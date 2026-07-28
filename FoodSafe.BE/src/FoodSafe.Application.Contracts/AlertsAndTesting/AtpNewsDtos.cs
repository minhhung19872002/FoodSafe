using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.AlertsAndTesting;

public class AtpNewsDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ThumbnailStoragePath { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public int ViewCount { get; set; }
    public NewsStatus Status { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? PublishedById { get; set; }
    public Guid? RecalledById { get; set; }
    public DateTime? RecalledAt { get; set; }
    public Guid? RejectedById { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectedReason { get; set; }
    public bool IsPublic { get; set; }
    public bool IsFeatured { get; set; }
    public AlertSource Source { get; set; }
    public string? ReporterName { get; set; }
    public string? ReporterContact { get; set; }
    public DateTime CreationTime { get; set; }
    public List<NewsLinkedAlertDto> LinkedAlerts { get; set; } = new();
}

public class NewsLinkedAlertDto : EntityDto<Guid>
{
    public Guid AlertId { get; set; }
    public string? AlertTitle { get; set; }
}

public class CreateUpdateAtpNewsDto
{
    [Required]
    [StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Content { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Summary { get; set; }

    [StringLength(500)]
    public string? ThumbnailStoragePath { get; set; }

    [StringLength(100)]
    public string? Category { get; set; }

    [StringLength(500)]
    public string? Tags { get; set; }

    public bool IsFeatured { get; set; }
    public List<Guid> LinkedAlertIds { get; set; } = new();
}

public class AtpNewsFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? Category { get; set; }
    public NewsStatus? Status { get; set; }
    public AlertSource? Source { get; set; }
}

public class PublishNewsDto
{
    public bool IsPublic { get; set; } = true;
}

/// <summary>Moderation refusal of a draft news item — the reason is kept for audit.</summary>
public class RejectNewsDto
{
    [Required]
    [StringLength(1000, MinimumLength = 3)]
    public string Reason { get; set; } = string.Empty;
}

public class AlertOptionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AlertNumber { get; set; }
}
