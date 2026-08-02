using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.ProductRecalls;

[Authorize(FoodSafePermissions.ProductRecalls.View)]
public class ProductRecallAppService :
    ApplicationService,
    IProductRecallAppService
{
    private readonly IRepository<ProductRecall, Guid> _recalls;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ProductRecallAppService(
        IRepository<ProductRecall, Guid> recalls,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<BusinessProductGroup> businessProductGroups,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _recalls = recalls;
        _businesses = businesses;
        _products = products;
        _businessProductGroups = businessProductGroups;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<ProductRecallDto>> GetListAsync(
        ProductRecallListInput input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.ProductName.ToUpper().Contains(filter) ||
                (x.DecisionNumber != null &&
                 x.DecisionNumber.ToUpper().Contains(filter)) ||
                (x.BatchInfo != null &&
                 x.BatchInfo.ToUpper().Contains(filter)));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.RecallType.HasValue)
            query = query.Where(x => x.RecallType == input.RecallType);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status);

        var total = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        var rows = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .ThenBy(x => x.ProductName)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, await ToDtosAsync(rows));
    }

    public async Task<ProductRecallDto> GetAsync(Guid id)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([recall]))[0];
    }

    public async Task<IReadOnlyList<RecallBusinessOptionDto>>
        GetBusinessOptionsAsync()
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View,
            _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();
        query = query.Where(x => x.Status == BusinessStatus.Active);
        if (!scope.HasGlobalAccess)
        {
            var allowedIds = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowedIds.Contains(x.Id));
        }
        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name)
                .Take(500)
                .Select(x => new RecallBusinessOptionDto
                {
                    Id = x.Id,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Create)]
    public async Task<ProductRecallDto> CreateAsync(
        CreateUpdateProductRecallDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureProductAsync(input.ProductId, business);

        var recall = ProductRecall.Create(
            GuidGenerator.Create(),
            business.Id,
            business.OrganizationId,
            input.ProductId,
            input.ProductName,
            input.BatchInfo,
            input.RecallType,
            input.Reason,
            input.DecisionNumber,
            input.DecisionDate,
            input.StartDate,
            input.QuantityRecalled,
            input.QuantityUnit);
        await _recalls.InsertAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([recall]))[0];
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Edit)]
    public async Task<ProductRecallDto> UpdateAsync(
        Guid id,
        CreateUpdateProductRecallDto input)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (input.BusinessId != recall.BusinessId)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.ProductMismatch);
        var business = await GetScopedBusinessAsync(
            recall.BusinessId,
            DataScopeOperation.Edit);
        await EnsureProductAsync(input.ProductId, business);

        recall.Update(
            input.ProductId,
            input.ProductName,
            input.BatchInfo,
            input.RecallType,
            input.Reason,
            input.DecisionNumber,
            input.DecisionDate,
            input.StartDate,
            input.QuantityRecalled,
            input.QuantityUnit);
        await _recalls.UpdateAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([recall]))[0];
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.Delete);
        await _recalls.DeleteAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Manage)]
    public async Task<ProductRecallDto> StartAsync(Guid id)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.Edit);
        recall.Start();
        await _recalls.UpdateAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([recall]))[0];
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Manage)]
    public async Task<ProductRecallDto> CompleteAsync(
        Guid id,
        CompleteProductRecallDto input)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.Edit);
        recall.Complete(
            input.PostRecallAction,
            input.CompletedDate,
            input.ActionDescription);
        await _recalls.UpdateAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([recall]))[0];
    }

    [Authorize(FoodSafePermissions.ProductRecalls.Manage)]
    public async Task<ProductRecallDto> CancelAsync(
        Guid id,
        CancelProductRecallDto input)
    {
        var recall = await GetScopedAsync(id, DataScopeOperation.Edit);
        recall.Cancel(input.Reason);
        await _recalls.UpdateAsync(
            recall,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([recall]))[0];
    }

    private async Task<IQueryable<ProductRecall>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _recalls.GetQueryableAsync();
        if (scope.HasGlobalAccess)
            return query;

        var allowedBusinessIds = await AllowedBusinessIdsAsync(scope);
        return query.Where(x => allowedBusinessIds.Contains(x.BusinessId));
    }

    private async Task<ProductRecall> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The product recall is outside the current user's data scope.");
    }

    private async Task<Business> GetScopedBusinessAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var allowedIds = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowedIds.Contains(x.Id));
        }
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The business is outside the current user's data scope.");
    }

    private async Task EnsureProductAsync(Guid? productId, Business business)
    {
        if (!productId.HasValue)
            return;
        var query = await _products.GetQueryableAsync();
        if (!await AsyncExecuter.AnyAsync(
                query.Where(x =>
                    x.Id == productId.Value &&
                    x.BusinessId == business.Id &&
                    x.OrganizationId == business.OrganizationId),
                _cancellationTokens.Token))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRecall.ProductMismatch);
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businesses = await _businesses.GetQueryableAsync();
        var links = await _businessProductGroups.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds =
            scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds =
            scope.ProductGroupIds ?? new HashSet<Guid>();
        return businesses.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 scope.ProvinceIds.Contains(
                     x.AddressProvinceId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 scope.CommuneIds.Contains(
                     x.AddressCommuneId.Value)) ||
                links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId)))
            .Select(x => x.Id);
    }

    private async Task<List<ProductRecallDto>> ToDtosAsync(
        IReadOnlyCollection<ProductRecall> recalls)
    {
        var businessIds = recalls.Select(x => x.BusinessId)
            .Distinct()
            .ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery
                .Where(x => businessIds.Contains(x.Id))
                .Select(x => new { x.Id, x.Name }),
            _cancellationTokens.Token);
        var businessNames = businessRows.ToDictionary(x => x.Id, x => x.Name);

        return recalls.Select(x =>
        {
            var dto = ObjectMapper.Map<ProductRecall, ProductRecallDto>(x);
            dto.BusinessName =
                businessNames.GetValueOrDefault(x.BusinessId) ??
                string.Empty;
            return dto;
        }).ToList();
    }

    // Honours the client's Sorting request against a whitelist. Falls back to
    // CreationTime descending.
    private static IOrderedQueryable<ProductRecall> ApplySorting(
        IQueryable<ProductRecall> query,
        string? sorting)
    {
        var descending = sorting?.Contains(
            "desc",
            StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("startdate", true) => query.OrderByDescending(x => x.StartDate),
            ("startdate", false) => query.OrderBy(x => x.StartDate),
            ("creationtime", true) =>
                query.OrderByDescending(x => x.CreationTime),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }
}
