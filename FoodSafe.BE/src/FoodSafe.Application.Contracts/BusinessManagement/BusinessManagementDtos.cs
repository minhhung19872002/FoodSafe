using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? OrganizationId { get; set; }
    public Guid? BusinessTypeId { get; set; }
    public Guid? BusinessClassificationId { get; set; }
    public BusinessStatus? Status { get; set; }
    public bool? HasEligibilityCertificate { get; set; }

    public BusinessListInput()
    {
        MaxResultCount = 20;
        Sorting = "Name";
    }
}

public sealed class BusinessDto : FullAuditedEntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? BusinessTypeId { get; set; }
    public Guid? BusinessClassificationId { get; set; }
    public string? TaxCode { get; set; }
    public string? RepresentativeName { get; set; }
    public string? RepresentativeIdCard { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactWebsite { get; set; }
    public string? AddressStreet { get; set; }
    public Guid? AddressProvinceId { get; set; }
    public Guid? AddressDistrictId { get; set; }
    public Guid? AddressCommuneId { get; set; }
    public double? AddressLatitude { get; set; }
    public double? AddressLongitude { get; set; }
    public BusinessStatus Status { get; set; }
    public string? SuspensionReason { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public bool HasEligibilityCertificate { get; set; }
    public bool HasVsattpCommitment { get; set; }
    public DateTime? EstablishedDate { get; set; }
    public int? EmployeeCount { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<Guid> ProductGroupIds { get; set; } = [];
    public IReadOnlyList<BusinessHandlerDto> Handlers { get; set; } = [];
}

public class UpsertBusinessDto
{
    public Guid OrganizationId { get; set; }
    [StringLength(50)] public string? Code { get; set; }
    [Required, StringLength(500)] public string Name { get; set; } = string.Empty;
    public Guid? BusinessTypeId { get; set; }
    public Guid? BusinessClassificationId { get; set; }
    [StringLength(50)] public string? TaxCode { get; set; }
    [StringLength(200)] public string? RepresentativeName { get; set; }
    [StringLength(50)] public string? RepresentativeIdCard { get; set; }
    [StringLength(50)] public string? ContactPhone { get; set; }
    [EmailAddress, StringLength(200)] public string? ContactEmail { get; set; }
    [Url, StringLength(500)] public string? ContactWebsite { get; set; }
    public string? AddressStreet { get; set; }
    public Guid? AddressProvinceId { get; set; }
    public Guid? AddressDistrictId { get; set; }
    public Guid? AddressCommuneId { get; set; }
    [Range(-90, 90)] public double? AddressLatitude { get; set; }
    [Range(-180, 180)] public double? AddressLongitude { get; set; }
    public DateTime? EstablishedDate { get; set; }
    [Range(0, int.MaxValue)] public int? EmployeeCount { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<Guid> ProductGroupIds { get; set; } = [];
}

public sealed class UpdateBusinessDto : UpsertBusinessDto
{
    public BusinessStatus Status { get; set; } = BusinessStatus.Active;
    public string? SuspensionReason { get; set; }
    public DateTime? SuspendedAt { get; set; }
    public bool HasEligibilityCertificate { get; set; }
    public bool HasVsattpCommitment { get; set; }
}

public sealed class BusinessHandlerDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Position { get; set; }
    public string? IdCardNumber { get; set; }
    public string? TrainingCertificateNumber { get; set; }
    public DateTime? TrainingDate { get; set; }
    public string? TrainingOrganization { get; set; }
    public DateTime? TrainingExpiryDate { get; set; }
    public string? HealthCertificateNumber { get; set; }
    public DateTime? HealthCheckDate { get; set; }
    public string? HealthCheckFacility { get; set; }
    public DateTime? HealthCheckExpiryDate { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
}

public sealed class UpsertBusinessHandlerDto
{
    [Required, StringLength(200)] public string FullName { get; set; } = string.Empty;
    [StringLength(200)] public string? Position { get; set; }
    [StringLength(50)] public string? IdCardNumber { get; set; }
    [StringLength(100)] public string? TrainingCertificateNumber { get; set; }
    public DateTime? TrainingDate { get; set; }
    [StringLength(300)] public string? TrainingOrganization { get; set; }
    public DateTime? TrainingExpiryDate { get; set; }
    [StringLength(100)] public string? HealthCertificateNumber { get; set; }
    public DateTime? HealthCheckDate { get; set; }
    [StringLength(300)] public string? HealthCheckFacility { get; set; }
    public DateTime? HealthCheckExpiryDate { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}

public sealed class ProductListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductGroupId { get; set; }
    public ProductStatus? Status { get; set; }

    public ProductListInput()
    {
        MaxResultCount = 20;
        Sorting = "Name";
    }
}

public sealed class ProductDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public Guid OrganizationId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid? ProductGroupId { get; set; }
    public string? BrandName { get; set; }
    public string? Manufacturer { get; set; }
    public Guid? ManufacturingCountryId { get; set; }
    public string? NetWeight { get; set; }
    public string? Specifications { get; set; }
    public string? Ingredients { get; set; }
    public int? ExpiryPeriodMonths { get; set; }
    public string? StorageConditions { get; set; }
    public string? UsageInstructions { get; set; }
    public ProductStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class UpsertProductDto
{
    public Guid BusinessId { get; set; }
    [StringLength(50)] public string? Code { get; set; }
    [Required, StringLength(500)] public string Name { get; set; } = string.Empty;
    public Guid? ProductGroupId { get; set; }
    [StringLength(200)] public string? BrandName { get; set; }
    [StringLength(300)] public string? Manufacturer { get; set; }
    public Guid? ManufacturingCountryId { get; set; }
    [StringLength(100)] public string? NetWeight { get; set; }
    public string? Specifications { get; set; }
    public string? Ingredients { get; set; }
    [Range(0, int.MaxValue)] public int? ExpiryPeriodMonths { get; set; }
    public string? StorageConditions { get; set; }
    public string? UsageInstructions { get; set; }
    public string? Notes { get; set; }
}

public sealed class UpdateProductDto : UpsertProductDto
{
    public ProductStatus Status { get; set; } = ProductStatus.Active;
}

public sealed class ProductBusinessOptionDto
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
}

public interface IBusinessAppService : IApplicationService
{
    Task<PagedResultDto<BusinessDto>> GetListAsync(BusinessListInput input);
    Task<BusinessDto> GetAsync(Guid id);
    Task<BusinessDto> CreateAsync(UpsertBusinessDto input);
    Task<BusinessDto> UpdateAsync(Guid id, UpdateBusinessDto input);
    Task DeleteAsync(Guid id);
    Task<BusinessHandlerDto> AddHandlerAsync(Guid id, UpsertBusinessHandlerDto input);
    Task<BusinessHandlerDto> UpdateHandlerAsync(Guid id, Guid handlerId, UpsertBusinessHandlerDto input);
    Task DeleteHandlerAsync(Guid id, Guid handlerId);
}

public interface IProductAppService : IApplicationService
{
    Task<PagedResultDto<ProductDto>> GetListAsync(ProductListInput input);
    Task<IReadOnlyList<ProductBusinessOptionDto>> GetBusinessOptionsAsync();
    Task<ProductDto> GetAsync(Guid id);
    Task<ProductDto> CreateAsync(UpsertProductDto input);
    Task<ProductDto> UpdateAsync(Guid id, UpdateProductDto input);
    Task DeleteAsync(Guid id);
}
