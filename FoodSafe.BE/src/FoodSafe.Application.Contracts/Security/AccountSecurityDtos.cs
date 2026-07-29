using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Security;

public class ChangeOwnPasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class CompleteInitialPasswordChangeDto : ChangeOwnPasswordDto
{
    [Required]
    [StringLength(256)]
    public string UserNameOrEmailAddress { get; set; } = string.Empty;

    [Required]
    [StringLength(2048)]
    public string CaptchaToken { get; set; } = string.Empty;
}

public sealed class CompletePasswordResetDto
{
    public Guid UserId { get; set; }

    [Required]
    public string ResetToken { get; set; } = string.Empty;

    [Required]
    [StringLength(256, MinimumLength = 1)]
    public string Password { get; set; } = string.Empty;
}

public interface IAccountSecurityAppService
{
    Task ChangePasswordAsync(ChangeOwnPasswordDto input);
    Task CompleteInitialPasswordChangeAsync(
        CompleteInitialPasswordChangeDto input);
    Task ResetPasswordAsync(CompletePasswordResetDto input);
}
