using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace FoodSafe.Security;

[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[ApiController]
[Route(ApiContract.CaptchaRootPath)]
public sealed class CaptchaController(IOptions<CaptchaOptions> options) : ControllerBase
{
    [HttpGet("config")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public object GetConfig()
    {
        return new
        {
            provider = "turnstile",
            siteKey = options.Value.SiteKey,
            action = options.Value.Action
        };
    }
}
