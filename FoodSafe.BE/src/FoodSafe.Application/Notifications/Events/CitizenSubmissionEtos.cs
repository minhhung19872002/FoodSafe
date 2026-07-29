namespace FoodSafe.Notifications;

public class CitizenAlertSubmittedEto
{
    public Guid AlertId { get; init; }
    public string TrackingCode { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
}

public class CitizenNewsSubmittedEto
{
    public Guid NewsId { get; init; }
    public string Title { get; init; } = string.Empty;
    public Guid OrganizationId { get; init; }
}
