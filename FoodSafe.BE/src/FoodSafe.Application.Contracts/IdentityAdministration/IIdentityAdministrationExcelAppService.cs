using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.IdentityAdministration;

public interface IIdentityAdministrationExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportUsersAsync(GetAdminUserListInput input);
}
