using FoodSafe.BusinessManagement;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Licensing;

public sealed class AdvertisementRegistrationTests
{
    private static readonly DateTime Today = new(2026, 7, 25);

    [Fact]
    public void Registration_should_normalize_number_and_deduplicate_products()
    {
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();
        var registration = Create([first, first, second]);

        registration.RegistrationNumber.ShouldBe("QC-01");
        registration.Products.Select(x => x.ProductId)
            .ShouldBe([first, second], ignoreOrder: true);
    }

    [Fact]
    public void Registration_should_require_products_and_valid_dates()
    {
        var missing = Should.Throw<BusinessException>(() => Create([]));
        missing.Code.ShouldBe(
            FoodSafeDomainErrorCodes.AdvertisementRegistration
                .ProductsRequired);

        var reversed = Should.Throw<BusinessException>(() =>
            Create(
                [Guid.NewGuid()],
                Today.AddDays(-1),
                Today));
        reversed.Code.ShouldBe(
            FoodSafeDomainErrorCodes.AdvertisementRegistration
                .InvalidDateRange);
    }

    [Fact]
    public void Revoked_registration_should_be_terminal()
    {
        var registration = Create([Guid.NewGuid()]);
        registration.Revoke("Thu hồi nội dung", Today, Guid.NewGuid());

        registration.Status.ShouldBe(LicenseStatus.Revoked);
        Should.Throw<BusinessException>(() =>
                registration.Update(
                    null, "QC-02", Today, null, null, null, null,
                    [Guid.NewGuid()], Today))
            .Code.ShouldBe(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .CannotModifyRevoked);
    }

    private static AdvertisementRegistration Create(
        IEnumerable<Guid> products,
        DateTime? expiryDate = null,
        DateTime? registrationDate = null) =>
        AdvertisementRegistration.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            " qc-01 ",
            registrationDate ?? new DateTime(2026, 1, 1),
            expiryDate,
            "Nội dung quảng cáo",
            "Truyền hình",
            null,
            products,
            Today);
}
