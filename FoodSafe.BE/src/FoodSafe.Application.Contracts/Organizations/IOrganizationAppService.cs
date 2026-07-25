using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Organizations;

public interface IOrganizationAppService : IApplicationService
{
    Task<PagedResultDto<OrganizationDto>> GetListAsync(GetOrganizationListInput input);
    Task<ListResultDto<OrganizationTreeNodeDto>> GetTreeAsync();
    Task<OrganizationDto> GetAsync(Guid id);
    Task<OrganizationDto> CreateAsync(CreateOrganizationDto input);
    Task<OrganizationDto> UpdateAsync(Guid id, UpdateOrganizationDto input);
    Task DeleteAsync(Guid id);
}
