using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FoodPoisoning;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/food-poisoning-case")]
public sealed class FoodPoisoningCasePdfController(
    IFoodPoisoningCasePdfAppService service) : AbpControllerBase
{
    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> GetPdfAsync(Guid id)
    {
        var bytes = await service.GenerateCasePdfAsync(id);
        return File(bytes, "application/pdf", $"ca-ngo-doc-{id:N}.pdf");
    }
}
