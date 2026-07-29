using Volo.Abp.Settings;

namespace FoodSafe.Settings;

public class FoodSafeSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        context.Add(
            new SettingDefinition(
                FoodSafeSettings.Appearance.LogoBlobName,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Appearance.LogoContentType,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Appearance.LoginBackgroundBlobName,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Appearance.LoginBackgroundContentType,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Homepage.Title,
                "Hệ thống quản lý an toàn thực phẩm"),
            new SettingDefinition(
                FoodSafeSettings.Homepage.Description,
                "Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh"),
            new SettingDefinition(
                FoodSafeSettings.Homepage.ContactPhone,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Homepage.ContactEmail,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Homepage.ContactAddress,
                string.Empty),
            new SettingDefinition(
                FoodSafeSettings.Security.PasswordMaxLength,
                "128"),
            new SettingDefinition(
                FoodSafeSettings.License.ExpiryNotificationDays,
                "30"));
    }
}
