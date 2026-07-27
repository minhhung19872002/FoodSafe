using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Inspection;

public class InspectionPlanExcelRow
{
    public string PlanCode { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string PlanTypeLabel { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
}

public class InspectionResultExcelRow
{
    public string? BusinessName { get; set; }
    public string InspectionDate { get; set; } = string.Empty;
    public string InspectionTypeLabel { get; set; } = string.Empty;
    public string OverallResultLabel { get; set; } = string.Empty;
    public string? TeamLeader { get; set; }
    public bool HasViolation { get; set; }
    public int ViolationCount { get; set; }
    public string? FineAmount { get; set; }
    public bool FollowUpRequired { get; set; }
    public string? FollowUpDate { get; set; }
    public string? Notes { get; set; }
}

public interface IInspectionPlanExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(InspectionPlanFilterDto input);
}

public interface IInspectionResultExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(InspectionResultFilterDto input);
}
