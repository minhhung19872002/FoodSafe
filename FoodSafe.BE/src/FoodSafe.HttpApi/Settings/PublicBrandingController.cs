using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Settings;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/branding")]
public sealed class PublicBrandingController(
    IPublicBrandingAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicBrandingDto> GetAsync() => service.GetAsync();

    [HttpGet("logo")]
    public async Task<IActionResult> GetLogoAsync()
    {
        var image = await service.GetLogoAsync();
        if (image is null)
        {
            return NotFound();
        }
        return File(image.Content, image.ContentType);
    }

    [HttpGet("login-background")]
    public async Task<IActionResult> GetLoginBackgroundAsync()
    {
        var image = await service.GetLoginBackgroundAsync();
        if (image is null)
        {
            return NotFound();
        }
        return File(image.Content, image.ContentType);
    }
}
