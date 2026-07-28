using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public sealed class EligibilityCertificateListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public EligibilityCertificateListInput()
    {
        MaxResultCount = 20;
    }
}

public sealed class EligibilityCertificateDto :
    FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? CertifyingAuthority { get; set; }
    public string? CertificationScope { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
}

public class UpsertEligibilityCertificateDto
{
    public Guid BusinessId { get; set; }

    [Required, StringLength(100)]
    public string CertificateNumber { get; set; } = string.Empty;

    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [StringLength(200)]
    public string? CertifyingAuthority { get; set; }

    public string? CertificationScope { get; set; }
    public string? Notes { get; set; }
}

public sealed class UpdateEligibilityCertificateDto :
    UpsertEligibilityCertificateDto;

public sealed class RevokeEligibilityCertificateDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class PublicEligibilityCertificateDto
{
    public string CertificateNumber { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? CertifyingAuthority { get; set; }
    public string? CertificationScope { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
}

public interface IPublicEligibilityCertificateAppService :
    IApplicationService
{
    Task<PublicEligibilityCertificateDto> FindByNumberAsync(string number);
}

public interface IEligibilityCertificateAppService : IApplicationService
{
    Task<PagedResultDto<EligibilityCertificateDto>> GetListAsync(
        EligibilityCertificateListInput input);
    Task<EligibilityCertificateDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<EligibilityCertificateDto> CreateAsync(
        UpsertEligibilityCertificateDto input);
    Task<EligibilityCertificateDto> UpdateAsync(
        Guid id,
        UpdateEligibilityCertificateDto input);
    Task DeleteAsync(Guid id);
    Task<EligibilityCertificateDto> RevokeAsync(
        Guid id,
        RevokeEligibilityCertificateDto input);
}
