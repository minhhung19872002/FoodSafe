using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

public interface IAtpAlertExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(AtpAlertFilterDto input);
}

public interface IAtpNewsExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(AtpNewsFilterDto input);
}

public interface IRiskAnalysisExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(FoodSafe.Application.Contracts.AlertsAndTesting.RiskAnalysisFilterDto input);
}

public interface IAdministrativeDocumentExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(FoodSafe.Application.Contracts.AlertsAndTesting.AdministrativeDocumentFilterDto input);
}
