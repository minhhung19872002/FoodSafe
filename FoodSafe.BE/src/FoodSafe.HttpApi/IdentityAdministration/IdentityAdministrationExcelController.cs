using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.IdentityAdministration;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/administration/excel")]
public sealed class IdentityAdministrationExcelController(
    IIdentityAdministrationExcelAppService service) : AbpControllerBase
{
    [HttpGet("users")]
    public async Task<IActionResult> ExportUsersAsync(
        [FromQuery] GetAdminUserListInput input)
    {
        var file = await service.ExportUsersAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
