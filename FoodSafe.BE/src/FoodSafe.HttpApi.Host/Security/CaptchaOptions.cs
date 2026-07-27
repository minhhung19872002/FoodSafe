namespace FoodSafe.Security;

public sealed class CaptchaOptions
{
    public const string SectionName = "Captcha";
    public const string TestSiteKey = "1x00000000000000000000AA";
    public const string TestSecretKey = "1x0000000000000000000000000000000AA";

    public string SiteKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string SiteVerifyUrl { get; set; } =
        "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    public string Action { get; set; } = "login";
    public string? ExpectedHostname { get; set; }
}

public static class CaptchaConfiguration
{
    public static void Validate(CaptchaOptions options, bool isProduction)
    {
        if (string.IsNullOrWhiteSpace(options.SiteKey)
            || string.IsNullOrWhiteSpace(options.SecretKey))
        {
            throw new InvalidOperationException(
                "Captcha:SiteKey and Captcha:SecretKey are required.");
        }

        if (isProduction
            && (options.SiteKey == CaptchaOptions.TestSiteKey
                || options.SecretKey == CaptchaOptions.TestSecretKey))
        {
            throw new InvalidOperationException(
                "Cloudflare Turnstile test keys are forbidden in Production.");
        }

        if (!Uri.TryCreate(options.SiteVerifyUrl, UriKind.Absolute, out var verifyUri)
            || verifyUri.Scheme != Uri.UriSchemeHttps)
        {
            throw new InvalidOperationException(
                "Captcha:SiteVerifyUrl must be an absolute HTTPS URL.");
        }

        if (string.IsNullOrWhiteSpace(options.Action))
        {
            throw new InvalidOperationException("Captcha:Action is required.");
        }

        if (isProduction && string.IsNullOrWhiteSpace(options.ExpectedHostname))
        {
            throw new InvalidOperationException(
                "Captcha:ExpectedHostname is required in Production.");
        }
    }
}
