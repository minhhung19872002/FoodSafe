using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Inspection;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Security.Encryption;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Outbound data-sharing engine (STT 51-57). Builds a typed payload carrying
/// the real records of the selected <see cref="SharedDataType"/> (via the
/// per-type <see cref="ISharedDataPayloadBuilder"/> strategies), sends it to a
/// configured partner endpoint, and records each attempt immutably in
/// di_api_call_logs. Failed attempts can be retried; a retry re-sends the
/// stored payload verbatim and appends a new attempt row — it never rewrites
/// the evidence of a previous attempt. The exact TT 31/2026 partner field
/// mapping is applied on top of this envelope once the official partner
/// schema is published.
/// </summary>
[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.DataIntegration.Share)]
public class DataSharingAppService :
    ApplicationService,
    IDataSharingAppService
{
    /// <summary>Named <see cref="IHttpClientFactory"/> key for the SSRF-guarded + Polly-resilient
    /// partner outbound client registered in the host module (FUNC-INT-004).</summary>
    public const string OutboundHttpClientName = "DataIntegrationOutbound";

    private static readonly JsonSerializerOptions PayloadJsonOptions =
        new(JsonSerializerDefaults.Web)
        {
            Converters = { new JsonStringEnumConverter() }
        };

    private readonly IRepository<ApiEndpoint, Guid> _endpoints;
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<ApiCallLog, Guid> _logs;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IStringEncryptionService _encryption;
    private readonly IEnumerable<ISharedDataPayloadBuilder> _payloadBuilders;
    private readonly IHttpClientFactory _httpClientFactory;

    public DataSharingAppService(
        IRepository<ApiEndpoint, Guid> endpoints,
        IRepository<AtpAlert, Guid> alerts,
        IRepository<InspectionResult, Guid> inspectionResults,
        IRepository<Business, Guid> businesses,
        IRepository<ApiCallLog, Guid> logs,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IStringEncryptionService encryption,
        IEnumerable<ISharedDataPayloadBuilder> payloadBuilders,
        IHttpClientFactory httpClientFactory)
    {
        _endpoints = endpoints;
        _alerts = alerts;
        _inspectionResults = inspectionResults;
        _businesses = businesses;
        _logs = logs;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _encryption = encryption;
        _payloadBuilders = payloadBuilders;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Lightweight alert lookup for the share dialog. It deliberately belongs
    /// to DataIntegration so users with Share permission do not also need the
    /// unrelated alert-management permission.
    /// </summary>
    public async Task<List<AlertShareOptionDto>> GetAlertOptionsAsync(string? filter)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, ct);
        var query = (await _alerts.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!filter.IsNullOrWhiteSpace())
        {
            var keyword = filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.Title.ToUpper().Contains(keyword) ||
                (x.AlertNumber != null &&
                 x.AlertNumber.ToUpper().Contains(keyword)));
        }

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(100)
                .Select(x => new AlertShareOptionDto
                {
                    Id = x.Id,
                    AlertNumber = x.AlertNumber,
                    Title = x.Title,
                }),
            ct);
    }

    /// <summary>
    /// Lightweight inspection-result lookup for the share dialog, protected by
    /// the integration Share permission and the caller's organization scope.
    /// </summary>
    public async Task<List<InspectionResultShareOptionDto>>
        GetInspectionResultOptionsAsync(string? filter)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, ct);
        var results = (await _inspectionResults.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
        var businesses = await _businesses.GetQueryableAsync();

        var query =
            from result in results
            join business in businesses on result.BusinessId equals business.Id
            select new
            {
                Result = result,
                BusinessName = business.Name,
            };

        if (!filter.IsNullOrWhiteSpace())
        {
            var keyword = filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.BusinessName.ToUpper().Contains(keyword) ||
                (x.Result.AdminDecisionNumber != null &&
                 x.Result.AdminDecisionNumber.ToUpper().Contains(keyword)));
        }

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.Result.InspectionDate)
                .ThenByDescending(x => x.Result.CreationTime)
                .Take(100)
                .Select(x => new InspectionResultShareOptionDto
                {
                    Id = x.Result.Id,
                    BusinessName = x.BusinessName,
                    InspectionDate = x.Result.InspectionDate,
                    AdminDecisionNumber = x.Result.AdminDecisionNumber,
                }),
            ct);
    }

    public async Task<ShareDataResultDto> ShareAsync(ShareDataInput input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var endpoint = await GetActiveScopedEndpointAsync(input.EndpointId, scope, ct);

        var builder = _payloadBuilders
            .SingleOrDefault(b => b.DataType == input.DataType);
        IReadOnlyList<object> records = builder is null
            ? Array.Empty<object>()
            : await builder.BuildRecordsAsync(input.EntityId, scope, ct);

        var payload = JsonSerializer.Serialize(new
        {
            schemaVersion = "1.0",
            dataType = input.DataType.ToString(),
            note = input.Note,
            organizationId = endpoint.OrganizationId,
            sharedAt = Clock.Now,
            source = "FoodSafe.QuangNinh",
            recordCount = records.Count,
            records
        }, PayloadJsonOptions);

        return await SendAndLogAsync(
            endpoint, payload, input.DataType,
            correlationId: null, attemptNumber: 1, ct);
    }

    public async Task<ShareDataResultDto> RetryAsync(Guid logId)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var original = await _logs.GetAsync(logId, cancellationToken: ct);
        if (!scope.IncludesOrganization(original.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The call log is outside the current user's data scope.");
        }
        if (original.Direction != ApiCallDirection.Outbound)
        {
            throw new UserFriendlyException(
                "Chỉ có thể thử lại giao tiếp gửi đi.");
        }
        if (original.IsSuccess)
        {
            throw new UserFriendlyException(
                "Chỉ có thể thử lại giao tiếp thất bại.");
        }
        if (original.EndpointId is null || original.RequestBody is null)
        {
            throw new UserFriendlyException(
                "Bản ghi không còn đủ thông tin gửi để thử lại.");
        }
        var endpoint = await _endpoints.FindAsync(
            original.EndpointId.Value, cancellationToken: ct)
            ?? throw new UserFriendlyException(
                "Điểm kết nối của giao tiếp này đã bị xóa nên không thể thử lại.");
        if (!scope.IncludesOrganization(endpoint.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The endpoint is outside the current user's data scope.");
        }
        if (endpoint.Status != ApiEndpointStatus.Active)
        {
            throw new UserFriendlyException(
                "Điểm kết nối đang ngừng hoạt động. Kích hoạt trước khi chia sẻ.");
        }

        // Attempts of one logical envelope chain to its original send.
        var rootId = original.CorrelationId ?? original.Id;
        var logsQuery = (await _logs.GetQueryableAsync())
            .Where(x => x.Id == rootId || x.CorrelationId == rootId)
            .Select(x => x.AttemptNumber);
        var attempts = await AsyncExecuter.ToListAsync(logsQuery, ct);
        var nextAttempt = (attempts.Count == 0 ? 1 : attempts.Max()) + 1;

        return await SendAndLogAsync(
            endpoint, original.RequestBody, original.DataType,
            correlationId: rootId, attemptNumber: nextAttempt, ct);
    }

    private async Task<ApiEndpoint> GetActiveScopedEndpointAsync(
        Guid endpointId, CurrentDataScope scope, CancellationToken ct)
    {
        var endpoint = await _endpoints.GetAsync(endpointId, cancellationToken: ct);
        if (!scope.IncludesOrganization(endpoint.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The endpoint is outside the current user's data scope.");
        }
        if (endpoint.Status != ApiEndpointStatus.Active)
        {
            throw new UserFriendlyException(
                "Điểm kết nối đang ngừng hoạt động. Kích hoạt trước khi chia sẻ.");
        }
        return endpoint;
    }

    private async Task<ShareDataResultDto> SendAndLogAsync(
        ApiEndpoint endpoint,
        string payload,
        SharedDataType dataType,
        Guid? correlationId,
        int attemptNumber,
        CancellationToken ct)
    {
        // Reject internal/reserved targets before sending (B-5). The guarded
        // client additionally re-checks the resolved IP at connect time.
        var target = OutboundUrlValidator.Validate(endpoint.Url);

        var stopwatch = Stopwatch.StartNew();
        int? statusCode = null;
        string? responseBody = null;
        string? errorMessage = null;
        var isSuccess = false;
        try
        {
            using var request = new HttpRequestMessage(
                new HttpMethod(endpoint.HttpMethod), target)
            {
                Content = new StringContent(
                    payload, Encoding.UTF8, "application/json")
            };
            ApplyAuthHeader(request, endpoint);
            var client = _httpClientFactory.CreateClient(OutboundHttpClientName);
            using var response = await client.SendAsync(request, ct);
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
            dataType: dataType,
            endpointId: endpoint.Id,
            correlationId: correlationId,
            attemptNumber: attemptNumber,
            payloadChecksum: Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(payload)))
                .ToLowerInvariant());
        await _logs.InsertAsync(log, autoSave: true, cancellationToken: ct);

        return new ShareDataResultDto
        {
            LogId = log.Id,
            IsSuccess = isSuccess,
            StatusCode = statusCode,
            ErrorMessage = errorMessage
        };
    }

    /// <summary>
    /// Injects the endpoint's outbound-auth header onto the outgoing request,
    /// decrypting the credential stored at rest just before send. The secret
    /// only ever lives on the in-flight <see cref="HttpRequestMessage"/>; it is
    /// never persisted to the call log (which records the request body, not the
    /// auth header).
    /// </summary>
    private void ApplyAuthHeader(HttpRequestMessage request, ApiEndpoint endpoint)
    {
        if (!endpoint.HasCredential || endpoint.AuthType == ApiAuthType.None)
            return;

        var credential = _encryption.Decrypt(endpoint.EncryptedCredential);
        if (string.IsNullOrEmpty(credential))
            return;

        switch (endpoint.AuthType)
        {
            case ApiAuthType.ApiKey:
                request.Headers.TryAddWithoutValidation("X-Api-Key", credential);
                break;
            case ApiAuthType.BearerToken:
                request.Headers.TryAddWithoutValidation(
                    "Authorization", $"Bearer {credential}");
                break;
            case ApiAuthType.BasicAuth:
                var basic = Convert.ToBase64String(Encoding.UTF8.GetBytes(credential));
                request.Headers.TryAddWithoutValidation(
                    "Authorization", $"Basic {basic}");
                break;
        }
    }

    private static string? Truncate(string? value, int maximumLength) =>
        value is null || value.Length <= maximumLength
            ? value
            : value[..maximumLength];
}
