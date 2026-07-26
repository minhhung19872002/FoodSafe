using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

public interface IFoodPoisoningCaseExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(FoodPoisoningCaseFilterDto input);
}

public interface IFoodPoisoningIncidentExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(FoodPoisoningIncidentFilterDto input);
}
