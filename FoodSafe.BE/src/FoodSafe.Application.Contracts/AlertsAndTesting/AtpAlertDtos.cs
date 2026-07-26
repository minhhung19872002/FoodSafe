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
    public bool IsPublic { get; set; }
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
    public AlertCategory Category { get; set; }

    [Required]
    public AlertSeverity Severity { get; set; }

    [Required]
    public AlertSource Source { get; set; }

    [StringLength(100)]
    public string? AlertNumber { get; set; }

    public string? AffectedArea { get; set; }
    public string? AffectedProducts { get; set; }
    public Guid? BusinessId { get; set; }
    public string? ReporterName { get; set; }
    public string? ReporterPhone { get; set; }
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
