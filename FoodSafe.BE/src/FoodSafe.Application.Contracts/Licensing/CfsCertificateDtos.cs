using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public sealed class CfsCertificateListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid? DestinationCountryId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public CfsCertificateListInput()
    {
        MaxResultCount = 20;
        Sorting = "IssueDate desc";
    }
}

public sealed class CfsCertificateDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string? LinkedProductName { get; set; }
    public Guid DestinationCountryId { get; set; }
    public string DestinationCountryName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? CertifyingAuthority { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
}

public class UpsertCfsCertificateDto
{
    public Guid BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public Guid DestinationCountryId { get; set; }

    [Required, StringLength(100)]
    public string CertificateNumber { get; set; } = string.Empty;

    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [StringLength(200)]
    public string? CertifyingAuthority { get; set; }

    public string? Notes { get; set; }
}

public sealed class UpdateCfsCertificateDto :
    UpsertCfsCertificateDto;

public sealed class RevokeCfsCertificateDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class PublicCfsCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ProductName { get; set; }
    public string DestinationCountryName { get; set; } = string.Empty;
    public string? CertifyingAuthority { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
}

public sealed class CfsCountryOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public interface IPublicCfsCertificateAppService :
    IApplicationService
{
    Task<PublicCfsCertificateDto> FindByNumberAsync(string number);
}

public interface ICfsCertificateAppService : IApplicationService
{
    Task<PagedResultDto<CfsCertificateDto>> GetListAsync(
        CfsCertificateListInput input);
    Task<CfsCertificateDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId);
    Task<IReadOnlyList<CfsCountryOptionDto>> GetCountryOptionsAsync();
    Task<CfsCertificateDto> CreateAsync(
        UpsertCfsCertificateDto input);
    Task<CfsCertificateDto> UpdateAsync(
        Guid id,
        UpdateCfsCertificateDto input);
    Task DeleteAsync(Guid id);
    Task<CfsCertificateDto> RevokeAsync(
        Guid id,
        RevokeCfsCertificateDto input);
}
