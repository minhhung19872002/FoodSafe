using Asp.Versioning;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.AlertsAndTesting;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize(FoodSafePermissions.AlertsAndTesting.News.View)]
[Route("api/v1/app/atp-news/thumbnail")]
public sealed class AtpNewsThumbnailController(
    IAtpNewsThumbnailAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 5L * 1024 * 1024 + 64 * 1024;

    /// <summary>
    /// Upload a thumbnail image for a news article.
    /// Returns the storage path to be stored in CreateUpdateAtpNewsDto.ThumbnailStoragePath.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Create)]
    public async Task<NewsThumbnailUploadResultDto> UploadAsync(IFormFile file)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn ảnh đại diện.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.UploadAsync(
            stream.ToArray(), file.FileName, file.ContentType);
    }

    /// <summary>
    /// Serve a previously uploaded news thumbnail image.
    /// The path must start with "news-thumbnails/".
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAsync([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest();

        var thumbnail = await service.GetAsync(path);
        if (thumbnail is null)
            return NotFound();

        return File(thumbnail.Content, thumbnail.ContentType);
    }
}
