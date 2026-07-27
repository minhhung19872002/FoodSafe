using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

[Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.View)]
public class ApiEndpointAppService : ApplicationService
{
    private readonly IRepository<ApiEndpoint, Guid> _endpoints;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ApiEndpointAppService(
        IRepository<ApiEndpoint, Guid> endpoints,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _endpoints = endpoints;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<ApiEndpointDto>> GetListAsync(
        ApiEndpointFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Name.Contains(filter) ||
                x.Url.Contains(filter) ||
                x.ExternalSystem.Contains(filter));
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
        var orgId = scope.OrganizationIds.First();

        var entity = ApiEndpoint.Create(
            GuidGenerator.Create(),
            orgId,
            input.Name,
            input.Url,
            input.HttpMethod,
            input.ExternalSystem,
            input.AuthType,
            input.Description);

        await _endpoints.InsertAsync(entity, autoSave: true,
            cancellationToken: _cancellationTokens.Token);

        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.Edit)]
    public async Task<ApiEndpointDto> UpdateAsync(
        Guid id, CreateUpdateApiEndpointDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(
            input.Name,
            input.Url,
            input.HttpMethod,
            input.ExternalSystem,
            input.AuthType,
            input.Description);

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
        CreationTime = e.CreationTime,
    };
}
