using Volo.Abp.Application.Dtos;

namespace FoodSafe.Organizations;

public sealed class GetOrganizationListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public OrganizationLevel? Level { get; set; }
    public Guid? ParentId { get; set; }
    public bool? IsActive { get; set; }

    public GetOrganizationListInput()
    {
        MaxResultCount = 50;
        Sorting = "Code";
    }
}
