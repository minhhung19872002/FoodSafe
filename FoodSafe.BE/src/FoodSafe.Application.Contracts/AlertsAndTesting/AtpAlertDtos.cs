using System;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.AlertsAndTesting;

public class AtpAlertDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string? AlertNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public AlertCategory Category { get; set; }
    public AlertSeverity Severity { get; set; }
    public string? AffectedArea { get; set; }
    public string? AffectedProducts { get; set; }
    public Guid? BusinessId { get; set; }
    public string? BusinessName { get; set; }
    public AlertSource Source { get; set; }
    public string? ReporterName { get; set; }
    public string? ReporterPhone { get; set; }
    public string? ReporterEmail { get; set; }
    public AlertStatus Status { get; set; }
    public Guid? PublishedById { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? RecalledById { get; set; }
    public DateTime? RecalledAt { get; set; }
    public string? RecallReason { get; set; }
    public Guid? RejectedById { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectedReason { get; set; }
    public bool IsPublic { get; set; }
    public Guid? AssigneeId { get; set; }
    public string? AssigneeName { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateUpdateAtpAlertDto
{
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [Required]
    [EnumDataType(typeof(AlertCategory))]
    public AlertCategory Category { get; set; }

    [Required]
    [EnumDataType(typeof(AlertSeverity))]
    public AlertSeverity Severity { get; set; }

    [Required]
    [EnumDataType(typeof(AlertSource))]
    public AlertSource Source { get; set; }

    [StringLength(100)]
    public string? AlertNumber { get; set; }

    public string? AffectedArea { get; set; }
    public string? AffectedProducts { get; set; }
    public Guid? BusinessId { get; set; }

    [StringLength(200)]
    public string? ReporterName { get; set; }

    [StringLength(20)]
    public string? ReporterPhone { get; set; }

    [StringLength(200)]
    public string? ReporterEmail { get; set; }
}

public class AtpAlertFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public AlertCategory? Category { get; set; }
    public AlertSeverity? Severity { get; set; }
    public AlertSource? Source { get; set; }
    public AlertStatus? Status { get; set; }
}

public class PublishAlertDto
{
    public bool IsPublic { get; set; } = true;
}

public class RecallAlertDto
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>Moderation refusal of a draft alert — the reason is kept for audit.</summary>
public class RejectAlertDto
{
    [Required]
    [StringLength(1000, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>Assigns a citizen-submitted alert to a staff member for processing (FR-29-06).</summary>
public class AssignAlertDto
{
    [Required]
    public Guid AssigneeId { get; set; }
}
