using Volo.Abp.Domain.Entities;

namespace FoodSafe.Inspection;

public sealed class InspectionPlanItem : Entity<Guid>
{
    public Guid PlanId { get; private set; }
    public Guid BusinessId { get; private set; }
    public int SequenceNumber { get; private set; }
    public DateTime? PlannedDate { get; private set; }
    public Guid? AssignedInspectorId { get; private set; }
    public InspectionPlanItemStatus Status { get; private set; }
    public string? Notes { get; private set; }

    private InspectionPlanItem() { }

    internal InspectionPlanItem(
        Guid id,
        Guid planId,
        Guid businessId,
        int sequenceNumber,
        DateTime? plannedDate,
        Guid? assignedInspectorId,
        string? notes) : base(id)
    {
        PlanId = planId;
        BusinessId = businessId;
        SequenceNumber = sequenceNumber;
        PlannedDate = plannedDate?.Date;
        AssignedInspectorId = assignedInspectorId;
        Status = InspectionPlanItemStatus.Pending;
        Notes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }

    public void MarkInProgress()
    {
        if (Status != InspectionPlanItemStatus.Pending)
            return;
        Status = InspectionPlanItemStatus.InProgress;
    }

    public void MarkCompleted()
    {
        Status = InspectionPlanItemStatus.Completed;
    }

    public void MarkSkipped()
    {
        Status = InspectionPlanItemStatus.Skipped;
    }
}
