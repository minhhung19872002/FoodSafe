using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Auditing;

namespace FoodSafe.Catalogs;

public abstract class MasterCatalog : Entity<Guid>, IAggregateRoot<Guid>, ISoftDelete, IAuditedObject
{
    public string Code { get; protected set; } = string.Empty;
    public string Name { get; protected set; } = string.Empty;
    public string? Description { get; protected set; }
    public bool IsActive { get; protected set; }
    public int SortOrder { get; protected set; }
    public bool IsDeleted { get; set; }
    public DateTime CreationTime { get; set; }
    public Guid? CreatorId { get; set; }
    public DateTime? LastModificationTime { get; set; }
    public Guid? LastModifierId { get; set; }

    protected void SetCommon(string code, string name, string? description, int sortOrder, bool isActive)
    {
        Code = Check.NotNullOrWhiteSpace(code, nameof(code), 50).Trim().ToUpperInvariant();
        Name = Check.NotNullOrWhiteSpace(name, nameof(name), 200).Trim();
        Description = Normalize(description);
        SortOrder = sortOrder;
        IsActive = isActive;
    }

    protected static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class BusinessType : MasterCatalog
{
    private BusinessType() { }
    public static BusinessType Create(Guid id, string code, string name, string? description, int sortOrder, bool isActive)
    {
        var item = new BusinessType { Id = id };
        item.Update(code, name, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, string? description, int sortOrder, bool isActive) =>
        SetCommon(code, name, description, sortOrder, isActive);
}

public sealed class AdvertisementType : MasterCatalog
{
    private AdvertisementType() { }
    public static AdvertisementType Create(Guid id, string code, string name, string? description, int sortOrder, bool isActive)
    {
        var item = new AdvertisementType { Id = id };
        item.Update(code, name, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, string? description, int sortOrder, bool isActive) =>
        SetCommon(code, name, description, sortOrder, isActive);
}

public sealed class DocumentType : MasterCatalog
{
    private DocumentType() { }
    public static DocumentType Create(Guid id, string code, string name, string? description, int sortOrder, bool isActive)
    {
        var item = new DocumentType { Id = id };
        item.Update(code, name, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, string? description, int sortOrder, bool isActive) =>
        SetCommon(code, name, description, sortOrder, isActive);
}

public sealed class BusinessClassification : MasterCatalog
{
    public string Criteria { get; private set; } = string.Empty;
    public BusinessRiskLevel RiskLevel { get; private set; }

    private BusinessClassification() { }
    public static BusinessClassification Create(Guid id, string code, string name, string criteria,
        BusinessRiskLevel riskLevel, string? description, int sortOrder, bool isActive)
    {
        var item = new BusinessClassification { Id = id };
        item.Update(code, name, criteria, riskLevel, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, string criteria, BusinessRiskLevel riskLevel,
        string? description, int sortOrder, bool isActive)
    {
        if (!Enum.IsDefined(riskLevel))
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidRiskLevel);
        SetCommon(code, name, description, sortOrder, isActive);
        Criteria = Check.NotNullOrWhiteSpace(criteria, nameof(criteria), 2000).Trim();
        RiskLevel = riskLevel;
    }
}

public sealed class ProductGroup : MasterCatalog
{
    public short Level { get; private set; }
    public Guid? ParentId { get; private set; }

    private ProductGroup() { }
    public static ProductGroup Create(Guid id, string code, string name, short level, Guid? parentId,
        string? description, int sortOrder, bool isActive)
    {
        var item = new ProductGroup { Id = id };
        item.Update(code, name, level, parentId, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, short level, Guid? parentId, string? description,
        int sortOrder, bool isActive)
    {
        if (level is < 1 or > 2 || (level == 1 && parentId.HasValue) || (level == 2 && !parentId.HasValue)
            || parentId == Id)
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidProductGroupHierarchy);
        SetCommon(code, name, description, sortOrder, isActive);
        Level = level;
        ParentId = parentId;
    }
}

public sealed class TestingCenter : MasterCatalog
{
    public string Address { get; private set; } = string.Empty;
    public Guid ProvinceId { get; private set; }
    public Guid? CommuneId { get; private set; }
    public string? ContactPerson { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string AccreditationNumber { get; private set; } = string.Empty;
    public string AccreditationScope { get; private set; } = string.Empty;
    public DateTime AccreditationExpiresAt { get; private set; }

    private TestingCenter() { }
    public static TestingCenter Create(Guid id, string code, string name, string address, Guid provinceId,
        Guid? communeId, string? contactPerson, string? phone, string? email,
        string accreditationNumber, string accreditationScope, DateTime accreditationExpiresAt,
        string? description, int sortOrder, bool isActive)
    {
        var item = new TestingCenter { Id = id };
        item.Update(code, name, address, provinceId, communeId, contactPerson, phone, email,
            accreditationNumber, accreditationScope, accreditationExpiresAt, description, sortOrder, isActive);
        return item;
    }
    public void Update(string code, string name, string address, Guid provinceId,
        Guid? communeId, string? contactPerson, string? phone, string? email, string accreditationNumber,
        string accreditationScope, DateTime accreditationExpiresAt, string? description, int sortOrder, bool isActive)
    {
        SetCommon(code, name, description, sortOrder, isActive);
        Address = Check.NotNullOrWhiteSpace(address, nameof(address), 500).Trim();
        ProvinceId = provinceId;
        CommuneId = communeId;
        ContactPerson = Normalize(contactPerson);
        Phone = Normalize(phone);
        Email = Normalize(email);
        AccreditationNumber = Check.NotNullOrWhiteSpace(accreditationNumber, nameof(accreditationNumber), 100).Trim();
        AccreditationScope = Check.NotNullOrWhiteSpace(accreditationScope, nameof(accreditationScope), 2000).Trim();
        AccreditationExpiresAt = accreditationExpiresAt;
    }
}

public sealed class TestingService : MasterCatalog
{
    public Guid TestingCenterId { get; private set; }
    public string Unit { get; private set; } = string.Empty;
    public string Method { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int TurnaroundDays { get; private set; }

    private TestingService() { }
    public static TestingService Create(Guid id, Guid testingCenterId, string code, string name,
        string unit, string method, decimal price, int turnaroundDays, string? description, int sortOrder, bool isActive)
    {
        var item = new TestingService { Id = id };
        item.Update(testingCenterId, code, name, unit, method, price, turnaroundDays, description, sortOrder, isActive);
        return item;
    }
    public void Update(Guid testingCenterId, string code, string name, string unit, string method,
        decimal price, int turnaroundDays, string? description, int sortOrder, bool isActive)
    {
        if (price < 0 || turnaroundDays < 0)
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidTestingService);
        SetCommon(code, name, description, sortOrder, isActive);
        TestingCenterId = testingCenterId;
        Unit = Check.NotNullOrWhiteSpace(unit, nameof(unit), 50).Trim();
        Method = Check.NotNullOrWhiteSpace(method, nameof(method), 500).Trim();
        Price = price;
        TurnaroundDays = turnaroundDays;
    }
}
