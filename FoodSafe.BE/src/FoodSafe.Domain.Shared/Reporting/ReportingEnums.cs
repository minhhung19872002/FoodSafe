namespace FoodSafe.Reporting;

public enum ReportStatus : short
{
    Draft = 1,
    Submitted = 2,
    Verified = 3,
    Returned = 4,
    Completed = 5
}

public enum ReportPeriodType : short
{
    HalfYear = 1,
    FullYear = 2
}

public enum ReportErrorNotificationStatus : short
{
    Pending = 1,
    Acknowledged = 2,
    Corrected = 3
}
