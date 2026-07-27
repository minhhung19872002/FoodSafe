using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public sealed class ExportFoodCertificateListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? DestinationCountryId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public ExportFoodCertificateListInput()
    {
        MaxResultCount = 20;
        Sorting = "IssueDate desc";
    }
}

public sealed class ExportFoodCertificateDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string? LinkedProductName { get; set; }
    public Guid? DestinationCountryId { get; set; }
    public string DestinationCountryName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
    public string? LotNumber { get; set; }
    public decimal? Quantity { get; set; }
    public string? QuantityUnit { get; set; }
}

public class UpsertExportFoodCertificateDto
{
    public Guid BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? DestinationCountryId { get; set; }

    [Required, StringLength(100)]
    public string CertificateNumber { get; set; } = string.Empty;

    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public string? Notes { get; set; }

    [StringLength(100)]
    public string? LotNumber { get; set; }

    [Range(typeof(decimal), "0", "999999999.999")]
    public decimal? Quantity { get; set; }

    [StringLength(50)]
    public string? QuantityUnit { get; set; }
}

public sealed class UpdateExportFoodCertificateDto :
    UpsertExportFoodCertificateDto;

public sealed class RevokeExportFoodCertificateDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class PublicExportFoodCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ProductName { get; set; }
    public string DestinationCountryName { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
    public string? LotNumber { get; set; }
    public decimal? Quantity { get; set; }
    public string? QuantityUnit { get; set; }
}

public interface IPublicExportFoodCertificateAppService :
    IApplicationService
{
    Task<PublicExportFoodCertificateDto> FindByNumberAsync(string number);
}

public interface IExportFoodCertificateAppService : IApplicationService
{
    Task<PagedResultDto<ExportFoodCertificateDto>> GetListAsync(
        ExportFoodCertificateListInput input);
    Task<ExportFoodCertificateDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId);
    Task<IReadOnlyList<CfsCountryOptionDto>> GetCountryOptionsAsync();
    Task<ExportFoodCertificateDto> CreateAsync(
        UpsertExportFoodCertificateDto input);
    Task<ExportFoodCertificateDto> UpdateAsync(
        Guid id,
        UpdateExportFoodCertificateDto input);
    Task DeleteAsync(Guid id);
    Task<ExportFoodCertificateDto> RevokeAsync(
        Guid id,
        RevokeExportFoodCertificateDto input);
}
