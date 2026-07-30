using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Inspection;

public class InspectionPlanDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public Guid? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public Guid? CommuneId { get; set; }
    public string? CommuneName { get; set; }
    public string PlanCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public InspectionPlanType PlanType { get; set; }
    public int Year { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Description { get; set; }
    public string? Objectives { get; set; }
    public InspectionPlanStatus Status { get; set; }
    public Guid? SubmittedById { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public Guid? ApprovedById { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? RejectedReason { get; set; }
    public string? CancelledReason { get; set; }
    public DateTime CreationTime { get; set; }
    public List<InspectionPlanItemDto> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
}

public class InspectionPlanItemDto : EntityDto<Guid>
{
    public Guid PlanId { get; set; }
    public Guid BusinessId { get; set; }
    public string? BusinessName { get; set; }
    public int SequenceNumber { get; set; }
    public DateTime? PlannedDate { get; set; }
    public Guid? AssignedInspectorId { get; set; }
    public string? AssignedInspectorName { get; set; }
    public InspectionPlanItemStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class UpdateInspectionPlanItemStatusDto
{
    /// <summary>InProgress or Skipped; Completed is set by the inspection-result flow.</summary>
    [Required]
    public InspectionPlanItemStatus Status { get; set; }
}

public class CreateUpdateInspectionPlanDto
{
    public Guid? OrganizationId { get; set; }
    public Guid? ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }

    [Required]
    [StringLength(50)]
    public string PlanCode { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public InspectionPlanType PlanType { get; set; }

    [Required]
    [Range(2000, 2100)]
    public int Year { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Description { get; set; }
    public string? Objectives { get; set; }
    public List<CreateUpdatePlanItemDto> Items { get; set; } = new();
}

public class CreateUpdatePlanItemDto
{
    [Required]
    public Guid BusinessId { get; set; }

    public int SequenceNumber { get; set; }
    public DateTime? PlannedDate { get; set; }
    public Guid? AssignedInspectorId { get; set; }
    public string? Notes { get; set; }
}

public class InspectionPlanFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public InspectionPlanType? PlanType { get; set; }
    public InspectionPlanStatus? Status { get; set; }
    public int? Year { get; set; }
    public Guid? OrganizationId { get; set; }
    public Guid? ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
}

public class RejectPlanDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}

public class CancelPlanDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}
