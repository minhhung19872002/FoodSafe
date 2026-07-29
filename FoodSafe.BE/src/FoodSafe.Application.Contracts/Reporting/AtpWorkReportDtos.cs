using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Reporting;

public class AtpWorkReportDto : EntityDto<Guid>, IReportActorsDto
{
    public Guid OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public ReportPeriodType PeriodType { get; set; }
    public int PeriodYear { get; set; }
    public int? PeriodHalf { get; set; }

    public int TotalBusinesses { get; set; }
    public int NewBusinesses { get; set; }
    public int InactiveBusinesses { get; set; }
    public int BusinessesWithCertificate { get; set; }

    public int DkcbIssued { get; set; }
    public int SelfDeclarationsReceived { get; set; }
    public int AdRegistrationsIssued { get; set; }
    public int EligibilityCertificatesIssued { get; set; }
    public int CfsIssued { get; set; }
    public int ExportCertificatesIssued { get; set; }

    public int TotalInspectionPlans { get; set; }
    public int BusinessesInspected { get; set; }
    public int ViolationsFound { get; set; }
    public int FinesIssued { get; set; }
    public decimal FineTotalAmount { get; set; }

    public int PoisoningCaseCount { get; set; }
    public int PoisoningIncidentCount { get; set; }
    public int TotalAffected { get; set; }
    public int TotalDeaths { get; set; }

    public int TrainingSessions { get; set; }
    public int TrainingParticipants { get; set; }
    public int MediaAppearances { get; set; }
    public int DocumentsIssued { get; set; }

    public string? Overview { get; set; }
    public string? Achievements { get; set; }
    public string? Limitations { get; set; }
    public string? Solutions { get; set; }
    public string? NextPeriodPlan { get; set; }

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

public class CreateAtpWorkReportDto
{
    [Required]
    public ReportPeriodType PeriodType { get; set; }
    [Required]
    [Range(2020, 2100)]
    public int PeriodYear { get; set; }
    public int? PeriodHalf { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAtpWorkReportStatsDto
{
    public int TotalBusinesses { get; set; }
    public int NewBusinesses { get; set; }
    public int InactiveBusinesses { get; set; }
    public int BusinessesWithCertificate { get; set; }

    public int DkcbIssued { get; set; }
    public int SelfDeclarationsReceived { get; set; }
    public int AdRegistrationsIssued { get; set; }
    public int EligibilityCertificatesIssued { get; set; }
    public int CfsIssued { get; set; }
    public int ExportCertificatesIssued { get; set; }

    public int TotalInspectionPlans { get; set; }
    public int BusinessesInspected { get; set; }
    public int ViolationsFound { get; set; }
    public int FinesIssued { get; set; }
    public decimal FineTotalAmount { get; set; }

    public int PoisoningCaseCount { get; set; }
    public int PoisoningIncidentCount { get; set; }
    public int TotalAffected { get; set; }
    public int TotalDeaths { get; set; }

    public int TrainingSessions { get; set; }
    public int TrainingParticipants { get; set; }
    public int MediaAppearances { get; set; }
    public int DocumentsIssued { get; set; }
}

public class UpdateAtpWorkReportNarrativeDto
{
    public string? Overview { get; set; }
    public string? Achievements { get; set; }
    public string? Limitations { get; set; }
    public string? Solutions { get; set; }
    public string? NextPeriodPlan { get; set; }
    public string? Notes { get; set; }
}

public class AtpWorkReportFilterDto : PagedAndSortedResultRequestDto
{
    public ReportStatus? Status { get; set; }
    public ReportPeriodType? PeriodType { get; set; }
    public int? PeriodYear { get; set; }
}
