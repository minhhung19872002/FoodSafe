using Asp.Versioning;
using FoodSafe.BusinessManagement;
using FoodSafe.IdentityAdministration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Controllers;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/administration")]
public sealed class IdentityAdministrationController(
    IIdentityAdministrationAppService service,
    IUserExcelAppService userExcel) : AbpControllerBase
{
    [HttpGet("users")]
    public Task<PagedResultDto<AdminUserDto>> GetUsersAsync(
        [FromQuery] GetAdminUserListInput input) =>
        service.GetUsersAsync(input);

    [HttpGet("users/{id:guid}")]
    public Task<AdminUserDto> GetUserAsync(Guid id) =>
        service.GetUserAsync(id);

    [HttpPost("users")]
    public Task<AdminUserDto> CreateUserAsync(
        [FromBody] CreateAdminUserDto input) =>
        service.CreateUserAsync(input);

    [HttpPut("users/{id:guid}")]
    public Task<AdminUserDto> UpdateUserAsync(
        Guid id,
        [FromBody] UpdateAdminUserDto input) =>
        service.UpdateUserAsync(id, input);

    [HttpPut("users/{id:guid}/activation")]
    public Task SetUserActivationAsync(
        Guid id,
        [FromBody] SetUserActivationDto input) =>
        service.SetUserActivationAsync(id, input);

    [HttpPut("users/{id:guid}/lock")]
    public Task SetUserLockAsync(
        Guid id,
        [FromBody] SetUserLockDto input) =>
        service.SetUserLockAsync(id, input);

    [HttpDelete("users/{id:guid}")]
    public Task DeleteUserAsync(Guid id) =>
        service.DeleteUserAsync(id);

    [HttpPost("users/{id:guid}/random-password")]
    public Task<GeneratedPasswordDto> GenerateRandomPasswordAsync(Guid id) =>
        service.GenerateRandomPasswordAsync(id);

    [HttpGet("permission-options")]
    public Task<ListResultDto<PermissionOptionDto>>
        GetPermissionOptionsAsync() =>
        service.GetPermissionOptionsAsync();

    [HttpPost("users/{id:guid}/password-reset")]
    public Task SendPasswordResetAsync(Guid id) =>
        service.SendPasswordResetAsync(id);

    [HttpGet("users/excel")]
    public async Task<IActionResult> ExportUsersAsync(
        [FromQuery] GetAdminUserListInput input)
    {
        var file = await userExcel.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("users/{id:guid}/activity")]
    public Task<PagedResultDto<UserActivityDto>> GetUserActivityAsync(
        Guid id,
        [FromQuery] PagedAndSortedResultRequestDto input) =>
        service.GetUserActivityAsync(id, input);

    [HttpGet("roles")]
    public Task<PagedResultDto<AdminRoleDto>> GetRolesAsync(
        [FromQuery] GetAdminRoleListInput input) =>
        service.GetRolesAsync(input);

    [HttpGet("roles/{id:guid}")]
    public Task<AdminRoleDto> GetRoleAsync(Guid id) =>
        service.GetRoleAsync(id);

    [HttpPost("roles")]
    public Task<AdminRoleDto> CreateRoleAsync(
        [FromBody] CreateAdminRoleDto input) =>
        service.CreateRoleAsync(input);

    [HttpPut("roles/{id:guid}")]
    public Task<AdminRoleDto> UpdateRoleAsync(
        Guid id,
        [FromBody] UpdateAdminRoleDto input) =>
        service.UpdateRoleAsync(id, input);

    [HttpDelete("roles/{id:guid}")]
    public Task DeleteRoleAsync(Guid id) =>
        service.DeleteRoleAsync(id);

    [HttpGet("roles/{id:guid}/permissions")]
    public Task<ListResultDto<RolePermissionGroupDto>>
        GetRolePermissionsAsync(Guid id) =>
        service.GetRolePermissionsAsync(id);

    [HttpPut("roles/{id:guid}/permissions")]
    public Task UpdateRolePermissionsAsync(
        Guid id,
        [FromBody] UpdateRolePermissionsDto input) =>
        service.UpdateRolePermissionsAsync(id, input);
}
