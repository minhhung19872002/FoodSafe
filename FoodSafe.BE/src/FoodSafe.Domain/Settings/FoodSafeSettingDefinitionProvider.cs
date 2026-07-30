using Volo.Abp.Identity.Settings;
using Volo.Abp.Settings;

namespace FoodSafe.Settings;

public class FoodSafeSettingDefinitionProvider : SettingDefinitionProvider
{
    public override void Define(ISettingDefinitionContext context)
    {
        OverrideIdentityPasswordDefaults(context);

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

    /// <summary>
    /// ABP áp các setting <c>Abp.Identity.Password.*</c> lên
    /// <see cref="Microsoft.AspNetCore.Identity.IdentityOptions"/> ở mỗi request,
    /// nên giá trị khai báo trong <c>ConfigureIdentity</c> bị ghi đè bởi setting.
    /// Mặc định của ABP là 6 ký tự, trong khi yêu cầu ATTT cấp độ 2 của hệ thống
    /// là tối thiểu 8 (xem CLAUDE.md §5). Phải đổi ngay ở tầng setting — nơi thực
    /// sự có hiệu lực và cũng là nơi API <c>/v1/public/password-policy</c> đọc ra
    /// để hiển thị cho người dùng.
    ///
    /// Vẫn cho phép quản trị viên thay đổi qua trang Cấu hình hệ thống; đây chỉ
    /// là giá trị mặc định khi chưa có ai lưu cấu hình.
    /// </summary>
    private static void OverrideIdentityPasswordDefaults(
        ISettingDefinitionContext context)
    {
        SetDefault(IdentitySettingNames.Password.RequiredLength, "8");
        SetDefault(IdentitySettingNames.Password.RequireDigit, "true");
        SetDefault(IdentitySettingNames.Password.RequireLowercase, "true");
        SetDefault(IdentitySettingNames.Password.RequireUppercase, "true");
        SetDefault(IdentitySettingNames.Password.RequireNonAlphanumeric, "true");

        void SetDefault(string name, string defaultValue)
        {
            var definition = context.GetOrNull(name);
            if (definition is not null)
            {
                definition.DefaultValue = defaultValue;
            }
        }
    }
}
