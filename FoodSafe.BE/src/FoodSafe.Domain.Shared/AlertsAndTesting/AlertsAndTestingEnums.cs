namespace FoodSafe.AlertsAndTesting;

public enum AlertCategory : short
{
    FoodSafety = 1,
    Contamination = 2,
    Chemical = 3,
    Biological = 4,
    Physical = 5,
    Other = 6
}

public enum AlertSeverity : short
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum AlertSource : short
{
    Internal = 1,
    PublicReport = 2,
    ExternalSystem = 3
}

public enum AlertStatus : short
{
    Draft = 1,
    Published = 2,
    Recalled = 3
}

public enum NewsStatus : short
{
    Draft = 1,
    Published = 2,
    Recalled = 3
}

public enum RiskLevel : short
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum RiskAnalysisStatus : short
{
    Draft = 1,
    Published = 2
}

public enum TestingResultOutcome : short
{
    Pass = 1,
    Fail = 2,
    Conditional = 3
}

public enum DocumentStatus : short
{
    Active = 1,
    Expired = 2,
    Revoked = 3
}
