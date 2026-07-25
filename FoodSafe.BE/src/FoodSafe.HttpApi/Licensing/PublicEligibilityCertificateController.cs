using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Licensing;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/eligibility-certificates")]
public sealed class PublicEligibilityCertificateController(
    IPublicEligibilityCertificateAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicEligibilityCertificateDto> FindByNumberAsync(
        [FromQuery] string number) =>
        service.FindByNumberAsync(number);
}
