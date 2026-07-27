using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;

namespace FoodSafe.PublicPortal;

public class PublicSearchRequestDto
{
    [StringLength(200)]
    public string? Keyword { get; set; }

    [Range(0, int.MaxValue)]
    public int SkipCount { get; set; }

    [Range(1, 50)]
    public int MaxResultCount { get; set; } = 10;
}

public class PublicBusinessSummaryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? BusinessTypeName { get; set; }
    public string? AddressText { get; set; }
    public BusinessStatus Status { get; set; }
    public bool HasVsattpCommitment { get; set; }
    public bool HasEligibilityCertificate { get; set; }
}

public class PublicProductSummaryDto
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? BrandName { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? ProductGroupName { get; set; }
}

public class PublicCertificateSummaryDto
{
    public Guid Id { get; set; }
    public string Number { get; set; } = string.Empty;
    public string BusinessName { get; set; } = string.Empty;
    public string? ProductName { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? CertifyingAuthority { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
}

public class PublicWarnedBusinessDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessCode { get; set; }
    public string? AddressText { get; set; }
    public string AlertTitle { get; set; } = string.Empty;
    public string? AlertNumber { get; set; }
    public AlertSeverity Severity { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class PublicAlertDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AlertNumber { get; set; }
    public AlertCategory Category { get; set; }
    public AlertSeverity Severity { get; set; }
    public string? AffectedArea { get; set; }
    public string? AffectedProducts { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class PublicNewsListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? Category { get; set; }
    public bool IsFeatured { get; set; }
    public int ViewCount { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public class PublicNewsDetailDto : PublicNewsListItemDto
{
    public string Content { get; set; } = string.Empty;
    public List<PublicAlertDto> LinkedAlerts { get; set; } = new();
}

public class PublicDocumentDto
{
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? DocumentTypeName { get; set; }
    public string? IssuingAuthority { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public string? Summary { get; set; }
}

public class PublicRiskAnalysisDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public AlertCategory Category { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public string? RelatedProducts { get; set; }
    public string? Recommendations { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string Content { get; set; } = string.Empty;
}

public class CreateCitizenAlertReportDto
{
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(8000)]
    public string Content { get; set; } = string.Empty;

    public AlertCategory Category { get; set; } = AlertCategory.Other;

    [StringLength(500)]
    public string? AffectedArea { get; set; }

    [StringLength(500)]
    public string? AffectedProducts { get; set; }

    [StringLength(200)]
    public string? ReporterName { get; set; }

    [StringLength(50)]
    public string? ReporterPhone { get; set; }

    [EmailAddress]
    [StringLength(200)]
    public string? ReporterEmail { get; set; }

    /// <summary>Validated by LoginCaptchaMiddleware before this DTO is handled.</summary>
    [Required]
    public string CaptchaToken { get; set; } = string.Empty;
}

public class CitizenAlertReportResultDto
{
    public Guid Id { get; set; }
    public string Message { get; set; } = string.Empty;
}

public interface IPublicDirectoryAppService
{
    Task<PagedResultDto<PublicBusinessSummaryDto>> SearchBusinessesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicProductSummaryDto>> SearchProductsAsync(PublicSearchRequestDto input);
}

public interface IPublicCertificateSearchAppService
{
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchEligibilityCertificatesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(PublicSearchRequestDto input);
}

public interface IPublicContentAppService
{
    Task<PagedResultDto<PublicNewsListItemDto>> GetNewsAsync(PublicSearchRequestDto input);
    Task<PublicNewsDetailDto> GetNewsDetailAsync(Guid id);
    Task<PagedResultDto<PublicAlertDto>> GetAlertsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicWarnedBusinessDto>> GetWarnedBusinessesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicDocumentDto>> GetDocumentsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(PublicSearchRequestDto input);
}

public interface ICitizenAlertReportAppService
{
    Task<CitizenAlertReportResultDto> CreateAsync(CreateCitizenAlertReportDto input);
}

public class CertificatePdfDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
}

public interface ICertificatePdfAppService
{
    Task<CertificatePdfDto> GetEligibilityCertificatePdfAsync(Guid id);
    Task<CertificatePdfDto> GetSelfDeclarationPdfAsync(Guid id);
    Task<CertificatePdfDto> GetProductRegistrationPdfAsync(Guid id);
    Task<CertificatePdfDto> GetCfsCertificatePdfAsync(Guid id);
    Task<CertificatePdfDto> GetExportFoodCertificatePdfAsync(Guid id);
}
