using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.FoodPoisoning;

public class FoodPoisoningIncidentDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string IncidentCode { get; set; } = string.Empty;
    public DateTime? OccurrenceDate { get; set; }
    public DateTime? EndDate { get; set; }

    public string? LocationDescription { get; set; }
    public Guid? LocationCommuneId { get; set; }
    public Guid? LocationDistrictId { get; set; }
    public Guid? LocationProvinceId { get; set; }
    public double? LocationLatitude { get; set; }
    public double? LocationLongitude { get; set; }

    public int ExposedCount { get; set; }
    public int AffectedCount { get; set; }
    public int HospitalizedCount { get; set; }
    public int DeathCount { get; set; }

    public string? SuspectedFood { get; set; }
    public string? FoodSource { get; set; }
    public string? FoodServiceType { get; set; }

    public CauseAssessment? CauseAssessmentValue { get; set; }
    public string? CausativeAgent { get; set; }
    public string? Pathogen { get; set; }

    public string? InvestigationTeam { get; set; }
    public string? ControlMeasures { get; set; }
    public string? PreventionMeasures { get; set; }
    public string? Conclusion { get; set; }

    public PoisoningIncidentStatus Status { get; set; }
    public Guid? ReportedById { get; set; }
    public DateTime? ReportedAt { get; set; }
    public Guid? VerifiedById { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public Guid? ConcludedById { get; set; }
    public DateTime? ConcludedAt { get; set; }
    public string? Notes { get; set; }
    public DateTime CreationTime { get; set; }
    public int CaseCount { get; set; }
}

public class CreateUpdateFoodPoisoningIncidentDto
{
    [Required]
    public DateTime? OccurrenceDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }

    [Required]
    [StringLength(500)]
    public string LocationDescription { get; set; } = string.Empty;
    public Guid? LocationCommuneId { get; set; }
    public Guid? LocationDistrictId { get; set; }
    public Guid? LocationProvinceId { get; set; }
    public double? LocationLatitude { get; set; }
    public double? LocationLongitude { get; set; }

    [Range(0, 1_000_000)]
    public int ExposedCount { get; set; }
    [Range(0, 1_000_000)]
    public int AffectedCount { get; set; }
    [Range(0, 1_000_000)]
    public int HospitalizedCount { get; set; }
    [Range(0, 1_000_000)]
    public int DeathCount { get; set; }

    public string? SuspectedFood { get; set; }
    [StringLength(200)]
    public string? FoodSource { get; set; }
    [StringLength(200)]
    public string? FoodServiceType { get; set; }

    public CauseAssessment? CauseAssessmentValue { get; set; }
    public string? CausativeAgent { get; set; }
    public string? Pathogen { get; set; }

    public string? InvestigationTeam { get; set; }
    public string? ControlMeasures { get; set; }
    public string? PreventionMeasures { get; set; }
}

public class FoodPoisoningIncidentFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public PoisoningIncidentStatus? Status { get; set; }
    public DateTime? OccurrenceDateFrom { get; set; }
    public DateTime? OccurrenceDateTo { get; set; }
}

public class ConcludeIncidentDto
{
    [Required]
    public string Conclusion { get; set; } = string.Empty;
}
