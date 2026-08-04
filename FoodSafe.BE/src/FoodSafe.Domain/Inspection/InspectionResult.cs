using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Inspection;

public sealed class InspectionResult : FullAuditedAggregateRoot<Guid>
{
    public Guid? PlanId { get; private set; }
    public Guid? PlanItemId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public DateTime InspectionDate { get; private set; }
    public InspectionType InspectionType { get; private set; }

    /// <summary>
    /// Inspection decision ("Quyết định kiểm tra") issued before the inspection,
    /// per Article 9 of Circular 48/2015/TT-BYT. Distinct from the administrative
    /// sanction decision (AdminDecisionNumber/AdminDecisionDate).
    /// </summary>
    public string? DecisionNumber { get; private set; }
    public DateTime? DecisionDate { get; private set; }
    public string? TeamLeader { get; private set; }
    public string? TeamMembersText { get; private set; }
    public InspectionOverallResult OverallResult { get; private set; }
    public bool HasViolation { get; private set; }
    public string? ViolationDescription { get; private set; }
    public decimal? FineAmount { get; private set; }
    public string FineCurrency { get; private set; } = "VND";
    public string? AdminDecisionNumber { get; private set; }
    public DateTime? AdminDecisionDate { get; private set; }
    public bool FollowUpRequired { get; private set; }
    public DateTime? FollowUpDate { get; private set; }
    public string? FollowUpScope { get; private set; }
    public FollowUpResult? FollowUpResultValue { get; private set; }
    public string? Recommendations { get; private set; }
    public string? Notes { get; private set; }
    public bool IsFinalized { get; private set; }
    public Guid? FinalizedById { get; private set; }
    public DateTime? FinalizedAt { get; private set; }

    // Request-scoped only (not persisted): remember what the caller explicitly
    // supplied in SetCoreFields so recalculation never overrides user input.
    private bool _fineAmountExplicit;
    private bool _hasViolationInput;

    private readonly List<InspectionViolation> _violations = new();
    public IReadOnlyList<InspectionViolation> Violations => _violations.AsReadOnly();

    private readonly List<InspectionResultInspector> _inspectors = new();
    public IReadOnlyList<InspectionResultInspector> Inspectors => _inspectors.AsReadOnly();

    private InspectionResult() { }

    private InspectionResult(Guid id) : base(id) { }

    public static InspectionResult Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? planId,
        Guid? planItemId,
        DateTime inspectionDate,
        InspectionType inspectionType,
        string? teamLeader,
        string? teamMembersText,
        InspectionOverallResult overallResult,
        bool hasViolation,
        string? violationDescription,
        decimal? fineAmount,
        string? adminDecisionNumber,
        DateTime? adminDecisionDate,
        bool followUpRequired,
        DateTime? followUpDate,
        string? followUpScope,
        string? recommendations,
        string? notes)
    {
        // The schema enforces this pairing too (chk_ir_plan_tuple).
        if (planItemId.HasValue != planId.HasValue)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.PlanItemWithoutPlan);

        var result = new InspectionResult(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId,
            PlanId = planId,
            PlanItemId = planItemId
        };
        result.SetCoreFields(
            inspectionDate, inspectionType, teamLeader, teamMembersText,
            overallResult, hasViolation, violationDescription, fineAmount,
            adminDecisionNumber, adminDecisionDate,
            followUpRequired, followUpDate, followUpScope, recommendations, notes);
        return result;
    }

    /// <summary>
    /// Sets the inspection decision reference. Must be called after the core
    /// fields are set so the decision date can be validated against the
    /// (possibly updated) inspection date.
    /// </summary>
    public void SetDecision(string? decisionNumber, DateTime? decisionDate)
    {
        EnsureMutable();

        var normalizedDate = decisionDate?.Date;
        if (normalizedDate.HasValue && normalizedDate.Value > InspectionDate)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.DecisionDateAfterInspectionDate);

        DecisionNumber = Normalize(decisionNumber);
        DecisionDate = normalizedDate;
    }

    public void Finalize(Guid finalizedById, DateTime finalizedAt)
    {
        if (IsFinalized)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.ResultAlreadyFinalized);
        IsFinalized = true;
        FinalizedById = finalizedById;
        FinalizedAt = finalizedAt;
    }

    public void EnsureMutable()
    {
        if (IsFinalized)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.CannotModifyFinalizedResult);
    }

    public void Update(
        DateTime inspectionDate,
        InspectionType inspectionType,
        string? teamLeader,
        string? teamMembersText,
        InspectionOverallResult overallResult,
        bool hasViolation,
        string? violationDescription,
        decimal? fineAmount,
        string? adminDecisionNumber,
        DateTime? adminDecisionDate,
        bool followUpRequired,
        DateTime? followUpDate,
        string? followUpScope,
        string? recommendations,
        string? notes)
    {
        EnsureMutable();
        SetCoreFields(
            inspectionDate, inspectionType, teamLeader, teamMembersText,
            overallResult, hasViolation, violationDescription, fineAmount,
            adminDecisionNumber, adminDecisionDate,
            followUpRequired, followUpDate, followUpScope, recommendations, notes);
    }

    public InspectionViolation AddViolation(
        Guid violationId,
        string? violationCode,
        string description,
        string? regulationReference,
        decimal? fineAmount,
        string? remedyRequired,
        DateTime? remedyDeadline,
        Guid? violationTypeId = null)
    {
        EnsureMutable();
        var violation = new InspectionViolation(
            violationId, Id, violationCode, description,
            regulationReference, fineAmount, remedyRequired, remedyDeadline,
            violationTypeId);
        _violations.Add(violation);
        RecalculateViolationState();
        return violation;
    }

    /// <summary>
    /// Drops every itemised violation without touching HasViolation/FineAmount —
    /// callers must follow up with <see cref="Update"/> to reset those fields.
    /// </summary>
    public void ClearViolations()
    {
        EnsureMutable();
        _violations.Clear();
    }

    public void RemoveViolation(Guid violationId)
    {
        EnsureMutable();
        var violation = _violations.FirstOrDefault(v => v.Id == violationId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.ViolationNotFound);
        _violations.Remove(violation);
        RecalculateViolationState();
    }

    public void MarkViolationRemedied(Guid violationId, DateTime remediedAt, string? notes)
    {
        var violation = _violations.FirstOrDefault(v => v.Id == violationId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.ViolationNotFound);
        violation.MarkRemedied(remediedAt, notes);
    }

    public void SetFollowUpResult(FollowUpResult result)
    {
        FollowUpResultValue = result;
    }

    public void SetInspectors(IEnumerable<(Guid UserId, bool IsTeamLeader)> inspectors)
    {
        _inspectors.Clear();
        foreach (var (userId, isTeamLeader) in inspectors)
        {
            _inspectors.Add(new InspectionResultInspector(Id, userId, isTeamLeader));
        }
    }

    private void SetCoreFields(
        DateTime inspectionDate,
        InspectionType inspectionType,
        string? teamLeader,
        string? teamMembersText,
        InspectionOverallResult overallResult,
        bool hasViolation,
        string? violationDescription,
        decimal? fineAmount,
        string? adminDecisionNumber,
        DateTime? adminDecisionDate,
        bool followUpRequired,
        DateTime? followUpDate,
        string? followUpScope,
        string? recommendations,
        string? notes)
    {
        if (fineAmount.HasValue && fineAmount.Value < 0)
            throw new ArgumentException("Fine amount cannot be negative.", nameof(fineAmount));

        InspectionDate = inspectionDate.Date;
        InspectionType = inspectionType;
        TeamLeader = Normalize(teamLeader);
        TeamMembersText = Normalize(teamMembersText);
        OverallResult = overallResult;
        _hasViolationInput = hasViolation;
        HasViolation = hasViolation || _violations.Count > 0;
        ViolationDescription = Normalize(violationDescription);
        _fineAmountExplicit = fineAmount.HasValue;
        FineAmount = fineAmount;
        AdminDecisionNumber = Normalize(adminDecisionNumber);
        AdminDecisionDate = adminDecisionDate?.Date;
        FollowUpRequired = followUpRequired;
        FollowUpDate = followUpRequired ? followUpDate?.Date : null;
        FollowUpScope = followUpRequired ? Normalize(followUpScope) : null;
        Recommendations = Normalize(recommendations);
        Notes = Normalize(notes);
    }

    // The user's explicit inputs win: itemised violations force HasViolation on,
    // and the itemised total only fills FineAmount when no total was entered.
    private void RecalculateViolationState()
    {
        HasViolation = _hasViolationInput || _violations.Count > 0;

        if (!_fineAmountExplicit)
        {
            var itemisedTotal = _violations
                .Where(v => v.FineAmount.HasValue)
                .Sum(v => v.FineAmount!.Value);
            FineAmount = itemisedTotal > 0 ? itemisedTotal : null;
        }
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
