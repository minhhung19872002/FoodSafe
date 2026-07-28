using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Settings;

public sealed class BrandingImageContentTypeTests
{
    [Theory]
    [InlineData("image/png")]
    [InlineData("image/jpeg")]
    [InlineData("image/webp")]
    [InlineData("IMAGE/PNG")] // content type comparison is case-insensitive
    public void Raster_image_types_are_accepted(string contentType)
    {
        Should.NotThrow(() =>
            SystemSettingsAppService.EnsureAllowedImageContentType(contentType));
    }

    [Theory]
    [InlineData("image/svg+xml")] // SEC-M-04: SVG can embed <script> -> stored XSS
    [InlineData("image/svg+xml; charset=utf-8")]
    [InlineData("text/html")]
    [InlineData("application/xml")]
    [InlineData("image/gif")]
    [InlineData("")]
    public void Non_raster_and_scriptable_types_are_rejected(string contentType)
    {
        var ex = Should.Throw<BusinessException>(() =>
            SystemSettingsAppService.EnsureAllowedImageContentType(contentType));

        ex.Code.ShouldBe("FoodSafe:SystemSettings:InvalidImageType");
    }
}
