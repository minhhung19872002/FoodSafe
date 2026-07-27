using Asp.Versioning;
using FoodSafe.Application.Contracts.Licensing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Licensing;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/advertisement-registrations")]
public sealed class PublicAdRegistrationController(
    IPublicAdRegistrationAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicAdRegistrationDto> FindByNumberAsync(
        [FromQuery] string number) =>
        service.FindByNumberAsync(number);
}
