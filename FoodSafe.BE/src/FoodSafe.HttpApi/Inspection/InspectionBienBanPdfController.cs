using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Inspection;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/inspection-result")]
public sealed class InspectionBienBanPdfController(
    IInspectionBienBanPdfAppService service) : AbpControllerBase
{
    [HttpGet("{id:guid}/bien-ban-pdf")]
    public async Task<IActionResult> GetBienBanPdfAsync(Guid id)
    {
        var file = await service.GenerateBienBanPdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
