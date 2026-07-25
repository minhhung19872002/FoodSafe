using Volo.Abp.Application.Dtos;

namespace FoodSafe.Organizations;

public sealed class OrganizationDto : FullAuditedEntityDto<Guid>
{
    public Guid? ParentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public OrganizationLevel Level { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? LeaderName { get; set; }
    public Guid? ProvinceId { get; set; }
    public Guid? DistrictId { get; set; }
    public Guid? CommuneId { get; set; }
    public bool IsActive { get; set; }
}
