using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FileManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/inspection-plan/{planId:guid}/attachments")]
public sealed class InspectionPlanAttachmentController(
    IInspectionPlanAttachmentAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 20L * 1024 * 1024 + 64 * 1024;

    [HttpGet]
    public Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid planId) =>
        service.GetListAsync(planId);

    [HttpPost]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid planId,
        IFormFile file,
        [FromForm] string? description)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn file đính kèm.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.UploadAsync(
            planId, stream.ToArray(), file.FileName, file.ContentType,
            description);
    }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAsync(
        Guid planId, Guid attachmentId)
    {
        var file = await service.DownloadAsync(planId, attachmentId);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpDelete("{attachmentId:guid}")]
    public Task DeleteAsync(Guid planId, Guid attachmentId) =>
        service.DeleteAsync(planId, attachmentId);
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/inspection-result/{resultId:guid}/attachments")]
public sealed class InspectionResultAttachmentController(
    IInspectionResultAttachmentAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 20L * 1024 * 1024 + 64 * 1024;

    [HttpGet]
    public Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid resultId) =>
        service.GetListAsync(resultId);

    [HttpPost]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid resultId,
        IFormFile file,
        [FromForm] string? description)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn file đính kèm.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.UploadAsync(
            resultId, stream.ToArray(), file.FileName, file.ContentType,
            description);
    }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAsync(
        Guid resultId, Guid attachmentId)
    {
        var file = await service.DownloadAsync(resultId, attachmentId);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpDelete("{attachmentId:guid}")]
    public Task DeleteAsync(Guid resultId, Guid attachmentId) =>
        service.DeleteAsync(resultId, attachmentId);
}
