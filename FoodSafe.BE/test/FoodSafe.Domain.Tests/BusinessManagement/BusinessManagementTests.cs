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

    [Fact]
    public void Self_declaration_should_normalize_number_and_derive_expiry()
    {
        var declaration = CreateSelfDeclaration(
            new DateTime(2026, 7, 25),
            new DateTime(2026, 7, 24));

        declaration.DeclarationNumber.ShouldBe("TCB-01");
        declaration.Status.ShouldBe(LicenseStatus.Expired);
        declaration.EffectiveStatus(new DateTime(2026, 7, 25))
            .ShouldBe(LicenseStatus.Expired);
    }

    [Fact]
    public void Self_declaration_should_reject_reversed_dates()
    {
        var exception = Should.Throw<BusinessException>(() =>
            CreateSelfDeclaration(
                new DateTime(2026, 7, 25),
                new DateTime(2026, 7, 24),
                declarationDate: new DateTime(2026, 7, 25)));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.SelfDeclaration.InvalidDateRange);
    }

    [Fact]
    public void Revoked_self_declaration_should_be_terminal()
    {
        var today = new DateTime(2026, 7, 25);
        var declaration = CreateSelfDeclaration(
            today,
            today.AddYears(1));
        var userId = Guid.NewGuid();
        declaration.Revoke("Không còn phù hợp", today, userId);

        declaration.Status.ShouldBe(LicenseStatus.Revoked);
        declaration.RevokedById.ShouldBe(userId);
        declaration.EffectiveStatus(today.AddYears(2))
            .ShouldBe(LicenseStatus.Revoked);
        var exception = Should.Throw<BusinessException>(() =>
            declaration.Update(
                null,
                "TCB-02",
                today,
                "Sản phẩm",
                null,
                null,
                today.AddYears(1),
                null,
                today));
        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.SelfDeclaration.CannotModifyRevoked);
    }

    private static Business CreateBusiness(
        Guid organizationId,
        string? code = "CS-01",
        string? taxCode = null,
        double? latitude = 21.0064,
        double? longitude = 107.2925) =>
        Business.Create(
            Guid.NewGuid(), organizationId, code, "Cơ sở kiểm thử", null, null,
            taxCode, null, null, null, null, null, "Hạ Long", null, null,
            latitude, longitude, null, null, null);

    private static SelfDeclaration CreateSelfDeclaration(
        DateTime today,
        DateTime? expiryDate,
        DateTime? declarationDate = null) =>
        SelfDeclaration.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            " tcb-01 ",
            declarationDate ?? new DateTime(2026, 1, 1),
            "Sản phẩm kiểm thử",
            null,
            null,
            expiryDate,
            null,
            today);
}
