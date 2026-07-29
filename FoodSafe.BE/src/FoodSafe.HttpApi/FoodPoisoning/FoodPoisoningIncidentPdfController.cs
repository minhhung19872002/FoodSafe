using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FoodPoisoning;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/food-poisoning-incident")]
public sealed class FoodPoisoningIncidentPdfController(
    IFoodPoisoningIncidentPdfAppService service) : AbpControllerBase
{
    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> GetPdfAsync(Guid id)
    {
        var bytes = await service.GenerateIncidentClosurePdfAsync(id);
        return File(bytes, "application/pdf", $"vu-ngo-doc-{id:N}.pdf");
    }
}
