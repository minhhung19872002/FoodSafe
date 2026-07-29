using Volo.Abp;

namespace FoodSafe.Reporting;

public sealed class AtpWorkReport : BaseReport
{
    protected override ReportStatus SubmittableFromStatus => ReportStatus.InternallyApproved;

    public ReportPeriodType PeriodType { get; private set; }
    public int PeriodYear { get; private set; }
    public int? PeriodHalf { get; private set; }

    public int TotalBusinesses { get; private set; }
    public int NewBusinesses { get; private set; }
    public int InactiveBusinesses { get; private set; }
    public int BusinessesWithCertificate { get; private set; }

    public int DkcbIssued { get; private set; }
    public int SelfDeclarationsReceived { get; private set; }
    public int AdRegistrationsIssued { get; private set; }
    public int EligibilityCertificatesIssued { get; private set; }
    public int CfsIssued { get; private set; }
    public int ExportCertificatesIssued { get; private set; }

    public int TotalInspectionPlans { get; private set; }
    public int BusinessesInspected { get; private set; }
    public int ViolationsFound { get; private set; }
    public int FinesIssued { get; private set; }
    public decimal FineTotalAmount { get; private set; }

    public int PoisoningCaseCount { get; private set; }
    public int PoisoningIncidentCount { get; private set; }
    public int TotalAffected { get; private set; }
    public int TotalDeaths { get; private set; }

    public int TrainingSessions { get; private set; }
    public int TrainingParticipants { get; private set; }
    public int MediaAppearances { get; private set; }
    public int DocumentsIssued { get; private set; }

    public string? Overview { get; private set; }
    public string? Achievements { get; private set; }
    public string? Limitations { get; private set; }
    public string? Solutions { get; private set; }
    public string? NextPeriodPlan { get; private set; }

    private readonly List<AtpWorkReportErrorNotification> _errorNotifications = [];
    public IReadOnlyList<AtpWorkReportErrorNotification> ErrorNotifications => _errorNotifications.AsReadOnly();

    private AtpWorkReport() { }

    public static AtpWorkReport Create(
        Guid id, Guid organizationId,
        ReportPeriodType periodType, int periodYear, int? periodHalf)
    {
        if (periodType == ReportPeriodType.HalfYear && periodHalf is not (1 or 2))
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.InvalidPeriod);

        return new AtpWorkReport
        {
            Id = id,
            OrganizationId = organizationId,
            PeriodType = periodType,
            PeriodYear = periodYear,
            PeriodHalf = periodType == ReportPeriodType.HalfYear ? periodHalf : null,
            Status = ReportStatus.Draft,
            SubmissionVersion = 0
        };
    }

    public void UpdateBusinessStats(
        int total, int newCount, int inactive, int withCert)
    {
        EnsureDraft();
        TotalBusinesses = Math.Max(0, total);
        NewBusinesses = Math.Max(0, newCount);
        InactiveBusinesses = Math.Max(0, inactive);
        BusinessesWithCertificate = Math.Max(0, withCert);
    }

    public void UpdateLicensingStats(
        int dkcb, int selfDeclarations, int adRegs, int eligibility, int cfs, int exports)
    {
        EnsureDraft();
        DkcbIssued = Math.Max(0, dkcb);
        SelfDeclarationsReceived = Math.Max(0, selfDeclarations);
        AdRegistrationsIssued = Math.Max(0, adRegs);
        EligibilityCertificatesIssued = Math.Max(0, eligibility);
        CfsIssued = Math.Max(0, cfs);
        ExportCertificatesIssued = Math.Max(0, exports);
    }

    public void UpdateInspectionStats(
        int plans, int inspected, int violations, int fines, decimal fineAmount)
    {
        EnsureDraft();
        TotalInspectionPlans = Math.Max(0, plans);
        BusinessesInspected = Math.Max(0, inspected);
        ViolationsFound = Math.Max(0, violations);
        FinesIssued = Math.Max(0, fines);
        FineTotalAmount = Math.Max(0, fineAmount);
    }

    public void UpdatePoisoningStats(
        int caseCount, int incidentCount, int affected, int deaths)
    {
        EnsureDraft();
        PoisoningCaseCount = Math.Max(0, caseCount);
        PoisoningIncidentCount = Math.Max(0, incidentCount);
        TotalAffected = Math.Max(0, affected);
        TotalDeaths = Math.Max(0, deaths);
    }

    public void UpdateCommunicationStats(
        int sessions, int participants, int media, int documents)
    {
        EnsureDraft();
        TrainingSessions = Math.Max(0, sessions);
        TrainingParticipants = Math.Max(0, participants);
        MediaAppearances = Math.Max(0, media);
        DocumentsIssued = Math.Max(0, documents);
    }

    public void UpdateNarrative(
        string? overview, string? achievements, string? limitations,
        string? solutions, string? nextPeriodPlan)
    {
        EnsureDraft();
        Overview = overview;
        Achievements = achievements;
        Limitations = limitations;
        Solutions = solutions;
        NextPeriodPlan = nextPeriodPlan;
    }

    public void AddErrorNotification(
        Guid id, Guid fromOrganizationId, string errorFields,
        string correctionDetails, Guid creatorId)
    {
        if (Status != ReportStatus.Submitted && Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CanOnlyNotifyErrorOnSubmittedOrVerified);

        _errorNotifications.Add(new AtpWorkReportErrorNotification(
            id, Id, fromOrganizationId, errorFields, correctionDetails, creatorId));
    }

    protected override object GetSubmissionPayload() => new
    {
        reportType = "ATP",
        organizationId = OrganizationId,
        periodType = (int)PeriodType,
        periodYear = PeriodYear,
        periodHalf = PeriodHalf,
        submissionVersion = SubmissionVersion,
        totalBusinesses = TotalBusinesses,
        newBusinesses = NewBusinesses,
        inactiveBusinesses = InactiveBusinesses,
        businessesWithCertificate = BusinessesWithCertificate,
        dkcbIssued = DkcbIssued,
        selfDeclarationsReceived = SelfDeclarationsReceived,
        adRegistrationsIssued = AdRegistrationsIssued,
        eligibilityCertificatesIssued = EligibilityCertificatesIssued,
        cfsIssued = CfsIssued,
        exportCertificatesIssued = ExportCertificatesIssued,
        totalInspectionPlans = TotalInspectionPlans,
        businessesInspected = BusinessesInspected,
        violationsFound = ViolationsFound,
        finesIssued = FinesIssued,
        fineTotalAmount = FineTotalAmount,
        poisoningCaseCount = PoisoningCaseCount,
        poisoningIncidentCount = PoisoningIncidentCount,
        totalAffected = TotalAffected,
        totalDeaths = TotalDeaths,
        trainingSessions = TrainingSessions,
        trainingParticipants = TrainingParticipants,
        mediaAppearances = MediaAppearances,
        documentsIssued = DocumentsIssued,
        overview = Overview,
        achievements = Achievements,
        limitations = Limitations,
        solutions = Solutions,
        nextPeriodPlan = NextPeriodPlan,
    };
}
