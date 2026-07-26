using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FoodPoisoning;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/food-poisoning-case/excel")]
public sealed class FoodPoisoningCaseExcelController(
    IFoodPoisoningCaseExcelAppService service) : AbpControllerBase
{
    [HttpGet("export")]
    public async Task<IActionResult> ExportAsync(
        [FromQuery] FoodPoisoningCaseFilterDto input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
