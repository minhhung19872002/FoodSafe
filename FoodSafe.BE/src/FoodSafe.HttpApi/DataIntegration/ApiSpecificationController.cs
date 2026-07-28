using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Authenticated management of versioned partner API specifications (FR-50-05).
/// Every action returns an object result so ABP wraps validation and business
/// failures into the standard error envelope (bad uploads surface as HTTP 400).
/// </summary>
[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/api-specification")]
public sealed class ApiSpecificationController(
    IApiSpecificationAppService service) : AbpControllerBase
{
    [HttpGet]
    public Task<PagedResultDto<ApiSpecificationDto>> GetListAsync(
        [FromQuery] ApiSpecificationFilterDto input) =>
        service.GetListAsync(input);

    [HttpGet("{id:guid}")]
    public Task<ApiSpecificationDto> GetAsync(Guid id) => service.GetAsync(id);

    [HttpPost]
    public Task<ApiSpecificationDto> UploadAsync(
        [FromBody] UploadApiSpecificationDto input) => service.UploadAsync(input);

    [HttpPut("{id:guid}/metadata")]
    public Task<ApiSpecificationDto> UpdateMetadataAsync(
        Guid id, [FromBody] UpdateApiSpecMetadataDto input) =>
        service.UpdateMetadataAsync(id, input);

    [HttpPost("{id:guid}/publish")]
    public Task<ApiSpecificationDto> PublishAsync(Guid id) =>
        service.PublishAsync(id);

    [HttpPost("{id:guid}/unpublish")]
    public Task<ApiSpecificationDto> UnpublishAsync(Guid id) =>
        service.UnpublishAsync(id);

    [HttpDelete("{id:guid}")]
    public Task DeleteAsync(Guid id) => service.DeleteAsync(id);

    /// <summary>
    /// Returns the raw document body plus save headers as JSON; the admin UI
    /// builds the file client-side. Kept as an object result (not a file stream)
    /// so a missing/out-of-scope id maps to a wrapped 403, never a raw 500.
    /// </summary>
    [HttpGet("{id:guid}/download")]
    public Task<ApiSpecificationDownloadDto> DownloadAsync(Guid id) =>
        service.DownloadAsync(id);
}
