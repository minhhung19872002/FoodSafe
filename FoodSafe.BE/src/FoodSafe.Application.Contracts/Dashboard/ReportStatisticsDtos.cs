namespace FoodSafe.Application.Contracts.Dashboard;

public class ReportStatisticsFilterDto
{
    public int? Year { get; set; }
}

public sealed class LicensesByBusinessTypeRow
{
    public string BusinessTypeName { get; set; } = string.Empty;
    public int SelfDeclarations { get; set; }
    public int ProductRegistrations { get; set; }
    public int EligibilityCertificates { get; set; }
    public int CfsCertificates { get; set; }
    public int ExportCertificates { get; set; }
    public int AdRegistrations { get; set; }
    public int Total { get; set; }
}

public sealed class PoisoningByAreaRow
{
    public string AreaName { get; set; } = string.Empty;
    public int CaseCount { get; set; }
    public int HospitalizedCount { get; set; }
    public int DeceasedCount { get; set; }
}

public sealed class InspectionSummaryRow
{
    public string OrganizationName { get; set; } = string.Empty;
    public int PlanCount { get; set; }
    public int InspectionCount { get; set; }
    public int ViolationCount { get; set; }
    public int SanctionCount { get; set; }
}

public sealed class BusinessBreakdownRow
{
    public string GroupName { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ReportStatisticsDto
{
    public List<LicensesByBusinessTypeRow> LicensesByBusinessType { get; set; } = [];
    public List<PoisoningByAreaRow> PoisoningByArea { get; set; } = [];
    public List<InspectionSummaryRow> InspectionByOrganization { get; set; } = [];
    public List<BusinessBreakdownRow> BusinessesByType { get; set; } = [];
    public List<BusinessBreakdownRow> BusinessesByRegion { get; set; } = [];
    public List<BusinessBreakdownRow> BusinessesByProvince { get; set; } = [];
    public List<BusinessBreakdownRow> BusinessesByDistrict { get; set; } = [];
    public List<BusinessBreakdownRow> BusinessesByOrganization { get; set; } = [];
}
