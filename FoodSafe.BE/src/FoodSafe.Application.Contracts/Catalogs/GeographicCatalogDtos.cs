using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

public sealed class GeographicCatalogListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? ParentId { get; set; }
    public bool? IsActive { get; set; }

    public GeographicCatalogListInput()
    {
        MaxResultCount = 50;
        Sorting = "SortOrder,Name";
    }
}

public abstract class GeographicCatalogDto : AuditedEntityDto<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public sealed class CountryDto : AuditedEntityDto<Guid>
{
    public string CodeAlpha2 { get; set; } = string.Empty;
    public string? CodeAlpha3 { get; set; }
    public string NameVi { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public sealed class RegionDto : GeographicCatalogDto
{
    public string? Description { get; set; }
}

public sealed class ProvinceDto : GeographicCatalogDto
{
    public Guid? RegionId { get; set; }
    public string? NameShort { get; set; }
}

public sealed class DistrictDto : GeographicCatalogDto
{
    public Guid ProvinceId { get; set; }
    public DistrictType Type { get; set; }
}

public sealed class CommuneDto : GeographicCatalogDto
{
    public Guid DistrictId { get; set; }
    public CommuneType Type { get; set; }
}

public abstract class UpsertGeographicCatalogDto : IValidatableObject
{
    [Required, StringLength(20)]
    public string Code { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    protected virtual int CodeMaxLength => 20;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!string.IsNullOrEmpty(Code) && Code.Length > CodeMaxLength)
        {
            yield return new ValidationResult(
                $"Code must not exceed {CodeMaxLength} characters.",
                [nameof(Code)]);
        }
    }
}

public sealed class UpsertRegionDto : UpsertGeographicCatalogDto
{
    [StringLength(1000)]
    public string? Description { get; set; }
}

public sealed class UpsertProvinceDto : UpsertGeographicCatalogDto
{
    protected override int CodeMaxLength => 10;

    public Guid? RegionId { get; set; }

    [StringLength(100)]
    public string? NameShort { get; set; }
}

public sealed class UpsertDistrictDto : UpsertGeographicCatalogDto
{
    protected override int CodeMaxLength => 10;

    public Guid ProvinceId { get; set; }
    [EnumDataType(typeof(DistrictType))]
    public DistrictType Type { get; set; }
}

public sealed class UpsertCommuneDto : UpsertGeographicCatalogDto
{
    protected override int CodeMaxLength => 10;

    public Guid DistrictId { get; set; }
    [EnumDataType(typeof(CommuneType))]
    public CommuneType Type { get; set; }
}

public sealed class ImportGeographyFromExcelInput
{
    public Guid ProvinceId { get; set; }
    public byte[] ExcelBytes { get; set; } = [];
}

public sealed class ImportGeographyErrorDto
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public sealed class ImportGeographyResultDto
{
    public int ImportedDistricts { get; set; }
    public int ImportedCommunes { get; set; }
    public int SkippedRows { get; set; }
    public IReadOnlyList<ImportGeographyErrorDto> Errors { get; set; } = [];
}

public interface IGeographicCatalogAppService : IApplicationService
{
    Task<ListResultDto<ProvinceDto>> GetProvincesAsync(bool activeOnly = true);
    Task<ListResultDto<DistrictDto>> GetDistrictsAsync(Guid provinceId, bool activeOnly = true);
    Task<ListResultDto<CommuneDto>> GetCommunesAsync(Guid districtId, bool activeOnly = true);
    Task<ProvinceDto> CreateProvinceAsync(UpsertProvinceDto input);
    Task<ProvinceDto> UpdateProvinceAsync(Guid id, UpsertProvinceDto input);
    Task DeleteProvinceAsync(Guid id);
    Task<DistrictDto> CreateDistrictAsync(UpsertDistrictDto input);
    Task<DistrictDto> UpdateDistrictAsync(Guid id, UpsertDistrictDto input);
    Task DeleteDistrictAsync(Guid id);
    Task<CommuneDto> CreateCommuneAsync(UpsertCommuneDto input);
    Task<CommuneDto> UpdateCommuneAsync(Guid id, UpsertCommuneDto input);
    Task DeleteCommuneAsync(Guid id);
    Task<ImportGeographyResultDto> ImportDistrictsAndCommunesFromExcelAsync(ImportGeographyFromExcelInput input);
}
