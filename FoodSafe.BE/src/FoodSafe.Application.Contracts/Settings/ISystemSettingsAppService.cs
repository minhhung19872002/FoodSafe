using Volo.Abp.Application.Services;

namespace FoodSafe.Settings;

public interface ISystemSettingsAppService : IApplicationService
{
    Task<SystemSettingsDto> GetAsync();
    Task<SystemSettingsDto> UpdateAsync(UpdateSystemSettingsDto input);
    Task SetLogoAsync(byte[] content, string contentType);
    Task SetLoginBackgroundAsync(byte[] content, string contentType);
    Task DeleteLogoAsync();
    Task DeleteLoginBackgroundAsync();
}

public interface IPublicBrandingAppService : IApplicationService
{
    Task<PublicBrandingDto> GetAsync();
    Task<BrandingImageDto?> GetLogoAsync();
    Task<BrandingImageDto?> GetLoginBackgroundAsync();
}
