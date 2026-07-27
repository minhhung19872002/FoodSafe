using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

[Authorize(FoodSafePermissions.DataIntegration.CallHistory.View)]
public class ApiCallLogAppService : ApplicationService
{
    private readonly IRepository<ApiCallLog, Guid> _logs;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ApiCallLogAppService(
        IRepository<ApiCallLog, Guid> logs,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _logs = logs;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<ApiCallLogDto>> GetListAsync(
        ApiCallLogFilterDto input)
    {
        var query = await ScopedQueryAsync();

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.ExternalSystemName.Contains(filter) ||
                x.EndpointUrl.Contains(filter));
        }
        if (input.Direction.HasValue)
            query = query.Where(x => x.Direction == input.Direction.Value);
        if (!input.ExternalSystem.IsNullOrWhiteSpace())
            query = query.Where(x => x.ExternalSystemName == input.ExternalSystem);
        if (input.IsSuccess.HasValue)
            query = query.Where(x => x.IsSuccess == input.IsSuccess.Value);
        if (input.DataType.HasValue)
            query = query.Where(x => x.DataType == input.DataType.Value);
        if (input.FromDate.HasValue)
            query = query.Where(x => x.CalledAt >= input.FromDate.Value.Date);
        if (input.ToDate.HasValue)
            query = query.Where(x => x.CalledAt <= input.ToDate.Value.Date.AddDays(1));

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.CalledAt);
        query = query.PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);

        return new PagedResultDto<ApiCallLogDto>(
            totalCount,
            items.Select(ToDto).ToList());
    }

    public async Task<ApiCallLogDetailDto> GetAsync(Guid id)
    {
        var query = await ScopedQueryAsync();
        var entity = await AsyncExecuter.FirstOrDefaultAsync(
                         query.Where(x => x.Id == id),
                         _cancellationTokens.Token)
                     ?? throw new BusinessException(
                         FoodSafeDomainErrorCodes.DataIntegration.CallLogNotFound);

        return new ApiCallLogDetailDto
        {
            Id = entity.Id,
            OrganizationId = entity.OrganizationId,
            DataType = entity.DataType,
            Direction = entity.Direction,
            ExternalSystemName = entity.ExternalSystemName,
            EndpointUrl = entity.EndpointUrl,
            HttpMethod = entity.HttpMethod,
            ResponseStatusCode = entity.ResponseStatusCode,
            CalledAt = entity.CalledAt,
            DurationMs = entity.DurationMs,
            IsSuccess = entity.IsSuccess,
            ErrorMessage = entity.ErrorMessage,
            CreationTime = entity.CreationTime,
            RequestHeaders = entity.RequestHeaders,
            RequestBody = entity.RequestBody,
            ResponseBody = entity.ResponseBody,
        };
    }

    private async Task<IQueryable<ApiCallLog>> ScopedQueryAsync()
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _logs.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private static ApiCallLogDto ToDto(ApiCallLog e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        Direction = e.Direction,
        ExternalSystemName = e.ExternalSystemName,
        EndpointUrl = e.EndpointUrl,
        HttpMethod = e.HttpMethod,
        ResponseStatusCode = e.ResponseStatusCode,
        CalledAt = e.CalledAt,
        DurationMs = e.DurationMs,
        IsSuccess = e.IsSuccess,
        ErrorMessage = e.ErrorMessage,
        DataType = e.DataType,
        CreationTime = e.CreationTime,
    };
}
