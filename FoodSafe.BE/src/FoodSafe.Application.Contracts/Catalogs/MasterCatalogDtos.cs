using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

public sealed class MasterCatalogListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public bool? IsActive { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? TestingCenterId { get; set; }

    public MasterCatalogListInput()
    {
        MaxResultCount = 50;
        Sorting = "SortOrder,Name";
    }
}

public class MasterCatalogDto : AuditedEntityDto<Guid>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public class UpsertMasterCatalogDto
{
    [Required, StringLength(50)] public string Code { get; set; } = string.Empty;
    [Required, StringLength(200)] public string Name { get; set; } = string.Empty;
    [StringLength(2000)] public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public sealed class UpsertCountryDto
{
    [Required, StringLength(2, MinimumLength = 2)] public string CodeAlpha2 { get; set; } = string.Empty;
    [StringLength(3, MinimumLength = 3)] public string? CodeAlpha3 { get; set; }
    [Required, StringLength(200)] public string NameVi { get; set; } = string.Empty;
    [StringLength(200)] public string? NameEn { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public sealed class ProductGroupDto : MasterCatalogDto
{
    public short Level { get; set; }
    public Guid? ParentId { get; set; }
}

public sealed class UpsertProductGroupDto : UpsertMasterCatalogDto
{
    [Range(1, 2)] public short Level { get; set; }
    public Guid? ParentId { get; set; }
}

public sealed class BusinessClassificationDto : MasterCatalogDto
{
    public string Criteria { get; set; } = string.Empty;
    public BusinessRiskLevel RiskLevel { get; set; }
}

public sealed class UpsertBusinessClassificationDto : UpsertMasterCatalogDto
{
    [Required, StringLength(2000)] public string Criteria { get; set; } = string.Empty;
    [EnumDataType(typeof(BusinessRiskLevel))] public BusinessRiskLevel RiskLevel { get; set; }
}

public sealed class TestingCenterDto : MasterCatalogDto
{
    public string Address { get; set; } = string.Empty;
    public Guid ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string AccreditationNumber { get; set; } = string.Empty;
    public string AccreditationScope { get; set; } = string.Empty;
    public DateTime AccreditationExpiresAt { get; set; }
}

public sealed class UpsertTestingCenterDto : UpsertMasterCatalogDto
{
    [Required, StringLength(500)] public string Address { get; set; } = string.Empty;
    public Guid ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
    [StringLength(200)] public string? ContactPerson { get; set; }
    [StringLength(50)] public string? Phone { get; set; }
    [EmailAddress, StringLength(200)] public string? Email { get; set; }
    [Required, StringLength(100)] public string AccreditationNumber { get; set; } = string.Empty;
    [Required, StringLength(2000)] public string AccreditationScope { get; set; } = string.Empty;
    public DateTime AccreditationExpiresAt { get; set; }
}

public sealed class TestingServiceDto : MasterCatalogDto
{
    public Guid TestingCenterId { get; set; }
    public string Unit { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int TurnaroundDays { get; set; }
}

public sealed class UpsertTestingServiceDto : UpsertMasterCatalogDto
{
    public Guid TestingCenterId { get; set; }
    [Required, StringLength(50)] public string Unit { get; set; } = string.Empty;
    [Required, StringLength(500)] public string Method { get; set; } = string.Empty;
    [Range(0, 9999999999999999.99)] public decimal Price { get; set; }
    [Range(0, 3650)] public int TurnaroundDays { get; set; }
}

public sealed class ViolationTypeDto : MasterCatalogDto
{
    public string LegalReference { get; set; } = string.Empty;
    public decimal? MinFine { get; set; }
    public decimal? MaxFine { get; set; }
}

public sealed class UpsertViolationTypeDto : UpsertMasterCatalogDto
{
    [Required, StringLength(500)] public string LegalReference { get; set; } = string.Empty;
    [Range(0, 9999999999999999.99)] public decimal? MinFine { get; set; }
    [Range(0, 9999999999999999.99)] public decimal? MaxFine { get; set; }
}

public interface IMasterCatalogAppService : IApplicationService
{
    Task<PagedResultDto<CountryDto>> GetCountriesAsync(MasterCatalogListInput input);
    Task<CountryDto> CreateCountryAsync(UpsertCountryDto input);
    Task<CountryDto> UpdateCountryAsync(Guid id, UpsertCountryDto input);
    Task DeleteCountryAsync(Guid id);
    Task<PagedResultDto<RegionDto>> GetRegionsAsync(MasterCatalogListInput input);
    Task<RegionDto> CreateRegionAsync(UpsertRegionDto input);
    Task<RegionDto> UpdateRegionAsync(Guid id, UpsertRegionDto input);
    Task DeleteRegionAsync(Guid id);
    Task<PagedResultDto<ProductGroupDto>> GetProductGroupsAsync(MasterCatalogListInput input);
    Task<ProductGroupDto> CreateProductGroupAsync(UpsertProductGroupDto input);
    Task<ProductGroupDto> UpdateProductGroupAsync(Guid id, UpsertProductGroupDto input);
    Task DeleteProductGroupAsync(Guid id);
    Task<PagedResultDto<MasterCatalogDto>> GetBusinessTypesAsync(MasterCatalogListInput input);
    Task<MasterCatalogDto> CreateBusinessTypeAsync(UpsertMasterCatalogDto input);
    Task<MasterCatalogDto> UpdateBusinessTypeAsync(Guid id, UpsertMasterCatalogDto input);
    Task DeleteBusinessTypeAsync(Guid id);
    Task<PagedResultDto<BusinessClassificationDto>> GetBusinessClassificationsAsync(MasterCatalogListInput input);
    Task<BusinessClassificationDto> CreateBusinessClassificationAsync(UpsertBusinessClassificationDto input);
    Task<BusinessClassificationDto> UpdateBusinessClassificationAsync(Guid id, UpsertBusinessClassificationDto input);
    Task DeleteBusinessClassificationAsync(Guid id);
    Task<PagedResultDto<MasterCatalogDto>> GetAdvertisementTypesAsync(MasterCatalogListInput input);
    Task<MasterCatalogDto> CreateAdvertisementTypeAsync(UpsertMasterCatalogDto input);
    Task<MasterCatalogDto> UpdateAdvertisementTypeAsync(Guid id, UpsertMasterCatalogDto input);
    Task DeleteAdvertisementTypeAsync(Guid id);
    Task<PagedResultDto<MasterCatalogDto>> GetDocumentTypesAsync(MasterCatalogListInput input);
    Task<MasterCatalogDto> CreateDocumentTypeAsync(UpsertMasterCatalogDto input);
    Task<MasterCatalogDto> UpdateDocumentTypeAsync(Guid id, UpsertMasterCatalogDto input);
    Task DeleteDocumentTypeAsync(Guid id);
    Task<PagedResultDto<TestingCenterDto>> GetTestingCentersAsync(MasterCatalogListInput input);
    Task<TestingCenterDto> CreateTestingCenterAsync(UpsertTestingCenterDto input);
    Task<TestingCenterDto> UpdateTestingCenterAsync(Guid id, UpsertTestingCenterDto input);
    Task DeleteTestingCenterAsync(Guid id);
    Task<PagedResultDto<TestingServiceDto>> GetTestingServicesAsync(MasterCatalogListInput input);
    Task<TestingServiceDto> CreateTestingServiceAsync(UpsertTestingServiceDto input);
    Task<TestingServiceDto> UpdateTestingServiceAsync(Guid id, UpsertTestingServiceDto input);
    Task DeleteTestingServiceAsync(Guid id);
    Task<PagedResultDto<ViolationTypeDto>> GetViolationTypesAsync(MasterCatalogListInput input);
    Task<ViolationTypeDto> CreateViolationTypeAsync(UpsertViolationTypeDto input);
    Task<ViolationTypeDto> UpdateViolationTypeAsync(Guid id, UpsertViolationTypeDto input);
    Task DeleteViolationTypeAsync(Guid id);
}
