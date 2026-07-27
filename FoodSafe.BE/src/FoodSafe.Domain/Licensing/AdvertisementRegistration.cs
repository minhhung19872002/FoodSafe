using FoodSafe.BusinessManagement;
using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Licensing;

public sealed class AdvertisementRegistration :
    FullAuditedAggregateRoot<Guid>
{
    private readonly List<AdvertisementRegistrationProduct> _products = [];

    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid? AdvertisementTypeId { get; private set; }
    public string RegistrationNumber { get; private set; } = string.Empty;
    public DateTime RegistrationDate { get; private set; }
    public DateTime? ExpiryDate { get; private set; }
    public string? ContentDescription { get; private set; }
    public string? Medium { get; private set; }
    public LicenseStatus Status { get; private set; }
    public string? RevokeReason { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public Guid? RevokedById { get; private set; }
    public string? Notes { get; private set; }
    public IReadOnlyCollection<AdvertisementRegistrationProduct> Products =>
        _products;

    private AdvertisementRegistration()
    {
    }

    private AdvertisementRegistration(Guid id) : base(id)
    {
    }

    public static AdvertisementRegistration Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        Guid? advertisementTypeId,
        string registrationNumber,
        DateTime registrationDate,
        DateTime? expiryDate,
        string? contentDescription,
        string? medium,
        string? notes,
        IEnumerable<Guid> productIds,
        DateTime today)
    {
        var registration = new AdvertisementRegistration(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        registration.Update(
            advertisementTypeId,
            registrationNumber,
            registrationDate,
            expiryDate,
            contentDescription,
            medium,
            notes,
            productIds,
            today);
        return registration;
    }

    public void Update(
        Guid? advertisementTypeId,
        string registrationNumber,
        DateTime registrationDate,
        DateTime? expiryDate,
        string? contentDescription,
        string? medium,
        string? notes,
        IEnumerable<Guid> productIds,
        DateTime today)
    {
        EnsureMutable();
        Check.NotNullOrWhiteSpace(
            registrationNumber,
            nameof(registrationNumber),
            100);
        var normalizedDate = registrationDate.Date;
        var normalizedExpiry = expiryDate?.Date;
        if (normalizedExpiry.HasValue &&
            normalizedDate > normalizedExpiry.Value)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .InvalidDateRange);
        var normalizedProducts = productIds.Distinct().ToArray();
        if (normalizedProducts.Length == 0)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .ProductsRequired);

        AdvertisementTypeId = advertisementTypeId;
        RegistrationNumber =
            registrationNumber.Trim().ToUpperInvariant();
        RegistrationDate = normalizedDate;
        ExpiryDate = normalizedExpiry;
        ContentDescription = Normalize(contentDescription);
        Medium = Normalize(medium);
        Notes = Normalize(notes);
        _products.RemoveAll(
            current => !normalizedProducts.Contains(current.ProductId));
        foreach (var productId in normalizedProducts.Where(
                     id => _products.All(x => x.ProductId != id)))
            _products.Add(new AdvertisementRegistrationProduct(
                Id,
                productId,
                BusinessId,
                OrganizationId));
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
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .AlreadyRevoked);
        Check.NotNullOrWhiteSpace(reason, nameof(reason), 2000);
        RevokeReason = reason.Trim();
        RevokedAt = revokedAt;
        RevokedById = revokedById;
        Status = LicenseStatus.Revoked;
    }

    private void EnsureMutable()
    {
        if (Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .CannotModifyRevoked);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class AdvertisementRegistrationProduct : Entity
{
    public Guid AdvertisementRegistrationId { get; private set; }
    public Guid ProductId { get; private set; }
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }

    private AdvertisementRegistrationProduct()
    {
    }

    internal AdvertisementRegistrationProduct(
        Guid advertisementRegistrationId,
        Guid productId,
        Guid businessId,
        Guid organizationId)
    {
        AdvertisementRegistrationId = advertisementRegistrationId;
        ProductId = productId;
        BusinessId = businessId;
        OrganizationId = organizationId;
    }

    public override object[] GetKeys() =>
        [AdvertisementRegistrationId, ProductId];
}
