using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.IdentityAdministration;

public interface IUserExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(GetAdminUserListInput input);
}
