using Volo.Abp;

namespace FoodSafe.Reporting;

public sealed class NdtpReport : BaseReport
{
    public int PeriodYear { get; private set; }
    public int PeriodMonth { get; private set; }

    public int CaseCount { get; private set; }
    public int CaseAffected { get; private set; }
    public int CaseHospitalized { get; private set; }
    public int CaseDeaths { get; private set; }

    public int IncidentCount { get; private set; }
    public int IncidentAffected { get; private set; }
    public int IncidentHospitalized { get; private set; }
    public int IncidentDeaths { get; private set; }

    public string? PreventionActivities { get; private set; }
    public string? RiskFactors { get; private set; }
    public string? Recommendations { get; private set; }

    private readonly List<NdtpReportErrorNotification> _errorNotifications = [];
    public IReadOnlyList<NdtpReportErrorNotification> ErrorNotifications => _errorNotifications.AsReadOnly();

    private NdtpReport() { }

    public static NdtpReport Create(
        Guid id, Guid organizationId, int periodYear, int periodMonth)
    {
        if (periodMonth < 1 || periodMonth > 12)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.InvalidPeriod);

        return new NdtpReport
        {
            Id = id,
            OrganizationId = organizationId,
            PeriodYear = periodYear,
            PeriodMonth = periodMonth,
            Status = ReportStatus.Draft,
            SubmissionVersion = 0
        };
    }

    public void UpdateStats(
        int caseCount, int caseAffected, int caseHospitalized, int caseDeaths,
        int incidentCount, int incidentAffected, int incidentHospitalized, int incidentDeaths)
    {
        EnsureDraft();
        CaseCount = Math.Max(0, caseCount);
        CaseAffected = Math.Max(0, caseAffected);
        CaseHospitalized = Math.Max(0, caseHospitalized);
        CaseDeaths = Math.Max(0, caseDeaths);
        IncidentCount = Math.Max(0, incidentCount);
        IncidentAffected = Math.Max(0, incidentAffected);
        IncidentHospitalized = Math.Max(0, incidentHospitalized);
        IncidentDeaths = Math.Max(0, incidentDeaths);
    }

    public void UpdateNarrative(
        string? preventionActivities, string? riskFactors, string? recommendations)
    {
        EnsureDraft();
        PreventionActivities = preventionActivities;
        RiskFactors = riskFactors;
        Recommendations = recommendations;
    }

    public void AddErrorNotification(
        Guid id, Guid fromOrganizationId, string errorFields,
        string correctionDetails, Guid creatorId)
    {
        if (Status != ReportStatus.Submitted && Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CanOnlyNotifyErrorOnSubmittedOrVerified);

        _errorNotifications.Add(new NdtpReportErrorNotification(
            id, Id, fromOrganizationId, errorFields, correctionDetails, creatorId));
    }

    protected override object GetSubmissionPayload() => new
    {
        reportType = "NDTP",
        organizationId = OrganizationId,
        periodYear = PeriodYear,
        periodMonth = PeriodMonth,
        submissionVersion = SubmissionVersion,
        caseCount = CaseCount,
        caseAffected = CaseAffected,
        caseHospitalized = CaseHospitalized,
        caseDeaths = CaseDeaths,
        incidentCount = IncidentCount,
        incidentAffected = IncidentAffected,
        incidentHospitalized = IncidentHospitalized,
        incidentDeaths = IncidentDeaths,
        preventionActivities = PreventionActivities,
        riskFactors = RiskFactors,
        recommendations = Recommendations,
    };
}
