using System.Reflection;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Xunit;

namespace FoodSafe.Security;

public sealed class CurrentUserContextPermissionContractTests
{
    [Fact]
    public void Frontend_permission_projection_includes_business_management()
    {
        var field = typeof(CurrentUserContextAppService).GetField(
            "FoodSafePermissionNames",
            BindingFlags.NonPublic | BindingFlags.Static);

        var permissions = Assert.IsType<string[]>(field?.GetValue(null));

        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Businesses.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Businesses.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Businesses.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Businesses.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Businesses.Import,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Products.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Products.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Products.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.Products.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ProductRegistrations.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ProductRegistrations.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ProductRegistrations.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ProductRegistrations.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.AdRegistrations.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.AdRegistrations.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.AdRegistrations.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.AdRegistrations.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.EligibilityCertificates.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.EligibilityCertificates.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.EligibilityCertificates.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.EligibilityCertificates.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.CfsCertificates.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.CfsCertificates.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.CfsCertificates.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.CfsCertificates.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ExportCertificates.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ExportCertificates.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ExportCertificates.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Licensing.ExportCertificates.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Plans.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Plans.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Plans.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Plans.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Plans.Approve,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Results.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Results.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Results.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.Inspection.Results.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.Alerts.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.Alerts.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.Alerts.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.Alerts.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.Alerts.Publish,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.News.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.News.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.News.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.News.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.AlertsAndTesting.News.Publish,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Cases.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Cases.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Cases.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Cases.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Cases.Verify,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.View,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.Verify,
            permissions);
        Assert.Contains(
            FoodSafePermissions.FoodPoisoning.Incidents.Conclude,
            permissions);
    }

    /// <summary>
    /// Regression guard for P1-1c: the identity-administration page gates each
    /// row action on a permission surfaced through this projection. A permission
    /// that is granted server-side but absent from this allowlist is never
    /// reported to the frontend, so its control silently never renders — which is
    /// exactly how <c>Users.Delete</c> shipped invisible. Every action the page
    /// depends on must therefore be projected.
    /// </summary>
    [Fact]
    public void Frontend_permission_projection_includes_system_administration()
    {
        var field = typeof(CurrentUserContextAppService).GetField(
            "FoodSafePermissionNames",
            BindingFlags.NonPublic | BindingFlags.Static);

        var permissions = Assert.IsType<string[]>(field?.GetValue(null));

        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Default,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.ManageRoles,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.ManageScope,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Activate,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.Lock,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.ResetPassword,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Users.ViewActivity,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Roles.Default,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Roles.Create,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Roles.Edit,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Roles.Delete,
            permissions);
        Assert.Contains(
            FoodSafePermissions.SystemAdministration.Roles.ManagePermissions,
            permissions);
    }
}
