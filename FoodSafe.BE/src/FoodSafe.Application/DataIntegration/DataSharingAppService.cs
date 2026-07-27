using System.Diagnostics;
using System.Text;
using System.Text.Json;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Outbound data-sharing engine (STT 51-57). Sends a typed payload to a
/// configured partner endpoint and records the exchange in
/// di_api_call_logs with its DataType so per-type share history can be
/// browsed. Partner-specific payload contracts (TT 31/2026) are applied
/// on top of this envelope once partner specifications are available.
/// </summary>
[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.DataIntegration.Share)]
public class DataSharingAppService :
    ApplicationService,
    IDataSharingAppService
{
    private static readonly HttpClient SharedClient = new()
    {
        Timeout = TimeSpan.FromSeconds(30)
    };

    private readonly IRepository<ApiEndpoint, Guid> _endpoints;
    private readonly IRepository<ApiCallLog, Guid> _logs;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public DataSharingAppService(
        IRepository<ApiEndpoint, Guid> endpoints,
        IRepository<ApiCallLog, Guid> logs,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _endpoints = endpoints;
        _logs = logs;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<ShareDataResultDto> ShareAsync(ShareDataInput input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var endpoint = await _endpoints.GetAsync(input.EndpointId, cancellationToken: ct);
        if (!scope.HasGlobalAccess &&
            !scope.OrganizationIds.Contains(endpoint.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The endpoint is outside the current user's data scope.");
        }
        if (endpoint.Status != ApiEndpointStatus.Active)
        {
            throw new UserFriendlyException(
                "Điểm kết nối đang ngừng hoạt động. Kích hoạt trước khi chia sẻ.");
        }

        var payload = JsonSerializer.Serialize(new
        {
            dataType = input.DataType.ToString(),
            entityId = input.EntityId,
            note = input.Note,
            organizationId = endpoint.OrganizationId,
            sharedAt = Clock.Now,
            source = "FoodSafe.QuangNinh"
        });

        var stopwatch = Stopwatch.StartNew();
        int? statusCode = null;
        string? responseBody = null;
        string? errorMessage = null;
        var isSuccess = false;
        try
        {
            using var request = new HttpRequestMessage(
                new HttpMethod(endpoint.HttpMethod), endpoint.Url)
            {
                Content = new StringContent(
                    payload, Encoding.UTF8, "application/json")
            };
            using var response = await SharedClient.SendAsync(request, ct);
            statusCode = (int)response.StatusCode;
            responseBody = Truncate(
                await response.Content.ReadAsStringAsync(ct), 4000);
            isSuccess = response.IsSuccessStatusCode;
            if (!isSuccess)
            {
                errorMessage = $"Partner returned HTTP {statusCode}.";
            }
        }
        catch (Exception exception) when (exception is HttpRequestException
                                              or TaskCanceledException)
        {
            errorMessage = Truncate(exception.Message, 4000);
        }
        stopwatch.Stop();

        var log = ApiCallLog.Create(
            GuidGenerator.Create(),
            endpoint.OrganizationId,
            ApiCallDirection.Outbound,
            endpoint.ExternalSystem,
            endpoint.Url,
            endpoint.HttpMethod,
            Clock.Now,
            stopwatch.ElapsedMilliseconds,
            isSuccess,
            requestBody: payload,
            responseStatusCode: statusCode,
            responseBody: responseBody,
            errorMessage: errorMessage,
            dataType: input.DataType);
        await _logs.InsertAsync(log, autoSave: true, cancellationToken: ct);

        return new ShareDataResultDto
        {
            LogId = log.Id,
            IsSuccess = isSuccess,
            StatusCode = statusCode,
            ErrorMessage = errorMessage
        };
    }

    private static string? Truncate(string? value, int maximumLength) =>
        value is null || value.Length <= maximumLength
            ? value
            : value[..maximumLength];
}
