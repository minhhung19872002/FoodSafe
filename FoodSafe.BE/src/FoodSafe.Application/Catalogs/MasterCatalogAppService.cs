using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Threading;

namespace FoodSafe.Catalogs;

[Authorize(FoodSafePermissions.Catalogs.View)]
public class MasterCatalogAppService : ApplicationService, IMasterCatalogAppService
{
    private readonly IRepository<Country, Guid> _countries;
    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _classifications;
    private readonly IRepository<AdvertisementType, Guid> _advertisementTypes;
    private readonly IRepository<DocumentType, Guid> _documentTypes;
    private readonly IRepository<TestingCenter, Guid> _testingCenters;
    private readonly IRepository<TestingService, Guid> _testingServices;
    private readonly IRepository<ManagementScopeAssignment, Guid> _scopeAssignments;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public MasterCatalogAppService(
        IRepository<Country, Guid> countries, IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces, IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes, IRepository<ProductGroup, Guid> productGroups,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> classifications,
        IRepository<AdvertisementType, Guid> advertisementTypes,
        IRepository<DocumentType, Guid> documentTypes,
        IRepository<TestingCenter, Guid> testingCenters,
        IRepository<TestingService, Guid> testingServices,
        IRepository<ManagementScopeAssignment, Guid> scopeAssignments,
        ICancellationTokenProvider cancellationTokens)
    {
        _countries = countries; _regions = regions; _provinces = provinces; _districts = districts;
        _communes = communes; _productGroups = productGroups; _businessTypes = businessTypes;
        _classifications = classifications; _advertisementTypes = advertisementTypes;
        _documentTypes = documentTypes; _testingCenters = testingCenters;
        _testingServices = testingServices; _scopeAssignments = scopeAssignments;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<CountryDto>> GetCountriesAsync(MasterCatalogListInput input)
    {
        var query = await _countries.GetQueryableAsync();
        if (!input.Filter.IsNullOrWhiteSpace())
            query = query.Where(x => x.CodeAlpha2.Contains(input.Filter!) || x.NameVi.Contains(input.Filter!)
                || (x.NameEn != null && x.NameEn.Contains(input.Filter!)));
        if (input.IsActive.HasValue) query = query.Where(x => x.IsActive == input.IsActive);
        return await PageAsync<Country, CountryDto>(
            query.OrderBy(x => x.SortOrder).ThenBy(x => x.NameVi), input);
    }

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<CountryDto> CreateCountryAsync(UpsertCountryDto input)
    {
        await EnsureCountryCodeAsync(input.CodeAlpha2, null);
        var item = Country.Create(GuidGenerator.Create(), input.CodeAlpha2, input.NameVi, input.CodeAlpha3, input.NameEn, input.SortOrder);
        if (!input.IsActive) item.Update(input.CodeAlpha2, input.NameVi, input.CodeAlpha3, input.NameEn, input.SortOrder, false);
        await _countries.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Country, CountryDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<CountryDto> UpdateCountryAsync(Guid id, UpsertCountryDto input)
    {
        await EnsureCountryCodeAsync(input.CodeAlpha2, id);
        var item = await _countries.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.CodeAlpha2, input.NameVi, input.CodeAlpha3, input.NameEn, input.SortOrder, input.IsActive);
        await _countries.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Country, CountryDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public Task DeleteCountryAsync(Guid id) => _countries.DeleteAsync(id, true, _cancellationTokens.Token);

    public async Task<PagedResultDto<RegionDto>> GetRegionsAsync(MasterCatalogListInput input) =>
        await PageAreaAsync<Region, RegionDto>(await _regions.GetQueryableAsync(), input);

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<RegionDto> CreateRegionAsync(UpsertRegionDto input)
    {
        await EnsureAreaCodeAsync(_regions, input.Code, null);
        var item = Region.Create(GuidGenerator.Create(), input.Code, input.Name, input.Description, input.SortOrder);
        if (!input.IsActive) item.Update(input.Code, input.Name, input.Description, input.SortOrder, false);
        await _regions.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Region, RegionDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<RegionDto> UpdateRegionAsync(Guid id, UpsertRegionDto input)
    {
        await EnsureAreaCodeAsync(_regions, input.Code, id);
        var item = await _regions.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.Description, input.SortOrder, input.IsActive);
        await _regions.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Region, RegionDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public async Task DeleteRegionAsync(Guid id)
    {
        if (await AnyAsync((await _provinces.GetQueryableAsync()).Where(x => x.RegionId == id))) ThrowInUse();
        await _regions.DeleteAsync(id, true, _cancellationTokens.Token);
    }

    public async Task<PagedResultDto<ProductGroupDto>> GetProductGroupsAsync(MasterCatalogListInput input)
    {
        var query = await _productGroups.GetQueryableAsync();
        if (input.ParentId.HasValue) query = query.Where(x => x.ParentId == input.ParentId);
        return await PageMasterAsync<ProductGroup, ProductGroupDto>(query, input);
    }

    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<ProductGroupDto> CreateProductGroupAsync(UpsertProductGroupDto input)
    {
        await ValidateProductParentAsync(input.Level, input.ParentId);
        await EnsureMasterCodeAsync(_productGroups, input.Code, null);
        var item = ProductGroup.Create(GuidGenerator.Create(), input.Code, input.Name, input.Level, input.ParentId,
            input.Description, input.SortOrder, input.IsActive);
        await _productGroups.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<ProductGroup, ProductGroupDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<ProductGroupDto> UpdateProductGroupAsync(Guid id, UpsertProductGroupDto input)
    {
        await ValidateProductParentAsync(input.Level, input.ParentId);
        await EnsureMasterCodeAsync(_productGroups, input.Code, id);
        var item = await _productGroups.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        if (input.Level == 2 && await AnyAsync((await _productGroups.GetQueryableAsync()).Where(x => x.ParentId == id)))
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidProductGroupHierarchy);
        item.Update(input.Code, input.Name, input.Level, input.ParentId, input.Description, input.SortOrder, input.IsActive);
        await _productGroups.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<ProductGroup, ProductGroupDto>(item);
    }

    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public async Task DeleteProductGroupAsync(Guid id)
    {
        if (await AnyAsync((await _productGroups.GetQueryableAsync()).Where(x => x.ParentId == id))
            || await AnyAsync((await _scopeAssignments.GetQueryableAsync()).Where(x => x.ProductGroupId == id)))
            ThrowInUse();
        await _productGroups.DeleteAsync(id, true, _cancellationTokens.Token);
    }

    public async Task<PagedResultDto<MasterCatalogDto>> GetBusinessTypesAsync(MasterCatalogListInput input) =>
        await PageMasterAsync<BusinessType, MasterCatalogDto>(await _businessTypes.GetQueryableAsync(), input);
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public Task<MasterCatalogDto> CreateBusinessTypeAsync(UpsertMasterCatalogDto input) =>
        CreateSimpleAsync(_businessTypes, input, BusinessType.Create);
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public Task<MasterCatalogDto> UpdateBusinessTypeAsync(Guid id, UpsertMasterCatalogDto input) =>
        UpdateSimpleAsync(_businessTypes, id, input, (x, i) => x.Update(i.Code, i.Name, i.Description, i.SortOrder, i.IsActive));
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public async Task DeleteBusinessTypeAsync(Guid id)
    {
        if (await AnyAsync((await _scopeAssignments.GetQueryableAsync()).Where(x => x.BusinessTypeId == id)))
            ThrowInUse();
        await _businessTypes.DeleteAsync(id, true, _cancellationTokens.Token);
    }

    public async Task<PagedResultDto<BusinessClassificationDto>> GetBusinessClassificationsAsync(MasterCatalogListInput input) =>
        await PageMasterAsync<BusinessClassification, BusinessClassificationDto>(await _classifications.GetQueryableAsync(), input);
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<BusinessClassificationDto> CreateBusinessClassificationAsync(UpsertBusinessClassificationDto input)
    {
        await EnsureMasterCodeAsync(_classifications, input.Code, null);
        var item = BusinessClassification.Create(GuidGenerator.Create(), input.Code, input.Name, input.Criteria,
            input.RiskLevel, input.Description, input.SortOrder, input.IsActive);
        await _classifications.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<BusinessClassification, BusinessClassificationDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<BusinessClassificationDto> UpdateBusinessClassificationAsync(Guid id, UpsertBusinessClassificationDto input)
    {
        await EnsureMasterCodeAsync(_classifications, input.Code, id);
        var item = await _classifications.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.Criteria, input.RiskLevel, input.Description, input.SortOrder, input.IsActive);
        await _classifications.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<BusinessClassification, BusinessClassificationDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public Task DeleteBusinessClassificationAsync(Guid id) => _classifications.DeleteAsync(id, true, _cancellationTokens.Token);

    public async Task<PagedResultDto<MasterCatalogDto>> GetAdvertisementTypesAsync(MasterCatalogListInput input) =>
        await PageMasterAsync<AdvertisementType, MasterCatalogDto>(await _advertisementTypes.GetQueryableAsync(), input);
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public Task<MasterCatalogDto> CreateAdvertisementTypeAsync(UpsertMasterCatalogDto input) =>
        CreateSimpleAsync(_advertisementTypes, input, AdvertisementType.Create);
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public Task<MasterCatalogDto> UpdateAdvertisementTypeAsync(Guid id, UpsertMasterCatalogDto input) =>
        UpdateSimpleAsync(_advertisementTypes, id, input, (x, i) => x.Update(i.Code, i.Name, i.Description, i.SortOrder, i.IsActive));
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public Task DeleteAdvertisementTypeAsync(Guid id) => _advertisementTypes.DeleteAsync(id, true, _cancellationTokens.Token);

    public async Task<PagedResultDto<MasterCatalogDto>> GetDocumentTypesAsync(MasterCatalogListInput input) =>
        await PageMasterAsync<DocumentType, MasterCatalogDto>(await _documentTypes.GetQueryableAsync(), input);
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public Task<MasterCatalogDto> CreateDocumentTypeAsync(UpsertMasterCatalogDto input) =>
        CreateSimpleAsync(_documentTypes, input, DocumentType.Create);
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public Task<MasterCatalogDto> UpdateDocumentTypeAsync(Guid id, UpsertMasterCatalogDto input) =>
        UpdateSimpleAsync(_documentTypes, id, input, (x, i) => x.Update(i.Code, i.Name, i.Description, i.SortOrder, i.IsActive));
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public Task DeleteDocumentTypeAsync(Guid id) => _documentTypes.DeleteAsync(id, true, _cancellationTokens.Token);

    public async Task<PagedResultDto<TestingCenterDto>> GetTestingCentersAsync(MasterCatalogListInput input) =>
        await PageMasterAsync<TestingCenter, TestingCenterDto>(await _testingCenters.GetQueryableAsync(), input);
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<TestingCenterDto> CreateTestingCenterAsync(UpsertTestingCenterDto input)
    {
        await ValidateGeographyAsync(input.ProvinceId, input.DistrictId, input.CommuneId);
        await EnsureMasterCodeAsync(_testingCenters, input.Code, null);
        var item = TestingCenter.Create(GuidGenerator.Create(), input.Code, input.Name, input.Address, input.ProvinceId,
            input.DistrictId, input.CommuneId, input.ContactPerson, input.Phone, input.Email,
            input.AccreditationNumber, input.AccreditationScope, input.AccreditationExpiresAt,
            input.Description, input.SortOrder, input.IsActive);
        await _testingCenters.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TestingCenter, TestingCenterDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<TestingCenterDto> UpdateTestingCenterAsync(Guid id, UpsertTestingCenterDto input)
    {
        await ValidateGeographyAsync(input.ProvinceId, input.DistrictId, input.CommuneId);
        await EnsureMasterCodeAsync(_testingCenters, input.Code, id);
        var item = await _testingCenters.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.Address, input.ProvinceId, input.DistrictId, input.CommuneId,
            input.ContactPerson, input.Phone, input.Email, input.AccreditationNumber, input.AccreditationScope,
            input.AccreditationExpiresAt, input.Description, input.SortOrder, input.IsActive);
        await _testingCenters.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TestingCenter, TestingCenterDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public async Task DeleteTestingCenterAsync(Guid id)
    {
        if (await AnyAsync((await _testingServices.GetQueryableAsync()).Where(x => x.TestingCenterId == id))) ThrowInUse();
        await _testingCenters.DeleteAsync(id, true, _cancellationTokens.Token);
    }

    public async Task<PagedResultDto<TestingServiceDto>> GetTestingServicesAsync(MasterCatalogListInput input)
    {
        var query = await _testingServices.GetQueryableAsync();
        if (input.TestingCenterId.HasValue) query = query.Where(x => x.TestingCenterId == input.TestingCenterId);
        return await PageMasterAsync<TestingService, TestingServiceDto>(query, input);
    }
    [Authorize(FoodSafePermissions.Catalogs.Create)]
    public async Task<TestingServiceDto> CreateTestingServiceAsync(UpsertTestingServiceDto input)
    {
        await _testingCenters.GetAsync(input.TestingCenterId, cancellationToken: _cancellationTokens.Token);
        await EnsureServiceCodeAsync(input.TestingCenterId, input.Code, null);
        var item = TestingService.Create(GuidGenerator.Create(), input.TestingCenterId, input.Code, input.Name,
            input.Unit, input.Method, input.Price, input.TurnaroundDays, input.Description, input.SortOrder, input.IsActive);
        await _testingServices.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TestingService, TestingServiceDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Edit)]
    public async Task<TestingServiceDto> UpdateTestingServiceAsync(Guid id, UpsertTestingServiceDto input)
    {
        await _testingCenters.GetAsync(input.TestingCenterId, cancellationToken: _cancellationTokens.Token);
        await EnsureServiceCodeAsync(input.TestingCenterId, input.Code, id);
        var item = await _testingServices.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.TestingCenterId, input.Code, input.Name, input.Unit, input.Method, input.Price,
            input.TurnaroundDays, input.Description, input.SortOrder, input.IsActive);
        await _testingServices.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TestingService, TestingServiceDto>(item);
    }
    [Authorize(FoodSafePermissions.Catalogs.Delete)]
    public Task DeleteTestingServiceAsync(Guid id) => _testingServices.DeleteAsync(id, true, _cancellationTokens.Token);

    private async Task<MasterCatalogDto> CreateSimpleAsync<TEntity>(IRepository<TEntity, Guid> repository,
        UpsertMasterCatalogDto input, Func<Guid, string, string, string?, int, bool, TEntity> factory)
        where TEntity : MasterCatalog
    {
        await EnsureMasterCodeAsync(repository, input.Code, null);
        var item = factory(GuidGenerator.Create(), input.Code, input.Name, input.Description, input.SortOrder, input.IsActive);
        await repository.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TEntity, MasterCatalogDto>(item);
    }

    private async Task<MasterCatalogDto> UpdateSimpleAsync<TEntity>(IRepository<TEntity, Guid> repository,
        Guid id, UpsertMasterCatalogDto input, Action<TEntity, UpsertMasterCatalogDto> update)
        where TEntity : MasterCatalog
    {
        await EnsureMasterCodeAsync(repository, input.Code, id);
        var item = await repository.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        update(item, input);
        await repository.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<TEntity, MasterCatalogDto>(item);
    }

    private async Task<PagedResultDto<TDto>> PageMasterAsync<TEntity, TDto>(
        IQueryable<TEntity> query, MasterCatalogListInput input) where TEntity : MasterCatalog
    {
        if (!input.Filter.IsNullOrWhiteSpace())
            query = query.Where(x => x.Code.Contains(input.Filter!) || x.Name.Contains(input.Filter!));
        if (input.IsActive.HasValue) query = query.Where(x => x.IsActive == input.IsActive);
        return await PageAsync<TEntity, TDto>(
            query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name), input);
    }

    private async Task<PagedResultDto<TDto>> PageAreaAsync<TEntity, TDto>(
        IQueryable<TEntity> query, MasterCatalogListInput input) where TEntity : AdministrativeArea
    {
        if (!input.Filter.IsNullOrWhiteSpace())
            query = query.Where(x => x.Code.Contains(input.Filter!) || x.Name.Contains(input.Filter!));
        if (input.IsActive.HasValue) query = query.Where(x => x.IsActive == input.IsActive);
        return await PageAsync<TEntity, TDto>(
            query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name), input);
    }

    private async Task<PagedResultDto<TDto>> PageAsync<TEntity, TDto>(
        IQueryable<TEntity> query, MasterCatalogListInput input) where TEntity : IEntity<Guid>
    {
        var total = await AsyncExecuter.LongCountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(query
            .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, ObjectMapper.Map<List<TEntity>, List<TDto>>(items));
    }

    private async Task EnsureCountryCodeAsync(string code, Guid? excludedId)
    {
        var normalized = code.Trim().ToUpperInvariant();
        var query = await _countries.GetQueryableAsync();
        if (await AnyAsync(query.Where(x => x.CodeAlpha2 == normalized && (!excludedId.HasValue || x.Id != excludedId))))
            ThrowDuplicate(normalized);
    }

    private async Task EnsureAreaCodeAsync<TEntity>(IRepository<TEntity, Guid> repository, string code, Guid? excludedId)
        where TEntity : AdministrativeArea
    {
        var normalized = code.Trim().ToUpperInvariant();
        if (await AnyAsync((await repository.GetQueryableAsync()).Where(x =>
                x.Code == normalized && (!excludedId.HasValue || x.Id != excludedId)))) ThrowDuplicate(normalized);
    }

    private async Task EnsureMasterCodeAsync<TEntity>(IRepository<TEntity, Guid> repository, string code, Guid? excludedId)
        where TEntity : MasterCatalog
    {
        var normalized = code.Trim().ToUpperInvariant();
        if (await AnyAsync((await repository.GetQueryableAsync()).Where(x =>
                x.Code == normalized && (!excludedId.HasValue || x.Id != excludedId)))) ThrowDuplicate(normalized);
    }

    private async Task EnsureServiceCodeAsync(Guid centerId, string code, Guid? excludedId)
    {
        var normalized = code.Trim().ToUpperInvariant();
        if (await AnyAsync((await _testingServices.GetQueryableAsync()).Where(x => x.TestingCenterId == centerId
            && x.Code == normalized && (!excludedId.HasValue || x.Id != excludedId)))) ThrowDuplicate(normalized);
    }

    private async Task ValidateProductParentAsync(short level, Guid? parentId)
    {
        if (level == 2 && parentId.HasValue)
        {
            var parent = await _productGroups.GetAsync(parentId.Value, cancellationToken: _cancellationTokens.Token);
            if (parent.Level != 1) throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidProductGroupHierarchy);
        }
    }

    private async Task ValidateGeographyAsync(Guid provinceId, Guid? districtId, Guid? communeId)
    {
        await _provinces.GetAsync(provinceId, cancellationToken: _cancellationTokens.Token);
        if (districtId.HasValue)
        {
            var district = await _districts.GetAsync(districtId.Value, cancellationToken: _cancellationTokens.Token);
            if (district.ProvinceId != provinceId) throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
        }
        if (communeId.HasValue)
        {
            if (!districtId.HasValue) throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
            var commune = await _communes.GetAsync(communeId.Value, cancellationToken: _cancellationTokens.Token);
            if (commune.DistrictId != districtId) throw new BusinessException(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
        }
    }

    private Task<bool> AnyAsync<TEntity>(IQueryable<TEntity> query) =>
        AsyncExecuter.AnyAsync(query, _cancellationTokens.Token);
    private static void ThrowInUse() => throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InUse);
    private static void ThrowDuplicate(string code) => throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.DuplicateCode)
        .WithData("Code", code);
}
