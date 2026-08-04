using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/data-integration")]
public sealed class ExternalSystemOptionsController(
    IExternalSystemOptionsAppService service) : AbpControllerBase
{
    [HttpGet("external-systems")]
    public Task<List<string>> GetExternalSystemsAsync() =>
        service.GetListAsync();
}
