using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.Dashboard;

public interface IStatisticsExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(StatisticsFilterDto input);
}
