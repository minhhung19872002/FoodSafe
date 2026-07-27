using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

public interface IApiEndpointExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(ApiEndpointFilterDto input);
}

public interface IApiCallLogExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(ApiCallLogFilterDto input);
}
