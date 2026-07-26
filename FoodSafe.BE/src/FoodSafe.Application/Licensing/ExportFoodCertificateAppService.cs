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

[Authorize(FoodSafePermissions.Licensing.ExportCertificates.View)]
public class ExportFoodCertificateAppService :
    ApplicationService,
    IExportFoodCertificateAppService
{
    private readonly IRepository<ExportFoodCertificate, Guid> _registrations;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<Country, Guid> _countries;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ExportFoodCertificateAppService(
        IRepository<ExportFoodCertificate, Guid> registrations,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<Country, Guid> countries,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<DocumentOwner, Guid> documentOwners,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _registrations = registrations;
        _businesses = businesses;
        _products = products;
        _countries = countries;
        _businessProductGroups = businessProductGroups;
        _documentOwners = documentOwners;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<ExportFoodCertificateDto>> GetListAsync(
        ExportFoodCertificateListInput input)
    {
        var today = Clock.Now.Date;
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x => x.CertificateNumber.Contains(filter));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.ProductId.HasValue)
            query = query.Where(x => x.ProductId == input.ProductId);
        if (input.DestinationCountryId.HasValue)
            query = query.Where(x =>
                x.DestinationCountryId == input.DestinationCountryId);
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
            query.OrderByDescending(x => x.IssueDate)
                .ThenBy(x => x.CertificateNumber)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, await ToDtosAsync(rows, today));
    }

    public async Task<ExportFoodCertificateDto> GetAsync(Guid id)
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
            var groupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
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

    public async Task<IReadOnlyList<CfsCountryOptionDto>>
        GetCountryOptionsAsync()
    {
        var query = await _countries.GetQueryableAsync();
        return await AsyncExecuter.ToListAsync(
            query.Where(x => x.IsActive)
                .OrderBy(x => x.SortOrder)
                .ThenBy(x => x.NameVi)
                .Select(x => new CfsCountryOptionDto
                {
                    Id = x.Id,
                    Code = x.CodeAlpha2,
                    Name = x.NameVi
                }),
            _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Licensing.ExportCertificates.Create)]
    public async Task<ExportFoodCertificateDto> CreateAsync(
        UpsertExportFoodCertificateDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureProductAsync(
            input.ProductId,
            business,
            DataScopeOperation.Create);
        if (input.DestinationCountryId.HasValue)
            await EnsureCountryAsync(input.DestinationCountryId.Value);
        await EnsureUniqueNumberAsync(input.CertificateNumber, null);

        var id = GuidGenerator.Create();
        var registration = ExportFoodCertificate.Create(
            id,
            business.Id,
            business.OrganizationId,
            input.ProductId,
            input.DestinationCountryId,
            input.CertificateNumber,
            input.IssueDate,
            input.ExpiryDate,
            input.LotNumber,
            input.Quantity,
            input.QuantityUnit,
            input.Notes,
            Clock.Now.Date);
        await _documentOwners.InsertAsync(
            DocumentOwner.Create(
                id,
                business.OrganizationId,
                "export-food-certificate",
                Clock.Now),
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await _registrations.InsertAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
    }

    [Authorize(FoodSafePermissions.Licensing.ExportCertificates.Edit)]
    public async Task<ExportFoodCertificateDto> UpdateAsync(
        Guid id,
        UpdateExportFoodCertificateDto input)
    {
        var registration = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        if (input.BusinessId != registration.BusinessId)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate.ProductMismatch);
        var business = await GetScopedBusinessAsync(
            registration.BusinessId,
            DataScopeOperation.Edit);
        await EnsureProductAsync(
            input.ProductId,
            business,
            DataScopeOperation.Edit);
        if (input.DestinationCountryId.HasValue)
            await EnsureCountryAsync(input.DestinationCountryId.Value);
        await EnsureUniqueNumberAsync(input.CertificateNumber, id);
        registration.Update(
            input.ProductId,
            input.DestinationCountryId,
            input.CertificateNumber,
            input.IssueDate,
            input.ExpiryDate,
            input.LotNumber,
            input.Quantity,
            input.QuantityUnit,
            input.Notes,
            Clock.Now.Date);
        await _registrations.UpdateAsync(
            registration,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([registration], Clock.Now.Date))[0];
    }

    [Authorize(FoodSafePermissions.Licensing.ExportCertificates.Delete)]
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

    [Authorize(FoodSafePermissions.Licensing.ExportCertificates.Edit)]
    public async Task<ExportFoodCertificateDto> RevokeAsync(
        Guid id,
        RevokeExportFoodCertificateDto input)
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

    private async Task<IQueryable<ExportFoodCertificate>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _registrations.GetQueryableAsync();
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
                 productGroupIds.Contains(product.ProductGroupId.Value))));
    }

    private async Task<ExportFoodCertificate> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The export food certificate is outside the current user's data scope.");
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
        if (!await AsyncExecuter.AnyAsync(query, _cancellationTokens.Token))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate.ProductMismatch);
    }

    private async Task EnsureCountryAsync(Guid countryId)
    {
        var query = await _countries.GetQueryableAsync();
        if (!await AsyncExecuter.AnyAsync(
                query.Where(x => x.Id == countryId && x.IsActive),
                _cancellationTokens.Token))
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate.CountryNotFound);
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
                        x.CertificateNumber == normalized &&
                        (!excludedId.HasValue || x.Id != excludedId.Value)),
                    _cancellationTokens.Token))
                throw new BusinessException(
                        FoodSafeDomainErrorCodes.ExportFoodCertificate
                            .DuplicateNumber)
                    .WithData("CertificateNumber", normalized);
        }
    }

    private async Task<List<ExportFoodCertificateDto>> ToDtosAsync(
        IReadOnlyCollection<ExportFoodCertificate> registrations,
        DateTime today)
    {
        var businessIds = registrations.Select(x => x.BusinessId)
            .Distinct().ToArray();
        var productIds = registrations.Where(x => x.ProductId.HasValue)
            .Select(x => x.ProductId!.Value).Distinct().ToArray();
        var countryIds = registrations
            .Where(x => x.DestinationCountryId.HasValue)
            .Select(x => x.DestinationCountryId!.Value)
            .Distinct().ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var productQuery = await _products.GetQueryableAsync();
        var countryQuery = await _countries.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var productRows = await AsyncExecuter.ToListAsync(
            productQuery.Where(x => productIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var countryRows = await AsyncExecuter.ToListAsync(
            countryQuery.Where(x => countryIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);
        var products = productRows.ToDictionary(x => x.Id, x => x.Name);
        var countries = countryRows.ToDictionary(x => x.Id, x => x.NameVi);
        return registrations.Select(x =>
        {
            var dto = ObjectMapper.Map<ExportFoodCertificate,
                ExportFoodCertificateDto>(x);
            dto.Status = x.EffectiveStatus(today);
            dto.DaysUntilExpiry = x.ExpiryDate.HasValue
                ? (x.ExpiryDate.Value.Date - today).Days
                : null;
            dto.BusinessName =
                businesses.GetValueOrDefault(x.BusinessId) ?? string.Empty;
            dto.LinkedProductName = x.ProductId.HasValue
                ? products.GetValueOrDefault(x.ProductId.Value)
                : null;
            dto.DestinationCountryName = x.DestinationCountryId.HasValue
                ? countries.GetValueOrDefault(
                    x.DestinationCountryId.Value) ?? string.Empty
                : string.Empty;
            return dto;
        }).ToList();
    }

    private static IQueryable<ExportFoodCertificate> ApplyStatusFilter(
        IQueryable<ExportFoodCertificate> query,
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
                "Trạng thái giấy chứng nhận không hợp lệ.")
        };
}
