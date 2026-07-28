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
[Route("api/v1/app/data-sharing")]
public sealed class DataSharingController(
    IDataSharingAppService service) : AbpControllerBase
{
    [HttpPost("share")]
    public Task<ShareDataResultDto> ShareAsync(
        [FromBody] ShareDataInput input) =>
        service.ShareAsync(input);

    [HttpPost("retry/{logId:guid}")]
    public Task<ShareDataResultDto> RetryAsync(Guid logId) =>
        service.RetryAsync(logId);
}
