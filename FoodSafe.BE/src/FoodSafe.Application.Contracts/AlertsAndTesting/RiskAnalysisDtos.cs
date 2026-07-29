using System.ComponentModel.DataAnnotations;
using FoodSafe.AlertsAndTesting;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Application.Contracts.AlertsAndTesting;

public class RiskAnalysisDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public AlertCategory Category { get; set; }
    public RiskLevel RiskLevel { get; set; }
    public List<Guid> ProductGroupIds { get; set; } = [];
    public List<string> ProductGroupNames { get; set; } = [];
    public string? RelatedProducts { get; set; }
    public string? Evidence { get; set; }
    public string? Recommendations { get; set; }
    public RiskAnalysisStatus Status { get; set; }
    public bool IsPublic { get; set; }
    public Guid? PublishedById { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateUpdateRiskAnalysisDto
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
    [EnumDataType(typeof(RiskLevel))]
    public RiskLevel RiskLevel { get; set; }

    public List<Guid> ProductGroupIds { get; set; } = [];
    public string? RelatedProducts { get; set; }
    public string? Evidence { get; set; }
    public string? Recommendations { get; set; }
}

public class RiskAnalysisFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public AlertCategory? Category { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public RiskAnalysisStatus? Status { get; set; }
}
