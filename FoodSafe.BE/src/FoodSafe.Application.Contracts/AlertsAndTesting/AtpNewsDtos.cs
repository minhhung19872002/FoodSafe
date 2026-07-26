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
    public bool IsPublic { get; set; }
    public bool IsFeatured { get; set; }
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

    public string? Summary { get; set; }
    public string? ThumbnailStoragePath { get; set; }
    public string? Category { get; set; }
    public string? Tags { get; set; }
    public bool IsFeatured { get; set; }
    public List<Guid> LinkedAlertIds { get; set; } = new();
}

public class AtpNewsFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? Category { get; set; }
    public NewsStatus? Status { get; set; }
}

public class PublishNewsDto
{
    public bool IsPublic { get; set; } = true;
}

public class AlertOptionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? AlertNumber { get; set; }
}
