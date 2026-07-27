using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public interface IAdvertisementRegistrationExcelAppService :
    IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(
        AdvertisementRegistrationListInput input);
}
