using Asp.Versioning;
using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.AlertsAndTesting;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/testing-result/excel")]
public sealed class TestingResultExcelController(
    ITestingResultExcelAppService service) : AbpControllerBase
{
    [HttpGet("export")]
    public async Task<IActionResult> ExportAsync(
        [FromQuery] TestingResultFilterDto input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
