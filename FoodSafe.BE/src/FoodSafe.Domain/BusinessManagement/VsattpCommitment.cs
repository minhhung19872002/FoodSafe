using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.BusinessManagement;

public sealed class VsattpCommitment : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public DateOnly CommitmentDate { get; private set; }
    public string? Notes { get; private set; }
    public VsattpCommitmentStatus Status { get; private set; }
    public Guid? ConfirmedByUserId { get; private set; }
    public DateTime? ConfirmedAt { get; private set; }

    private VsattpCommitment() { }

    private VsattpCommitment(Guid id) : base(id) { }

    public static VsattpCommitment Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        DateOnly commitmentDate,
        string? notes)
    {
        var record = new VsattpCommitment(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId,
            Status = VsattpCommitmentStatus.Submitted
        };
        record.Update(commitmentDate, notes);
        return record;
    }

    public void Update(DateOnly commitmentDate, string? notes)
    {
        if (Status == VsattpCommitmentStatus.Confirmed)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Business.CannotModifyConfirmedCommitment);
        CommitmentDate = commitmentDate;
        Notes = Normalize(notes);
    }

    public void Confirm(Guid confirmedByUserId, DateTime confirmedAt)
    {
        if (Status == VsattpCommitmentStatus.Confirmed)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Business.CommitmentAlreadyConfirmed);
        Status = VsattpCommitmentStatus.Confirmed;
        ConfirmedByUserId = confirmedByUserId;
        ConfirmedAt = confirmedAt;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
