namespace FoodSafe.Inspection;

public enum InspectionPlanType : short
{
    Annual = 1,
    Periodic = 2,
    Irregular = 3,
    FollowUp = 4
}

public enum InspectionPlanStatus : short
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    InProgress = 4,
    Completed = 5,
    Cancelled = 6
}

public enum InspectionPlanItemStatus : short
{
    Pending = 1,
    InProgress = 2,
    Completed = 3,
    Skipped = 4
}

public enum InspectionType : short
{
    Scheduled = 1,
    Unscheduled = 2,
    FollowUp = 3,
    Emergency = 4
}

public enum InspectionOverallResult : short
{
    Pass = 1,
    Fail = 2,
    ConditionalPass = 3
}

public enum FollowUpResult : short
{
    Passed = 1,
    StillFailed = 2
}
