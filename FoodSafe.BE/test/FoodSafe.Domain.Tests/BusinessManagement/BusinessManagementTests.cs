using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessManagementTests
{
    [Fact]
    public void Business_should_normalize_identity_and_preserve_organization()
    {
        var organizationId = Guid.NewGuid();

        var business = CreateBusiness(
            organizationId,
            code: " cs-01 ",
            taxCode: " 5700123456 ");

        business.OrganizationId.ShouldBe(organizationId);
        business.Code.ShouldBe("CS-01");
        business.TaxCode.ShouldBe("5700123456");
        business.Status.ShouldBe(BusinessStatus.Active);
    }

    [Theory]
    [InlineData(91, 107)]
    [InlineData(21, 181)]
    public void Business_should_reject_invalid_coordinates(
        double latitude,
        double longitude)
    {
        var exception = Should.Throw<BusinessException>(() =>
            CreateBusiness(
                Guid.NewGuid(),
                latitude: latitude,
                longitude: longitude));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.Business.InvalidCoordinates);
    }

    [Fact]
    public void Suspended_business_should_require_a_reason()
    {
        var business = CreateBusiness(Guid.NewGuid());

        var exception = Should.Throw<BusinessException>(() =>
            business.SetStatus(BusinessStatus.Suspended, null, null));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.Business.SuspensionReasonRequired);
    }

    [Fact]
    public void Product_should_keep_parent_organization_and_reject_negative_expiry()
    {
        var businessId = Guid.NewGuid();
        var organizationId = Guid.NewGuid();

        var exception = Should.Throw<BusinessException>(() =>
            Product.Create(
                Guid.NewGuid(), businessId, organizationId, "P-01", "Sản phẩm",
                null, null, null, null, null, null, null, -1, null, null, null));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.Product.InvalidExpiryPeriod);
    }

    [Fact]
    public void Handler_should_reject_reversed_certificate_dates()
    {
        var exception = Should.Throw<BusinessException>(() =>
            BusinessHandler.Create(
                Guid.NewGuid(), Guid.NewGuid(), "Nguyễn Văn A", null, null,
                "TH-01", new DateTime(2026, 2, 1), null,
                new DateTime(2026, 1, 1), null, null, null, null, null));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.Business.InvalidCertificateDates);
    }

    private static Business CreateBusiness(
        Guid organizationId,
        string? code = "CS-01",
        string? taxCode = null,
        double? latitude = 21.0064,
        double? longitude = 107.2925) =>
        Business.Create(
            Guid.NewGuid(), organizationId, code, "Cơ sở kiểm thử", null, null,
            taxCode, null, null, null, null, null, "Hạ Long", null, null, null,
            latitude, longitude, null, null, null);
}
