using System.ComponentModel.DataAnnotations;

namespace FoodSafe.Organizations;

public class CreateOrganizationDto
{
    public Guid? ParentId { get; set; }

    [Required, StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [EnumDataType(typeof(OrganizationLevel))]
    public OrganizationLevel Level { get; set; }

    [StringLength(1000)]
    public string? Address { get; set; }

    [StringLength(50)]
    public string? Phone { get; set; }

    [EmailAddress, StringLength(200)]
    public string? Email { get; set; }

    [StringLength(200)]
    public string? LeaderName { get; set; }

    public Guid? ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
}
