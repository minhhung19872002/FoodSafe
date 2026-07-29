namespace FoodSafe.Notifications;

public class ReportSubmittedEto
{
    public Guid ReportId { get; init; }
    public string ReportEntityType { get; init; } = string.Empty;
    public string ReportDisplayName { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
    public Guid SubmittedById { get; init; }
}

public class ReportVerifiedEto
{
    public Guid ReportId { get; init; }
    public string ReportEntityType { get; init; } = string.Empty;
    public string ReportDisplayName { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
    public Guid? SubmittedById { get; init; }
}

public class ReportReturnedEto
{
    public Guid ReportId { get; init; }
    public string ReportEntityType { get; init; } = string.Empty;
    public string ReportDisplayName { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
    public Guid? SubmittedById { get; init; }
    public string ReturnReason { get; init; } = string.Empty;
}

public class ReportErrorNotificationSentEto
{
    public Guid ReportId { get; init; }
    public string ReportEntityType { get; init; } = string.Empty;
    public string ReportDisplayName { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
}

public class ReportErrorNotificationRespondedEto
{
    public Guid ReportId { get; init; }
    public string ReportEntityType { get; init; } = string.Empty;
    public string ReportDisplayName { get; init; } = string.Empty;
    public Guid SentByOrganizationId { get; init; }
}
