using FoodSafe.Settings;
using Microsoft.AspNetCore.Identity;
using Volo.Abp.Settings;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace FoodSafe.Security;

/// <summary>
/// Enforces the configurable maximum password length
/// (FoodSafe.Security.PasswordMaxLength) on top of the built-in
/// minimum-length policy.
/// </summary>
public sealed class MaximumPasswordLengthValidator
    : IPasswordValidator<IdentityUser>
{
    private readonly ISettingProvider _settingProvider;

    public MaximumPasswordLengthValidator(ISettingProvider settingProvider)
    {
        _settingProvider = settingProvider;
    }

    public async Task<IdentityResult> ValidateAsync(
        UserManager<IdentityUser> manager,
        IdentityUser user,
        string? password)
    {
        var raw = await _settingProvider.GetOrNullAsync(
            FoodSafeSettings.Security.PasswordMaxLength);
        var maximumLength = int.TryParse(raw, out var parsed) ? parsed : 128;
        if (password is not null && password.Length > maximumLength)
        {
            return IdentityResult.Failed(new IdentityError
            {
                Code = "PasswordTooLong",
                Description =
                    $"Mật khẩu không được vượt quá {maximumLength} ký tự."
            });
        }
        return IdentityResult.Success;
    }
}
