using FoodSafe.BusinessManagement;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Licensing;

public sealed class EligibilityCertificate :
    FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; } = string.Empty;
    public DateTime IssueDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? CertifyingAuthority { get; private set; }
    public string? CertificationScope { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }

    private EligibilityCertificate()
    {
    }

    private EligibilityCertificate(Guid id) : base(id)
    {
    }

    public static EligibilityCertificate Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? certifyingAuthority,
        string? certificationScope,
        string? notes,
        DateTime today)
    {
        var certificate = new EligibilityCertificate(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        certificate.Update(
            certificateNumber,
            issueDate,
            expiryDate,
            certifyingAuthority,
            certificationScope,
            notes,
            today);
        return certificate;
    }

    public void Update(
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? certifyingAuthority,
        string? certificationScope,
        string? notes,
        DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .CannotModifyRevoked);
        Check.NotNullOrWhiteSpace(
            certificateNumber,
            nameof(certificateNumber),
            100);

        var normalizedIssueDate = issueDate.Date;
        // Điều 37 Luật ATTP 2010: giấy chứng nhận có hiệu lực 03 năm kể từ ngày cấp.
        var statutoryExpiry = normalizedIssueDate.AddYears(3);
        var normalizedExpiryDate = expiryDate?.Date ?? statutoryExpiry;
        if (normalizedIssueDate > normalizedExpiryDate)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .InvalidDateRange);
        if (normalizedExpiryDate > statutoryExpiry)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .ExpiryExceedsStatutoryLimit);

        CertificateNumber = certificateNumber.Trim().ToUpperInvariant();
        IssueDate = normalizedIssueDate;
        ExpiryDate = normalizedExpiryDate;
        CertifyingAuthority = Normalize(certifyingAuthority);
        CertificationScope = Normalize(certificationScope);
        Notes = Normalize(notes);
        SynchronizeExpiry(today);
    }

    public void SynchronizeExpiry(DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            return;
        Status = ExpiryDate.HasValue && ExpiryDate.Value.Date < today.Date
            ? LicenseStatus.Expired
            : LicenseStatus.Active;
    }

    public LicenseStatus EffectiveStatus(DateTime today) =>
        Status == LicenseStatus.Revoked
            ? LicenseStatus.Revoked
            : ExpiryDate.HasValue && ExpiryDate.Value.Date < today.Date
                ? LicenseStatus.Expired
                : LicenseStatus.Active;

    public void Revoke(string reason, DateTime revokedAt, Guid revokedById)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .AlreadyRevoked);
        Check.NotNullOrWhiteSpace(reason, nameof(reason), 2000);
        RevokeReason = reason.Trim();
        RevokedAt = revokedAt;
        RevokedById = revokedById;
        Status = LicenseStatus.Revoked;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
