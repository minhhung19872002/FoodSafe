using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Licensing;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/cfs-certificates")]
public sealed class PublicCfsCertificateController(
    IPublicCfsCertificateAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicCfsCertificateDto> FindByNumberAsync(
        [FromQuery] string number) =>
        service.FindByNumberAsync(number);
}
