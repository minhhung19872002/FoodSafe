namespace FoodSafe.Notifications;

public enum NotificationType : short
{
    // Report workflow (1x)
    ReportSubmitted = 11,
    ReportVerified = 12,
    ReportReturned = 13,
    ReportErrorNotificationSent = 14,
    ReportErrorNotificationResponded = 15,

    // Food poisoning (2x)
    FoodPoisoningCaseReported = 21,
    FoodPoisoningCaseVerified = 22,
    FoodPoisoningIncidentReported = 23,
    FoodPoisoningIncidentVerified = 24,
    FoodPoisoningIncidentConcluded = 25,
    FoodPoisoningErrorReportCreated = 26,

    // License expiry (3x)
    LicenseExpiringSoon = 31,

    // System (5x)
    PasswordExpiringSoon = 51,
}
