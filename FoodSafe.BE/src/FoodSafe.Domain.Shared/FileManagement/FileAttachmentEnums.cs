namespace FoodSafe.FileManagement;

public enum VirusScanStatus : short
{
    Pending = 1,
    Clean = 2,
    Infected = 3,
    ScanFailed = 4
}

public enum RetentionStatus : short
{
    Active = 1,
    Archived = 2,
    PendingDeletion = 3
}
