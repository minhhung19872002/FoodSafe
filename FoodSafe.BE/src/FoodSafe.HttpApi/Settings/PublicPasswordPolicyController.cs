using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Settings;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/password-policy")]
public sealed class PublicPasswordPolicyController(
    IPublicPasswordPolicyAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicPasswordPolicyDto> GetAsync() => service.GetAsync();
}
