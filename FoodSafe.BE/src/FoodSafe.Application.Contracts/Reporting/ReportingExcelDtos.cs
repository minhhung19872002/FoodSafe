using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Reporting;

public interface INdtpReportExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(NdtpReportFilterDto input);
}

public interface IAtpWorkReportExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(AtpWorkReportFilterDto input);
}

public interface IActionMonthReportExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(ActionMonthReportFilterDto input);
}
