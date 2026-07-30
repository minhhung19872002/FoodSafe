using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Inspection;

public sealed class InspectionPlan : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid? ProvinceId { get; private set; }
    public Guid? CommuneId { get; private set; }
    public string PlanCode { get; private set; } = string.Empty;
    public string Title { get; private set; } = string.Empty;
    public InspectionPlanType PlanType { get; private set; }
    public int Year { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public string? Description { get; private set; }
    public string? Objectives { get; private set; }
    public InspectionPlanStatus Status { get; private set; }

    public Guid? SubmittedById { get; private set; }
    public DateTime? SubmittedAt { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public DateTime? ApprovedAt { get; private set; }
    public Guid? RejectedById { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    public string? RejectedReason { get; private set; }
    public Guid? CancelledById { get; private set; }
    public DateTime? CancelledAt { get; private set; }
    public string? CancelledReason { get; private set; }

    private readonly List<InspectionPlanItem> _items = new();
    public IReadOnlyList<InspectionPlanItem> Items => _items.AsReadOnly();

    private InspectionPlan() { }

    private InspectionPlan(Guid id) : base(id) { }

    public static InspectionPlan Create(
        Guid id,
        Guid organizationId,
        string planCode,
        string title,
        InspectionPlanType planType,
        int year,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        string? objectives,
        Guid? provinceId = null,
        Guid? communeId = null)
    {
        var plan = new InspectionPlan(id)
        {
            Status = InspectionPlanStatus.Draft
        };
        plan.SetCoreFields(organizationId, planCode, title, planType, year, startDate, endDate, description, objectives, provinceId, communeId);
        return plan;
    }

    public void Update(
        Guid organizationId,
        string planCode,
        string title,
        InspectionPlanType planType,
        int year,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        string? objectives,
        Guid? provinceId = null,
        Guid? communeId = null)
    {
        EnsureDraft();
        SetCoreFields(organizationId, planCode, title, planType, year, startDate, endDate, description, objectives, provinceId, communeId);
    }

    public InspectionPlanItem AddBusiness(
        Guid itemId,
        Guid businessId,
        int sequenceNumber,
        DateTime? plannedDate,
        Guid? assignedInspectorId,
        string? notes)
    {
        EnsureDraft();

        if (_items.Any(i => i.BusinessId == businessId))
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.DuplicateBusiness);

        var item = new InspectionPlanItem(
            itemId, Id, businessId, sequenceNumber,
            plannedDate, assignedInspectorId, notes);
        _items.Add(item);
        return item;
    }

    public InspectionPlanItem UpdateBusinessDetails(
        Guid businessId,
        int sequenceNumber,
        DateTime? plannedDate,
        Guid? assignedInspectorId,
        string? notes)
    {
        EnsureDraft();

        var item = _items.FirstOrDefault(i => i.BusinessId == businessId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.BusinessNotInPlan);
        item.UpdateDetails(sequenceNumber, plannedDate, assignedInspectorId, notes);
        return item;
    }

    public void RemoveBusiness(Guid businessId)
    {
        EnsureDraft();

        var item = _items.FirstOrDefault(i => i.BusinessId == businessId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.BusinessNotInPlan);
        _items.Remove(item);
    }

    public InspectionPlanItem UpdateItemStatus(Guid itemId, InspectionPlanItemStatus status)
    {
        if (Status != InspectionPlanStatus.Approved && Status != InspectionPlanStatus.InProgress)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);

        var item = _items.FirstOrDefault(i => i.Id == itemId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.BusinessNotInPlan);

        // Completed is reserved for the inspection-result flow.
        switch (status)
        {
            case InspectionPlanItemStatus.InProgress when item.Status == InspectionPlanItemStatus.Pending:
                item.MarkInProgress();
                break;
            case InspectionPlanItemStatus.Skipped when item.Status is InspectionPlanItemStatus.Pending
                or InspectionPlanItemStatus.InProgress:
                item.MarkSkipped();
                break;
            default:
                throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);
        }

        return item;
    }

    public void Submit(Guid submittedById, DateTime submittedAt)
    {
        EnsureDraft();

        if (_items.Count == 0)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.EmptyPlan);

        Status = InspectionPlanStatus.Submitted;
        SubmittedById = submittedById;
        SubmittedAt = submittedAt;
    }

    public void Approve(Guid approvedById, DateTime approvedAt)
    {
        if (Status != InspectionPlanStatus.Submitted)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);

        Status = InspectionPlanStatus.Approved;
        ApprovedById = approvedById;
        ApprovedAt = approvedAt;
    }

    public void Reject(Guid rejectedById, DateTime rejectedAt, string reason)
    {
        if (Status != InspectionPlanStatus.Submitted)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);

        Check.NotNullOrWhiteSpace(reason, nameof(reason));

        Status = InspectionPlanStatus.Draft;
        RejectedById = rejectedById;
        RejectedAt = rejectedAt;
        RejectedReason = reason.Trim();
    }

    public void MarkInProgress()
    {
        if (Status != InspectionPlanStatus.Approved)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);

        Status = InspectionPlanStatus.InProgress;
    }

    public void Complete()
    {
        if (Status is not (InspectionPlanStatus.Approved or InspectionPlanStatus.InProgress))
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);

        Status = InspectionPlanStatus.Completed;
    }

    public void Cancel(Guid cancelledById, DateTime cancelledAt, string reason)
    {
        if (Status == InspectionPlanStatus.Completed)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.CannotCancelCompleted);

        Check.NotNullOrWhiteSpace(reason, nameof(reason));

        Status = InspectionPlanStatus.Cancelled;
        CancelledById = cancelledById;
        CancelledAt = cancelledAt;
        CancelledReason = reason.Trim();
    }

    private void SetCoreFields(
        Guid organizationId,
        string planCode,
        string title,
        InspectionPlanType planType,
        int year,
        DateTime? startDate,
        DateTime? endDate,
        string? description,
        string? objectives,
        Guid? provinceId,
        Guid? communeId)
    {
        Check.NotNullOrWhiteSpace(planCode, nameof(planCode), 50);
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);

        var normalizedStart = startDate?.Date;
        var normalizedEnd = endDate?.Date;
        if (normalizedStart.HasValue && normalizedEnd.HasValue &&
            normalizedStart.Value > normalizedEnd.Value)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.InvalidDateRange);

        OrganizationId = organizationId;
        PlanCode = planCode.Trim().ToUpperInvariant();
        Title = title.Trim();
        PlanType = planType;
        Year = year;
        StartDate = normalizedStart;
        EndDate = normalizedEnd;
        Description = Normalize(description);
        Objectives = Normalize(objectives);
        ProvinceId = provinceId;
        CommuneId = communeId;
    }

    private void EnsureDraft()
    {
        if (Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.CannotModifyNonDraft);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
