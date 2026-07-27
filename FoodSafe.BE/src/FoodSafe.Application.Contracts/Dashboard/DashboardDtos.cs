using System;
using System.Collections.Generic;

namespace FoodSafe.Application.Contracts.Dashboard;

public sealed class DashboardStatsFilter
{
    public int? Year { get; set; }
    public Guid? OrganizationId { get; set; }
}

public class DashboardStatsDto
{
    public int TotalBusinesses { get; set; }
    public int ActiveBusinesses { get; set; }
    public int TotalSelfDeclarations { get; set; }
    public int TotalProductRegistrations { get; set; }
    public int TotalEligibilityCertificates { get; set; }
    public int TotalCfsCertificates { get; set; }
    public int TotalExportCertificates { get; set; }
    public int TotalAdRegistrations { get; set; }
    public int ExpiringWithin30Days { get; set; }
    public int TotalInspectionPlans { get; set; }
    public int TotalInspectionResults { get; set; }
    public int InspectionViolationCount { get; set; }
    public int TotalFoodPoisoningCases { get; set; }
    public int TotalAlerts { get; set; }
    public int TotalRiskAnalyses { get; set; }
    public int TotalTestingResults { get; set; }
    public List<LicenseBreakdownItem> LicenseBreakdown { get; set; } = [];
    public List<RecentActivityItem> RecentActivities { get; set; } = [];
}

public class LicenseBreakdownItem
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ExpiringLicenseDto
{
    public Guid Id { get; set; }
    public string LicenseType { get; set; } = string.Empty;
    public string LicenseNumber { get; set; } = string.Empty;
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public int DaysRemaining { get; set; }
    /// <summary>Warning tier: 30, 60 or 90 (days threshold the license falls into).</summary>
    public int WarningTier { get; set; }
}

public class RecentActivityItem
{
    public string EntityType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreationTime { get; set; }
    public string? CreatorName { get; set; }
}

public class DashboardFilterDto
{
    public int? Year { get; set; }
    public Guid? OrganizationId { get; set; }
}

public sealed class ReportComplianceRowDto
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = string.Empty;
    public int NdtpSubmittedMonths { get; set; }
    public int NdtpExpectedMonths { get; set; }
    public int AtpWorkSubmitted { get; set; }
    public int AtpWorkExpected { get; set; }
    public int ActionMonthSubmitted { get; set; }
    public int ActionMonthExpected { get; set; }
}
