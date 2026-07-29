using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Reporting;

public class NdtpReportDto : EntityDto<Guid>, IReportActorsDto
{
    public Guid OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public int PeriodYear { get; set; }
    public int PeriodMonth { get; set; }

    public int CaseCount { get; set; }
    public int CaseAffected { get; set; }
    public int CaseHospitalized { get; set; }
    public int CaseDeaths { get; set; }

    public int IncidentCount { get; set; }
    public int IncidentAffected { get; set; }
    public int IncidentHospitalized { get; set; }
    public int IncidentDeaths { get; set; }

    public string? PreventionActivities { get; set; }
    public string? RiskFactors { get; set; }
    public string? Recommendations { get; set; }

    public ReportStatus Status { get; set; }
    public short SubmissionVersion { get; set; }
    public Guid? SubmittedById { get; set; }
    public string? SubmittedByName { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? VerifiedById { get; set; }
    public string? VerifiedByName { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? ReturnedById { get; set; }
    public string? ReturnedByName { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public string? ReturnReason { get; set; }
    public Guid? CompletedById { get; set; }
    public string? CompletedByName { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public string? SubmissionHash { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateNdtpReportDto
{
    [Required]
    [Range(2020, 2100)]
    public int PeriodYear { get; set; }
    [Required]
    [Range(1, 12)]
    public int PeriodMonth { get; set; }
    public string? Notes { get; set; }
}

public class UpdateNdtpReportStatsDto
{
    public int CaseCount { get; set; }
    public int CaseAffected { get; set; }
    public int CaseHospitalized { get; set; }
    public int CaseDeaths { get; set; }
    public int IncidentCount { get; set; }
    public int IncidentAffected { get; set; }
    public int IncidentHospitalized { get; set; }
    public int IncidentDeaths { get; set; }
}

public class UpdateNdtpReportNarrativeDto
{
    public string? PreventionActivities { get; set; }
    public string? RiskFactors { get; set; }
    public string? Recommendations { get; set; }
    public string? Notes { get; set; }
}

public class NdtpReportFilterDto : PagedAndSortedResultRequestDto
{
    public ReportStatus? Status { get; set; }
    public int? PeriodYear { get; set; }
    public int? PeriodMonth { get; set; }
}

public class ReturnReportDto
{
    [Required]
    public string ReturnReason { get; set; } = string.Empty;
}

public class ReportErrorNotificationDto : EntityDto<Guid>
{
    public Guid FromOrganizationId { get; set; }
    public string ErrorFields { get; set; } = string.Empty;
    public string CorrectionDetails { get; set; } = string.Empty;
    public ReportErrorNotificationStatus Status { get; set; }
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public Guid? RespondedById { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateReportErrorNotificationDto
{
    [Required]
    [StringLength(1000)]
    public string ErrorFields { get; set; } = string.Empty;
    [Required]
    [StringLength(4000)]
    public string CorrectionDetails { get; set; } = string.Empty;
}

public class RespondReportErrorNotificationDto
{
    [Required]
    [StringLength(4000)]
    public string Response { get; set; } = string.Empty;
}
