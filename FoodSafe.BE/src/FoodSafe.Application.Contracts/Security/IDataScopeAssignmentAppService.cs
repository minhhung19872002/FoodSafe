using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Security;

public interface IDataScopeAssignmentAppService : IApplicationService
{
    Task<PagedResultDto<DataScopeAssignmentDto>> GetAssignmentsAsync(
        DataScopeAssignmentListInput input);

    Task<DataScopeAssignmentDto> CreateAssignmentAsync(
        CreateDataScopeAssignmentInput input);

    Task DeleteAssignmentAsync(Guid id);
}
