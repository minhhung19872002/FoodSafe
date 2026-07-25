using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Security;

public sealed class ChangeOwnPasswordDto
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

public interface IAccountSecurityAppService
{
    Task ChangePasswordAsync(ChangeOwnPasswordDto input);
}
