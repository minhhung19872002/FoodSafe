using Asp.Versioning;
using FoodSafe.Application.Contracts.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.BusinessManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/self-declarations")]
public sealed class PublicSelfDeclarationController(
    IPublicSelfDeclarationAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicSelfDeclarationDto> FindByNumberAsync(
        [FromQuery] string number) =>
        service.FindByNumberAsync(number);
}
