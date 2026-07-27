using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Organizations;

public interface IOrganizationExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(GetOrganizationListInput input);
}
