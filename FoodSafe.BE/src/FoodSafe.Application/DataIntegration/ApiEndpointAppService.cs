using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Security.Encryption;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

[Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.View)]
public class ApiEndpointAppService : ApplicationService
{
    private readonly IRepository<ApiEndpoint, Guid> _endpoints;
    private readonly IRepository<ApiCallLog, Guid> _callLogs;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IStringEncryptionService _encryption;

    public ApiEndpointAppService(
        IRepository<ApiEndpoint, Guid> endpoints,
        IRepository<ApiCallLog, Guid> callLogs,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IStringEncryptionService encryption)
    {
        _endpoints = endpoints;
        _callLogs = callLogs;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _encryption = encryption;
    }

    public async Task<PagedResultDto<ApiEndpointDto>> GetListAsync(
        ApiEndpointFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.Name.ToUpper().Contains(filter) ||
                x.Url.ToUpper().Contains(filter) ||
                x.ExternalSystem.ToUpper().Contains(filter));
        }
        if (!input.ExternalSystem.IsNullOrWhiteSpace())
            query = query.Where(x => x.ExternalSystem == input.ExternalSystem);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.CreationTime);
        query = query.PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);

        return new PagedResultDto<ApiEndpointDto>(
            totalCount,
            items.Select(ToDto).ToList());
    }

    public async Task<ApiEndpointDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.Create)]
    public async Task<ApiEndpointDto> CreateAsync(CreateUpdateApiEndpointDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound));

        OutboundUrlValidator.Validate(input.Url);

        var entity = ApiEndpoint.Create(
            GuidGenerator.Create(),
            orgId,
            input.Name,
            input.Url,
            input.HttpMethod,
            input.ExternalSystem,
            input.AuthType,
            input.Description);

        if (!input.Credential.IsNullOrWhiteSpace())
            entity.SetEncryptedCredential(_encryption.Encrypt(input.Credential));

        await _endpoints.InsertAsync(entity, autoSave: true,
            cancellationToken: _cancellationTokens.Token);

        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.Edit)]
    public async Task<ApiEndpointDto> UpdateAsync(
        Guid id, CreateUpdateApiEndpointDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        OutboundUrlValidator.Validate(input.Url);

        entity.Update(
            input.Name,
            input.Url,
            input.HttpMethod,
            input.ExternalSystem,
            input.AuthType,
            input.Description);

        // Write-only rotation: a supplied value replaces the stored secret; an
        // explicit ClearCredential removes it; otherwise the stored value stays.
        if (!input.Credential.IsNullOrWhiteSpace())
            entity.SetEncryptedCredential(_encryption.Encrypt(input.Credential));
        else if (input.ClearCredential)
            entity.SetEncryptedCredential(null);

        await _endpoints.UpdateAsync(entity, autoSave: true,
            cancellationToken: _cancellationTokens.Token);

        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.Edit)]
    public async Task ToggleStatusAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        if (entity.Status == ApiEndpointStatus.Active)
            entity.Deactivate();
        else
            entity.Activate();

        await _endpoints.UpdateAsync(entity, autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        await _endpoints.DeleteAsync(entity,
            cancellationToken: _cancellationTokens.Token);
    }

    /// <summary>
    /// Probes the endpoint URL with a lightweight request and records the
    /// attempt in the call history (FR-50-05 "Test Connection").
    /// </summary>
    public async Task<TestConnectionResultDto> TestConnectionAsync(Guid id)
    {
        var endpoint = await GetScopedAsync(id, DataScopeOperation.View);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        int? statusCode = null;
        string? errorMessage = null;
        var isSuccess = false;
        try
        {
            // Re-validate at probe time; the guarded client additionally refuses
            // to connect to any private/reserved IP (defeats DNS rebinding).
            var target = OutboundUrlValidator.Validate(endpoint.Url);
            using var request = new HttpRequestMessage(HttpMethod.Head, target);
            using var response = await ProbeClient.SendAsync(
                request, _cancellationTokens.Token);
            statusCode = (int)response.StatusCode;
            // HEAD may be unsupported (405) — the host is still reachable.
            isSuccess = response.IsSuccessStatusCode ||
                        statusCode is 405 or 401 or 403;
            if (!isSuccess)
            {
                errorMessage = $"Máy chủ trả về HTTP {statusCode}.";
            }
        }
        catch (Exception exception) when (exception is HttpRequestException
                                              or TaskCanceledException
                                              or UriFormatException
                                              or InvalidOperationException)
        {
            errorMessage = exception.Message.Length > 4000
                ? exception.Message[..4000]
                : exception.Message;
        }
        stopwatch.Stop();

        await _callLogs.InsertAsync(
            ApiCallLog.Create(
                GuidGenerator.Create(),
                endpoint.OrganizationId,
                ApiCallDirection.Outbound,
                endpoint.ExternalSystem,
                endpoint.Url,
                "HEAD",
                Clock.Now,
                stopwatch.ElapsedMilliseconds,
                isSuccess,
                responseStatusCode: statusCode,
                errorMessage: errorMessage),
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);

        return new TestConnectionResultDto
        {
            IsSuccess = isSuccess,
            StatusCode = statusCode,
            DurationMs = stopwatch.ElapsedMilliseconds,
            ErrorMessage = errorMessage
        };
    }

    // SSRF-guarded: the connect callback refuses private/reserved IPs (B-5).
    private static readonly HttpClient ProbeClient =
        OutboundUrlValidator.CreateGuardedHttpClient(TimeSpan.FromSeconds(10));

    private async Task<IQueryable<ApiEndpoint>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation, _cancellationTokens.Token);
        var query = await _endpoints.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<ApiEndpoint> GetScopedAsync(
        Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(
                   FoodSafeDomainErrorCodes.DataIntegration.EndpointNotFound);
    }

    private static ApiEndpointDto ToDto(ApiEndpoint e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        Name = e.Name,
        Url = e.Url,
        HttpMethod = e.HttpMethod,
        ExternalSystem = e.ExternalSystem,
        Description = e.Description,
        AuthType = e.AuthType,
        Status = e.Status,
        HasCredential = e.HasCredential,
        CreationTime = e.CreationTime,
    };
}
