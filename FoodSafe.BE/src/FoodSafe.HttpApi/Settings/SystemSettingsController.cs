using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Settings;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/system-settings")]
public sealed class SystemSettingsController(
    ISystemSettingsAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 2L * 1024 * 1024 + 64 * 1024;

    [HttpGet]
    public Task<SystemSettingsDto> GetAsync() => service.GetAsync();

    [HttpPut]
    public Task<SystemSettingsDto> UpdateAsync(
        [FromBody] UpdateSystemSettingsDto input) =>
        service.UpdateAsync(input);

    [HttpPost("logo")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task SetLogoAsync(IFormFile file)
    {
        var (content, contentType) = await ReadFileAsync(file);
        await service.SetLogoAsync(content, contentType);
    }

    [HttpPost("login-background")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task SetLoginBackgroundAsync(IFormFile file)
    {
        var (content, contentType) = await ReadFileAsync(file);
        await service.SetLoginBackgroundAsync(content, contentType);
    }

    [HttpDelete("logo")]
    public Task DeleteLogoAsync() => service.DeleteLogoAsync();

    [HttpDelete("login-background")]
    public Task DeleteLoginBackgroundAsync() =>
        service.DeleteLoginBackgroundAsync();

    private async Task<(byte[] Content, string ContentType)> ReadFileAsync(
        IFormFile file)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn file hình ảnh.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return (stream.ToArray(), file.ContentType);
    }
}
