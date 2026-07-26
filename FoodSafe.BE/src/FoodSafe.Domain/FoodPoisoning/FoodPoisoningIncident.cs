using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.FoodPoisoning;

public sealed class FoodPoisoningIncident : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string IncidentCode { get; private set; } = string.Empty;
    public DateTime? OccurrenceDate { get; private set; }
    public DateTime? EndDate { get; private set; }

    // Location (flattened)
    public string? LocationDescription { get; private set; }
    public Guid? LocationCommuneId { get; private set; }
    public Guid? LocationDistrictId { get; private set; }
    public Guid? LocationProvinceId { get; private set; }
    public double? LocationLatitude { get; private set; }
    public double? LocationLongitude { get; private set; }

    // Statistics (flattened)
    public int ExposedCount { get; private set; }
    public int AffectedCount { get; private set; }
    public int HospitalizedCount { get; private set; }
    public int DeathCount { get; private set; }

    // Food info (flattened)
    public string? SuspectedFood { get; private set; }
    public string? FoodSource { get; private set; }
    public string? FoodServiceType { get; private set; }

    // Cause assessment
    public CauseAssessment? CauseAssessmentValue { get; private set; }
    public string? CausativeAgent { get; private set; }
    public string? Pathogen { get; private set; }

    // Investigation & response
    public string? InvestigationTeam { get; private set; }
    public string? ControlMeasures { get; private set; }
    public string? PreventionMeasures { get; private set; }
    public string? Conclusion { get; private set; }

    public PoisoningIncidentStatus Status { get; private set; }
    public Guid? ReportedById { get; private set; }
    public DateTime? ReportedAt { get; private set; }
    public Guid? VerifiedById { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public Guid? ConcludedById { get; private set; }
    public DateTime? ConcludedAt { get; private set; }
    public string? Notes { get; private set; }

    private readonly List<PoisoningIncidentErrorReport> _errorReports = [];
    public IReadOnlyList<PoisoningIncidentErrorReport> ErrorReports => _errorReports;

    private FoodPoisoningIncident() { }

    private FoodPoisoningIncident(Guid id) : base(id) { }

    public static FoodPoisoningIncident Create(
        Guid id,
        Guid organizationId,
        string incidentCode,
        DateTime? occurrenceDate = null,
        DateTime? endDate = null,
        string? notes = null)
    {
        Check.NotNullOrWhiteSpace(incidentCode, nameof(incidentCode), 50);

        return new FoodPoisoningIncident(id)
        {
            OrganizationId = organizationId,
            IncidentCode = incidentCode.Trim(),
            OccurrenceDate = occurrenceDate,
            EndDate = endDate,
            Notes = Normalize(notes),
            Status = PoisoningIncidentStatus.Draft
        };
    }

    public void Update(
        DateTime? occurrenceDate,
        DateTime? endDate,
        string? notes)
    {
        EnsureDraft();
        OccurrenceDate = occurrenceDate;
        EndDate = endDate;
        Notes = Normalize(notes);
    }

    public void SetLocation(
        string? description,
        Guid? communeId,
        Guid? districtId,
        Guid? provinceId,
        double? latitude,
        double? longitude)
    {
        EnsureDraft();
        LocationDescription = Normalize(description);
        LocationCommuneId = communeId;
        LocationDistrictId = districtId;
        LocationProvinceId = provinceId;
        LocationLatitude = latitude;
        LocationLongitude = longitude;
    }

    public void SetStatistics(
        int exposedCount,
        int affectedCount,
        int hospitalizedCount,
        int deathCount)
    {
        EnsureDraft();
        ExposedCount = Math.Max(0, exposedCount);
        AffectedCount = Math.Max(0, affectedCount);
        HospitalizedCount = Math.Max(0, hospitalizedCount);
        DeathCount = Math.Max(0, deathCount);
    }

    public void SetFoodInfo(
        string? suspectedFood,
        string? foodSource,
        string? foodServiceType)
    {
        EnsureDraft();
        SuspectedFood = Normalize(suspectedFood);
        FoodSource = Normalize(foodSource);
        FoodServiceType = Normalize(foodServiceType);
    }

    public void SetCauseInfo(
        CauseAssessment? causeAssessment,
        string? causativeAgent,
        string? pathogen)
    {
        EnsureDraft();
        CauseAssessmentValue = causeAssessment;
        CausativeAgent = Normalize(causativeAgent);
        Pathogen = Normalize(pathogen);
    }

    public void SetInvestigationInfo(
        string? investigationTeam,
        string? controlMeasures,
        string? preventionMeasures)
    {
        EnsureDraft();
        InvestigationTeam = Normalize(investigationTeam);
        ControlMeasures = Normalize(controlMeasures);
        PreventionMeasures = Normalize(preventionMeasures);
    }

    public void Submit(Guid reporterId, DateTime reportedAt)
    {
        if (Status != PoisoningIncidentStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.InvalidStatusTransition);

        Status = PoisoningIncidentStatus.Reported;
        ReportedById = reporterId;
        ReportedAt = reportedAt;
    }

    public void Verify(Guid verifierId, DateTime verifiedAt)
    {
        if (Status != PoisoningIncidentStatus.Reported)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.InvalidStatusTransition);

        Status = PoisoningIncidentStatus.Verified;
        VerifiedById = verifierId;
        VerifiedAt = verifiedAt;
    }

    public void Conclude(Guid concluderId, DateTime concludedAt, string conclusion)
    {
        if (Status != PoisoningIncidentStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.InvalidStatusTransition);

        Check.NotNullOrWhiteSpace(conclusion, nameof(conclusion));

        Status = PoisoningIncidentStatus.Concluded;
        ConcludedById = concluderId;
        ConcludedAt = concludedAt;
        Conclusion = conclusion.Trim();
    }

    public PoisoningIncidentErrorReport AddErrorReport(
        Guid id,
        Guid fromOrgId,
        string errorDescription,
        string correctionRequest,
        Guid? creatorId)
    {
        if (Status != PoisoningIncidentStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CanOnlyReportErrorOnVerified);

        Check.NotNullOrWhiteSpace(errorDescription, nameof(errorDescription));
        Check.NotNullOrWhiteSpace(correctionRequest, nameof(correctionRequest));

        var report = new PoisoningIncidentErrorReport(
            id, Id, fromOrgId, errorDescription, correctionRequest, creatorId);
        _errorReports.Add(report);
        return report;
    }

    private void EnsureDraft()
    {
        if (Status != PoisoningIncidentStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CannotModifyNonDraft);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
