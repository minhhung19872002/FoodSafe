using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
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

    // Raster formats only. SVG is intentionally excluded (SEC-M-04): branding
    // images are served from public, unauthenticated endpoints with their stored
    // Content-Type, and an SVG can embed <script>, so a malicious/compromised
    // admin could plant stored XSS that runs for every visitor of the login page.
    // ClamAV does not detect XSS payloads, so exclusion at upload is the control.
    private static readonly HashSet<string> AllowedImageContentTypes = new(
        StringComparer.OrdinalIgnoreCase)
    {
        "image/png",
        "image/jpeg",
        "image/webp"
    };

    private readonly ISettingManager _settingManager;
    private readonly ISettingProvider _settingProvider;
    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;
    private readonly IConfiguration _configuration;

    public SystemSettingsAppService(
        ISettingManager settingManager,
        ISettingProvider settingProvider,
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner,
        IConfiguration configuration)
    {
        _settingManager = settingManager;
        _settingProvider = settingProvider;
        _blobs = blobs;
        _malwareScanner = malwareScanner;
        _configuration = configuration;
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
            IssuingAgency = await _settingProvider.GetOrNullAsync(
                FoodSafeSettings.Documents.IssuingAgency),
            HasLogo = !string.IsNullOrEmpty(
                await _settingProvider.GetOrNullAsync(
                    FoodSafeSettings.Appearance.LogoBlobName)),
            HasLoginBackground = !string.IsNullOrEmpty(
                await _settingProvider.GetOrNullAsync(
                    FoodSafeSettings.Appearance.LoginBackgroundBlobName)),
            LicenseExpiryNotificationDays = await GetIntAsync(
                FoodSafeSettings.License.ExpiryNotificationDays, 30),
            MinioEndpoint = _configuration["BlobStorage:Endpoint"],
            MinioBucketName = _configuration["BlobStorage:BucketName"]
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

        await SetGlobalAsync(
            FoodSafeSettings.Documents.IssuingAgency,
            input.IssuingAgency);

        await SetGlobalAsync(
            FoodSafeSettings.License.ExpiryNotificationDays,
            input.LicenseExpiryNotificationDays.ToString());

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
        EnsureAllowedImageContentType(contentType);
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

    // Exposed for direct regression testing (SEC-M-04): rejects any content
    // type outside the raster allow-list — notably image/svg+xml, which can
    // embed <script> and would run as stored XSS on the public login page.
    public static void EnsureAllowedImageContentType(string contentType)
    {
        if (!AllowedImageContentTypes.Contains(contentType))
        {
            throw new BusinessException(
                "FoodSafe:SystemSettings:InvalidImageType");
        }
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
