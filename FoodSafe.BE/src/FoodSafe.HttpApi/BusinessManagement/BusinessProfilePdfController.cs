using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.BusinessManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/business")]
public sealed class BusinessProfilePdfController(
    IBusinessProfilePdfAppService service) : AbpControllerBase
{
    [HttpGet("{id:guid}/profile-pdf")]
    public async Task<IActionResult> GetProfilePdfAsync(Guid id)
    {
        var file = await service.GenerateProfilePdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
