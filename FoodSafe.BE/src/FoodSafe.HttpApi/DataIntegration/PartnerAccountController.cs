using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/partner-account")]
public sealed class PartnerAccountController(
    IPartnerAccountAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PagedResultDto<PartnerAccountDto>> GetListAsync(
        [FromQuery] PartnerAccountFilterDto input) =>
        service.GetListAsync(input);

    [HttpGet("{id:guid}")]
    public Task<PartnerAccountDto> GetAsync(Guid id) => service.GetAsync(id);

    [HttpPost]
    public Task<PartnerAccountDto> CreateAsync(
        [FromBody] CreatePartnerAccountDto input) => service.CreateAsync(input);

    [HttpPut("{id:guid}")]
    public Task<PartnerAccountDto> UpdateAsync(
        Guid id, [FromBody] UpdatePartnerAccountDto input) =>
        service.UpdateAsync(id, input);

    [HttpPost("{id:guid}/toggle-status")]
    public Task ToggleStatusAsync(Guid id) => service.ToggleStatusAsync(id);

    [HttpDelete("{id:guid}")]
    public Task DeleteAsync(Guid id) => service.DeleteAsync(id);

    [HttpGet("{id:guid}/keys")]
    public Task<List<PartnerApiKeyDto>> GetKeysAsync(Guid id) =>
        service.GetKeysAsync(id);

    [HttpPost("{id:guid}/keys")]
    public Task<IssuedPartnerApiKeyDto> IssueKeyAsync(
        Guid id, [FromBody] IssuePartnerApiKeyDto input) =>
        service.IssueKeyAsync(id, input);

    [HttpDelete("{id:guid}/keys/{keyId:guid}")]
    public Task RevokeKeyAsync(Guid id, Guid keyId) =>
        service.RevokeKeyAsync(id, keyId);

    [HttpGet("submissions")]
    public Task<PagedResultDto<InboundSubmissionDto>> GetSubmissionsAsync(
        [FromQuery] InboundSubmissionFilterDto input) =>
        service.GetSubmissionsAsync(input);

    [HttpGet("submissions/{submissionId:guid}")]
    public Task<InboundSubmissionDetailDto> GetSubmissionAsync(
        Guid submissionId) => service.GetSubmissionAsync(submissionId);
}
