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
        FoodSafePermissions.Catalogs.Default,
        FoodSafePermissions.Catalogs.View,
        FoodSafePermissions.Catalogs.Create,
        FoodSafePermissions.Catalogs.Edit,
        FoodSafePermissions.Catalogs.Delete,
        FoodSafePermissions.BusinessManagement.Businesses.View,
        FoodSafePermissions.BusinessManagement.Businesses.Create,
        FoodSafePermissions.BusinessManagement.Businesses.Edit,
        FoodSafePermissions.BusinessManagement.Businesses.Delete,
        FoodSafePermissions.BusinessManagement.Businesses.Import,
        FoodSafePermissions.BusinessManagement.Products.View,
        FoodSafePermissions.BusinessManagement.Products.Create,
        FoodSafePermissions.BusinessManagement.Products.Import,
        FoodSafePermissions.BusinessManagement.Products.Edit,
        FoodSafePermissions.BusinessManagement.Products.Delete,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete,
        FoodSafePermissions.Licensing.ProductRegistrations.View,
        FoodSafePermissions.Licensing.ProductRegistrations.Create,
        FoodSafePermissions.Licensing.ProductRegistrations.Edit,
        FoodSafePermissions.Licensing.ProductRegistrations.Delete,
        FoodSafePermissions.Licensing.AdRegistrations.View,
        FoodSafePermissions.Licensing.AdRegistrations.Create,
        FoodSafePermissions.Licensing.AdRegistrations.Edit,
        FoodSafePermissions.Licensing.AdRegistrations.Delete,
        FoodSafePermissions.Licensing.EligibilityCertificates.View,
        FoodSafePermissions.Licensing.EligibilityCertificates.Create,
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit,
        FoodSafePermissions.Licensing.EligibilityCertificates.Delete,
        FoodSafePermissions.Licensing.CfsCertificates.View,
        FoodSafePermissions.Licensing.CfsCertificates.Create,
        FoodSafePermissions.Licensing.CfsCertificates.Edit,
        FoodSafePermissions.Licensing.CfsCertificates.Delete,
        FoodSafePermissions.Licensing.ExportCertificates.View,
        FoodSafePermissions.Licensing.ExportCertificates.Create,
        FoodSafePermissions.Licensing.ExportCertificates.Edit,
        FoodSafePermissions.Licensing.ExportCertificates.Delete,
        FoodSafePermissions.Inspection.Plans.View,
        FoodSafePermissions.Inspection.Plans.Create,
        FoodSafePermissions.Inspection.Plans.Edit,
        FoodSafePermissions.Inspection.Plans.Delete,
        FoodSafePermissions.Inspection.Plans.Approve,
        FoodSafePermissions.Inspection.Results.View,
        FoodSafePermissions.Inspection.Results.Create,
        FoodSafePermissions.Inspection.Results.Edit,
        FoodSafePermissions.Inspection.Results.Delete,
        FoodSafePermissions.SystemAdministration.Default,
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
            PasswordMustChange = user?.ShouldChangePasswordOnNextLogin == true
                || profile?.MustChangePassword == true
                || profile?.IsPasswordExpired(Clock.Now) == true
        };
    }
}
