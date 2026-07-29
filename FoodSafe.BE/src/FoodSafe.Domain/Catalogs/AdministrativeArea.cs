using Volo.Abp;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Auditing;

namespace FoodSafe.Catalogs;

public sealed class Country : Entity<Guid>, IAggregateRoot<Guid>, ISoftDelete, IAuditedObject
{
    public string CodeAlpha2 { get; private set; } = string.Empty;
    public string? CodeAlpha3 { get; private set; }
    public string NameVi { get; private set; } = string.Empty;
    public string? NameEn { get; private set; }
    public bool IsActive { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsDeleted { get; set; }
    public DateTime CreationTime { get; set; }
    public Guid? CreatorId { get; set; }
    public DateTime? LastModificationTime { get; set; }
    public Guid? LastModifierId { get; set; }

    private Country() { }

    private Country(Guid id) => Id = id;

    public static Country Create(
        Guid id,
        string codeAlpha2,
        string nameVi,
        string? codeAlpha3 = null,
        string? nameEn = null,
        int sortOrder = 0)
    {
        var item = new Country(id);
        item.Update(codeAlpha2, nameVi, codeAlpha3, nameEn, sortOrder, true);
        return item;
    }

    public void Update(
        string codeAlpha2,
        string nameVi,
        string? codeAlpha3,
        string? nameEn,
        int sortOrder,
        bool isActive)
    {
        CodeAlpha2 = Check.NotNullOrWhiteSpace(codeAlpha2, nameof(codeAlpha2))
            .Trim().ToUpperInvariant();
        if (CodeAlpha2.Length != 2)
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidCountryCode);
        }

        CodeAlpha3 = Normalize(codeAlpha3)?.ToUpperInvariant();
        if (CodeAlpha3 is { Length: not 3 })
        {
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidCountryCode);
        }

        NameVi = Check.NotNullOrWhiteSpace(nameVi, nameof(nameVi), 200).Trim();
        NameEn = Normalize(nameEn);
        SortOrder = sortOrder;
        IsActive = isActive;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public abstract class AdministrativeArea : Entity<Guid>, IAggregateRoot<Guid>, ISoftDelete, IAuditedObject
{
    public string Code { get; protected set; } = string.Empty;
    public string Name { get; protected set; } = string.Empty;
    public bool IsActive { get; protected set; }
    public int SortOrder { get; protected set; }
    public bool IsDeleted { get; set; }
    public DateTime CreationTime { get; set; }
    public Guid? CreatorId { get; set; }
    public DateTime? LastModificationTime { get; set; }
    public Guid? LastModifierId { get; set; }

    protected AdministrativeArea()
    {
    }

    protected AdministrativeArea(Guid id, string code, string name, int sortOrder)
        : base()
    {
        Id = id;
        SetCommon(code, name, sortOrder);
        IsActive = true;
    }

    public void Update(string code, string name, int sortOrder, bool isActive)
    {
        SetCommon(code, name, sortOrder);
        IsActive = isActive;
    }

    private void SetCommon(string code, string name, int sortOrder)
    {
        Code = Check.NotNullOrWhiteSpace(code, nameof(code), 20).Trim().ToUpperInvariant();
        Name = Check.NotNullOrWhiteSpace(name, nameof(name), 200).Trim();
        SortOrder = sortOrder;
    }
}

public sealed class Region : AdministrativeArea
{
    public string? Description { get; private set; }

    private Region() { }

    private Region(Guid id, string code, string name, string? description, int sortOrder)
        : base(id, code, name, sortOrder) => Description = Normalize(description);

    public static Region Create(Guid id, string code, string name, string? description, int sortOrder = 0) =>
        new(id, code, name, description, sortOrder);

    public void Update(string code, string name, string? description, int sortOrder, bool isActive)
    {
        base.Update(code, name, sortOrder, isActive);
        Description = Normalize(description);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class Province : AdministrativeArea
{
    public Guid? RegionId { get; private set; }
    public string? NameShort { get; private set; }

    private Province() { }

    public static Province Create(Guid id, string code, string name, Guid? regionId, string? nameShort, int sortOrder = 0)
    {
        var item = new Province();
        item.Id = id;
        item.Update(code, name, regionId, nameShort, sortOrder, true);
        return item;
    }

    public void Update(string code, string name, Guid? regionId, string? nameShort, int sortOrder, bool isActive)
    {
        Check.NotNullOrWhiteSpace(code, nameof(code), 10);
        base.Update(code, name, sortOrder, isActive);
        RegionId = regionId;
        NameShort = string.IsNullOrWhiteSpace(nameShort) ? null : nameShort.Trim();
    }
}

public sealed class Commune : AdministrativeArea
{
    public Guid ProvinceId { get; private set; }
    public CommuneType Type { get; private set; }

    private Commune() { }

    public static Commune Create(Guid id, string code, string name, Guid provinceId, CommuneType type, int sortOrder = 0)
    {
        var item = new Commune();
        item.Id = id;
        item.Update(code, name, provinceId, type, sortOrder, true);
        return item;
    }

    public void Update(string code, string name, Guid provinceId, CommuneType type, int sortOrder, bool isActive)
    {
        Check.NotNullOrWhiteSpace(code, nameof(code), 10);
        if (!Enum.IsDefined(type))
            throw new BusinessException(FoodSafeDomainErrorCodes.Catalog.InvalidCommuneType);
        base.Update(code, name, sortOrder, isActive);
        ProvinceId = provinceId;
        Type = type;
    }
}
