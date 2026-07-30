using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Inspection;

namespace FoodSafe.PublicPortal;

public class PublicSearchRequestDto
{
    [StringLength(200)]
    public string? Keyword { get; set; }

    [Range(0, int.MaxValue)]
    public int SkipCount { get; set; }

    [Range(1, 500)]
    public int MaxResultCount { get; set; } = 10;
}

public class PublicBusinessSearchRequestDto : PublicSearchRequestDto
{
    public List<Guid>? BusinessTypeIds { get; set; }
}

public class PublicProductSearchRequestDto : PublicSearchRequestDto
{
    public Guid? ProductGroupId { get; set; }
}

public class PublicTestingResultSearchRequestDto : PublicSearchRequestDto
{
    public TestingResultOutcome? Outcome { get; set; }
}

public class PublicDocumentSearchRequestDto : PublicSearchRequestDto
{
    public Guid? DocumentTypeId { get; set; }
}

public class PublicCertificateSearchRequestDto : PublicSearchRequestDto
{
    public LicenseStatus? Status { get; set; }
}

public class CatalogOptionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
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
    public string? Manufacturer { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? ProductGroupName { get; set; }
}

public class PublicTestingResultDto
{
    public Guid Id { get; set; }
    public string SampleCode { get; set; } = string.Empty;
    public string SampleName { get; set; } = string.Empty;
    public string? BusinessName { get; set; }
    public string? TestingCenterName { get; set; }
    public DateTime SampleDate { get; set; }
    public DateTime? ResultDate { get; set; }
    public TestingResultOutcome Outcome { get; set; }
    public bool HasFailedIndicators { get; set; }
}

public class PublicInspectionResultDto
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? BusinessAddress { get; set; }
    public DateTime InspectionDate { get; set; }
    public InspectionType InspectionType { get; set; }
    public InspectionOverallResult OverallResult { get; set; }
    public bool HasViolation { get; set; }
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

    /// <summary>
    /// Tracking code the citizen can use to look up the report status later
    /// via the public status endpoint (anonymous). Null if the alert was not
    /// created via the public-report workflow.
    /// </summary>
    public string? TrackingCode { get; set; }
}

/// <summary>
/// Minimal status projection exposed to anonymous citizens via the tracking
/// endpoint. No personally identifiable reporter data is included.
/// </summary>
public class CitizenReportStatusDto
{
    public string TrackingCode { get; set; } = string.Empty;
    public DateTime SubmittedAt { get; set; }

    /// <summary>
    /// Caller-facing status label. One of: Submitted, UnderReview, Resolved, Rejected.
    /// </summary>
    public string Status { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}

public class CreateCitizenNewsReportDto
{
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(8000)]
    public string Content { get; set; } = string.Empty;

    [StringLength(200)]
    public string? ReporterName { get; set; }

    [StringLength(200)]
    public string? ReporterContact { get; set; }

    /// <summary>Validated by LoginCaptchaMiddleware before this DTO is handled.</summary>
    [Required]
    public string CaptchaToken { get; set; } = string.Empty;
}

public interface ICitizenNewsReportAppService
{
    Task<CitizenAlertReportResultDto> CreateAsync(
        CreateCitizenNewsReportDto input);
}

public interface IPublicDirectoryAppService
{
    Task<PagedResultDto<PublicBusinessSummaryDto>> SearchBusinessesAsync(PublicBusinessSearchRequestDto input);
    Task<PagedResultDto<PublicProductSummaryDto>> SearchProductsAsync(PublicProductSearchRequestDto input);
    Task<List<CatalogOptionDto>> GetBusinessTypeOptionsAsync();
    Task<List<CatalogOptionDto>> GetProductGroupOptionsAsync();
}

public interface IPublicCertificateSearchAppService
{
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchEligibilityCertificatesAsync(PublicCertificateSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(PublicCertificateSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(PublicCertificateSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(PublicCertificateSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(PublicCertificateSearchRequestDto input);
    Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(PublicCertificateSearchRequestDto input);
}

public interface IPublicContentAppService
{
    Task<PagedResultDto<PublicNewsListItemDto>> GetNewsAsync(PublicSearchRequestDto input);
    Task<PublicNewsDetailDto> GetNewsDetailAsync(Guid id);
    Task<PagedResultDto<PublicAlertDto>> GetAlertsAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicWarnedBusinessDto>> GetWarnedBusinessesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicDocumentDto>> GetDocumentsAsync(PublicDocumentSearchRequestDto input);
    Task<List<CatalogOptionDto>> GetDocumentTypeOptionsAsync();
    Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(PublicSearchRequestDto input);
    Task<PagedResultDto<PublicTestingResultDto>> GetTestingResultsAsync(PublicTestingResultSearchRequestDto input);
    Task<PagedResultDto<PublicInspectionResultDto>> GetInspectionResultsAsync(PublicSearchRequestDto input);

    /// <summary>
    /// Returns the status of a citizen-submitted alert by its tracking code.
    /// Returns null when the code is not found — callers should respond with 404.
    /// No personally identifiable reporter data is included in the result.
    /// </summary>
    Task<CitizenReportStatusDto?> GetCitizenReportStatusAsync(string trackingCode);
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
