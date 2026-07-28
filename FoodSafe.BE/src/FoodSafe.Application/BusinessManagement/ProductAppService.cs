using FoodSafe.Permissions;
using FoodSafe.Security;
using FoodSafe.FileManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

[Authorize(FoodSafePermissions.BusinessManagement.Products.View)]
public class ProductAppService : ApplicationService, IProductAppService
{
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;

    public ProductAppService(
        IRepository<Product, Guid> products,
        IRepository<Business, Guid> businesses,
        IRepository<BusinessProductGroup> businessProductGroups,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IRepository<DocumentOwner, Guid> documentOwners)
    {
        _products = products;
        _businesses = businesses;
        _businessProductGroups = businessProductGroups;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _documentOwners = documentOwners;
    }

    public async Task<PagedResultDto<ProductDto>> GetListAsync(
        ProductListInput input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Name.Contains(filter) ||
                (x.Code != null && x.Code.Contains(filter)) ||
                (x.BrandName != null && x.BrandName.Contains(filter)) ||
                (x.Manufacturer != null && x.Manufacturer.Contains(filter)));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.ProductGroupId.HasValue)
            query = query.Where(x => x.ProductGroupId == input.ProductGroupId);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status);

        var total = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, ObjectMapper.Map<List<Product>, List<ProductDto>>(items));
    }

    public async Task<IReadOnlyList<ProductBusinessOptionDto>>
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
                .Select(x => new ProductBusinessOptionDto
                {
                    Id = x.Id,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    public async Task<ProductDto> GetAsync(Guid id) =>
        ObjectMapper.Map<Product, ProductDto>(
            await GetScopedAsync(id, DataScopeOperation.View));

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Create)]
    public async Task<ProductDto> CreateAsync(UpsertProductDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureUniqueCodeAsync(input.BusinessId, input.Code, null);
        var product = Product.Create(
            GuidGenerator.Create(), business.Id, business.OrganizationId,
            input.Code, input.Name, input.ProductGroupId, input.BrandName,
            input.Manufacturer, input.ManufacturingCountryId, input.NetWeight,
            input.Specifications, input.Ingredients, input.ExpiryPeriodMonths,
            input.StorageConditions, input.UsageInstructions, input.Notes);
        await _documentOwners.InsertAsync(
            DocumentOwner.Create(
                product.Id,
                product.OrganizationId,
                "product",
                Clock.Now),
            autoSave: false,
            cancellationToken: _cancellationTokens.Token);
        await _products.InsertAsync(
            product,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return ObjectMapper.Map<Product, ProductDto>(product);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Edit)]
    public async Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto input)
    {
        var product = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (input.BusinessId != product.BusinessId)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Product.OrganizationMismatch);
        await EnsureUniqueCodeAsync(product.BusinessId, input.Code, id);
        product.Update(
            input.Code, input.Name, input.ProductGroupId, input.BrandName,
            input.Manufacturer, input.ManufacturingCountryId, input.NetWeight,
            input.Specifications, input.Ingredients, input.ExpiryPeriodMonths,
            input.StorageConditions, input.UsageInstructions, input.Notes);
        product.SetStatus(input.Status);
        await _products.UpdateAsync(
            product,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return ObjectMapper.Map<Product, ProductDto>(product);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var product = await GetScopedAsync(id, DataScopeOperation.Delete);
        await _products.DeleteAsync(
            product,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    private async Task<IQueryable<Product>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var products = await _products.GetQueryableAsync();
        if (scope.HasGlobalAccess) return products;

        var allowedBusinessIds = await AllowedBusinessIdsAsync(
            scope,
            includeProductGroups: false);
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return products.Where(x =>
            allowedBusinessIds.Contains(x.BusinessId) ||
            (x.ProductGroupId.HasValue &&
             productGroupIds.Contains(x.ProductGroupId.Value)));
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope,
        bool includeProductGroups = true)
    {
        var businesses = await _businesses.GetQueryableAsync();
        var links = await _businessProductGroups.GetQueryableAsync();
        var organizationIds = scope.OrganizationIds;
        var provinceIds = scope.ProvinceIds;
        var districtIds = scope.DistrictIds;
        var communeIds = scope.CommuneIds;
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return businesses.Where(x =>
                organizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 provinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressDistrictId.HasValue &&
                 districtIds.Contains(x.AddressDistrictId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 communeIds.Contains(x.AddressCommuneId.Value)) ||
                (includeProductGroups && links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId))))
            .Select(x => x.Id);
    }

    private async Task<Business> GetScopedBusinessAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var allowedIds = await AllowedBusinessIdsAsync(scope);
        var query = await _businesses.GetQueryableAsync();
        var business = scope.HasGlobalAccess
            ? await AsyncExecuter.FirstOrDefaultAsync(
                query.Where(x => x.Id == id),
                _cancellationTokens.Token)
            : await AsyncExecuter.FirstOrDefaultAsync(
                query.Where(x => x.Id == id && allowedIds.Contains(x.Id)),
                _cancellationTokens.Token);
        return business ?? throw new AbpAuthorizationException(
            "The business is outside the current user's data scope.");
    }

    private async Task<Product> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        var product = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.Id == id),
            _cancellationTokens.Token);
        return product ?? throw new AbpAuthorizationException(
            "The product is outside the current user's data scope.");
    }

    private async Task EnsureUniqueCodeAsync(
        Guid businessId,
        string? code,
        Guid? excludedId)
    {
        if (code.IsNullOrWhiteSpace()) return;
        var normalized = code!.Trim().ToUpperInvariant();
        var query = await _products.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                query.Where(x =>
                    x.BusinessId == businessId &&
                    x.Code == normalized &&
                    (!excludedId.HasValue || x.Id != excludedId)),
                _cancellationTokens.Token))
            throw new BusinessException(
                    FoodSafeDomainErrorCodes.Product.DuplicateCode)
                .WithData("Code", normalized);
    }

    // Honours the client's Sorting request (e.g. "name", "creationTime desc")
    // against a whitelist. Falls back to CreationTime descending.
    private static IOrderedQueryable<Product> ApplySorting(
        IQueryable<Product> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("name",         true)  => query.OrderByDescending(x => x.Name),
            ("name",         false) => query.OrderBy(x => x.Name),
            ("creationtime", true)  => query.OrderByDescending(x => x.CreationTime),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _                       => query.OrderByDescending(x => x.CreationTime)
        };
    }
}
