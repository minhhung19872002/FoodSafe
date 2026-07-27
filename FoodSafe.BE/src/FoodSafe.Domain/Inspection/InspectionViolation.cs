using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.Inspection;

public sealed class InspectionViolation : Entity<Guid>
{
    public Guid InspectionResultId { get; private set; }
    public string? ViolationCode { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? RegulationReference { get; private set; }
    public decimal? FineAmount { get; private set; }
    public string? RemedyRequired { get; private set; }
    public DateTime? RemedyDeadline { get; private set; }
    public bool IsRemedied { get; private set; }
    public DateTime? RemediedAt { get; private set; }
    public string? RemediedNotes { get; private set; }

    private InspectionViolation() { }

    internal InspectionViolation(
        Guid id,
        Guid inspectionResultId,
        string? violationCode,
        string description,
        string? regulationReference,
        decimal? fineAmount,
        string? remedyRequired,
        DateTime? remedyDeadline) : base(id)
    {
        Check.NotNullOrWhiteSpace(description, nameof(description));

        if (fineAmount.HasValue && fineAmount.Value < 0)
            throw new ArgumentException("Fine amount cannot be negative.", nameof(fineAmount));

        InspectionResultId = inspectionResultId;
        ViolationCode = string.IsNullOrWhiteSpace(violationCode) ? null : violationCode.Trim();
        Description = description.Trim();
        RegulationReference = string.IsNullOrWhiteSpace(regulationReference) ? null : regulationReference.Trim();
        FineAmount = fineAmount;
        RemedyRequired = string.IsNullOrWhiteSpace(remedyRequired) ? null : remedyRequired.Trim();
        RemedyDeadline = remedyDeadline?.Date;
        IsRemedied = false;
    }

    public void MarkRemedied(DateTime remediedAt, string? notes)
    {
        if (IsRemedied)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.ViolationAlreadyRemedied);

        IsRemedied = true;
        RemediedAt = remediedAt;
        RemediedNotes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }
}
