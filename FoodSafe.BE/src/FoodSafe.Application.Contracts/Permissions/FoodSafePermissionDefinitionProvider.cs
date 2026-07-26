using FoodSafe.Localization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Localization;

namespace FoodSafe.Permissions;

public sealed class FoodSafePermissionDefinitionProvider : PermissionDefinitionProvider
{
    public override void Define(IPermissionDefinitionContext context)
    {
        var group = context.AddGroup(
            FoodSafePermissions.GroupName,
            LocalizableString.Create<FoodSafeResource>("Permission:FoodSafe"));

        var organizations = group.AddPermission(
            FoodSafePermissions.Organizations.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Organizations"));

        organizations.AddChild(
            FoodSafePermissions.Organizations.View,
            LocalizableString.Create<FoodSafeResource>("Permission:Organizations.View"));
        organizations.AddChild(
            FoodSafePermissions.Organizations.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:Organizations.Create"));
        organizations.AddChild(
            FoodSafePermissions.Organizations.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:Organizations.Edit"));
        organizations.AddChild(
            FoodSafePermissions.Organizations.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:Organizations.Delete"));

        var geography = group.AddPermission(
            FoodSafePermissions.GeographicCatalogs.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:GeographicCatalogs"));
        geography.AddChild(
            FoodSafePermissions.GeographicCatalogs.View,
            LocalizableString.Create<FoodSafeResource>("Permission:GeographicCatalogs.View"));
        geography.AddChild(
            FoodSafePermissions.GeographicCatalogs.Manage,
            LocalizableString.Create<FoodSafeResource>("Permission:GeographicCatalogs.Manage"));

        var catalogs = group.AddPermission(
            FoodSafePermissions.Catalogs.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Catalogs"));
        catalogs.AddChild(FoodSafePermissions.Catalogs.View,
            LocalizableString.Create<FoodSafeResource>("Permission:Catalogs.View"));
        catalogs.AddChild(FoodSafePermissions.Catalogs.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:Catalogs.Create"));
        catalogs.AddChild(FoodSafePermissions.Catalogs.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:Catalogs.Edit"));
        catalogs.AddChild(FoodSafePermissions.Catalogs.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:Catalogs.Delete"));

        var businessManagement = group.AddPermission(
            FoodSafePermissions.BusinessManagement.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:BusinessManagement"));
        var businesses = businessManagement.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses"));
        businesses.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.View,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses.View"));
        businesses.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses.Create"));
        businesses.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses.Edit"));
        businesses.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses.Delete"));
        businesses.AddChild(
            FoodSafePermissions.BusinessManagement.Businesses.Import,
            LocalizableString.Create<FoodSafeResource>("Permission:Businesses.Import"));

        var products = businessManagement.AddChild(
            FoodSafePermissions.BusinessManagement.Products.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Products"));
        products.AddChild(
            FoodSafePermissions.BusinessManagement.Products.View,
            LocalizableString.Create<FoodSafeResource>("Permission:Products.View"));
        products.AddChild(
            FoodSafePermissions.BusinessManagement.Products.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:Products.Create"));
        products.AddChild(
            FoodSafePermissions.BusinessManagement.Products.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:Products.Edit"));
        products.AddChild(
            FoodSafePermissions.BusinessManagement.Products.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:Products.Delete"));
        products.AddChild(
            FoodSafePermissions.BusinessManagement.Products.Import,
            LocalizableString.Create<FoodSafeResource>("Permission:Products.Import"));

        var selfDeclarations = businessManagement.AddChild(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:SelfDeclarations"));
        selfDeclarations.AddChild(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:SelfDeclarations.View"));
        selfDeclarations.AddChild(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:SelfDeclarations.Create"));
        selfDeclarations.AddChild(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:SelfDeclarations.Edit"));
        selfDeclarations.AddChild(
            FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:SelfDeclarations.Delete"));

        var licensing = group.AddPermission(
            FoodSafePermissions.Licensing.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:Licensing"));
        var productRegistrations = licensing.AddChild(
            FoodSafePermissions.Licensing.ProductRegistrations.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ProductRegistrations"));
        productRegistrations.AddChild(
            FoodSafePermissions.Licensing.ProductRegistrations.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ProductRegistrations.View"));
        productRegistrations.AddChild(
            FoodSafePermissions.Licensing.ProductRegistrations.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ProductRegistrations.Create"));
        productRegistrations.AddChild(
            FoodSafePermissions.Licensing.ProductRegistrations.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ProductRegistrations.Edit"));
        productRegistrations.AddChild(
            FoodSafePermissions.Licensing.ProductRegistrations.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ProductRegistrations.Delete"));
        var adRegistrations = licensing.AddChild(
            FoodSafePermissions.Licensing.AdRegistrations.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AdRegistrations"));
        adRegistrations.AddChild(
            FoodSafePermissions.Licensing.AdRegistrations.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AdRegistrations.View"));
        adRegistrations.AddChild(
            FoodSafePermissions.Licensing.AdRegistrations.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AdRegistrations.Create"));
        adRegistrations.AddChild(
            FoodSafePermissions.Licensing.AdRegistrations.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AdRegistrations.Edit"));
        adRegistrations.AddChild(
            FoodSafePermissions.Licensing.AdRegistrations.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AdRegistrations.Delete"));
        var eligibilityCertificates = licensing.AddChild(
            FoodSafePermissions.Licensing.EligibilityCertificates.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:EligibilityCertificates"));
        eligibilityCertificates.AddChild(
            FoodSafePermissions.Licensing.EligibilityCertificates.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:EligibilityCertificates.View"));
        eligibilityCertificates.AddChild(
            FoodSafePermissions.Licensing.EligibilityCertificates.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:EligibilityCertificates.Create"));
        eligibilityCertificates.AddChild(
            FoodSafePermissions.Licensing.EligibilityCertificates.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:EligibilityCertificates.Edit"));
        eligibilityCertificates.AddChild(
            FoodSafePermissions.Licensing.EligibilityCertificates.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:EligibilityCertificates.Delete"));
        var cfsCertificates = licensing.AddChild(
            FoodSafePermissions.Licensing.CfsCertificates.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:CfsCertificates"));
        cfsCertificates.AddChild(
            FoodSafePermissions.Licensing.CfsCertificates.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:CfsCertificates.View"));
        cfsCertificates.AddChild(
            FoodSafePermissions.Licensing.CfsCertificates.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:CfsCertificates.Create"));
        cfsCertificates.AddChild(
            FoodSafePermissions.Licensing.CfsCertificates.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:CfsCertificates.Edit"));
        cfsCertificates.AddChild(
            FoodSafePermissions.Licensing.CfsCertificates.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:CfsCertificates.Delete"));
        var exportCertificates = licensing.AddChild(
            FoodSafePermissions.Licensing.ExportCertificates.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ExportCertificates"));
        exportCertificates.AddChild(
            FoodSafePermissions.Licensing.ExportCertificates.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ExportCertificates.View"));
        exportCertificates.AddChild(
            FoodSafePermissions.Licensing.ExportCertificates.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ExportCertificates.Create"));
        exportCertificates.AddChild(
            FoodSafePermissions.Licensing.ExportCertificates.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ExportCertificates.Edit"));
        exportCertificates.AddChild(
            FoodSafePermissions.Licensing.ExportCertificates.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:ExportCertificates.Delete"));

        var inspection = group.AddPermission(
            FoodSafePermissions.Inspection.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Inspection"));
        var inspectionPlans = inspection.AddChild(
            FoodSafePermissions.Inspection.Plans.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans"));
        inspectionPlans.AddChild(
            FoodSafePermissions.Inspection.Plans.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans.View"));
        inspectionPlans.AddChild(
            FoodSafePermissions.Inspection.Plans.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans.Create"));
        inspectionPlans.AddChild(
            FoodSafePermissions.Inspection.Plans.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans.Edit"));
        inspectionPlans.AddChild(
            FoodSafePermissions.Inspection.Plans.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans.Delete"));
        inspectionPlans.AddChild(
            FoodSafePermissions.Inspection.Plans.Approve,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionPlans.Approve"));
        var inspectionResults = inspection.AddChild(
            FoodSafePermissions.Inspection.Results.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionResults"));
        inspectionResults.AddChild(
            FoodSafePermissions.Inspection.Results.View,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionResults.View"));
        inspectionResults.AddChild(
            FoodSafePermissions.Inspection.Results.Create,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionResults.Create"));
        inspectionResults.AddChild(
            FoodSafePermissions.Inspection.Results.Edit,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionResults.Edit"));
        inspectionResults.AddChild(
            FoodSafePermissions.Inspection.Results.Delete,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:InspectionResults.Delete"));

        var alertsAndTesting = group.AddPermission(
            FoodSafePermissions.AlertsAndTesting.Default,
            LocalizableString.Create<FoodSafeResource>(
                "Permission:AlertsAndTesting"));
        var alerts = alertsAndTesting.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts"));
        alerts.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.View,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts.View"));
        alerts.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts.Create"));
        alerts.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts.Edit"));
        alerts.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts.Delete"));
        alerts.AddChild(
            FoodSafePermissions.AlertsAndTesting.Alerts.Publish,
            LocalizableString.Create<FoodSafeResource>("Permission:Alerts.Publish"));
        var news = alertsAndTesting.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:News"));
        news.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.View,
            LocalizableString.Create<FoodSafeResource>("Permission:News.View"));
        news.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:News.Create"));
        news.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:News.Edit"));
        news.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:News.Delete"));
        news.AddChild(
            FoodSafePermissions.AlertsAndTesting.News.Publish,
            LocalizableString.Create<FoodSafeResource>("Permission:News.Publish"));

        var foodPoisoning = group.AddPermission(
            FoodSafePermissions.FoodPoisoning.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:FoodPoisoning"));
        var poisoningCases = foodPoisoning.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases"));
        poisoningCases.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.View,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases.View"));
        poisoningCases.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases.Create"));
        poisoningCases.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases.Edit"));
        poisoningCases.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases.Delete"));
        poisoningCases.AddChild(
            FoodSafePermissions.FoodPoisoning.Cases.Verify,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningCases.Verify"));
        var poisoningIncidents = foodPoisoning.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.View,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.View"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.Create"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.Edit"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.Delete"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Verify,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.Verify"));
        poisoningIncidents.AddChild(
            FoodSafePermissions.FoodPoisoning.Incidents.Conclude,
            LocalizableString.Create<FoodSafeResource>("Permission:PoisoningIncidents.Conclude"));

        var systemAdministration = group.AddPermission(
            FoodSafePermissions.SystemAdministration.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin"));
        var users = systemAdministration.AddChild(
            FoodSafePermissions.SystemAdministration.Users.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.Create"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.Edit"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.ManageRoles,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.ManageRoles"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.ManageScope,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.ManageScope"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.Activate,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.Activate"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.Lock,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.Lock"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.ResetPassword,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.ResetPassword"));
        users.AddChild(
            FoodSafePermissions.SystemAdministration.Users.ViewActivity,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Users.ViewActivity"));

        var roles = systemAdministration.AddChild(
            FoodSafePermissions.SystemAdministration.Roles.Default,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Roles"));
        roles.AddChild(
            FoodSafePermissions.SystemAdministration.Roles.Create,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Roles.Create"));
        roles.AddChild(
            FoodSafePermissions.SystemAdministration.Roles.Edit,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Roles.Edit"));
        roles.AddChild(
            FoodSafePermissions.SystemAdministration.Roles.Delete,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Roles.Delete"));
        roles.AddChild(
            FoodSafePermissions.SystemAdministration.Roles.ManagePermissions,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Roles.ManagePermissions"));
        systemAdministration.AddChild(
            FoodSafePermissions.SystemAdministration.AuditLogs,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.AuditLogs"));
        systemAdministration.AddChild(
            FoodSafePermissions.SystemAdministration.Settings,
            LocalizableString.Create<FoodSafeResource>("Permission:SystemAdmin.Settings"));

        group.AddPermission(
            FoodSafePermissions.DataScope.All,
            LocalizableString.Create<FoodSafeResource>("Permission:DataScope.All"));
    }
}
