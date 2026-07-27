using Asp.Versioning;
using FoodSafe.Application.Contracts.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Controllers.Dashboard;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/audit-log/excel")]
public sealed class AuditLogExcelController(
    IAuditLogExcelAppService service) : AbpControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ExportAsync([FromQuery] GetAuditLogListInput input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
