using FoodSafe.BusinessManagement;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Licensing;

public sealed class ProductRegistrationTests
{
    private static readonly DateTime Today = new(2026, 7, 25);

    [Fact]
    public void Registration_should_normalize_number_and_expire()
    {
        var registration = Create(Today.AddDays(-1));

        registration.RegistrationNumber.ShouldBe("DKCB-01");
        registration.Status.ShouldBe(LicenseStatus.Expired);
        registration.EffectiveStatus(Today)
            .ShouldBe(LicenseStatus.Expired);
    }

    [Fact]
    public void Registration_should_reject_reversed_dates()
    {
        var exception = Should.Throw<BusinessException>(() =>
            Create(
                Today.AddDays(-1),
                registrationDate: Today));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.ProductRegistration.InvalidDateRange);
    }

    [Fact]
    public void Revoked_registration_should_be_terminal()
    {
        var registration = Create(Today.AddYears(1));
        registration.Revoke("Thu hồi theo quyết định", Today, Guid.NewGuid());

        registration.Status.ShouldBe(LicenseStatus.Revoked);
        registration.EffectiveStatus(Today.AddYears(2))
            .ShouldBe(LicenseStatus.Revoked);
        var exception = Should.Throw<BusinessException>(() =>
            registration.Update(
                null, "DKCB-02", null, Today, null,
                Today.AddYears(1), "Sản phẩm", null, null, null, Today));
        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.ProductRegistration
                .CannotModifyRevoked);
    }

    private static ProductRegistration Create(
        DateTime? expiryDate,
        DateTime? registrationDate = null) =>
        ProductRegistration.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            " dkcb-01 ",
            "TN-01",
            registrationDate ?? new DateTime(2026, 1, 1),
            new DateTime(2026, 1, 2),
            expiryDate,
            "Sản phẩm kiểm thử",
            "Nhà sản xuất",
            "Cục An toàn thực phẩm",
            null,
            Today);
}
