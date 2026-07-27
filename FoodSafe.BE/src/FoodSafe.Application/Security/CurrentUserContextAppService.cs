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
        FoodSafePermissions.AlertsAndTesting.Alerts.View,
        FoodSafePermissions.AlertsAndTesting.Alerts.Create,
        FoodSafePermissions.AlertsAndTesting.Alerts.Edit,
        FoodSafePermissions.AlertsAndTesting.Alerts.Delete,
        FoodSafePermissions.AlertsAndTesting.Alerts.Publish,
        FoodSafePermissions.AlertsAndTesting.News.View,
        FoodSafePermissions.AlertsAndTesting.News.Create,
        FoodSafePermissions.AlertsAndTesting.News.Edit,
        FoodSafePermissions.AlertsAndTesting.News.Delete,
        FoodSafePermissions.AlertsAndTesting.News.Publish,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Create,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Edit,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Delete,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Publish,
        FoodSafePermissions.AlertsAndTesting.TestingResults.View,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Create,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Edit,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Delete,
        FoodSafePermissions.AlertsAndTesting.Documents.View,
        FoodSafePermissions.AlertsAndTesting.Documents.Create,
        FoodSafePermissions.AlertsAndTesting.Documents.Edit,
        FoodSafePermissions.AlertsAndTesting.Documents.Delete,
        FoodSafePermissions.FoodPoisoning.Cases.View,
        FoodSafePermissions.FoodPoisoning.Cases.Create,
        FoodSafePermissions.FoodPoisoning.Cases.Edit,
        FoodSafePermissions.FoodPoisoning.Cases.Delete,
        FoodSafePermissions.FoodPoisoning.Cases.Verify,
        FoodSafePermissions.FoodPoisoning.Incidents.View,
        FoodSafePermissions.FoodPoisoning.Incidents.Create,
        FoodSafePermissions.FoodPoisoning.Incidents.Edit,
        FoodSafePermissions.FoodPoisoning.Incidents.Delete,
        FoodSafePermissions.FoodPoisoning.Incidents.Verify,
        FoodSafePermissions.FoodPoisoning.Incidents.Conclude,
        FoodSafePermissions.Reporting.NdtpReports.View,
        FoodSafePermissions.Reporting.NdtpReports.Create,
        FoodSafePermissions.Reporting.NdtpReports.Edit,
        FoodSafePermissions.Reporting.NdtpReports.Delete,
        FoodSafePermissions.Reporting.NdtpReports.Submit,
        FoodSafePermissions.Reporting.NdtpReports.Verify,
        FoodSafePermissions.Reporting.NdtpReports.Return,
        FoodSafePermissions.Reporting.NdtpReports.Complete,
        FoodSafePermissions.Reporting.AtpWorkReports.View,
        FoodSafePermissions.Reporting.AtpWorkReports.Create,
        FoodSafePermissions.Reporting.AtpWorkReports.Edit,
        FoodSafePermissions.Reporting.AtpWorkReports.Delete,
        FoodSafePermissions.Reporting.AtpWorkReports.Submit,
        FoodSafePermissions.Reporting.AtpWorkReports.Verify,
        FoodSafePermissions.Reporting.AtpWorkReports.Return,
        FoodSafePermissions.Reporting.AtpWorkReports.Complete,
        FoodSafePermissions.Reporting.ActionMonthReports.View,
        FoodSafePermissions.Reporting.ActionMonthReports.Create,
        FoodSafePermissions.Reporting.ActionMonthReports.Edit,
        FoodSafePermissions.Reporting.ActionMonthReports.Delete,
        FoodSafePermissions.Reporting.ActionMonthReports.Submit,
        FoodSafePermissions.Reporting.ActionMonthReports.Verify,
        FoodSafePermissions.Reporting.ActionMonthReports.Return,
        FoodSafePermissions.Reporting.ActionMonthReports.Complete,
        FoodSafePermissions.SystemAdministration.Default,
        FoodSafePermissions.SystemAdministration.Users.Default,
        FoodSafePermissions.SystemAdministration.Users.Create,
        FoodSafePermissions.SystemAdministration.Users.Edit,
        FoodSafePermissions.SystemAdministration.Users.ManageRoles,
        FoodSafePermissions.SystemAdministration.Users.ManageScope,
        FoodSafePermissions.SystemAdministration.Users.Activate,
        FoodSafePermissions.SystemAdministration.Users.Lock,
        FoodSafePermissions.SystemAdministration.Users.ResetPassword,
        FoodSafePermissions.SystemAdministration.Users.ViewActivity,
        FoodSafePermissions.SystemAdministration.Roles.Default,
        FoodSafePermissions.SystemAdministration.Roles.Create,
        FoodSafePermissions.SystemAdministration.Roles.Edit,
        FoodSafePermissions.SystemAdministration.Roles.Delete,
        FoodSafePermissions.SystemAdministration.Roles.ManagePermissions,
        FoodSafePermissions.SystemAdministration.AuditLogs,
        FoodSafePermissions.SystemAdministration.Settings,
        FoodSafePermissions.DataIntegration.ApiEndpoints.View,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Create,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Edit,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Delete,
        FoodSafePermissions.DataIntegration.CallHistory.View,
        FoodSafePermissions.DataIntegration.Share,
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
