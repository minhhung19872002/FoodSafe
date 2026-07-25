using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Organizations;

public class Organization : FullAuditedAggregateRoot<Guid>
{
    public Guid? ParentId { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public string Name { get; private set; } = string.Empty;
    public OrganizationLevel Level { get; private set; }
    public string? Address { get; private set; }
    public string? Phone { get; private set; }
    public string? Email { get; private set; }
    public string? LeaderName { get; private set; }
    public Guid? ProvinceId { get; private set; }
    public Guid? DistrictId { get; private set; }
    public Guid? CommuneId { get; private set; }
    public bool IsActive { get; private set; }

    protected Organization()
    {
    }

    private Organization(Guid id)
        : base(id)
    {
    }

    public static Organization Create(
        Guid id,
        string code,
        string name,
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId,
        string? address = null,
        string? phone = null,
        string? email = null,
        string? leaderName = null)
    {
        var organization = new Organization(id);
        organization.SetDetails(
            code, name, level, parentId, provinceId, districtId, communeId,
            address, phone, email, leaderName);
        organization.IsActive = true;
        return organization;
    }

    public void Update(
        string code,
        string name,
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId,
        string? address,
        string? phone,
        string? email,
        string? leaderName,
        bool isActive)
    {
        SetDetails(
            code, name, level, parentId, provinceId, districtId, communeId,
            address, phone, email, leaderName);
        IsActive = isActive;
    }

    private void SetDetails(
        string code,
        string name,
        OrganizationLevel level,
        Guid? parentId,
        Guid? provinceId,
        Guid? districtId,
        Guid? communeId,
        string? address,
        string? phone,
        string? email,
        string? leaderName)
    {
        Check.NotNullOrWhiteSpace(code, nameof(code), 50);
        Check.NotNullOrWhiteSpace(name, nameof(name), 200);
        OrganizationHierarchyRules.ValidateShape(
            level, parentId, provinceId, districtId, communeId);

        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        Level = level;
        ParentId = parentId;
        ProvinceId = provinceId;
        DistrictId = districtId;
        CommuneId = communeId;
        Address = Normalize(address);
        Phone = Normalize(phone);
        Email = Normalize(email);
        LeaderName = Normalize(leaderName);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
