namespace FoodSafe.FoodPoisoning;

public enum PoisoningCaseStatus : short
{
    Draft = 1,
    Reported = 2,
    Verified = 3
}

public enum PoisoningIncidentStatus : short
{
    Draft = 1,
    Reported = 2,
    Verified = 3,
    Concluded = 4
}

public enum CauseAssessment : short
{
    Confirmed = 1,
    Probable = 2,
    Suspected = 3,
    Unknown = 4
}

public enum TreatmentResult : short
{
    Recovered = 1,
    Hospitalized = 2,
    Deceased = 3
}

public enum VictimGender : short
{
    Male = 1,
    Female = 2,
    Other = 3
}

public enum ErrorReportStatus : short
{
    Pending = 1,
    Acknowledged = 2,
    Corrected = 3
}
