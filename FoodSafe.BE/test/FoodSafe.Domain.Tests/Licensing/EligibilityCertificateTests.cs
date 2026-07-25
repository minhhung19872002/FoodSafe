using FoodSafe.BusinessManagement;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Licensing;

public sealed class EligibilityCertificateTests
{
    private static readonly DateTime Today = new(2026, 7, 25);

    [Fact]
    public void Certificate_should_normalize_number_and_expire_effectively()
    {
        var certificate = Create(expiryDate: Today.AddDays(-1));

        certificate.CertificateNumber.ShouldBe("DDK-01");
        certificate.Status.ShouldBe(LicenseStatus.Expired);
        certificate.EffectiveStatus(Today).ShouldBe(LicenseStatus.Expired);
    }

    [Fact]
    public void Certificate_should_reject_reversed_dates()
    {
        var exception = Should.Throw<BusinessException>(() =>
            Create(
                issueDate: Today,
                expiryDate: Today.AddDays(-1)));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.EligibilityCertificate
                .InvalidDateRange);
    }

    [Fact]
    public void Revoked_certificate_should_be_terminal()
    {
        var certificate = Create();
        certificate.Revoke("Không còn đủ điều kiện", Today, Guid.NewGuid());

        certificate.Status.ShouldBe(LicenseStatus.Revoked);
        Should.Throw<BusinessException>(() =>
                certificate.Update(
                    "DDK-02",
                    Today,
                    null,
                    null,
                    null,
                    null,
                    Today))
            .Code.ShouldBe(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .CannotModifyRevoked);
    }

    private static EligibilityCertificate Create(
        DateTime? issueDate = null,
        DateTime? expiryDate = null) =>
        EligibilityCertificate.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            " ddk-01 ",
            issueDate ?? new DateTime(2026, 1, 1),
            expiryDate,
            "Chi cục ATVSTP",
            "Sản xuất thực phẩm",
            null,
            Today);
}
