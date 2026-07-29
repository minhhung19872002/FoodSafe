using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.FoodPoisoning;

public sealed class FoodPoisoningCase : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public Guid? IncidentId { get; private set; }
    public string CaseCode { get; private set; } = string.Empty;
    public DateOnly ReportDate { get; private set; }
    public DateTime? OccurrenceDate { get; private set; }

    // Location (flattened)
    public string? LocationDescription { get; private set; }
    public Guid? LocationCommuneId { get; private set; }
    public Guid? LocationProvinceId { get; private set; }
    public double? LocationLatitude { get; private set; }
    public double? LocationLongitude { get; private set; }

    // Victim info (flattened)
    public string? VictimName { get; private set; }
    public int? VictimAge { get; private set; }
    public VictimGender? VictimGender { get; private set; }
    public string? VictimPhone { get; private set; }
    public string? VictimAddress { get; private set; }

    // Food info (flattened)
    public string? SuspectedFood { get; private set; }
    public string? FoodSource { get; private set; }
    public DateOnly? FoodPreparationDate { get; private set; }
    public string? Symptoms { get; private set; }
    public DateTime? OnsetTime { get; private set; }

    // Medical info (flattened)
    public string? MedicalFacility { get; private set; }
    public DateOnly? TreatmentStartDate { get; private set; }
    public TreatmentResult? TreatmentResult { get; private set; }

    // Reporter info (flattened)
    public string? ReporterName { get; private set; }
    public string? ReporterPhone { get; private set; }
    public string? ReporterOrganization { get; private set; }
    public string? ReporterRelation { get; private set; }

    public PoisoningCaseStatus Status { get; private set; }
    public Guid? ReportedById { get; private set; }
    public DateTime? ReportedAt { get; private set; }
    public Guid? VerifiedById { get; private set; }
    public DateTime? VerifiedAt { get; private set; }
    public string? Notes { get; private set; }

    private readonly List<PoisoningCaseErrorReport> _errorReports = [];
    public IReadOnlyList<PoisoningCaseErrorReport> ErrorReports => _errorReports;

    private FoodPoisoningCase() { }

    private FoodPoisoningCase(Guid id) : base(id) { }

    public static FoodPoisoningCase Create(
        Guid id,
        Guid organizationId,
        string caseCode,
        DateOnly reportDate,
        DateTime? occurrenceDate = null,
        Guid? incidentId = null,
        string? notes = null)
    {
        Check.NotNullOrWhiteSpace(caseCode, nameof(caseCode), 50);

        return new FoodPoisoningCase(id)
        {
            OrganizationId = organizationId,
            CaseCode = caseCode.Trim(),
            ReportDate = reportDate,
            OccurrenceDate = occurrenceDate,
            IncidentId = incidentId,
            Notes = Normalize(notes),
            Status = PoisoningCaseStatus.Draft
        };
    }

    public void Update(
        DateOnly reportDate,
        DateTime? occurrenceDate,
        Guid? incidentId,
        string? notes)
    {
        EnsureDraft();
        ReportDate = reportDate;
        OccurrenceDate = occurrenceDate;
        IncidentId = incidentId;
        Notes = Normalize(notes);
    }

    public void SetLocation(
        string? description,
        Guid? communeId,
        Guid? provinceId,
        double? latitude,
        double? longitude)
    {
        EnsureDraft();
        LocationDescription = Normalize(description);
        LocationCommuneId = communeId;
        LocationProvinceId = provinceId;
        LocationLatitude = latitude;
        LocationLongitude = longitude;
    }

    public void SetVictimInfo(
        string? name,
        int? age,
        VictimGender? gender,
        string? phone,
        string? address)
    {
        EnsureDraft();
        VictimName = Normalize(name);
        VictimAge = age;
        VictimGender = gender;
        VictimPhone = Normalize(phone);
        VictimAddress = Normalize(address);
    }

    public void SetFoodInfo(
        string? suspectedFood,
        string? foodSource,
        DateOnly? foodPreparationDate,
        string? symptoms,
        DateTime? onsetTime)
    {
        EnsureDraft();
        SuspectedFood = Normalize(suspectedFood);
        FoodSource = Normalize(foodSource);
        FoodPreparationDate = foodPreparationDate;
        Symptoms = Normalize(symptoms);
        OnsetTime = onsetTime;
    }

    public void SetMedicalInfo(
        string? medicalFacility,
        DateOnly? treatmentStartDate,
        TreatmentResult? treatmentResult)
    {
        EnsureDraft();
        MedicalFacility = Normalize(medicalFacility);
        TreatmentStartDate = treatmentStartDate;
        TreatmentResult = treatmentResult;
    }

    public void SetReporterInfo(
        string? name,
        string? phone,
        string? organization,
        string? relation)
    {
        EnsureDraft();
        ReporterName = Normalize(name);
        ReporterPhone = Normalize(phone);
        ReporterOrganization = Normalize(organization);
        ReporterRelation = Normalize(relation);
    }

    public void Submit(Guid reporterId, DateTime reportedAt)
    {
        if (Status != PoisoningCaseStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.InvalidStatusTransition);

        Status = PoisoningCaseStatus.Reported;
        ReportedById = reporterId;
        ReportedAt = reportedAt;
    }

    public void Verify(Guid verifierId, DateTime verifiedAt)
    {
        if (Status != PoisoningCaseStatus.Reported)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.InvalidStatusTransition);

        Status = PoisoningCaseStatus.Verified;
        VerifiedById = verifierId;
        VerifiedAt = verifiedAt;
    }

    public PoisoningCaseErrorReport AddErrorReport(
        Guid id,
        Guid fromOrgId,
        string errorDescription,
        string correctionRequest,
        Guid? creatorId)
    {
        if (Status != PoisoningCaseStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CanOnlyReportErrorOnVerified);

        Check.NotNullOrWhiteSpace(errorDescription, nameof(errorDescription));
        Check.NotNullOrWhiteSpace(correctionRequest, nameof(correctionRequest));

        var report = new PoisoningCaseErrorReport(
            id, Id, fromOrgId, errorDescription, correctionRequest, creatorId);
        _errorReports.Add(report);
        return report;
    }

    private void EnsureDraft()
    {
        if (Status != PoisoningCaseStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CannotModifyNonDraft);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
