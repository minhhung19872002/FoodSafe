using FoodSafe.BusinessManagement;
using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Licensing;

public sealed class ProductRegistration : FullAuditedAggregateRoot<Guid>
{
    // Chặn giá trị mặc định 0001-01-01 khi client bỏ trống RegistrationDate.
    private static readonly DateTime MinimumRegistrationDate = new(1900, 1, 1);


    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string RegistrationNumber { get; private set; } = string.Empty;
    public string? ReceiptNumber { get; private set; }
    public DateTime RegistrationDate { get; private set; }
    public DateTime? ReceiptDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string? Manufacturer { get; private set; }
    public string? CertifyingAuthority { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }

    private ProductRegistration()
    {
    }

    private ProductRegistration(Guid id) : base(id)
    {
    }

    public static ProductRegistration Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? productId,
        string registrationNumber,
        string? receiptNumber,
        DateTime registrationDate,
        DateTime? receiptDate,
        DateTime? expiryDate,
        string productName,
        string? manufacturer,
        string? certifyingAuthority,
        string? notes,
        DateTime today)
    {
        var registration = new ProductRegistration(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        registration.Update(
            productId,
            registrationNumber,
            receiptNumber,
            registrationDate,
            receiptDate,
            expiryDate,
            productName,
            manufacturer,
            certifyingAuthority,
            notes,
            today);
        return registration;
    }

    public void Update(
        Guid? productId,
        string registrationNumber,
        string? receiptNumber,
        DateTime registrationDate,
        DateTime? receiptDate,
        DateTime? expiryDate,
        string productName,
        string? manufacturer,
        string? certifyingAuthority,
        string? notes,
        DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRegistration
                    .CannotModifyRevoked);
        Check.NotNullOrWhiteSpace(
            registrationNumber,
            nameof(registrationNumber),
            100);
        Check.NotNullOrWhiteSpace(productName, nameof(productName), 500);

        var normalizedRegistrationDate = registrationDate.Date;
        if (normalizedRegistrationDate < MinimumRegistrationDate)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRegistration
                    .InvalidRegistrationDate);
        var normalizedExpiryDate = expiryDate?.Date;
        if (normalizedExpiryDate.HasValue &&
            normalizedRegistrationDate > normalizedExpiryDate.Value)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRegistration
                    .InvalidDateRange);

        ProductId = productId;
        RegistrationNumber =
            registrationNumber.Trim().ToUpperInvariant();
        ReceiptNumber = Normalize(receiptNumber);
        RegistrationDate = normalizedRegistrationDate;
        ReceiptDate = receiptDate?.Date;
        ExpiryDate = normalizedExpiryDate;
        ProductName = productName.Trim();
        Manufacturer = Normalize(manufacturer);
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
                FoodSafeDomainErrorCodes.ProductRegistration
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
