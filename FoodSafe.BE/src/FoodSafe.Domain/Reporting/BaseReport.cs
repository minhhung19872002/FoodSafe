using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Reporting;

public abstract class BaseReport : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; protected set; }
    public ReportStatus Status { get; protected set; }
    public short SubmissionVersion { get; protected set; }

    public Guid? SubmittedById { get; protected set; }
    public DateTime? SubmittedAt { get; protected set; }
    public Guid? VerifiedById { get; protected set; }
    public DateTime? VerifiedAt { get; protected set; }
    public Guid? ReturnedById { get; protected set; }
    public DateTime? ReturnedAt { get; protected set; }
    public string? ReturnReason { get; protected set; }
    public Guid? CompletedById { get; protected set; }
    public DateTime? CompletedAt { get; protected set; }
    public string? Notes { get; protected set; }

    protected BaseReport() { }

    protected void EnsureDraft()
    {
        if (Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotModifyNonDraft);
    }

    public void Submit(Guid submitterId, DateTime submittedAt)
    {
        if (Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotSubmitNonDraft);

        SubmissionVersion++;
        SubmittedById = submitterId;
        SubmittedAt = submittedAt;
        Status = ReportStatus.Submitted;
    }

    public void Verify(Guid verifierId, DateTime verifiedAt)
    {
        if (Status != ReportStatus.Submitted)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotVerifyNonSubmitted);

        VerifiedById = verifierId;
        VerifiedAt = verifiedAt;
        Status = ReportStatus.Verified;
    }

    public void Return(Guid returnerId, DateTime returnedAt, string returnReason)
    {
        if (Status != ReportStatus.Submitted && Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotReturnNonSubmittedOrVerified);

        if (string.IsNullOrWhiteSpace(returnReason))
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.ReturnReasonRequired);

        ReturnedById = returnerId;
        ReturnedAt = returnedAt;
        ReturnReason = returnReason;
        Status = ReportStatus.Returned;
    }

    public void Complete(Guid completedById, DateTime completedAt)
    {
        if (Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotCompleteNonVerified);

        CompletedById = completedById;
        CompletedAt = completedAt;
        Status = ReportStatus.Completed;
    }

    public void ReturnToDraft()
    {
        if (Status != ReportStatus.Returned)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotReturnToDraftNonReturned);

        Status = ReportStatus.Draft;
    }

    public void SetNotes(string? notes) => Notes = notes;
}
