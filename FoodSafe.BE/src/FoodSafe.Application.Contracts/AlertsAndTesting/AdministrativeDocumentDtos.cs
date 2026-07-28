using System.ComponentModel.DataAnnotations;
using FoodSafe.AlertsAndTesting;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Application.Contracts.AlertsAndTesting;

public class AdministrativeDocumentDto
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public Guid DocumentTypeId { get; set; }
    public string? DocumentTypeName { get; set; }
    public string DocumentNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? IssuingAuthority { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Summary { get; set; }
    public DocumentStatus Status { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateUpdateAdministrativeDocumentDto
{
    public Guid DocumentTypeId { get; set; }

    [Required, StringLength(100)]
    public string DocumentNumber { get; set; } = string.Empty;

    [Required, StringLength(500)]
    public string Title { get; set; } = string.Empty;

    [StringLength(300)]
    public string? IssuingAuthority { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime? EffectiveDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Summary { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Active;
    public bool IsPublic { get; set; }
}

public class AdministrativeDocumentFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? DocumentTypeId { get; set; }
    public DocumentStatus? Status { get; set; }
}
