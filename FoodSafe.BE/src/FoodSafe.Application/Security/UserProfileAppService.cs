using FoodSafe.FileManagement;
using FoodSafe.Organizations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Users;

namespace FoodSafe.Security;

[RemoteService(IsEnabled = false)]
[Authorize]
public class UserProfileAppService :
    ApplicationService,
    IUserProfileAppService
{
    private const int MaximumAvatarBytes = 2 * 1024 * 1024;

    private static readonly HashSet<string> AllowedImageContentTypes = new(
        StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp"
    };

    private readonly IdentityUserManager _userManager;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;

    public UserProfileAppService(
        IdentityUserManager userManager,
        IRepository<AppUserProfile, Guid> profiles,
        IRepository<Organization, Guid> organizations,
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner)
    {
        _userManager = userManager;
        _profiles = profiles;
        _organizations = organizations;
        _blobs = blobs;
        _malwareScanner = malwareScanner;
    }

    public async Task<UserProfileDto> GetAsync()
    {
        var userId = CurrentUser.GetId();
        var user = await _userManager.GetByIdAsync(userId);
        var profile = await _profiles.FirstOrDefaultAsync(
            x => x.UserId == userId);
        Organization? organization = null;
        if (profile is not null)
        {
            organization = await _organizations.FirstOrDefaultAsync(
                x => x.Id == profile.OrganizationId);
        }

        return new UserProfileDto
        {
            UserName = user.UserName,
            FullName = profile?.FullName ?? user.Name ?? user.UserName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Position = profile?.Position,
            Department = profile?.Department,
            OrganizationName = organization?.Name,
            HasAvatar = await _blobs.ExistsAsync(AvatarBlobName(userId))
        };
    }

    public async Task<UserProfileDto> UpdateAsync(UpdateUserProfileDto input)
    {
        var userId = CurrentUser.GetId();
        var user = await _userManager.GetByIdAsync(userId);
        user.Name = input.FullName.Trim();
        (await _userManager.SetPhoneNumberAsync(
            user,
            string.IsNullOrWhiteSpace(input.PhoneNumber)
                ? null
                : input.PhoneNumber.Trim())).CheckErrors();
        (await _userManager.UpdateAsync(user)).CheckErrors();

        var profile = await _profiles.FirstOrDefaultAsync(
            x => x.UserId == userId);
        if (profile is not null)
        {
            profile.ChangeDetails(
                profile.OrganizationId,
                input.FullName,
                profile.Position,
                profile.Department,
                Clock.Now);
            await _profiles.UpdateAsync(profile);
        }
        await CurrentUnitOfWork!.SaveChangesAsync();
        return await GetAsync();
    }

    public async Task SetAvatarAsync(byte[] content, string contentType)
    {
        if (content.Length == 0 || content.Length > MaximumAvatarBytes)
        {
            throw new BusinessException("FoodSafe:Profile:InvalidAvatarSize")
                .WithData("MaximumBytes", MaximumAvatarBytes);
        }
        if (!AllowedImageContentTypes.Contains(contentType))
        {
            throw new BusinessException("FoodSafe:Profile:InvalidAvatarType");
        }
        using (var scanStream = new MemoryStream(content))
        {
            if (!await _malwareScanner.IsCleanAsync(scanStream, default))
            {
                throw new BusinessException(
                    "FoodSafe:Profile:MalwareDetected");
            }
        }
        var blobName = AvatarBlobName(CurrentUser.GetId());
        await _blobs.SaveAsync(blobName, content, overrideExisting: true);
        await _blobs.SaveAsync(
            $"{blobName}.meta",
            System.Text.Encoding.UTF8.GetBytes(contentType),
            overrideExisting: true);
    }

    public async Task<AvatarDto?> GetAvatarAsync()
    {
        var blobName = AvatarBlobName(CurrentUser.GetId());
        var content = await _blobs.GetAllBytesOrNullAsync(blobName);
        if (content is null)
        {
            return null;
        }
        var meta = await _blobs.GetAllBytesOrNullAsync($"{blobName}.meta");
        return new AvatarDto
        {
            Content = content,
            ContentType = meta is null
                ? "image/png"
                : System.Text.Encoding.UTF8.GetString(meta)
        };
    }

    public async Task DeleteAvatarAsync()
    {
        var blobName = AvatarBlobName(CurrentUser.GetId());
        await _blobs.DeleteAsync(blobName);
        await _blobs.DeleteAsync($"{blobName}.meta");
    }

    private static string AvatarBlobName(Guid userId) =>
        $"avatars/{userId:N}";
}
