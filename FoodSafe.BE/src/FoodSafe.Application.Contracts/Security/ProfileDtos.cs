using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.Security;

public sealed class UserProfileDto
{
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public string? OrganizationName { get; set; }
    public bool HasAvatar { get; set; }
}

public sealed class UpdateUserProfileDto
{
    [Required]
    [StringLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    [StringLength(32)]
    public string? PhoneNumber { get; set; }
}

public sealed class AvatarDto
{
    public byte[] Content { get; set; } = [];
    public string ContentType { get; set; } = "image/png";
}

public interface IUserProfileAppService : IApplicationService
{
    Task<UserProfileDto> GetAsync();
    Task<UserProfileDto> UpdateAsync(UpdateUserProfileDto input);
    Task SetAvatarAsync(byte[] content, string contentType);
    Task<AvatarDto?> GetAvatarAsync();
    Task DeleteAvatarAsync();
}
