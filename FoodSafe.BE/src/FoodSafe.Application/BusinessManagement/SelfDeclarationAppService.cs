using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.BusinessManagement;

[Authorize(
    FoodSafePermissions.BusinessManagement.SelfDeclarations.View)]
public class SelfDeclarationAppService :
    ApplicationService,
    ISelfDeclarationAppService
{
    private readonly IRepository<SelfDeclaration, Guid> _declarations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public SelfDeclarationAppService(
        IRepository<SelfDeclaration, Guid> declarations,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<DocumentOwner, Guid> documentOwners,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _declarations = declarations;
        _businesses = businesses;
        _products = products;
        _businessProductGroups = businessProductGroups;
        _documentOwners = documentOwners;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<SelfDeclarationDto>> GetListAsync(
        SelfDeclarationListInput input)
    {
        var today = Clock.Now.Date;
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.DeclarationNumber.Contains(filter) ||
                x.ProductName.Contains(filter) ||
                (x.Manufacturer != null &&
                 x.Manufacturer.Contains(filter)));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.ProductId.HasValue)
            query = query.Where(x => x.ProductId == input.ProductId);
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
                .ThenBy(x => x.DeclarationNumber)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, await ToDtosAsync(rows, today));
    }

    public async Task<SelfDeclarationDto> GetAsync(Guid id)
    {
        var declaration = await GetScopedAsync(
            id,
            DataScopeOperation.View);
        return (await ToDtosAsync([declaration], Clock.Now.Date))[0];
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
            var groupIds =
                scope.ProductGroupIds ?? new HashSet<Guid>();
            query = query.Where(x =>
                allowedIds.Contains(x.BusinessId) ||
                (x.ProductGroupId.HasValue &&
                 groupIds.Contains(x.ProductGroupId.Value)));
        }
        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name)
                .Take(500)
                .Select(x => new SelfDeclarationProductOptionDto
                {
                    Id = x.Id,
                    BusinessId = x.BusinessId,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Create)]
    public async Task<SelfDeclarationDto> CreateAsync(
        UpsertSelfDeclarationDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureProductAsync(
            input.ProductId,
            business,
            DataScopeOperation.Create);
        await EnsureUniqueNumberAsync(
            business.Id,
            input.DeclarationNumber,
            null);

        var id = GuidGenerator.Create();
        var declaration = SelfDeclaration.Create(
            id,
            business.Id,
            business.OrganizationId,
            input.ProductId,
            input.DeclarationNumber,
            input.DeclarationDate,
            input.ProductName,
            input.Manufacturer,
            input.Purpose,
            input.ExpiryDate,
            input.Notes,
            Clock.Now.Date);
        await _documentOwners.InsertAsync(
            DocumentOwner.Create(
                id,
                business.OrganizationId,
                "self-declaration",
                Clock.Now),
            autoSave: false,
            cancellationToken: _cancellationTokens.Token);
        await _declarations.InsertAsync(
            declaration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([declaration], Clock.Now.Date))[0];
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    public async Task<SelfDeclarationDto> UpdateAsync(
        Guid id,
        UpdateSelfDeclarationDto input)
    {
        var declaration = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        if (input.BusinessId != declaration.BusinessId)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration.ProductMismatch);
        var business = await GetScopedBusinessAsync(
            declaration.BusinessId,
            DataScopeOperation.Edit);
        await EnsureProductAsync(
            input.ProductId,
            business,
            DataScopeOperation.Edit);
        await EnsureUniqueNumberAsync(
            business.Id,
            input.DeclarationNumber,
            id);
        declaration.Update(
            input.ProductId,
            input.DeclarationNumber,
            input.DeclarationDate,
            input.ProductName,
            input.Manufacturer,
            input.Purpose,
            input.ExpiryDate,
            input.Notes,
            Clock.Now.Date);
        await _declarations.UpdateAsync(
            declaration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([declaration], Clock.Now.Date))[0];
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var declaration = await GetScopedAsync(
            id,
            DataScopeOperation.Delete);
        await _declarations.DeleteAsync(
            declaration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    public async Task<SelfDeclarationDto> RevokeAsync(
        Guid id,
        RevokeSelfDeclarationDto input)
    {
        var declaration = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        declaration.Revoke(
            input.Reason,
            Clock.Now,
            CurrentUser.GetId());
        await _declarations.UpdateAsync(
            declaration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([declaration], Clock.Now.Date))[0];
    }

    private async Task<IQueryable<SelfDeclaration>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _declarations.GetQueryableAsync();
        if (scope.HasGlobalAccess)
            return query;

        var allowedBusinessIds = await AllowedBusinessIdsAsync(
            scope,
            includeProductGroups: false);
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        var products = await _products.GetQueryableAsync();
        return query.Where(x =>
            allowedBusinessIds.Contains(x.BusinessId) ||
            (x.ProductId.HasValue &&
             products.Any(product =>
                 product.Id == x.ProductId.Value &&
                 product.ProductGroupId.HasValue &&
                 productGroupIds.Contains(
                     product.ProductGroupId.Value))));
    }

    private async Task<SelfDeclaration> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The self-declaration is outside the current user's data scope.");
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

    private async Task EnsureProductAsync(
        Guid? productId,
        Business business,
        DataScopeOperation operation)
    {
        if (!productId.HasValue)
            return;
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _products.GetQueryableAsync();
        query = query.Where(x =>
            x.Id == productId.Value &&
            x.BusinessId == business.Id &&
            x.OrganizationId == business.OrganizationId);
        if (!scope.HasGlobalAccess)
        {
            var allowedBusinessIds = await AllowedBusinessIdsAsync(
                scope,
                includeProductGroups: false);
            var productGroupIds =
                scope.ProductGroupIds ?? new HashSet<Guid>();
            query = query.Where(x =>
                allowedBusinessIds.Contains(x.BusinessId) ||
                (x.ProductGroupId.HasValue &&
                 productGroupIds.Contains(x.ProductGroupId.Value)));
        }
        if (!await AsyncExecuter.AnyAsync(
                query,
                _cancellationTokens.Token))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration.ProductMismatch);
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope,
        bool includeProductGroups = true)
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
                (includeProductGroups && links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId))))
            .Select(x => x.Id);
    }

    private async Task EnsureUniqueNumberAsync(
        Guid businessId,
        string number,
        Guid? excludedId)
    {
        var normalized = number.Trim().ToUpperInvariant();
        using (_declarations.DisableTracking())
        using (DataFilter.Disable<ISoftDelete>())
        {
            var query = await _declarations.GetQueryableAsync();
            if (await AsyncExecuter.AnyAsync(
                    query.Where(x =>
                        x.BusinessId == businessId &&
                        x.DeclarationNumber == normalized &&
                        (!excludedId.HasValue ||
                         x.Id != excludedId.Value)),
                    _cancellationTokens.Token))
                throw new BusinessException(
                        FoodSafeDomainErrorCodes.SelfDeclaration
                            .DuplicateNumber)
                    .WithData("DeclarationNumber", normalized);
        }
    }

    private async Task<List<SelfDeclarationDto>> ToDtosAsync(
        IReadOnlyCollection<SelfDeclaration> declarations,
        DateTime today)
    {
        var businessIds = declarations.Select(x => x.BusinessId)
            .Distinct()
            .ToArray();
        var productIds = declarations.Where(x => x.ProductId.HasValue)
            .Select(x => x.ProductId!.Value)
            .Distinct()
            .ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var productQuery = await _products.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var productRows = await AsyncExecuter.ToListAsync(
            productQuery.Where(x => productIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);
        var products = productRows.ToDictionary(x => x.Id, x => x.Name);

        return declarations.Select(x =>
        {
            var dto = ObjectMapper.Map<SelfDeclaration,
                SelfDeclarationDto>(x);
            dto.Status = x.EffectiveStatus(today);
            dto.DaysUntilExpiry = x.ExpiryDate.HasValue
                ? (x.ExpiryDate.Value.Date - today).Days
                : null;
            dto.BusinessName =
                businesses.GetValueOrDefault(x.BusinessId) ??
                string.Empty;
            dto.LinkedProductName = x.ProductId.HasValue
                ? products.GetValueOrDefault(x.ProductId.Value)
                : null;
            return dto;
        }).ToList();
    }

    private static IQueryable<SelfDeclaration> ApplyStatusFilter(
        IQueryable<SelfDeclaration> query,
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
                "Trạng thái hồ sơ không hợp lệ.")
        };

    // Honours the client's Sorting request (e.g. "declarationDate desc",
    // "creationTime") against a whitelist. Falls back to CreationTime descending.
    private static IOrderedQueryable<SelfDeclaration> ApplySorting(
        IQueryable<SelfDeclaration> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("declarationdate", true) => query.OrderByDescending(x => x.DeclarationDate),
            ("declarationdate", false) => query.OrderBy(x => x.DeclarationDate),
            ("creationtime", true) => query.OrderByDescending(x => x.CreationTime),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }
}
