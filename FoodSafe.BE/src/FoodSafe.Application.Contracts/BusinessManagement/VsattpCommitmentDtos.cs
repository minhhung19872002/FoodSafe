using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.Application.Contracts.BusinessManagement;

public class VsattpCommitmentDto : EntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public Guid OrganizationId { get; set; }
    public DateOnly CommitmentDate { get; set; }
    public string? Notes { get; set; }
    public VsattpCommitmentStatus Status { get; set; }
    public Guid? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class CreateVsattpCommitmentDto
{
    [Required]
    public Guid BusinessId { get; set; }

    [Required]
    public DateOnly CommitmentDate { get; set; }

    public string? Notes { get; set; }
}

public class UpdateVsattpCommitmentDto
{
    [Required]
    public DateOnly CommitmentDate { get; set; }

    public string? Notes { get; set; }
}

public class VsattpCommitmentListInput : PagedAndSortedResultRequestDto
{
    public Guid? BusinessId { get; set; }
    public Guid? OrganizationId { get; set; }
    public VsattpCommitmentStatus? Status { get; set; }
}
