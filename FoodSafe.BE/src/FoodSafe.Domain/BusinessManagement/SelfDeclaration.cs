using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.BusinessManagement;

public sealed class SelfDeclaration : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid? ProductId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string DeclarationNumber { get; private set; } = string.Empty;
    public DateTime DeclarationDate { get; private set; }
    public string ProductName { get; private set; } = string.Empty;
    public string? Manufacturer { get; private set; }
    public string? Purpose { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }

    private SelfDeclaration()
    {
    }

    private SelfDeclaration(Guid id) : base(id)
    {
    }

    public static SelfDeclaration Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? productId,
        string declarationNumber,
        DateTime declarationDate,
        string productName,
        string? manufacturer,
        string? purpose,
        DateTime? expiryDate,
        string? notes,
        DateTime today)
    {
        var declaration = new SelfDeclaration(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        declaration.Update(
            productId,
            declarationNumber,
            declarationDate,
            productName,
            manufacturer,
            purpose,
            expiryDate,
            notes,
            today);
        return declaration;
    }

    public void Update(
        Guid? productId,
        string declarationNumber,
        DateTime declarationDate,
        string productName,
        string? manufacturer,
        string? purpose,
        DateTime? expiryDate,
        string? notes,
        DateTime today)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration.CannotModifyRevoked);
        Check.NotNullOrWhiteSpace(
            declarationNumber,
            nameof(declarationNumber),
            100);
        Check.NotNullOrWhiteSpace(productName, nameof(productName), 500);

        var normalizedDeclarationDate = declarationDate.Date;
        var normalizedExpiryDate = expiryDate?.Date;
        if (normalizedExpiryDate.HasValue &&
            normalizedDeclarationDate > normalizedExpiryDate.Value)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration.InvalidDateRange);

        ProductId = productId;
        DeclarationNumber = declarationNumber.Trim().ToUpperInvariant();
        DeclarationDate = normalizedDeclarationDate;
        ProductName = productName.Trim();
        Manufacturer = Normalize(manufacturer);
        Purpose = Normalize(purpose);
        ExpiryDate = normalizedExpiryDate;
        Notes = Normalize(notes);
        Status = EffectiveStatus(today);
    }

    public void Revoke(string reason, DateTime revokedAt, Guid revokedById)
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration.AlreadyRevoked);
        Check.NotNullOrWhiteSpace(reason, nameof(reason), 2000);
        RevokeReason = reason.Trim();
        RevokedAt = revokedAt;
        RevokedById = revokedById;
        Status = LicenseStatus.Revoked;
    }

    public LicenseStatus EffectiveStatus(DateTime today) =>
        Status == LicenseStatus.Revoked
            ? LicenseStatus.Revoked
            : ExpiryDate.HasValue && ExpiryDate.Value.Date < today.Date
                ? LicenseStatus.Expired
                : LicenseStatus.Active;

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
