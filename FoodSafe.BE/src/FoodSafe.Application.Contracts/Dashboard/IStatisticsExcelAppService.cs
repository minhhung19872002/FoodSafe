using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.Dashboard;

public interface IStatisticsExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportLicensesByBusinessTypeAsync(ReportStatisticsFilterDto input);
    Task<ExcelDownloadDto> ExportPoisoningByAreaAsync(ReportStatisticsFilterDto input);
    Task<ExcelDownloadDto> ExportInspectionSummaryAsync(ReportStatisticsFilterDto input);
    Task<ExcelDownloadDto> ExportBusinessBreakdownAsync(ReportStatisticsFilterDto input);
    Task<ExcelDownloadDto> ExportReportComplianceAsync(DashboardFilterDto input);
}
