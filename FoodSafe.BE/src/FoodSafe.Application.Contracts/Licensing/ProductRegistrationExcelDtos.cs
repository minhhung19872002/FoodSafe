using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public interface IProductRegistrationExcelAppService :
    IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(
        ProductRegistrationListInput input);
}
