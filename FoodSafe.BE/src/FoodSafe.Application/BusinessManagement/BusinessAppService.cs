using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

[Authorize(FoodSafePermissions.BusinessManagement.Businesses.View)]
public class BusinessAppService : ApplicationService, IBusinessAppService
{
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<BusinessHandler, Guid> _handlers;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public BusinessAppService(
        IRepository<Business, Guid> businesses,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<BusinessHandler, Guid> handlers,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _businessProductGroups = businessProductGroups;
        _handlers = handlers;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<BusinessDto>> GetListAsync(
        BusinessListInput input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View,
            _cancellationTokens.Token);
        var query = await ScopedQueryAsync(scope);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Name.Contains(filter) ||
                (x.Code != null && x.Code.Contains(filter)) ||
                (x.TaxCode != null && x.TaxCode.Contains(filter)) ||
                (x.AddressStreet != null && x.AddressStreet.Contains(filter)));
        }
        if (input.OrganizationId.HasValue)
            query = query.Where(x => x.OrganizationId == input.OrganizationId);
        if (input.BusinessTypeId.HasValue)
            query = query.Where(x => x.BusinessTypeId == input.BusinessTypeId);
        if (input.BusinessClassificationId.HasValue)
            query = query.Where(x =>
                x.BusinessClassificationId == input.BusinessClassificationId);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status);
        if (input.HasEligibilityCertificate.HasValue)
            query = query.Where(x =>
                x.HasEligibilityCertificate == input.HasEligibilityCertificate);
        if (input.ProvinceId.HasValue)
            query = query.Where(x => x.AddressProvinceId == input.ProvinceId);
        if (input.DistrictId.HasValue)
            query = query.Where(x => x.AddressDistrictId == input.DistrictId);
        if (input.CommuneId.HasValue)
            query = query.Where(x => x.AddressCommuneId == input.CommuneId);

        var total = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, ObjectMapper.Map<List<Business>, List<BusinessDto>>(items));
    }

    // Honours the client's Sorting request (e.g. "Name", "Code desc", "Status")
    // against a whitelist so the businesses list supports column sorting without
    // exposing the query to dynamic-LINQ injection. Falls back to Name ascending.
    private static IOrderedQueryable<Business> ApplySorting(
        IQueryable<Business> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("code", true) => query.OrderByDescending(x => x.Code),
            ("code", false) => query.OrderBy(x => x.Code),
            ("status", true) => query.OrderByDescending(x => x.Status).ThenBy(x => x.Name),
            ("status", false) => query.OrderBy(x => x.Status).ThenBy(x => x.Name),
            ("name", true) => query.OrderByDescending(x => x.Name),
            _ => query.OrderBy(x => x.Name)
        };
    }

    public async Task<BusinessDto> GetAsync(Guid id)
    {
        var business = await GetScopedAsync(id, DataScopeOperation.View);
        return await ToDetailDtoAsync(business);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Create)]
    public async Task<BusinessDto> CreateAsync(UpsertBusinessDto input)
    {
        await _dataScopeProvider.EnsureOrganizationAccessAsync(
            input.OrganizationId,
            DataScopeOperation.Create,
            _cancellationTokens.Token);
        await EnsureUniqueIdentityAsync(input.Code, input.TaxCode, null);

        var business = Business.Create(
            GuidGenerator.Create(), input.OrganizationId, input.Code, input.Name,
            input.BusinessTypeId, input.BusinessClassificationId, input.TaxCode,
            input.RepresentativeName, input.RepresentativeIdCard,
            input.ContactPhone, input.ContactEmail, input.ContactWebsite,
            input.AddressStreet, input.AddressProvinceId, input.AddressDistrictId,
            input.AddressCommuneId, input.AddressLatitude, input.AddressLongitude,
            input.EstablishedDate, input.EmployeeCount, input.Notes);
        await _businesses.InsertAsync(
            business,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await ReplaceProductGroupsAsync(business.Id, input.ProductGroupIds);
        return await ToDetailDtoAsync(business);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Edit)]
    public async Task<BusinessDto> UpdateAsync(
        Guid id,
        UpdateBusinessDto input)
    {
        var business = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (input.OrganizationId != business.OrganizationId)
            throw new AbpAuthorizationException(
                "Changing the owning organization is not supported.");
        await EnsureUniqueIdentityAsync(input.Code, input.TaxCode, id);

        business.Update(
            input.Code, input.Name, input.BusinessTypeId,
            input.BusinessClassificationId, input.TaxCode,
            input.RepresentativeName, input.RepresentativeIdCard,
            input.ContactPhone, input.ContactEmail, input.ContactWebsite,
            input.AddressStreet, input.AddressProvinceId, input.AddressDistrictId,
            input.AddressCommuneId, input.AddressLatitude, input.AddressLongitude,
            input.EstablishedDate, input.EmployeeCount, input.Notes);
        business.SetStatus(
            input.Status,
            input.SuspensionReason,
            input.SuspendedAt);
        business.SetCertificateFlags(
            input.HasEligibilityCertificate,
            input.HasVsattpCommitment);
        await _businesses.UpdateAsync(
            business,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await ReplaceProductGroupsAsync(id, input.ProductGroupIds);
        return await ToDetailDtoAsync(business);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var business = await GetScopedAsync(id, DataScopeOperation.Delete);
        await _businesses.DeleteAsync(
            business,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Edit)]
    public async Task<BusinessHandlerDto> AddHandlerAsync(
        Guid id,
        UpsertBusinessHandlerDto input)
    {
        await GetScopedAsync(id, DataScopeOperation.Edit);
        var handler = BusinessHandler.Create(
            GuidGenerator.Create(), id, input.FullName, input.Position,
            input.IdCardNumber, input.TrainingCertificateNumber,
            input.TrainingDate, input.TrainingOrganization,
            input.TrainingExpiryDate, input.HealthCertificateNumber,
            input.HealthCheckDate, input.HealthCheckFacility,
            input.HealthCheckExpiryDate, input.Notes);
        if (!input.IsActive)
        {
            UpdateHandler(handler, input);
        }
        await _handlers.InsertAsync(
            handler,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return ObjectMapper.Map<BusinessHandler, BusinessHandlerDto>(handler);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Edit)]
    public async Task<BusinessHandlerDto> UpdateHandlerAsync(
        Guid id,
        Guid handlerId,
        UpsertBusinessHandlerDto input)
    {
        await GetScopedAsync(id, DataScopeOperation.Edit);
        var handler = await _handlers.GetAsync(
            x => x.Id == handlerId && x.BusinessId == id,
            cancellationToken: _cancellationTokens.Token);
        UpdateHandler(handler, input);
        await _handlers.UpdateAsync(
            handler,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return ObjectMapper.Map<BusinessHandler, BusinessHandlerDto>(handler);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Businesses.Edit)]
    public async Task DeleteHandlerAsync(Guid id, Guid handlerId)
    {
        await GetScopedAsync(id, DataScopeOperation.Edit);
        var handler = await _handlers.GetAsync(
            x => x.Id == handlerId && x.BusinessId == id,
            cancellationToken: _cancellationTokens.Token);
        await _handlers.DeleteAsync(
            handler,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    private async Task<IQueryable<Business>> ScopedQueryAsync(
        CurrentDataScope scope)
    {
        var query = await _businesses.GetQueryableAsync();
        if (scope.HasGlobalAccess) return query;

        var productGroupQuery = await _businessProductGroups.GetQueryableAsync();
        var organizationIds = scope.OrganizationIds;
        var provinceIds = scope.ProvinceIds;
        var districtIds = scope.DistrictIds;
        var communeIds = scope.CommuneIds;
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();

        return query.Where(x =>
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
            productGroupQuery.Any(link =>
                link.BusinessId == x.Id &&
                productGroupIds.Contains(link.ProductGroupId)));
    }

    private async Task<Business> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await ScopedQueryAsync(scope);
        var business = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(x => x.Id == id),
            _cancellationTokens.Token);
        return business ?? throw new AbpAuthorizationException(
            "The business is outside the current user's data scope.");
    }

    private async Task EnsureUniqueIdentityAsync(
        string? code,
        string? taxCode,
        Guid? excludedId)
    {
        var normalizedCode = Normalize(code);
        var normalizedTaxCode = Normalize(taxCode);
        var query = await _businesses.GetQueryableAsync();
        if (normalizedCode is not null && await AsyncExecuter.AnyAsync(
                query.Where(x =>
                    x.Code == normalizedCode &&
                    (!excludedId.HasValue || x.Id != excludedId)),
                _cancellationTokens.Token))
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.DuplicateCode);
        if (normalizedTaxCode is not null && await AsyncExecuter.AnyAsync(
                query.Where(x =>
                    x.TaxCode == normalizedTaxCode &&
                    (!excludedId.HasValue || x.Id != excludedId)),
                _cancellationTokens.Token))
            throw new BusinessException(
                    FoodSafeDomainErrorCodes.Business.DuplicateTaxCode)
                .WithData("TaxCode", normalizedTaxCode);
    }

    private async Task ReplaceProductGroupsAsync(
        Guid businessId,
        IReadOnlyList<Guid> productGroupIds)
    {
        var distinctIds = productGroupIds.Distinct().ToArray();
        var query = await _businessProductGroups.GetQueryableAsync();
        var existing = await AsyncExecuter.ToListAsync(
            query.Where(x => x.BusinessId == businessId),
            _cancellationTokens.Token);
        if (existing.Count > 0)
            await _businessProductGroups.DeleteManyAsync(
                existing,
                autoSave: false,
                cancellationToken: _cancellationTokens.Token);
        if (distinctIds.Length > 0)
            await _businessProductGroups.InsertManyAsync(
                distinctIds.Select(id => new BusinessProductGroup(businessId, id)),
                autoSave: true,
                cancellationToken: _cancellationTokens.Token);
    }

    private async Task<BusinessDto> ToDetailDtoAsync(Business business)
    {
        var dto = ObjectMapper.Map<Business, BusinessDto>(business);
        var productGroupQuery = await _businessProductGroups.GetQueryableAsync();
        dto.ProductGroupIds = await AsyncExecuter.ToListAsync(
            productGroupQuery
                .Where(x => x.BusinessId == business.Id)
                .Select(x => x.ProductGroupId),
            _cancellationTokens.Token);
        var handlerQuery = await _handlers.GetQueryableAsync();
        var handlers = await AsyncExecuter.ToListAsync(
            handlerQuery
                .Where(x => x.BusinessId == business.Id)
                .OrderBy(x => x.FullName),
            _cancellationTokens.Token);
        dto.Handlers =
            ObjectMapper.Map<List<BusinessHandler>, List<BusinessHandlerDto>>(
                handlers);
        return dto;
    }

    private static void UpdateHandler(
        BusinessHandler handler,
        UpsertBusinessHandlerDto input) =>
        handler.Update(
            input.FullName, input.Position, input.IdCardNumber,
            input.TrainingCertificateNumber, input.TrainingDate,
            input.TrainingOrganization, input.TrainingExpiryDate,
            input.HealthCertificateNumber, input.HealthCheckDate,
            input.HealthCheckFacility, input.HealthCheckExpiryDate,
            input.IsActive, input.Notes);

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().ToUpperInvariant();
}
