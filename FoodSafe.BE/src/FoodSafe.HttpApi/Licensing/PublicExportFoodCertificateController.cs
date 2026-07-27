using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Licensing;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/export-food-certificates")]
public sealed class PublicExportFoodCertificateController(
    IPublicExportFoodCertificateAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicExportFoodCertificateDto> FindByNumberAsync(
        [FromQuery] string number) =>
        service.FindByNumberAsync(number);
}
