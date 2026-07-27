using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FileManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route(
    "api/v1/app/self-declaration/{declarationId:guid}/attachments")]
public sealed class SelfDeclarationAttachmentController(
    ISelfDeclarationAttachmentAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes =
        20L * 1024 * 1024 + 64 * 1024;

    [HttpGet]
    public Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid declarationId) =>
        service.GetListAsync(declarationId);

    [HttpPost]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid declarationId,
        IFormFile file,
        [FromForm] string? description)
    {
        if (file is null)
            throw new UserFriendlyException(
                "Vui lòng chọn file đính kèm.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(
            stream,
            HttpContext.RequestAborted);
        return await service.UploadAsync(
            declarationId,
            stream.ToArray(),
            file.FileName,
            file.ContentType,
            description);
    }

    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> DownloadAsync(
        Guid declarationId,
        Guid attachmentId)
    {
        var file = await service.DownloadAsync(
            declarationId,
            attachmentId);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpDelete("{attachmentId:guid}")]
    public Task DeleteAsync(
        Guid declarationId,
        Guid attachmentId) =>
        service.DeleteAsync(declarationId, attachmentId);
}
