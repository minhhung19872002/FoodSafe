namespace FoodSafe.Settings;

public static class FoodSafeSettings
{
    private const string Prefix = "FoodSafe";

    public static class Appearance
    {
        public const string LogoBlobName = Prefix + ".Appearance.LogoBlobName";
        public const string LogoContentType =
            Prefix + ".Appearance.LogoContentType";
        public const string LoginBackgroundBlobName =
            Prefix + ".Appearance.LoginBackgroundBlobName";
        public const string LoginBackgroundContentType =
            Prefix + ".Appearance.LoginBackgroundContentType";
    }

    public static class Homepage
    {
        public const string Title = Prefix + ".Homepage.Title";
        public const string Description = Prefix + ".Homepage.Description";
        public const string ContactPhone = Prefix + ".Homepage.ContactPhone";
        public const string ContactEmail = Prefix + ".Homepage.ContactEmail";
        public const string ContactAddress = Prefix + ".Homepage.ContactAddress";
    }

    public static class Security
    {
        public const string PasswordMaxLength =
            Prefix + ".Security.PasswordMaxLength";
    }

    public static class License
    {
        public const string ExpiryNotificationDays =
            Prefix + ".License.ExpiryNotificationDays";
    }
}
