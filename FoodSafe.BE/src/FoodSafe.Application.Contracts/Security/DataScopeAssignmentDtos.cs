using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Security;

public sealed class DataScopeAssignmentListInput : PagedAndSortedResultRequestDto
{
    [Required]
    public ManagementScopeType ScopeType { get; set; }

    public Guid? BusinessId { get; set; }
    public Guid? BusinessTypeId { get; set; }
    public Guid? ProductGroupId { get; set; }
}

public sealed class DataScopeAssignmentDto : EntityDto<Guid>
{
    public ManagementScopeType ScopeType { get; set; }
    public Guid? GranteeUserId { get; set; }
    public string? GranteeUserName { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? BusinessTypeId { get; set; }
    public Guid? ProductGroupId { get; set; }
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

public sealed class CreateDataScopeAssignmentInput
{
    [Required]
    public ManagementScopeType ScopeType { get; set; }

    public Guid? GranteeUserId { get; set; }

    public Guid? BusinessId { get; set; }
    public Guid? BusinessTypeId { get; set; }
    public Guid? ProductGroupId { get; set; }

    public bool CanView { get; set; } = true;
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }

    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}
