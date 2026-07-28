using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Licensing;

[Authorize(FoodSafePermissions.Licensing.AdRegistrations.View)]
public class AdvertisementRegistrationAppService :
    ApplicationService,
    IAdvertisementRegistrationAppService
{
    private readonly IRepository<AdvertisementRegistration, Guid>
        _registrations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<AdvertisementType, Guid> _advertisementTypes;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AdvertisementRegistrationAppService(
        IRepository<AdvertisementRegistration, Guid> registrations,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<AdvertisementType, Guid> advertisementTypes,
        IRepository<DocumentOwner, Guid> documentOwners,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _registrations = registrations;
        _businesses = businesses;
        _products = products;
        _businessProductGroups = businessProductGroups;
        _advertisementTypes = advertisementTypes;
        _documentOwners = documentOwners;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<AdvertisementRegistrationDto>>
        GetListAsync(AdvertisementRegistrationListInput input)
    {
        var today = Clock.Now.Date;
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.RegistrationNumber.Contains(filter) ||
                (x.ContentDescription != null &&
                 x.ContentDescription.Contains(filter)) ||
                (x.Medium != null && x.Medium.Contains(filter)));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.AdvertisementTypeId.HasValue)
            query = query.Where(x =>
                x.AdvertisementTypeId == input.AdvertisementTypeId);
        if (input.ProductId.HasValue)
            query = query.Where(x =>
                x.Products.Any(p => p.ProductId == input.ProductId));
        if (input.Status.HasValue)
            query = ApplyStatusFilter(query, input.Status.Value, today);
        if (input.ExpiringWithinDays.HasValue)
        {
            var through = today.AddDays(input.ExpiringWithinDays.Value);
            query = query.Where(x =>
                x.Status != LicenseStatus.Revoked &&
                x.ExpiryDate.HasValue &&
                x.ExpiryDate.Value >= today &&
                x.ExpiryDate.Value <= through);
        }
        var total = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        var rows = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, await ToDtosAsync(rows, today));
    }

    public async Task<AdvertisementRegistrationDto> GetAsync(Guid id)
    {
        var registration = await GetScopedAsync(
            id,
            DataScopeOperation.View);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
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
            var allowed = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowed.Contains(x.Id));
        }
        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name).Take(500)
                .Select(x => new ProductBusinessOptionDto
                {
                    Id = x.Id,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    public async Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId)
    {
        await GetScopedBusinessAsync(
            businessId,
            DataScopeOperation.View);
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View,
            _cancellationTokens.Token);
        var query = await _products.GetQueryableAsync();
        query = query.Where(x =>
            x.BusinessId == businessId &&
            x.Status == ProductStatus.Active);
        if (!scope.HasGlobalAccess)
        {
            var allowedIds = await AllowedBusinessIdsAsync(
                scope,
                includeProductGroups: false);
            var groupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
            query = query.Where(x =>
                allowedIds.Contains(x.BusinessId) ||
                (x.ProductGroupId.HasValue &&
                 groupIds.Contains(x.ProductGroupId.Value)));
        }
        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name).Take(500)
                .Select(x => new SelfDeclarationProductOptionDto
                {
                    Id = x.Id,
                    BusinessId = x.BusinessId,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    public async Task<IReadOnlyList<AdvertisementTypeOptionDto>>
        GetAdvertisementTypeOptionsAsync()
    {
        var query = await _advertisementTypes.GetQueryableAsync();
        return await AsyncExecuter.ToListAsync(
            query.Where(x => x.IsActive)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.Name)
                .Take(500)
                .Select(x => new AdvertisementTypeOptionDto
                {
                    Id = x.Id,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Create)]
    public async Task<AdvertisementRegistrationDto> CreateAsync(
        UpsertAdvertisementRegistrationDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureAdvertisementTypeAsync(input.AdvertisementTypeId);
        var productIds = await EnsureProductsAsync(
            input.ProductIds,
            business,
            DataScopeOperation.Create);
        await EnsureUniqueNumberAsync(input.RegistrationNumber, null);
        var id = GuidGenerator.Create();
        var registration = AdvertisementRegistration.Create(
            id,
            business.Id,
            business.OrganizationId,
            input.AdvertisementTypeId,
            input.RegistrationNumber,
            input.RegistrationDate,
            input.ExpiryDate,
            input.ContentDescription,
            input.Medium,
            input.Notes,
            productIds,
            Clock.Now.Date);
        await _documentOwners.InsertAsync(
            DocumentOwner.Create(
                id,
                business.OrganizationId,
                "advertisement-registration",
                Clock.Now),
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await _registrations.InsertAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Edit)]
    public async Task<AdvertisementRegistrationDto> UpdateAsync(
        Guid id,
        UpdateAdvertisementRegistrationDto input)
    {
        var registration = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        if (registration.BusinessId != input.BusinessId)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .ProductMismatch);
        var business = await GetScopedBusinessAsync(
            registration.BusinessId,
            DataScopeOperation.Edit);
        await EnsureAdvertisementTypeAsync(input.AdvertisementTypeId);
        var productIds = await EnsureProductsAsync(
            input.ProductIds,
            business,
            DataScopeOperation.Edit);
        await EnsureUniqueNumberAsync(input.RegistrationNumber, id);
        registration.Update(
            input.AdvertisementTypeId,
            input.RegistrationNumber,
            input.RegistrationDate,
            input.ExpiryDate,
            input.ContentDescription,
            input.Medium,
            input.Notes,
            productIds,
            Clock.Now.Date);
        await _registrations.UpdateAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var registration = await GetScopedAsync(
            id,
            DataScopeOperation.Delete);
        await _registrations.DeleteAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Edit)]
    public async Task<AdvertisementRegistrationDto> RevokeAsync(
        Guid id,
        RevokeAdvertisementRegistrationDto input)
    {
        var registration = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        registration.Revoke(input.Reason, Clock.Now, CurrentUser.GetId());
        await _registrations.UpdateAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
    }

    private async Task<IQueryable<AdvertisementRegistration>>
        ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _registrations.WithDetailsAsync(x => x.Products);
        if (scope.HasGlobalAccess)
            return query;
        var allowedBusinessIds = await AllowedBusinessIdsAsync(
            scope,
            includeProductGroups: false);
        var groupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        var products = await _products.GetQueryableAsync();
        return query.Where(x =>
            allowedBusinessIds.Contains(x.BusinessId) ||
            x.Products.Any(link =>
                products.Any(product =>
                    product.Id == link.ProductId &&
                    product.ProductGroupId.HasValue &&
                    groupIds.Contains(product.ProductGroupId.Value))));
    }

    private async Task<AdvertisementRegistration> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The advertisement registration is outside the current user's data scope.");
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
            var allowed = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowed.Contains(x.Id));
        }
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The business is outside the current user's data scope.");
    }

    private async Task<Guid[]> EnsureProductsAsync(
        IReadOnlyCollection<Guid> productIds,
        Business business,
        DataScopeOperation operation)
    {
        var ids = productIds.Distinct().ToArray();
        if (ids.Length == 0)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .ProductsRequired);
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _products.GetQueryableAsync();
        query = query.Where(x =>
            ids.Contains(x.Id) &&
            x.BusinessId == business.Id &&
            x.OrganizationId == business.OrganizationId);
        if (!scope.HasGlobalAccess)
        {
            var allowed = await AllowedBusinessIdsAsync(
                scope,
                includeProductGroups: false);
            var groupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
            query = query.Where(x =>
                allowed.Contains(x.BusinessId) ||
                (x.ProductGroupId.HasValue &&
                 groupIds.Contains(x.ProductGroupId.Value)));
        }
        var count = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        if (count != ids.Length)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .ProductMismatch);
        return ids;
    }

    private async Task EnsureAdvertisementTypeAsync(Guid? id)
    {
        if (!id.HasValue)
            return;
        var query = await _advertisementTypes.GetQueryableAsync();
        if (!await AsyncExecuter.AnyAsync(
                query.Where(x => x.Id == id.Value && x.IsActive),
                _cancellationTokens.Token))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .AdvertisementTypeNotFound);
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope,
        bool includeProductGroups = true)
    {
        var businesses = await _businesses.GetQueryableAsync();
        var links = await _businessProductGroups.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return businesses.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 scope.ProvinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressDistrictId.HasValue &&
                 scope.DistrictIds.Contains(x.AddressDistrictId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 scope.CommuneIds.Contains(x.AddressCommuneId.Value)) ||
                (includeProductGroups && links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId))))
            .Select(x => x.Id);
    }

    private async Task EnsureUniqueNumberAsync(
        string number,
        Guid? excludedId)
    {
        var normalized = number.Trim().ToUpperInvariant();
        using (_registrations.DisableTracking())
        using (DataFilter.Disable<ISoftDelete>())
        {
            var query = await _registrations.GetQueryableAsync();
            if (await AsyncExecuter.AnyAsync(
                    query.Where(x =>
                        x.RegistrationNumber == normalized &&
                        (!excludedId.HasValue || x.Id != excludedId.Value)),
                    _cancellationTokens.Token))
                throw new BusinessException(
                        FoodSafeDomainErrorCodes.AdvertisementRegistration
                            .DuplicateNumber)
                    .WithData("RegistrationNumber", normalized);
        }
    }

    private async Task<List<AdvertisementRegistrationDto>> ToDtosAsync(
        IReadOnlyCollection<AdvertisementRegistration> registrations,
        DateTime today)
    {
        var businessIds = registrations.Select(x => x.BusinessId)
            .Distinct().ToArray();
        var typeIds = registrations
            .Where(x => x.AdvertisementTypeId.HasValue)
            .Select(x => x.AdvertisementTypeId!.Value)
            .Distinct().ToArray();
        var productIds = registrations.SelectMany(x => x.Products)
            .Select(x => x.ProductId).Distinct().ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var typeQuery = await _advertisementTypes.GetQueryableAsync();
        var productQuery = await _products.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var typeRows = await AsyncExecuter.ToListAsync(
            typeQuery.Where(x => typeIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var productRows = await AsyncExecuter.ToListAsync(
            productQuery.Where(x => productIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);
        var types = typeRows.ToDictionary(x => x.Id, x => x.Name);
        var products = productRows.ToDictionary(x => x.Id);
        return registrations.Select(x =>
        {
            var dto = ObjectMapper.Map<AdvertisementRegistration,
                AdvertisementRegistrationDto>(x);
            dto.Status = x.EffectiveStatus(today);
            dto.DaysUntilExpiry = x.ExpiryDate.HasValue
                ? (x.ExpiryDate.Value.Date - today).Days
                : null;
            dto.BusinessName =
                businesses.GetValueOrDefault(x.BusinessId) ?? string.Empty;
            dto.AdvertisementTypeName = x.AdvertisementTypeId.HasValue
                ? types.GetValueOrDefault(x.AdvertisementTypeId.Value)
                : null;
            dto.Products = x.Products
                .Where(link => products.ContainsKey(link.ProductId))
                .Select(link =>
                {
                    var product = products[link.ProductId];
                    return new SelfDeclarationProductOptionDto
                    {
                        Id = product.Id,
                        BusinessId = product.BusinessId,
                        Code = product.Code,
                        Name = product.Name
                    };
                }).ToArray();
            return dto;
        }).ToList();
    }

    // Honours the client's Sorting request against a whitelist; falls back to
    // CreationTime descending (newest first).
    private static IOrderedQueryable<AdvertisementRegistration> ApplySorting(
        IQueryable<AdvertisementRegistration> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("registrationdate", true)  => query.OrderByDescending(x => x.RegistrationDate),
            ("registrationdate", false) => query.OrderBy(x => x.RegistrationDate),
            ("creationtime", true)      => query.OrderByDescending(x => x.CreationTime),
            ("creationtime", false)     => query.OrderBy(x => x.CreationTime),
            _                           => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private static IQueryable<AdvertisementRegistration> ApplyStatusFilter(
        IQueryable<AdvertisementRegistration> query,
        LicenseStatus status,
        DateTime today) =>
        status switch
        {
            LicenseStatus.Revoked => query.Where(
                x => x.Status == LicenseStatus.Revoked),
            LicenseStatus.Expired => query.Where(
                x => x.Status != LicenseStatus.Revoked &&
                     x.ExpiryDate.HasValue &&
                     x.ExpiryDate.Value < today),
            LicenseStatus.Active => query.Where(
                x => x.Status != LicenseStatus.Revoked &&
                     (!x.ExpiryDate.HasValue ||
                      x.ExpiryDate.Value >= today)),
            _ => throw new UserFriendlyException(
                "Trạng thái đăng ký quảng cáo không hợp lệ.")
        };
}
