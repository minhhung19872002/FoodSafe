using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Security;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/data-scope-assignments")]
public sealed class DataScopeAssignmentController(
    IDataScopeAssignmentAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PagedResultDto<DataScopeAssignmentDto>> GetAssignmentsAsync(
        [FromQuery] DataScopeAssignmentListInput input) =>
        service.GetAssignmentsAsync(input);

    [HttpPost]
    public Task<DataScopeAssignmentDto> CreateAssignmentAsync(
        [FromBody] CreateDataScopeAssignmentInput input) =>
        service.CreateAssignmentAsync(input);

    [HttpDelete("{id:guid}")]
    public Task DeleteAssignmentAsync(Guid id) =>
        service.DeleteAssignmentAsync(id);
}
