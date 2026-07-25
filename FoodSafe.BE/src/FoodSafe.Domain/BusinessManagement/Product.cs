using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.BusinessManagement;

public sealed class Product : FullAuditedAggregateRoot<Guid>
{
    public Guid BusinessId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string? Code { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public Guid? ProductGroupId { get; private set; }
    public string? BrandName { get; private set; }
    public string? Manufacturer { get; private set; }
    public Guid? ManufacturingCountryId { get; private set; }
    public string? NetWeight { get; private set; }
    public string? Specifications { get; private set; }
    public string? Ingredients { get; private set; }
    public int? ExpiryPeriodMonths { get; private set; }
    public string? StorageConditions { get; private set; }
    public string? UsageInstructions { get; private set; }
    public ProductStatus Status { get; private set; }
    public string? Notes { get; private set; }

    private Product()
    {
    }

    private Product(Guid id) : base(id)
    {
    }

    public static Product Create(
        Guid id,
        Guid businessId,
        Guid organizationId,
        string? code,
        string name,
        Guid? productGroupId,
        string? brandName,
        string? manufacturer,
        Guid? manufacturingCountryId,
        string? netWeight,
        string? specifications,
        string? ingredients,
        int? expiryPeriodMonths,
        string? storageConditions,
        string? usageInstructions,
        string? notes)
    {
        var product = new Product(id)
        {
            BusinessId = businessId,
            OrganizationId = organizationId
        };
        product.Update(
            code, name, productGroupId, brandName, manufacturer,
            manufacturingCountryId, netWeight, specifications, ingredients,
            expiryPeriodMonths, storageConditions, usageInstructions, notes);
        product.Status = ProductStatus.Active;
        return product;
    }

    public void Update(
        string? code,
        string name,
        Guid? productGroupId,
        string? brandName,
        string? manufacturer,
        Guid? manufacturingCountryId,
        string? netWeight,
        string? specifications,
        string? ingredients,
        int? expiryPeriodMonths,
        string? storageConditions,
        string? usageInstructions,
        string? notes)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), 500);
        if (expiryPeriodMonths < 0)
            throw new BusinessException(FoodSafeDomainErrorCodes.Product.InvalidExpiryPeriod);

        Code = Normalize(code)?.ToUpperInvariant();
        Name = name.Trim();
        ProductGroupId = productGroupId;
        BrandName = Normalize(brandName);
        Manufacturer = Normalize(manufacturer);
        ManufacturingCountryId = manufacturingCountryId;
        NetWeight = Normalize(netWeight);
        Specifications = Normalize(specifications);
        Ingredients = Normalize(ingredients);
        ExpiryPeriodMonths = expiryPeriodMonths;
        StorageConditions = Normalize(storageConditions);
        UsageInstructions = Normalize(usageInstructions);
        Notes = Normalize(notes);
    }

    public void SetStatus(ProductStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new BusinessException(FoodSafeDomainErrorCodes.Product.InvalidStatus);
        Status = status;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
