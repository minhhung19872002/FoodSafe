using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Settings;

namespace FoodSafe.Settings;

[RemoteService(IsEnabled = false)]
[AllowAnonymous]
public class PublicBrandingAppService :
    ApplicationService,
    IPublicBrandingAppService
{
    private readonly ISettingProvider _settingProvider;
    private readonly IBlobContainer _blobs;

    public PublicBrandingAppService(
        ISettingProvider settingProvider,
        IBlobContainer blobs)
    {
        _settingProvider = settingProvider;
        _blobs = blobs;
    }

    public async Task<PublicBrandingDto> GetAsync() =>
        new()
        {
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

    public Task<BrandingImageDto?> GetLogoAsync() =>
        LoadImageAsync(
            FoodSafeSettings.Appearance.LogoBlobName,
            FoodSafeSettings.Appearance.LogoContentType);

    public Task<BrandingImageDto?> GetLoginBackgroundAsync() =>
        LoadImageAsync(
            FoodSafeSettings.Appearance.LoginBackgroundBlobName,
            FoodSafeSettings.Appearance.LoginBackgroundContentType);

    private async Task<BrandingImageDto?> LoadImageAsync(
        string blobNameSetting,
        string contentTypeSetting)
    {
        var blobName = await _settingProvider.GetOrNullAsync(blobNameSetting);
        if (string.IsNullOrEmpty(blobName))
        {
            return null;
        }
        var content = await _blobs.GetAllBytesOrNullAsync(blobName);
        if (content is null)
        {
            return null;
        }
        return new BrandingImageDto
        {
            Content = content,
            ContentType = await _settingProvider.GetOrNullAsync(
                contentTypeSetting) ?? "image/png"
        };
    }
}
