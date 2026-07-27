using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

public interface ITestingServiceExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(MasterCatalogListInput input);
}
