using FoodSafe.BusinessManagement;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Licensing;

public sealed class CfsCertificate : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid DestinationCountryId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; } = string.Empty;
    public DateTime IssueDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? CertifyingAuthority { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }

    private CfsCertificate()
    {
    }

    private CfsCertificate(Guid id) : base(id)
    {
    }

    public static CfsCertificate Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? productId,
        Guid destinationCountryId,
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? certifyingAuthority,
        string? notes,
        DateTime today)
    {
        var registration = new CfsCertificate(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        registration.Update(
            productId,
            destinationCountryId,
            certificateNumber,
            issueDate,
            expiryDate,
            certifyingAuthority,
            notes,
            today);
        return registration;
    }

    public void Update(
        Guid? productId,
        Guid destinationCountryId,
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? certifyingAuthority,
        string? notes,
        DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.CfsCertificate
                    .CannotModifyRevoked);
        Check.NotNullOrWhiteSpace(
            certificateNumber,
            nameof(certificateNumber),
            100);
        if (destinationCountryId == Guid.Empty)
            throw new ArgumentException(
                "Destination country is required.",
                nameof(destinationCountryId));

        var normalizedIssueDate = issueDate.Date;
        var normalizedExpiryDate = expiryDate?.Date;
        if (normalizedExpiryDate.HasValue &&
            normalizedIssueDate > normalizedExpiryDate.Value)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.CfsCertificate
                    .InvalidDateRange);

        ProductId = productId;
        DestinationCountryId = destinationCountryId;
        CertificateNumber =
            certificateNumber.Trim().ToUpperInvariant();
        IssueDate = normalizedIssueDate;
        ExpiryDate = normalizedExpiryDate;
        CertifyingAuthority = Normalize(certifyingAuthority);
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
                FoodSafeDomainErrorCodes.CfsCertificate
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
