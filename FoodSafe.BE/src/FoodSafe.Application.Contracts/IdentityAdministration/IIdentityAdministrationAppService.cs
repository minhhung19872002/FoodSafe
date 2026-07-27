using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.IdentityAdministration;

public interface IIdentityAdministrationAppService : IApplicationService
{
    Task<PagedResultDto<AdminUserDto>> GetUsersAsync(GetAdminUserListInput input);
    Task<AdminUserDto> GetUserAsync(Guid id);
    Task<AdminUserDto> CreateUserAsync(CreateAdminUserDto input);
    Task<AdminUserDto> UpdateUserAsync(Guid id, UpdateAdminUserDto input);
    Task SetUserActivationAsync(Guid id, SetUserActivationDto input);
    Task SetUserLockAsync(Guid id, SetUserLockDto input);
    Task SendPasswordResetAsync(Guid id);
    Task DeleteUserAsync(Guid id);
    Task<PagedResultDto<UserActivityDto>> GetUserActivityAsync(
        Guid id,
        PagedAndSortedResultRequestDto input);

    Task<PagedResultDto<AdminRoleDto>> GetRolesAsync(GetAdminRoleListInput input);
    Task<AdminRoleDto> GetRoleAsync(Guid id);
    Task<AdminRoleDto> CreateRoleAsync(CreateAdminRoleDto input);
    Task<AdminRoleDto> UpdateRoleAsync(Guid id, UpdateAdminRoleDto input);
    Task DeleteRoleAsync(Guid id);
    Task<ListResultDto<RolePermissionGroupDto>> GetRolePermissionsAsync(Guid id);
    Task UpdateRolePermissionsAsync(Guid id, UpdateRolePermissionsDto input);
}
