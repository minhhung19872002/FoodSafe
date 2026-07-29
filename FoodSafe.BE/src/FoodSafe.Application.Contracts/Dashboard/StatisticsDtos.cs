namespace FoodSafe.Application.Contracts.Dashboard;

public class StatisticsDto
{
    public List<CategoryCount> BusinessByStatus { get; set; } = [];
    public List<CategoryCount> BusinessByType { get; set; } = [];
    public List<CategoryCount> LicenseByCategory { get; set; } = [];
    public List<CategoryCount> LicenseByStatus { get; set; } = [];
    public List<MonthlyCount> InspectionsByMonth { get; set; } = [];
    public List<MonthlyCount> ViolationsByMonth { get; set; } = [];
    public List<MonthlyCount> PoisoningCasesByMonth { get; set; } = [];
    public List<CategoryCount> InspectionOutcome { get; set; } = [];
}

public class CategoryCount
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class MonthlyCount
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class StatisticsFilterDto
{
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int? Quarter { get; set; }
    public Guid? OrganizationId { get; set; }
}

public sealed class PoisoningTrendPoint
{
    public string Month { get; set; } = string.Empty;
    public int Cases { get; set; }
    public int Victims { get; set; }
}
