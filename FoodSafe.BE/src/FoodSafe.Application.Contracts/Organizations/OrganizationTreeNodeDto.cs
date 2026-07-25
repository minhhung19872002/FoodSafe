namespace FoodSafe.Organizations;

public sealed class OrganizationTreeNodeDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public OrganizationLevel Level { get; set; }
    public bool IsActive { get; set; }
    public List<OrganizationTreeNodeDto> Children { get; set; } = [];
}
