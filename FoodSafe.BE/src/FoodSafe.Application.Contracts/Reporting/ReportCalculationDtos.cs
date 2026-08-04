using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Reporting;

public class CalculateAtpWorkStatsInput
{
    [EnumDataType(typeof(ReportPeriodType))]
    public ReportPeriodType PeriodType { get; set; }

    [Range(2020, 2100)]
    public int PeriodYear { get; set; }

    [Range(1, 2)]
    public int? PeriodHalf { get; set; }
}

public class AtpWorkReportCalculatedStatsDto
{
    public int TotalBusinesses { get; set; }
    public int NewBusinesses { get; set; }
    public int InactiveBusinesses { get; set; }
    public int BusinessesWithCertificate { get; set; }

    public int DkcbIssued { get; set; }
    public int SelfDeclarationsReceived { get; set; }
    public int AdRegistrationsIssued { get; set; }
    public int EligibilityCertificatesIssued { get; set; }
    public int CfsIssued { get; set; }
    public int ExportCertificatesIssued { get; set; }

    public int TotalInspectionPlans { get; set; }
    public int BusinessesInspected { get; set; }
    public int ViolationsFound { get; set; }
    public int FinesIssued { get; set; }
    public decimal FineTotalAmount { get; set; }

    public int PoisoningCaseCount { get; set; }
    public int PoisoningIncidentCount { get; set; }
    public int TotalAffected { get; set; }
    public int TotalDeaths { get; set; }
}

public class NdtpAggregationInput
{
    [Range(2020, 2100)]
    public int PeriodYear { get; set; }

    [Range(1, 12)]
    public int PeriodMonth { get; set; }
}

public class NdtpAggregatedStatsDto
{
    public int ReportCount { get; set; }
    public int CaseCount { get; set; }
    public int CaseAffected { get; set; }
    public int CaseHospitalized { get; set; }
    public int CaseDeaths { get; set; }
    public int IncidentCount { get; set; }
    public int IncidentAffected { get; set; }
    public int IncidentHospitalized { get; set; }
    public int IncidentDeaths { get; set; }

    /// <summary>Số vụ ≥30 người mắc (TT 20/2019, TT 23/2025/TT-BYT).</summary>
    public int LargeScaleIncidentCount { get; set; }
}
