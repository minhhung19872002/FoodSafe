using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Catalogs;

[Authorize(FoodSafePermissions.GeographicCatalogs.View)]
public class GeographicCatalogAppService : ApplicationService, IGeographicCatalogAppService
{
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<Region, Guid> _regions;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public GeographicCatalogAppService(
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes,
        IRepository<Region, Guid> regions,
        ICancellationTokenProvider cancellationTokens)
    {
        _provinces = provinces;
        _districts = districts;
        _communes = communes;
        _regions = regions;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<ListResultDto<ProvinceDto>> GetProvincesAsync(bool activeOnly = true)
    {
        var query = await _provinces.GetQueryableAsync();
        if (activeOnly) query = query.Where(x => x.IsActive);
        var items = await AsyncExecuter.ToListAsync(query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name));
        return new(ObjectMapper.Map<List<Province>, List<ProvinceDto>>(items));
    }

    public async Task<ListResultDto<DistrictDto>> GetDistrictsAsync(Guid provinceId, bool activeOnly = true)
    {
        var query = (await _districts.GetQueryableAsync()).Where(x => x.ProvinceId == provinceId);
        if (activeOnly) query = query.Where(x => x.IsActive);
        var items = await AsyncExecuter.ToListAsync(query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name));
        return new(ObjectMapper.Map<List<District>, List<DistrictDto>>(items));
    }

    public async Task<ListResultDto<CommuneDto>> GetCommunesAsync(Guid districtId, bool activeOnly = true)
    {
        var query = (await _communes.GetQueryableAsync()).Where(x => x.DistrictId == districtId);
        if (activeOnly) query = query.Where(x => x.IsActive);
        var items = await AsyncExecuter.ToListAsync(query.OrderBy(x => x.SortOrder).ThenBy(x => x.Name));
        return new(ObjectMapper.Map<List<Commune>, List<CommuneDto>>(items));
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<ProvinceDto> CreateProvinceAsync(UpsertProvinceDto input)
    {
        await ValidateRegionAsync(input.RegionId);
        await EnsureUniqueAsync(_provinces, input.Code, null);
        var item = Province.Create(GuidGenerator.Create(), input.Code, input.Name, input.RegionId, input.NameShort, input.SortOrder);
        if (!input.IsActive) item.Update(input.Code, input.Name, input.RegionId, input.NameShort, input.SortOrder, false);
        await _provinces.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Province, ProvinceDto>(item);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<ProvinceDto> UpdateProvinceAsync(Guid id, UpsertProvinceDto input)
    {
        await ValidateRegionAsync(input.RegionId);
        await EnsureUniqueAsync(_provinces, input.Code, id);
        var item = await _provinces.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.RegionId, input.NameShort, input.SortOrder, input.IsActive);
        await _provinces.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Province, ProvinceDto>(item);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<DistrictDto> CreateDistrictAsync(UpsertDistrictDto input)
    {
        await _provinces.GetAsync(input.ProvinceId, cancellationToken: _cancellationTokens.Token);
        await EnsureUniqueAsync(_districts, input.Code, null);
        var item = District.Create(GuidGenerator.Create(), input.Code, input.Name, input.ProvinceId, input.Type, input.SortOrder);
        if (!input.IsActive) item.Update(input.Code, input.Name, input.ProvinceId, input.Type, input.SortOrder, false);
        await _districts.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<District, DistrictDto>(item);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<DistrictDto> UpdateDistrictAsync(Guid id, UpsertDistrictDto input)
    {
        await _provinces.GetAsync(input.ProvinceId, cancellationToken: _cancellationTokens.Token);
        await EnsureUniqueAsync(_districts, input.Code, id);
        var item = await _districts.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.ProvinceId, input.Type, input.SortOrder, input.IsActive);
        await _districts.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<District, DistrictDto>(item);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<CommuneDto> CreateCommuneAsync(UpsertCommuneDto input)
    {
        await _districts.GetAsync(input.DistrictId, cancellationToken: _cancellationTokens.Token);
        await EnsureUniqueAsync(_communes, input.Code, null);
        var item = Commune.Create(GuidGenerator.Create(), input.Code, input.Name, input.DistrictId, input.Type, input.SortOrder);
        if (!input.IsActive) item.Update(input.Code, input.Name, input.DistrictId, input.Type, input.SortOrder, false);
        await _communes.InsertAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Commune, CommuneDto>(item);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<CommuneDto> UpdateCommuneAsync(Guid id, UpsertCommuneDto input)
    {
        await _districts.GetAsync(input.DistrictId, cancellationToken: _cancellationTokens.Token);
        await EnsureUniqueAsync(_communes, input.Code, id);
        var item = await _communes.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        item.Update(input.Code, input.Name, input.DistrictId, input.Type, input.SortOrder, input.IsActive);
        await _communes.UpdateAsync(item, true, _cancellationTokens.Token);
        return ObjectMapper.Map<Commune, CommuneDto>(item);
    }

    private async Task ValidateRegionAsync(Guid? regionId)
    {
        if (regionId.HasValue)
        {
            await _regions.GetAsync(regionId.Value, cancellationToken: _cancellationTokens.Token);
        }
    }

    private async Task EnsureUniqueAsync<TEntity>(
        IRepository<TEntity, Guid> repository,
        string code,
        Guid? excludedId)
        where TEntity : AdministrativeArea
    {
        var normalized = Check.NotNullOrWhiteSpace(code, nameof(code), 20).Trim().ToUpperInvariant();
        var query = await repository.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                query.Where(x => x.Code == normalized && (!excludedId.HasValue || x.Id != excludedId)),
                _cancellationTokens.Token))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.DuplicateCode)
                .WithData("Code", normalized);
        }
    }
}
