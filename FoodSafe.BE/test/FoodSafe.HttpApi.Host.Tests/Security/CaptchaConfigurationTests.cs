using FoodSafe.Security;
using Shouldly;
using Xunit;

namespace FoodSafe;

public sealed class CaptchaConfigurationTests
{
    [Fact]
    public void Development_Should_Allow_Published_Test_Keys()
    {
        var options = ValidOptions();
        options.SiteKey = CaptchaOptions.TestSiteKey;
        options.SecretKey = CaptchaOptions.TestSecretKey;

        Should.NotThrow(() => CaptchaConfiguration.Validate(options, false));
    }

    [Fact]
    public void Production_Should_Reject_Published_Test_Keys()
    {
        var options = ValidOptions();
        options.SiteKey = CaptchaOptions.TestSiteKey;
        options.SecretKey = CaptchaOptions.TestSecretKey;

        Should.Throw<InvalidOperationException>(
            () => CaptchaConfiguration.Validate(options, true));
    }

    [Fact]
    public void Production_Should_Require_Expected_Hostname()
    {
        var options = ValidOptions();
        options.ExpectedHostname = null;

        Should.Throw<InvalidOperationException>(
            () => CaptchaConfiguration.Validate(options, true));
    }

    private static CaptchaOptions ValidOptions()
    {
        return new CaptchaOptions
        {
            SiteKey = "production-site-key",
            SecretKey = "production-secret-key",
            ExpectedHostname = "foodsafe.example.gov.vn"
        };
    }
}
