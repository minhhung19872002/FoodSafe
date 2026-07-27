namespace FoodSafe.Organizations;

public sealed class UpdateOrganizationDto : CreateOrganizationDto
{
    public bool IsActive { get; set; } = true;
}
