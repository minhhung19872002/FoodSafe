using FoodSafe.BusinessManagement;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Licensing;

public sealed class ExportFoodCertificate : FullAuditedAggregateRoot<Guid>
{
    // Chặn giá trị mặc định 0001-01-01 khi client bỏ trống IssueDate.
    private static readonly DateTime MinimumIssueDate = new(1900, 1, 1);

    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid? DestinationCountryId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string CertificateNumber { get; private set; } = string.Empty;
    public DateTime IssueDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? LotNumber { get; private set; }
    public decimal? Quantity { get; private set; }
    public string? QuantityUnit { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }

    private ExportFoodCertificate()
    {
    }

    private ExportFoodCertificate(Guid id) : base(id)
    {
    }

    public static ExportFoodCertificate Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? productId,
        Guid? destinationCountryId,
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? lotNumber,
        decimal? quantity,
        string? quantityUnit,
        string? notes,
        DateTime today)
    {
        var certificate = new ExportFoodCertificate(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        certificate.Update(
            productId,
            destinationCountryId,
            certificateNumber,
            issueDate,
            expiryDate,
            lotNumber,
            quantity,
            quantityUnit,
            notes,
            today);
        return certificate;
    }

    public void Update(
        Guid? productId,
        Guid? destinationCountryId,
        string certificateNumber,
        DateTime issueDate,
        DateTime? expiryDate,
        string? lotNumber,
        decimal? quantity,
        string? quantityUnit,
        string? notes,
        DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate
                    .CannotModifyRevoked);
        Check.NotNullOrWhiteSpace(
            certificateNumber,
            nameof(certificateNumber),
            100);

        var normalizedIssueDate = issueDate.Date;
        if (normalizedIssueDate < MinimumIssueDate)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate
                    .InvalidIssueDate);
        var normalizedExpiryDate = expiryDate?.Date;
        if (normalizedExpiryDate.HasValue &&
            normalizedIssueDate > normalizedExpiryDate.Value)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ExportFoodCertificate
                    .InvalidDateRange);

        ProductId = productId;
        DestinationCountryId = destinationCountryId;
        CertificateNumber =
            certificateNumber.Trim().ToUpperInvariant();
        IssueDate = normalizedIssueDate;
        ExpiryDate = normalizedExpiryDate;
        LotNumber = Normalize(lotNumber);
        Quantity = quantity;
        QuantityUnit = Normalize(quantityUnit);
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
                FoodSafeDomainErrorCodes.ExportFoodCertificate
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
