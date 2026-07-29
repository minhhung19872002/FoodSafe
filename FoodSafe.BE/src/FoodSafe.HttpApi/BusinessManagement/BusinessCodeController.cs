using Asp.Versioning;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.BusinessManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Route("api/v1/app/business")]
public sealed class BusinessCodeController(
    IBusinessAppService service) : AbpControllerBase
{
    [HttpGet("next-code")]
    public Task<BusinessCodeSuggestionDto> GetNextCodeAsync(
        [FromQuery] Guid organizationId) =>
        service.GetNextCodeAsync(organizationId);
}
