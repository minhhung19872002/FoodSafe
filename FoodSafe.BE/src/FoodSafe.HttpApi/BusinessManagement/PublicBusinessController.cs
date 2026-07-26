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
[Route("api/v1/public/businesses")]
public sealed class PublicBusinessController(
    IPublicBusinessAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PublicBusinessDto> FindByNameOrCodeAsync(
        [FromQuery] string keyword) =>
        service.FindByNameOrCodeAsync(keyword);
}
