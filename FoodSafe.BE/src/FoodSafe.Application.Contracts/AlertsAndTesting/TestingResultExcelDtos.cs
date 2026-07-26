using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

public interface ITestingResultExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(TestingResultFilterDto input);
}
