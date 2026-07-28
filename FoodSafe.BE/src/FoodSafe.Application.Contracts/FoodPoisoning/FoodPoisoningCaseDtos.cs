using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.FoodPoisoning;

public class FoodPoisoningCaseDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public Guid? IncidentId { get; set; }
    public string CaseCode { get; set; } = string.Empty;
    public DateOnly ReportDate { get; set; }
    public DateTime? OccurrenceDate { get; set; }

    public string? LocationDescription { get; set; }
    public Guid? LocationCommuneId { get; set; }
    public Guid? LocationDistrictId { get; set; }
    public Guid? LocationProvinceId { get; set; }
    public double? LocationLatitude { get; set; }
    public double? LocationLongitude { get; set; }

    public string? VictimName { get; set; }
    public int? VictimAge { get; set; }
    public VictimGender? VictimGender { get; set; }
    public string? VictimPhone { get; set; }
    public string? VictimAddress { get; set; }

    public string? SuspectedFood { get; set; }
    public string? FoodSource { get; set; }
    public DateOnly? FoodPreparationDate { get; set; }
    public string? Symptoms { get; set; }
    public DateTime? OnsetTime { get; set; }

    public string? MedicalFacility { get; set; }
    public DateOnly? TreatmentStartDate { get; set; }
    public TreatmentResult? TreatmentResult { get; set; }

    public string? ReporterName { get; set; }
    public string? ReporterPhone { get; set; }
    public string? ReporterOrganization { get; set; }
    public string? ReporterRelation { get; set; }

    public PoisoningCaseStatus Status { get; set; }
    public Guid? ReportedById { get; set; }
    public DateTime? ReportedAt { get; set; }
    public Guid? VerifiedById { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateUpdateFoodPoisoningCaseDto
{
    [Required]
    public DateOnly ReportDate { get; set; }
    public DateTime? OccurrenceDate { get; set; }
    public Guid? IncidentId { get; set; }
    public string? Notes { get; set; }

    [Required]
    [StringLength(500)]
    public string LocationDescription { get; set; } = string.Empty;
    public Guid? LocationCommuneId { get; set; }
    public Guid? LocationDistrictId { get; set; }
    public Guid? LocationProvinceId { get; set; }
    public double? LocationLatitude { get; set; }
    public double? LocationLongitude { get; set; }

    [Required]
    [StringLength(200)]
    public string VictimName { get; set; } = string.Empty;
    [Range(0, 150)]
    public int? VictimAge { get; set; }
    public VictimGender? VictimGender { get; set; }
    [StringLength(50)]
    public string? VictimPhone { get; set; }
    public string? VictimAddress { get; set; }

    public string? SuspectedFood { get; set; }
    [StringLength(200)]
    public string? FoodSource { get; set; }
    public DateOnly? FoodPreparationDate { get; set; }
    public string? Symptoms { get; set; }
    public DateTime? OnsetTime { get; set; }

    [StringLength(300)]
    public string? MedicalFacility { get; set; }
    public DateOnly? TreatmentStartDate { get; set; }
    public TreatmentResult? TreatmentResult { get; set; }

    [StringLength(200)]
    public string? ReporterName { get; set; }
    [StringLength(50)]
    public string? ReporterPhone { get; set; }
    [StringLength(300)]
    public string? ReporterOrganization { get; set; }
    [StringLength(100)]
    public string? ReporterRelation { get; set; }
}

public class FoodPoisoningCaseFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public PoisoningCaseStatus? Status { get; set; }
    public DateOnly? ReportDateFrom { get; set; }
    public DateOnly? ReportDateTo { get; set; }
    public Guid? IncidentId { get; set; }
}

public class PoisoningErrorReportDto : EntityDto<Guid>
{
    public Guid FromOrganizationId { get; set; }
    public string ErrorDescription { get; set; } = string.Empty;
    public string CorrectionRequest { get; set; } = string.Empty;
    public ErrorReportStatus Status { get; set; }
    public string? Response { get; set; }
    public DateTime? RespondedAt { get; set; }
    public Guid? RespondedById { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreatePoisoningErrorReportDto
{
    [Required]
    public string ErrorDescription { get; set; } = string.Empty;
    [Required]
    public string CorrectionRequest { get; set; } = string.Empty;
}

public class RespondPoisoningErrorReportDto
{
    [Required]
    [StringLength(2000)]
    public string Response { get; set; } = string.Empty;
}
