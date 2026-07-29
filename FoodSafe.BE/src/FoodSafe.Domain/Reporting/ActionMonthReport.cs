using Volo.Abp;

namespace FoodSafe.Reporting;

public sealed class ActionMonthReport : BaseReport
{
    public int PeriodYear { get; private set; }
    public string? ActionMonthTheme { get; private set; }
    public string? ActionMonthDates { get; private set; }

    public int MediaArticles { get; private set; }
    public int BroadcastPrograms { get; private set; }
    public int PropagandaSessions { get; private set; }
    public int Participants { get; private set; }
    public int PostersDistributed { get; private set; }
    public int LeafletsDistributed { get; private set; }

    public int BusinessesInspected { get; private set; }
    public int ViolationsFound { get; private set; }
    public int FinesIssued { get; private set; }
    public decimal FineAmount { get; private set; }

    public int NewSelfDeclarations { get; private set; }

    public string? Achievements { get; private set; }
    public string? Limitations { get; private set; }
    public string? LessonsLearned { get; private set; }
    public string? NextSteps { get; private set; }

    private readonly List<ActionMonthReportErrorNotification> _errorNotifications = [];
    public IReadOnlyList<ActionMonthReportErrorNotification> ErrorNotifications => _errorNotifications.AsReadOnly();

    private ActionMonthReport() { }

    public static ActionMonthReport Create(
        Guid id, Guid organizationId, int periodYear)
    {
        return new ActionMonthReport
        {
            Id = id,
            OrganizationId = organizationId,
            PeriodYear = periodYear,
            Status = ReportStatus.Draft,
            SubmissionVersion = 0
        };
    }

    public void UpdateHeader(string? theme, string? dates)
    {
        EnsureDraft();
        ActionMonthTheme = theme;
        ActionMonthDates = dates;
    }

    public void UpdateCommunicationStats(
        int mediaArticles, int broadcastPrograms, int propagandaSessions,
        int participants, int posters, int leaflets)
    {
        EnsureDraft();
        MediaArticles = Math.Max(0, mediaArticles);
        BroadcastPrograms = Math.Max(0, broadcastPrograms);
        PropagandaSessions = Math.Max(0, propagandaSessions);
        Participants = Math.Max(0, participants);
        PostersDistributed = Math.Max(0, posters);
        LeafletsDistributed = Math.Max(0, leaflets);
    }

    public void UpdateInspectionStats(
        int inspected, int violations, int fines, decimal fineAmount)
    {
        EnsureDraft();
        BusinessesInspected = Math.Max(0, inspected);
        ViolationsFound = Math.Max(0, violations);
        FinesIssued = Math.Max(0, fines);
        FineAmount = Math.Max(0, fineAmount);
    }

    public void UpdateOtherStats(int newSelfDeclarations)
    {
        EnsureDraft();
        NewSelfDeclarations = Math.Max(0, newSelfDeclarations);
    }

    public void UpdateNarrative(
        string? achievements, string? limitations,
        string? lessonsLearned, string? nextSteps)
    {
        EnsureDraft();
        Achievements = achievements;
        Limitations = limitations;
        LessonsLearned = lessonsLearned;
        NextSteps = nextSteps;
    }

    public void AddErrorNotification(
        Guid id, Guid fromOrganizationId, string errorFields,
        string correctionDetails, Guid creatorId)
    {
        if (Status != ReportStatus.Submitted && Status != ReportStatus.Verified)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CanOnlyNotifyErrorOnSubmittedOrVerified);

        _errorNotifications.Add(new ActionMonthReportErrorNotification(
            id, Id, fromOrganizationId, errorFields, correctionDetails, creatorId));
    }

    protected override object GetSubmissionPayload() => new
    {
        reportType = "AMR",
        organizationId = OrganizationId,
        periodYear = PeriodYear,
        submissionVersion = SubmissionVersion,
        actionMonthTheme = ActionMonthTheme,
        actionMonthDates = ActionMonthDates,
        mediaArticles = MediaArticles,
        broadcastPrograms = BroadcastPrograms,
        propagandaSessions = PropagandaSessions,
        participants = Participants,
        postersDistributed = PostersDistributed,
        leafletsDistributed = LeafletsDistributed,
        businessesInspected = BusinessesInspected,
        violationsFound = ViolationsFound,
        finesIssued = FinesIssued,
        fineAmount = FineAmount,
        newSelfDeclarations = NewSelfDeclarations,
        achievements = Achievements,
        limitations = Limitations,
        lessonsLearned = LessonsLearned,
        nextSteps = NextSteps,
    };
}
