using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Security;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/profile")]
public sealed class UserProfileController(
    IUserProfileAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 2L * 1024 * 1024 + 64 * 1024;

    [HttpGet]
    public Task<UserProfileDto> GetAsync() => service.GetAsync();

    [HttpPut]
    public Task<UserProfileDto> UpdateAsync(
        [FromBody] UpdateUserProfileDto input) =>
        service.UpdateAsync(input);

    [HttpPost("avatar")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task SetAvatarAsync(IFormFile file)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn ảnh đại diện.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        await service.SetAvatarAsync(stream.ToArray(), file.ContentType);
    }

    [HttpGet("avatar")]
    public async Task<IActionResult> GetAvatarAsync()
    {
        var avatar = await service.GetAvatarAsync();
        if (avatar is null)
        {
            return NotFound();
        }
        return File(avatar.Content, avatar.ContentType);
    }

    [HttpDelete("avatar")]
    public Task DeleteAvatarAsync() => service.DeleteAvatarAsync();
}
