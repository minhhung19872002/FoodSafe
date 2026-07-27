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
[Route("api/v1/app/statistics/excel")]
public sealed class StatisticsExcelController(
    IStatisticsExcelAppService service) : AbpControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ExportAsync([FromQuery] StatisticsFilterDto input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
