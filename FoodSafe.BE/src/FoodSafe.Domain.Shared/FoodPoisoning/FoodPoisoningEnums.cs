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

/// <summary>
/// Nhóm căn nguyên vụ ngộ độc theo phân loại thống kê ngành y tế
/// (điều tra NĐTP theo QĐ 39/2006/QĐ-BYT).
/// </summary>
public enum PoisoningCauseCategory : short
{
    /// <summary>Vi sinh vật (vi khuẩn, virus, ký sinh trùng).</summary>
    Microbial = 1,
    /// <summary>Hóa chất (hóa chất bảo vệ thực vật, phụ gia ngoài danh mục...).</summary>
    Chemical = 2,
    /// <summary>Độc tố tự nhiên (nấm độc, cá nóc, cóc, độc tố hải sản...).</summary>
    NaturalToxin = 3,
    /// <summary>Không xác định được căn nguyên.</summary>
    Undetermined = 4
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
