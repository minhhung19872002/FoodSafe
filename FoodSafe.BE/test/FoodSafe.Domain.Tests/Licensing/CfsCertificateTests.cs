using FoodSafe.BusinessManagement;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Licensing;

public sealed class CfsCertificateTests
{
    private static readonly DateTime Today = new(2026, 7, 25);

    [Fact]
    public void Certificate_should_normalize_number_and_expire()
    {
        var certificate = Create(Today.AddDays(-1));

        certificate.CertificateNumber.ShouldBe("CFS-01");
        certificate.Status.ShouldBe(LicenseStatus.Expired);
        certificate.EffectiveStatus(Today)
            .ShouldBe(LicenseStatus.Expired);
    }

    [Fact]
    public void Certificate_should_reject_reversed_dates()
    {
        var exception = Should.Throw<BusinessException>(() =>
            Create(Today.AddDays(-1), issueDate: Today));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.CfsCertificate.InvalidDateRange);
    }

    [Fact]
    public void Revoked_certificate_should_be_terminal()
    {
        var certificate = Create(Today.AddYears(1));
        certificate.Revoke("Thu hồi theo quyết định", Today, Guid.NewGuid());

        certificate.Status.ShouldBe(LicenseStatus.Revoked);
        certificate.EffectiveStatus(Today.AddYears(2))
            .ShouldBe(LicenseStatus.Revoked);
        var exception = Should.Throw<BusinessException>(() =>
            certificate.Update(
                null,
                Guid.NewGuid(),
                "CFS-02",
                Today,
                Today.AddYears(1),
                null,
                null,
                Today));
        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.CfsCertificate.CannotModifyRevoked);
    }

    private static CfsCertificate Create(
        DateTime? expiryDate,
        DateTime? issueDate = null) =>
        CfsCertificate.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            Guid.NewGuid(),
            " cfs-01 ",
            issueDate ?? new DateTime(2026, 1, 1),
            expiryDate,
            "Cục An toàn thực phẩm",
            null,
            Today);
}
