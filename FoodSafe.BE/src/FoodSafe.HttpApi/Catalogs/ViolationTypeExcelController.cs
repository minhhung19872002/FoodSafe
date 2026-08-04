using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Catalogs;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/master-catalog/violation-types/excel")]
public sealed class ViolationTypeExcelController(
    IViolationTypeExcelAppService service) : AbpControllerBase
{
    [HttpGet("export")]
    public async Task<IActionResult> ExportAsync(
        [FromQuery] MasterCatalogListInput input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
