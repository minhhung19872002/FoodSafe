using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Identity.Settings;
using Volo.Abp.Settings;

namespace FoodSafe.Settings;

[RemoteService(IsEnabled = false)]
[AllowAnonymous]
public class PublicPasswordPolicyAppService :
    ApplicationService,
    IPublicPasswordPolicyAppService
{
    private readonly ISettingProvider _settingProvider;

    public PublicPasswordPolicyAppService(ISettingProvider settingProvider)
    {
        _settingProvider = settingProvider;
    }

    public async Task<PublicPasswordPolicyDto> GetAsync() =>
        new()
        {
            RequiredLength = await GetIntAsync(
                IdentitySettingNames.Password.RequiredLength, 8),
            MaxLength = await GetIntAsync(
                FoodSafeSettings.Security.PasswordMaxLength, 128),
            RequireDigit = await GetBoolAsync(
                IdentitySettingNames.Password.RequireDigit, true),
            RequireLowercase = await GetBoolAsync(
                IdentitySettingNames.Password.RequireLowercase, true),
            RequireUppercase = await GetBoolAsync(
                IdentitySettingNames.Password.RequireUppercase, true),
            RequireNonAlphanumeric = await GetBoolAsync(
                IdentitySettingNames.Password.RequireNonAlphanumeric, true)
        };

    private async Task<int> GetIntAsync(string name, int fallback)
    {
        var value = await _settingProvider.GetOrNullAsync(name);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    private async Task<bool> GetBoolAsync(string name, bool fallback)
    {
        var value = await _settingProvider.GetOrNullAsync(name);
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
