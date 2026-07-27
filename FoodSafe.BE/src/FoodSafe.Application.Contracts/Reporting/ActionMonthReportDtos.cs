using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Reporting;

public class ActionMonthReportDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public int PeriodYear { get; set; }
    public string? ActionMonthTheme { get; set; }
    public string? ActionMonthDates { get; set; }

    public int MediaArticles { get; set; }
    public int BroadcastPrograms { get; set; }
    public int PropagandaSessions { get; set; }
    public int Participants { get; set; }
    public int PostersDistributed { get; set; }
    public int LeafletsDistributed { get; set; }

    public int BusinessesInspected { get; set; }
    public int ViolationsFound { get; set; }
    public int FinesIssued { get; set; }
    public decimal FineAmount { get; set; }

    public int NewSelfDeclarations { get; set; }

    public string? Achievements { get; set; }
    public string? Limitations { get; set; }
    public string? LessonsLearned { get; set; }
    public string? NextSteps { get; set; }

    public ReportStatus Status { get; set; }
    public short SubmissionVersion { get; set; }
    public Guid? SubmittedById { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? VerifiedById { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? ReturnedById { get; set; }
    public DateTime? ReturnedAt { get; set; }
    public string? ReturnReason { get; set; }
    public Guid? CompletedById { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateActionMonthReportDto
{
    [Required]
    [Range(2020, 2100)]
    public int PeriodYear { get; set; }

    [StringLength(500)]
    public string? ActionMonthTheme { get; set; }

    /// <summary>Khoảng thời gian triển khai, định dạng dd/MM/yyyy - dd/MM/yyyy.</summary>
    [StringLength(50)]
    [RegularExpression(
        @"^\s*\d{1,2}/\d{1,2}/\d{4}\s*[-–]\s*\d{1,2}/\d{1,2}/\d{4}\s*$",
        ErrorMessage =
            "Thời gian triển khai phải theo định dạng dd/MM/yyyy - dd/MM/yyyy.")]
    public string? ActionMonthDates { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class UpdateActionMonthReportStatsDto
{
    public int MediaArticles { get; set; }
    public int BroadcastPrograms { get; set; }
    public int PropagandaSessions { get; set; }
    public int Participants { get; set; }
    public int PostersDistributed { get; set; }
    public int LeafletsDistributed { get; set; }

    public int BusinessesInspected { get; set; }
    public int ViolationsFound { get; set; }
    public int FinesIssued { get; set; }
    public decimal FineAmount { get; set; }

    public int NewSelfDeclarations { get; set; }
}

public class UpdateActionMonthReportNarrativeDto
{
    [StringLength(500)]
    public string? ActionMonthTheme { get; set; }

    /// <summary>Khoảng thời gian triển khai, định dạng dd/MM/yyyy - dd/MM/yyyy.</summary>
    [StringLength(50)]
    [RegularExpression(
        @"^\s*\d{1,2}/\d{1,2}/\d{4}\s*[-–]\s*\d{1,2}/\d{1,2}/\d{4}\s*$",
        ErrorMessage =
            "Thời gian triển khai phải theo định dạng dd/MM/yyyy - dd/MM/yyyy.")]
    public string? ActionMonthDates { get; set; }
    public string? Achievements { get; set; }
    public string? Limitations { get; set; }
    public string? LessonsLearned { get; set; }
    public string? NextSteps { get; set; }
    public string? Notes { get; set; }
}

public class ActionMonthReportFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public ReportStatus? Status { get; set; }
    public int? PeriodYear { get; set; }
}
