using FoodSafe.Organizations;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Security;

[Authorize]
public class CurrentUserContextAppService :
    ApplicationService,
    ICurrentUserContextAppService
{
    private static readonly string[] FoodSafePermissionNames =
    [
        FoodSafePermissions.Organizations.View,
        FoodSafePermissions.Organizations.Create,
        FoodSafePermissions.Organizations.Edit,
        FoodSafePermissions.Organizations.Delete,
        FoodSafePermissions.GeographicCatalogs.View,
        FoodSafePermissions.GeographicCatalogs.Manage,
        FoodSafePermissions.DataScope.All
    ];

    private readonly ICurrentUser _currentUser;
    private readonly IPermissionChecker _permissionChecker;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IIdentityUserRepository _users;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public CurrentUserContextAppService(
        ICurrentUser currentUser,
        IPermissionChecker permissionChecker,
        IRepository<AppUserProfile, Guid> profiles,
        IRepository<Organization, Guid> organizations,
        IIdentityUserRepository users,
        ICancellationTokenProvider cancellationTokens)
    {
        _currentUser = currentUser;
        _permissionChecker = permissionChecker;
        _profiles = profiles;
        _organizations = organizations;
        _users = users;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<CurrentUserContextDto> GetAsync()
    {
        var userId = _currentUser.GetId();
        var token = _cancellationTokens.Token;
        var profileQuery = await _profiles.GetQueryableAsync();
        var profile = await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(x => x.UserId == userId),
            token);
        Organization? organization = null;
        if (profile is not null)
        {
            organization = await _organizations.FindAsync(
                profile.OrganizationId,
                cancellationToken: token);
        }

        var granted = new List<string>();
        foreach (var permission in FoodSafePermissionNames)
        {
            if (await _permissionChecker.IsGrantedAsync(permission))
            {
                granted.Add(permission);
            }
        }

        var user = await _users.FindAsync(userId, cancellationToken: token);
        return new CurrentUserContextDto
        {
            Id = userId,
            UserName = _currentUser.UserName ?? string.Empty,
            Name = _currentUser.Name ?? profile?.FullName ?? string.Empty,
            Email = _currentUser.Email ?? string.Empty,
            OrganizationId = profile?.OrganizationId,
            OrganizationName = organization?.Name,
            Roles = _currentUser.Roles.ToArray(),
            Permissions = granted.ToArray(),
            PasswordMustChange = user?.ShouldChangePasswordOnNextLogin
                ?? profile?.MustChangePassword
                ?? false
        };
    }
}
