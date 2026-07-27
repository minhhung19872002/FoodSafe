using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Emailing;
using Volo.Abp.Identity.Settings;
using Volo.Abp.SettingManagement;
using Volo.Abp.Settings;

namespace FoodSafe.Settings;

[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.SystemAdministration.Settings)]
public class SystemSettingsAppService :
    ApplicationService,
    ISystemSettingsAppService
{
    private const int MaximumImageBytes = 2 * 1024 * 1024;
    private const string LogoBlobName = "branding/logo";
    private const string LoginBackgroundBlobName = "branding/login-background";

    private static readonly HashSet<string> AllowedImageContentTypes = new(
        StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml"
    };

    private readonly ISettingManager _settingManager;
    private readonly ISettingProvider _settingProvider;
    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;

    public SystemSettingsAppService(
        ISettingManager settingManager,
        ISettingProvider settingProvider,
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner)
    {
        _settingManager = settingManager;
        _settingProvider = settingProvider;
        _blobs = blobs;
        _malwareScanner = malwareScanner;
    }

    public async Task<SystemSettingsDto> GetAsync()
    {
        var dto = new SystemSettingsDto
        {
            PasswordRequiredLength = await GetIntAsync(
                IdentitySettingNames.Password.RequiredLength, 8),
            PasswordMaxLength = await GetIntAsync(
                FoodSafeSettings.Security.PasswordMaxLength, 128),
            PasswordRequireDigit = await GetBoolAsync(
                IdentitySettingNames.Password.RequireDigit, true),
            PasswordRequireLowercase = await GetBoolAsync(
                IdentitySettingNames.Password.RequireLowercase, true),
            PasswordRequireUppercase = await GetBoolAsync(
                IdentitySettingNames.Password.RequireUppercase, true),
            PasswordRequireNonAlphanumeric = await GetBoolAsync(
                IdentitySettingNames.Password.RequireNonAlphanumeric, true),
            LockoutMaxFailedAttempts = await GetIntAsync(
                IdentitySettingNames.Lockout.MaxFailedAccessAttempts, 5),
            LockoutDurationMinutes = await GetIntAsync(
                IdentitySettingNames.Lockout.LockoutDuration, 1800) / 60,
            SmtpHost = await _settingProvider.GetOrNullAsync(
                EmailSettingNames.Smtp.Host),
            SmtpPort = await GetNullableIntAsync(EmailSettingNames.Smtp.Port),
            SmtpUserName = await _settingProvider.GetOrNullAsync(
                EmailSettingNames.Smtp.UserName),
            SmtpEnableSsl = await GetBoolAsync(
                EmailSettingNames.Smtp.EnableSsl, false),
            SmtpSenderAddress = await _settingProvider.GetOrNullAsync(
                EmailSettingNames.DefaultFromAddress),
            SmtpSenderDisplayName = await _settingProvider.GetOrNullAsync(
                EmailSettingNames.DefaultFromDisplayName),
            HasSmtpPassword = !string.IsNullOrEmpty(
                await _settingProvider.GetOrNullAsync(
                    EmailSettingNames.Smtp.Password)),
            HomepageTitle = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Homepage.Title),
            HomepageDescription = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Homepage.Description),
            ContactPhone = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Homepage.ContactPhone),
            ContactEmail = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Homepage.ContactEmail),
            ContactAddress = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Homepage.ContactAddress),
            HasLogo = !string.IsNullOrEmpty(
                await _settingProvider.GetOrNullAsync(
                    FoodSafeSettings.Appearance.LogoBlobName)),
            HasLoginBackground = !string.IsNullOrEmpty(
                await _settingProvider.GetOrNullAsync(
                    FoodSafeSettings.Appearance.LoginBackgroundBlobName))
        };
        return dto;
    }

    public async Task<SystemSettingsDto> UpdateAsync(
        UpdateSystemSettingsDto input)
    {
        if (input.PasswordMaxLength < input.PasswordRequiredLength)
        {
            throw new BusinessException(
                "FoodSafe:SystemSettings:InvalidPasswordLengthRange");
        }

        await SetGlobalAsync(
            IdentitySettingNames.Password.RequiredLength,
            input.PasswordRequiredLength.ToString());
        await SetGlobalAsync(
            FoodSafeSettings.Security.PasswordMaxLength,
            input.PasswordMaxLength.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Password.RequireDigit,
            input.PasswordRequireDigit.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Password.RequireLowercase,
            input.PasswordRequireLowercase.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Password.RequireUppercase,
            input.PasswordRequireUppercase.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Password.RequireNonAlphanumeric,
            input.PasswordRequireNonAlphanumeric.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Lockout.MaxFailedAccessAttempts,
            input.LockoutMaxFailedAttempts.ToString());
        await SetGlobalAsync(
            IdentitySettingNames.Lockout.LockoutDuration,
            (input.LockoutDurationMinutes * 60).ToString());

        await SetGlobalAsync(EmailSettingNames.Smtp.Host, input.SmtpHost);
        await SetGlobalAsync(
            EmailSettingNames.Smtp.Port,
            input.SmtpPort?.ToString());
        await SetGlobalAsync(
            EmailSettingNames.Smtp.UserName,
            input.SmtpUserName);
        await SetGlobalAsync(
            EmailSettingNames.Smtp.EnableSsl,
            input.SmtpEnableSsl.ToString());
        await SetGlobalAsync(
            EmailSettingNames.DefaultFromAddress,
            input.SmtpSenderAddress);
        await SetGlobalAsync(
            EmailSettingNames.DefaultFromDisplayName,
            input.SmtpSenderDisplayName);
        if (!string.IsNullOrWhiteSpace(input.SmtpPassword))
        {
            await _settingManager.SetGlobalAsync(
                EmailSettingNames.Smtp.Password,
                input.SmtpPassword);
        }

        await SetGlobalAsync(
            FoodSafeSettings.Homepage.Title,
            input.HomepageTitle);
        await SetGlobalAsync(
            FoodSafeSettings.Homepage.Description,
            input.HomepageDescription);
        await SetGlobalAsync(
            FoodSafeSettings.Homepage.ContactPhone,
            input.ContactPhone);
        await SetGlobalAsync(
            FoodSafeSettings.Homepage.ContactEmail,
            input.ContactEmail);
        await SetGlobalAsync(
            FoodSafeSettings.Homepage.ContactAddress,
            input.ContactAddress);

        return await GetAsync();
    }

    public Task SetLogoAsync(byte[] content, string contentType) =>
        SaveBrandingImageAsync(
            content,
            contentType,
            LogoBlobName,
            FoodSafeSettings.Appearance.LogoBlobName,
            FoodSafeSettings.Appearance.LogoContentType);

    public Task SetLoginBackgroundAsync(byte[] content, string contentType) =>
        SaveBrandingImageAsync(
            content,
            contentType,
            LoginBackgroundBlobName,
            FoodSafeSettings.Appearance.LoginBackgroundBlobName,
            FoodSafeSettings.Appearance.LoginBackgroundContentType);

    public async Task DeleteLogoAsync()
    {
        await _blobs.DeleteAsync(LogoBlobName);
        await SetGlobalAsync(FoodSafeSettings.Appearance.LogoBlobName, null);
        await SetGlobalAsync(FoodSafeSettings.Appearance.LogoContentType, null);
    }

    public async Task DeleteLoginBackgroundAsync()
    {
        await _blobs.DeleteAsync(LoginBackgroundBlobName);
        await SetGlobalAsync(
            FoodSafeSettings.Appearance.LoginBackgroundBlobName, null);
        await SetGlobalAsync(
            FoodSafeSettings.Appearance.LoginBackgroundContentType, null);
    }

    private async Task SaveBrandingImageAsync(
        byte[] content,
        string contentType,
        string blobName,
        string blobNameSetting,
        string contentTypeSetting)
    {
        if (content.Length == 0 || content.Length > MaximumImageBytes)
        {
            throw new BusinessException(
                    "FoodSafe:SystemSettings:InvalidImageSize")
                .WithData("MaximumBytes", MaximumImageBytes);
        }
        if (!AllowedImageContentTypes.Contains(contentType))
        {
            throw new BusinessException(
                "FoodSafe:SystemSettings:InvalidImageType");
        }
        using (var scanStream = new MemoryStream(content))
        {
            if (!await _malwareScanner.IsCleanAsync(scanStream, default))
            {
                throw new BusinessException(
                    "FoodSafe:SystemSettings:MalwareDetected");
            }
        }
        await _blobs.SaveAsync(blobName, content, overrideExisting: true);
        await SetGlobalAsync(blobNameSetting, blobName);
        await SetGlobalAsync(contentTypeSetting, contentType);
    }

    private Task SetGlobalAsync(string name, string? value) =>
        _settingManager.SetGlobalAsync(
            name,
            string.IsNullOrWhiteSpace(value) ? null : value.Trim());

    private async Task<int> GetIntAsync(string name, int fallback)
    {
        var value = await _settingProvider.GetOrNullAsync(name);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }

    private async Task<int?> GetNullableIntAsync(string name)
    {
        var value = await _settingProvider.GetOrNullAsync(name);
        return int.TryParse(value, out var parsed) ? parsed : null;
    }

    private async Task<bool> GetBoolAsync(string name, bool fallback)
    {
        var value = await _settingProvider.GetOrNullAsync(name);
        return bool.TryParse(value, out var parsed) ? parsed : fallback;
    }
}
