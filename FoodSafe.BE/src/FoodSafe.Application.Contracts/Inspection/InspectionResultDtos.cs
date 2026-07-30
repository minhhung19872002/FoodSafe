using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Inspection;

public class InspectionResultDto : EntityDto<Guid>
{
    public Guid? PlanId { get; set; }
    public Guid? PlanItemId { get; set; }
    public Guid BusinessId { get; set; }
    public string? BusinessName { get; set; }
    public Guid OrganizationId { get; set; }
    public DateTime InspectionDate { get; set; }
    public InspectionType InspectionType { get; set; }
    public string? TeamLeader { get; set; }
    public string? TeamMembersText { get; set; }
    public InspectionOverallResult OverallResult { get; set; }
    public bool HasViolation { get; set; }
    public string? ViolationDescription { get; set; }
    public decimal? FineAmount { get; set; }
    public string FineCurrency { get; set; } = "VND";
    public string? AdminDecisionNumber { get; set; }
    public DateTime? AdminDecisionDate { get; set; }
    public bool FollowUpRequired { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public string? FollowUpScope { get; set; }
    public FollowUpResult? FollowUpResultValue { get; set; }
    public string? Recommendations { get; set; }
    public string? Notes { get; set; }
    public bool IsFinalized { get; set; }
    public DateTime? FinalizedAt { get; set; }
    public DateTime CreationTime { get; set; }
    public List<InspectionViolationDto> Violations { get; set; } = new();
    public List<InspectionResultInspectorDto> Inspectors { get; set; } = new();
}

public class InspectionViolationDto : EntityDto<Guid>
{
    public Guid InspectionResultId { get; set; }
    public string? ViolationCode { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? RegulationReference { get; set; }
    public decimal? FineAmount { get; set; }
    public string? RemedyRequired { get; set; }
    public DateTime? RemedyDeadline { get; set; }
    public bool IsRemedied { get; set; }
    public DateTime? RemediedAt { get; set; }
    public string? RemediedNotes { get; set; }
}

public class InspectionResultInspectorDto
{
    public Guid UserId { get; set; }
    public string? UserName { get; set; }
    public bool IsTeamLeader { get; set; }
}

public class CreateUpdateInspectionResultDto
{
    public Guid? PlanId { get; set; }
    public Guid? PlanItemId { get; set; }

    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    public DateTime InspectionDate { get; set; }

    [Required]
    public InspectionType InspectionType { get; set; }

    public string? TeamLeader { get; set; }
    public string? TeamMembersText { get; set; }

    [Required]
    public InspectionOverallResult OverallResult { get; set; }

    public bool HasViolation { get; set; }
    public string? ViolationDescription { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? FineAmount { get; set; }

    public string? AdminDecisionNumber { get; set; }
    public DateTime? AdminDecisionDate { get; set; }
    public bool FollowUpRequired { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public string? FollowUpScope { get; set; }
    public string? Recommendations { get; set; }
    public string? Notes { get; set; }
    public List<CreateUpdateViolationDto> Violations { get; set; } = new();
    public List<InspectorDto> Inspectors { get; set; } = new();
}

public class CreateUpdateViolationDto
{
    public string? ViolationCode { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? RegulationReference { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? FineAmount { get; set; }

    public string? RemedyRequired { get; set; }
    public DateTime? RemedyDeadline { get; set; }
}

public class InspectorDto
{
    [Required]
    public Guid UserId { get; set; }
    public bool IsTeamLeader { get; set; }
}

public class MarkViolationRemediedDto
{
    public string? Notes { get; set; }
}

public class SetFollowUpResultDto
{
    [Required]
    public FollowUpResult Result { get; set; }
}

public class InspectionResultFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? PlanId { get; set; }
    public InspectionType? InspectionType { get; set; }
    public InspectionOverallResult? OverallResult { get; set; }
    public bool? HasViolation { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
}
