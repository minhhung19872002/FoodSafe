using ClosedXML.Excel;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using FoodSafe.Organizations;

namespace FoodSafe.Catalogs;

[Authorize(FoodSafePermissions.GeographicCatalogs.View)]
public class GeographicCatalogAppService : ApplicationService, IGeographicCatalogAppService
{
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public GeographicCatalogAppService(
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes,
        IRepository<Region, Guid> regions,
        IRepository<Organization, Guid> organizations,
        ICancellationTokenProvider cancellationTokens)
    {
        _provinces = provinces;
        _districts = districts;
        _communes = communes;
        _regions = regions;
        _organizations = organizations;
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
    public async Task DeleteProvinceAsync(Guid id)
    {
        var districts = await _districts.GetQueryableAsync();
        var organizations = await _organizations.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                districts.Where(x => x.ProvinceId == id),
                _cancellationTokens.Token)
            || await AsyncExecuter.AnyAsync(
                organizations.Where(x => x.ProvinceId == id),
                _cancellationTokens.Token))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InUse);
        }

        await _provinces.DeleteAsync(id, true, _cancellationTokens.Token);
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
    public async Task DeleteDistrictAsync(Guid id)
    {
        var communes = await _communes.GetQueryableAsync();
        var organizations = await _organizations.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                communes.Where(x => x.DistrictId == id),
                _cancellationTokens.Token)
            || await AsyncExecuter.AnyAsync(
                organizations.Where(x => x.DistrictId == id),
                _cancellationTokens.Token))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InUse);
        }

        await _districts.DeleteAsync(id, true, _cancellationTokens.Token);
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

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task DeleteCommuneAsync(Guid id)
    {
        var organizations = await _organizations.GetQueryableAsync();
        if (await AsyncExecuter.AnyAsync(
                organizations.Where(x => x.CommuneId == id),
                _cancellationTokens.Token))
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InUse);
        }

        await _communes.DeleteAsync(id, true, _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.GeographicCatalogs.Manage)]
    public async Task<ImportGeographyResultDto> ImportDistrictsAndCommunesFromExcelAsync(
        ImportGeographyFromExcelInput input)
    {
        await _provinces.GetAsync(input.ProvinceId, cancellationToken: _cancellationTokens.Token);

        List<GeographyExcelRow> excelRows;
        try
        {
            excelRows = ReadExcelRows(input.ExcelBytes);
        }
        catch (Exception ex)
        {
            throw new UserFriendlyException($"Không thể đọc file Excel: {ex.Message}");
        }

        var errors = new List<ImportGeographyErrorDto>();
        var skippedRows = 0;
        var importedCommunes = 0;
        var processedDistrictCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Load all existing districts for the province up front
        var existingDistricts = (await AsyncExecuter.ToListAsync(
                (await _districts.GetQueryableAsync()).Where(d => d.ProvinceId == input.ProvinceId),
                _cancellationTokens.Token))
            .ToDictionary(d => d.Code, StringComparer.OrdinalIgnoreCase);

        // Communes are loaded per district on demand
        var communesByDistrict = new Dictionary<Guid, Dictionary<string, Commune>>();

        foreach (var row in excelRows)
        {
            var districtCode = NormalizeCode(row.DistrictCode);
            var districtName = NormalizeName(row.DistrictName);
            var communeCode = NormalizeCode(row.CommuneCode);
            var communeName = NormalizeName(row.CommuneName);
            var typeText = row.Type?.Trim() ?? string.Empty;

            // --- District validation ---
            if (string.IsNullOrEmpty(districtCode))
            {
                // Only log an error if there's any other non-empty data in the row
                if (!string.IsNullOrEmpty(districtName) || !string.IsNullOrEmpty(communeCode) || !string.IsNullOrEmpty(communeName))
                {
                    errors.Add(new ImportGeographyErrorDto
                    {
                        RowNumber = row.RowNumber,
                        Field = "Mã huyện",
                        Message = "Mã huyện không được để trống"
                    });
                }
                skippedRows++;
                continue;
            }

            if (string.IsNullOrEmpty(districtName))
            {
                errors.Add(new ImportGeographyErrorDto
                {
                    RowNumber = row.RowNumber,
                    Field = "Tên huyện",
                    Message = "Tên huyện không được để trống"
                });
                skippedRows++;
                continue;
            }

            if (districtCode.Length > 10)
            {
                errors.Add(new ImportGeographyErrorDto
                {
                    RowNumber = row.RowNumber,
                    Field = "Mã huyện",
                    Message = $"Mã huyện vượt quá 10 ký tự: {districtCode}"
                });
                skippedRows++;
                continue;
            }

            var districtType = ParseDistrictType(typeText, districtName);
            var communeType = ParseCommuneType(typeText);

            // --- Upsert district ---
            if (!existingDistricts.TryGetValue(districtCode, out var district))
            {
                district = District.Create(
                    GuidGenerator.Create(), districtCode, districtName,
                    input.ProvinceId, districtType, 0);
                await _districts.InsertAsync(district, autoSave: false, _cancellationTokens.Token);
                existingDistricts[districtCode] = district;
            }
            else if (district.Name != districtName || district.Type != districtType)
            {
                district.Update(districtCode, districtName, input.ProvinceId, districtType,
                    district.SortOrder, district.IsActive);
                await _districts.UpdateAsync(district, autoSave: false, _cancellationTokens.Token);
            }

            processedDistrictCodes.Add(districtCode);

            // --- Commune validation (skip if no commune data) ---
            if (string.IsNullOrEmpty(communeCode) && string.IsNullOrEmpty(communeName))
                continue;

            if (string.IsNullOrEmpty(communeCode))
            {
                errors.Add(new ImportGeographyErrorDto
                {
                    RowNumber = row.RowNumber,
                    Field = "Mã xã",
                    Message = "Mã xã không được để trống khi có tên xã"
                });
                skippedRows++;
                continue;
            }

            if (string.IsNullOrEmpty(communeName))
            {
                errors.Add(new ImportGeographyErrorDto
                {
                    RowNumber = row.RowNumber,
                    Field = "Tên xã",
                    Message = "Tên xã không được để trống khi có mã xã"
                });
                skippedRows++;
                continue;
            }

            if (communeCode.Length > 10)
            {
                errors.Add(new ImportGeographyErrorDto
                {
                    RowNumber = row.RowNumber,
                    Field = "Mã xã",
                    Message = $"Mã xã vượt quá 10 ký tự: {communeCode}"
                });
                skippedRows++;
                continue;
            }

            // --- Load communes for this district on demand ---
            if (!communesByDistrict.TryGetValue(district.Id, out var districtCommunes))
            {
                var loaded = await AsyncExecuter.ToListAsync(
                    (await _communes.GetQueryableAsync()).Where(c => c.DistrictId == district.Id),
                    _cancellationTokens.Token);
                districtCommunes = loaded.ToDictionary(c => c.Code, StringComparer.OrdinalIgnoreCase);
                communesByDistrict[district.Id] = districtCommunes;
            }

            // --- Upsert commune ---
            if (!districtCommunes.TryGetValue(communeCode, out var commune))
            {
                commune = Commune.Create(GuidGenerator.Create(), communeCode, communeName,
                    district.Id, communeType, 0);
                await _communes.InsertAsync(commune, autoSave: false, _cancellationTokens.Token);
                districtCommunes[communeCode] = commune;
                importedCommunes++;
            }
            else if (commune.Name != communeName || commune.Type != communeType)
            {
                commune.Update(communeCode, communeName, district.Id, communeType,
                    commune.SortOrder, commune.IsActive);
                await _communes.UpdateAsync(commune, autoSave: false, _cancellationTokens.Token);
                importedCommunes++;
            }
        }

        return new ImportGeographyResultDto
        {
            ImportedDistricts = processedDistrictCodes.Count,
            ImportedCommunes = importedCommunes,
            SkippedRows = skippedRows,
            Errors = errors
        };
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

    // ── Excel parsing helpers ──────────────────────────────────────────────

    private sealed record GeographyExcelRow(
        int RowNumber,
        string? DistrictCode,
        string? DistrictName,
        string? CommuneCode,
        string? CommuneName,
        string? Type);

    private static List<GeographyExcelRow> ReadExcelRows(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes);
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.First();
        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        var rows = new List<GeographyExcelRow>(lastRow);

        for (var rowNum = 2; rowNum <= lastRow; rowNum++)
        {
            var row = sheet.Row(rowNum);
            rows.Add(new GeographyExcelRow(
                RowNumber: rowNum,
                DistrictCode: CellText(row.Cell(1)),
                DistrictName: CellText(row.Cell(2)),
                CommuneCode: CellText(row.Cell(3)),
                CommuneName: CellText(row.Cell(4)),
                Type: CellText(row.Cell(5))));
        }

        return rows;
    }

    private static string CellText(IXLCell cell)
    {
        if (cell.IsEmpty()) return string.Empty;
        return cell.Value.ToString()?.Trim() ?? string.Empty;
    }

    private static string NormalizeCode(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? string.Empty : raw.Trim().ToUpperInvariant();

    private static string NormalizeName(string? raw) =>
        string.IsNullOrWhiteSpace(raw) ? string.Empty : raw.Trim();

    private static DistrictType ParseDistrictType(string typeText, string districtName)
    {
        var t = typeText.ToLowerInvariant();
        if (t.Contains("quận")) return DistrictType.UrbanDistrict;
        if (t.Contains("thị xã")) return DistrictType.Town;
        if (t.Contains("thành phố")) return DistrictType.ProvincialCity;
        if (t.Contains("huyện")) return DistrictType.RuralDistrict;

        // Infer from district name prefix when type column is not a district type
        var name = districtName.ToLowerInvariant();
        if (name.StartsWith("quận")) return DistrictType.UrbanDistrict;
        if (name.StartsWith("thị xã")) return DistrictType.Town;
        if (name.StartsWith("thành phố")) return DistrictType.ProvincialCity;

        return DistrictType.RuralDistrict;
    }

    private static CommuneType ParseCommuneType(string typeText)
    {
        var t = typeText.ToLowerInvariant();
        if (t.Contains("phường")) return CommuneType.Ward;
        if (t.Contains("thị trấn")) return CommuneType.Township;
        return CommuneType.Commune;
    }
}
