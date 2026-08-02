using FoodSafe.Permissions;
using Microsoft.AspNetCore.Identity;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Identity;
using Volo.Abp.PermissionManagement;

namespace FoodSafe.Data;

public sealed class FoodSafePermissionDataSeedContributor :
    IDataSeedContributor,
    ITransientDependency
{
    private readonly IPermissionDataSeeder _permissionDataSeeder;
    private readonly IdentityRoleManager _roleManager;

    public FoodSafePermissionDataSeedContributor(
        IPermissionDataSeeder permissionDataSeeder,
        IdentityRoleManager roleManager)
    {
        _permissionDataSeeder = permissionDataSeeder;
        _roleManager = roleManager;
    }

    public async Task SeedAsync(DataSeedContext context)
    {
        await SeedRolePermissionsAsync(
            "admin",
            AllAdministrativePermissions,
            context.TenantId);

        foreach (var roleDefinition in DefaultRoles)
        {
            var role = await _roleManager.FindByNameAsync(roleDefinition.Name);
            if (role is null)
            {
                role = new IdentityRole(
                    Guid.NewGuid(),
                    roleDefinition.Name,
                    context.TenantId)
                {
                    IsStatic = true,
                    IsPublic = false,
                    IsDefault = false
                };
                role.SetProperty("Description", roleDefinition.Description);
                role.SetProperty("IsActive", true);
                (await _roleManager.CreateAsync(role)).CheckErrors();
            }

            await SeedRolePermissionsAsync(
                roleDefinition.Name,
                roleDefinition.Permissions,
                context.TenantId);
        }
    }

    private Task SeedRolePermissionsAsync(
        string roleName,
        IReadOnlyCollection<string> permissions,
        Guid? tenantId) =>
        _permissionDataSeeder.SeedAsync(
            RolePermissionValueProvider.ProviderName,
            roleName,
            permissions,
            tenantId);

    private static readonly string[] AllAdministrativePermissions =
    [
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
        FoodSafePermissions.Organizations.Default,
        FoodSafePermissions.Organizations.View,
        FoodSafePermissions.Organizations.Create,
        FoodSafePermissions.Organizations.Edit,
        FoodSafePermissions.Organizations.Delete,
        FoodSafePermissions.GeographicCatalogs.Default,
        FoodSafePermissions.GeographicCatalogs.View,
        FoodSafePermissions.GeographicCatalogs.Manage,
        FoodSafePermissions.Catalogs.Default,
        FoodSafePermissions.Catalogs.View,
        FoodSafePermissions.Catalogs.Create,
        FoodSafePermissions.Catalogs.Edit,
        FoodSafePermissions.Catalogs.Delete,
        FoodSafePermissions.BusinessManagement.Default,
        FoodSafePermissions.BusinessManagement.Businesses.Default,
        FoodSafePermissions.BusinessManagement.Businesses.View,
        FoodSafePermissions.BusinessManagement.Businesses.Create,
        FoodSafePermissions.BusinessManagement.Businesses.Edit,
        FoodSafePermissions.BusinessManagement.Businesses.Delete,
        FoodSafePermissions.BusinessManagement.Businesses.Import,
        FoodSafePermissions.BusinessManagement.Products.Default,
        FoodSafePermissions.BusinessManagement.Products.View,
        FoodSafePermissions.BusinessManagement.Products.Create,
        FoodSafePermissions.BusinessManagement.Products.Import,
        FoodSafePermissions.BusinessManagement.Products.Edit,
        FoodSafePermissions.BusinessManagement.Products.Delete,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Default,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete,
        FoodSafePermissions.Licensing.Default,
        FoodSafePermissions.Licensing.ProductRegistrations.Default,
        FoodSafePermissions.Licensing.ProductRegistrations.View,
        FoodSafePermissions.Licensing.ProductRegistrations.Create,
        FoodSafePermissions.Licensing.ProductRegistrations.Edit,
        FoodSafePermissions.Licensing.ProductRegistrations.Delete,
        FoodSafePermissions.Licensing.AdRegistrations.Default,
        FoodSafePermissions.Licensing.AdRegistrations.View,
        FoodSafePermissions.Licensing.AdRegistrations.Create,
        FoodSafePermissions.Licensing.AdRegistrations.Edit,
        FoodSafePermissions.Licensing.AdRegistrations.Delete,
        FoodSafePermissions.Licensing.EligibilityCertificates.Default,
        FoodSafePermissions.Licensing.EligibilityCertificates.View,
        FoodSafePermissions.Licensing.EligibilityCertificates.Create,
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit,
        FoodSafePermissions.Licensing.EligibilityCertificates.Delete,
        FoodSafePermissions.Licensing.VsattpCommitments.Default,
        FoodSafePermissions.Licensing.VsattpCommitments.View,
        FoodSafePermissions.Licensing.VsattpCommitments.Create,
        FoodSafePermissions.Licensing.VsattpCommitments.Edit,
        FoodSafePermissions.Licensing.VsattpCommitments.Delete,
        FoodSafePermissions.Licensing.VsattpCommitments.Confirm,
        FoodSafePermissions.Licensing.CfsCertificates.Default,
        FoodSafePermissions.Licensing.CfsCertificates.View,
        FoodSafePermissions.Licensing.CfsCertificates.Create,
        FoodSafePermissions.Licensing.CfsCertificates.Edit,
        FoodSafePermissions.Licensing.CfsCertificates.Delete,
        FoodSafePermissions.Licensing.ExportCertificates.Default,
        FoodSafePermissions.Licensing.ExportCertificates.View,
        FoodSafePermissions.Licensing.ExportCertificates.Create,
        FoodSafePermissions.Licensing.ExportCertificates.Edit,
        FoodSafePermissions.Licensing.ExportCertificates.Delete,
        FoodSafePermissions.ProductRecalls.Default,
        FoodSafePermissions.ProductRecalls.View,
        FoodSafePermissions.ProductRecalls.Create,
        FoodSafePermissions.ProductRecalls.Edit,
        FoodSafePermissions.ProductRecalls.Delete,
        FoodSafePermissions.ProductRecalls.Manage,
        FoodSafePermissions.Inspection.Default,
        FoodSafePermissions.Inspection.Plans.Default,
        FoodSafePermissions.Inspection.Plans.View,
        FoodSafePermissions.Inspection.Plans.Create,
        FoodSafePermissions.Inspection.Plans.Edit,
        FoodSafePermissions.Inspection.Plans.Delete,
        FoodSafePermissions.Inspection.Plans.Approve,
        FoodSafePermissions.Inspection.Results.Default,
        FoodSafePermissions.Inspection.Results.View,
        FoodSafePermissions.Inspection.Results.Create,
        FoodSafePermissions.Inspection.Results.Edit,
        FoodSafePermissions.Inspection.Results.Delete,
        FoodSafePermissions.AlertsAndTesting.Default,
        FoodSafePermissions.AlertsAndTesting.Alerts.Default,
        FoodSafePermissions.AlertsAndTesting.Alerts.View,
        FoodSafePermissions.AlertsAndTesting.Alerts.Create,
        FoodSafePermissions.AlertsAndTesting.Alerts.Edit,
        FoodSafePermissions.AlertsAndTesting.Alerts.Delete,
        FoodSafePermissions.AlertsAndTesting.Alerts.Publish,
        FoodSafePermissions.AlertsAndTesting.Alerts.Assign,
        FoodSafePermissions.AlertsAndTesting.News.Default,
        FoodSafePermissions.AlertsAndTesting.News.View,
        FoodSafePermissions.AlertsAndTesting.News.Create,
        FoodSafePermissions.AlertsAndTesting.News.Edit,
        FoodSafePermissions.AlertsAndTesting.News.Delete,
        FoodSafePermissions.AlertsAndTesting.News.Publish,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Default,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Create,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Edit,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Delete,
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Publish,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Default,
        FoodSafePermissions.AlertsAndTesting.TestingResults.View,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Create,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Edit,
        FoodSafePermissions.AlertsAndTesting.TestingResults.Delete,
        FoodSafePermissions.AlertsAndTesting.Documents.Default,
        FoodSafePermissions.AlertsAndTesting.Documents.View,
        FoodSafePermissions.AlertsAndTesting.Documents.Create,
        FoodSafePermissions.AlertsAndTesting.Documents.Edit,
        FoodSafePermissions.AlertsAndTesting.Documents.Delete,
        FoodSafePermissions.FoodPoisoning.Default,
        FoodSafePermissions.FoodPoisoning.Cases.Default,
        FoodSafePermissions.FoodPoisoning.Cases.View,
        FoodSafePermissions.FoodPoisoning.Cases.Create,
        FoodSafePermissions.FoodPoisoning.Cases.Edit,
        FoodSafePermissions.FoodPoisoning.Cases.Delete,
        FoodSafePermissions.FoodPoisoning.Cases.Verify,
        FoodSafePermissions.FoodPoisoning.Incidents.Default,
        FoodSafePermissions.FoodPoisoning.Incidents.View,
        FoodSafePermissions.FoodPoisoning.Incidents.Create,
        FoodSafePermissions.FoodPoisoning.Incidents.Edit,
        FoodSafePermissions.FoodPoisoning.Incidents.Delete,
        FoodSafePermissions.FoodPoisoning.Incidents.Verify,
        FoodSafePermissions.FoodPoisoning.Incidents.Conclude,
        FoodSafePermissions.Reporting.Default,
        FoodSafePermissions.Reporting.NdtpReports.Default,
        FoodSafePermissions.Reporting.NdtpReports.View,
        FoodSafePermissions.Reporting.NdtpReports.Create,
        FoodSafePermissions.Reporting.NdtpReports.Edit,
        FoodSafePermissions.Reporting.NdtpReports.Delete,
        FoodSafePermissions.Reporting.NdtpReports.Submit,
        FoodSafePermissions.Reporting.NdtpReports.Verify,
        FoodSafePermissions.Reporting.NdtpReports.Return,
        FoodSafePermissions.Reporting.NdtpReports.Complete,
        FoodSafePermissions.Reporting.AtpWorkReports.Default,
        FoodSafePermissions.Reporting.AtpWorkReports.View,
        FoodSafePermissions.Reporting.AtpWorkReports.Create,
        FoodSafePermissions.Reporting.AtpWorkReports.Edit,
        FoodSafePermissions.Reporting.AtpWorkReports.Delete,
        FoodSafePermissions.Reporting.AtpWorkReports.Submit,
        FoodSafePermissions.Reporting.AtpWorkReports.Verify,
        FoodSafePermissions.Reporting.AtpWorkReports.Return,
        FoodSafePermissions.Reporting.AtpWorkReports.Complete,
        FoodSafePermissions.Reporting.ActionMonthReports.Default,
        FoodSafePermissions.Reporting.ActionMonthReports.View,
        FoodSafePermissions.Reporting.ActionMonthReports.Create,
        FoodSafePermissions.Reporting.ActionMonthReports.Edit,
        FoodSafePermissions.Reporting.ActionMonthReports.Delete,
        FoodSafePermissions.Reporting.ActionMonthReports.Submit,
        FoodSafePermissions.Reporting.ActionMonthReports.Verify,
        FoodSafePermissions.Reporting.ActionMonthReports.Return,
        FoodSafePermissions.Reporting.ActionMonthReports.Complete,
        FoodSafePermissions.DataIntegration.Default,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Default,
        FoodSafePermissions.DataIntegration.ApiEndpoints.View,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Create,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Edit,
        FoodSafePermissions.DataIntegration.ApiEndpoints.Delete,
        FoodSafePermissions.DataIntegration.CallHistory.Default,
        FoodSafePermissions.DataIntegration.CallHistory.View,
        FoodSafePermissions.DataIntegration.Partners.Default,
        FoodSafePermissions.DataIntegration.Partners.View,
        FoodSafePermissions.DataIntegration.Partners.Create,
        FoodSafePermissions.DataIntegration.Partners.Edit,
        FoodSafePermissions.DataIntegration.Partners.Delete,
        FoodSafePermissions.DataIntegration.Partners.ManageKeys,
        FoodSafePermissions.DataScope.All
    ];

    private static readonly string[] UserAdministratorPermissions =
    [
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
        FoodSafePermissions.Organizations.Default,
        FoodSafePermissions.Organizations.View,
        FoodSafePermissions.GeographicCatalogs.Default,
        FoodSafePermissions.GeographicCatalogs.View,
        FoodSafePermissions.Catalogs.Default,
        FoodSafePermissions.Catalogs.View,
        FoodSafePermissions.BusinessManagement.Default,
        FoodSafePermissions.BusinessManagement.Businesses.Default,
        FoodSafePermissions.BusinessManagement.Businesses.View,
        FoodSafePermissions.BusinessManagement.Businesses.Create,
        FoodSafePermissions.BusinessManagement.Businesses.Edit,
        FoodSafePermissions.BusinessManagement.Products.Default,
        FoodSafePermissions.BusinessManagement.Products.View,
        FoodSafePermissions.BusinessManagement.Products.Create,
        FoodSafePermissions.BusinessManagement.Products.Import,
        FoodSafePermissions.BusinessManagement.Products.Edit,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Default,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit
    ];

    private static readonly RoleSeedDefinition[] DefaultRoles =
    [
        new(
            "SystemAdmin",
            "Quản trị toàn hệ thống",
            AllAdministrativePermissions),
        new(
            "ProvinceAdmin",
            "Quản trị cấp tỉnh",
            AllAdministrativePermissions
                .Where(permission =>
                    permission != FoodSafePermissions.DataScope.All)
                .ToArray()),
        new(
            "ProvinceStaff",
            "Cán bộ cấp tỉnh",
            [
                FoodSafePermissions.Organizations.Default,
                FoodSafePermissions.Organizations.View,
                FoodSafePermissions.GeographicCatalogs.Default,
                FoodSafePermissions.GeographicCatalogs.View,
                FoodSafePermissions.Catalogs.Default,
                FoodSafePermissions.Catalogs.View,
                FoodSafePermissions.Catalogs.Create,
                FoodSafePermissions.Catalogs.Edit,
                FoodSafePermissions.Catalogs.Delete,
                FoodSafePermissions.BusinessManagement.Default,
                FoodSafePermissions.BusinessManagement.Businesses.Default,
                FoodSafePermissions.BusinessManagement.Businesses.View,
                FoodSafePermissions.BusinessManagement.Businesses.Create,
                FoodSafePermissions.BusinessManagement.Businesses.Edit,
                FoodSafePermissions.BusinessManagement.Businesses.Import,
                FoodSafePermissions.BusinessManagement.Products.Default,
                FoodSafePermissions.BusinessManagement.Products.View,
                FoodSafePermissions.BusinessManagement.Products.Create,
                FoodSafePermissions.BusinessManagement.Products.Import,
                FoodSafePermissions.BusinessManagement.Products.Edit,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Default,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
                FoodSafePermissions.Licensing.Default,
                FoodSafePermissions.Licensing.ProductRegistrations.Default,
                FoodSafePermissions.Licensing.ProductRegistrations.View,
                FoodSafePermissions.Licensing.ProductRegistrations.Create,
                FoodSafePermissions.Licensing.ProductRegistrations.Edit,
                FoodSafePermissions.Licensing.AdRegistrations.Default,
                FoodSafePermissions.Licensing.AdRegistrations.View,
                FoodSafePermissions.Licensing.AdRegistrations.Create,
                FoodSafePermissions.Licensing.AdRegistrations.Edit,
                FoodSafePermissions.Licensing.EligibilityCertificates.Default,
                FoodSafePermissions.Licensing.EligibilityCertificates.View,
                FoodSafePermissions.Licensing.EligibilityCertificates.Create,
                FoodSafePermissions.Licensing.EligibilityCertificates.Edit,
                FoodSafePermissions.Licensing.VsattpCommitments.Default,
                FoodSafePermissions.Licensing.VsattpCommitments.View,
                FoodSafePermissions.Licensing.VsattpCommitments.Create,
                FoodSafePermissions.Licensing.VsattpCommitments.Edit,
                FoodSafePermissions.Licensing.VsattpCommitments.Confirm,
                FoodSafePermissions.Licensing.CfsCertificates.Default,
                FoodSafePermissions.Licensing.CfsCertificates.View,
                FoodSafePermissions.Licensing.CfsCertificates.Create,
                FoodSafePermissions.Licensing.CfsCertificates.Edit,
                FoodSafePermissions.Licensing.ExportCertificates.Default,
                FoodSafePermissions.Licensing.ExportCertificates.View,
                FoodSafePermissions.Licensing.ExportCertificates.Create,
                FoodSafePermissions.Licensing.ExportCertificates.Edit,
                FoodSafePermissions.ProductRecalls.Default,
                FoodSafePermissions.ProductRecalls.View,
                FoodSafePermissions.ProductRecalls.Create,
                FoodSafePermissions.ProductRecalls.Edit,
                FoodSafePermissions.ProductRecalls.Manage,
                FoodSafePermissions.Inspection.Default,
                FoodSafePermissions.Inspection.Plans.Default,
                FoodSafePermissions.Inspection.Plans.View,
                FoodSafePermissions.Inspection.Plans.Create,
                FoodSafePermissions.Inspection.Plans.Edit,
                FoodSafePermissions.Inspection.Plans.Approve,
                FoodSafePermissions.Inspection.Results.Default,
                FoodSafePermissions.Inspection.Results.View,
                FoodSafePermissions.Inspection.Results.Create,
                FoodSafePermissions.Inspection.Results.Edit,
                FoodSafePermissions.AlertsAndTesting.Default,
                FoodSafePermissions.AlertsAndTesting.Alerts.Default,
                FoodSafePermissions.AlertsAndTesting.Alerts.View,
                FoodSafePermissions.AlertsAndTesting.Alerts.Create,
                FoodSafePermissions.AlertsAndTesting.Alerts.Edit,
                FoodSafePermissions.AlertsAndTesting.Alerts.Publish,
                FoodSafePermissions.AlertsAndTesting.Alerts.Assign,
                FoodSafePermissions.AlertsAndTesting.News.Default,
                FoodSafePermissions.AlertsAndTesting.News.View,
                FoodSafePermissions.AlertsAndTesting.News.Create,
                FoodSafePermissions.AlertsAndTesting.News.Edit,
                FoodSafePermissions.AlertsAndTesting.News.Publish,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Default,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Create,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Edit,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Delete,
                FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Publish,
                FoodSafePermissions.AlertsAndTesting.TestingResults.Default,
                FoodSafePermissions.AlertsAndTesting.TestingResults.View,
                FoodSafePermissions.AlertsAndTesting.TestingResults.Create,
                FoodSafePermissions.AlertsAndTesting.TestingResults.Edit,
                FoodSafePermissions.AlertsAndTesting.TestingResults.Delete,
                FoodSafePermissions.AlertsAndTesting.Documents.Default,
                FoodSafePermissions.AlertsAndTesting.Documents.View,
                FoodSafePermissions.AlertsAndTesting.Documents.Create,
                FoodSafePermissions.AlertsAndTesting.Documents.Edit,
                FoodSafePermissions.AlertsAndTesting.Documents.Delete,
                FoodSafePermissions.FoodPoisoning.Default,
                FoodSafePermissions.FoodPoisoning.Cases.Default,
                FoodSafePermissions.FoodPoisoning.Cases.View,
                FoodSafePermissions.FoodPoisoning.Cases.Create,
                FoodSafePermissions.FoodPoisoning.Cases.Edit,
                FoodSafePermissions.FoodPoisoning.Cases.Verify,
                FoodSafePermissions.FoodPoisoning.Incidents.Default,
                FoodSafePermissions.FoodPoisoning.Incidents.View,
                FoodSafePermissions.FoodPoisoning.Incidents.Create,
                FoodSafePermissions.FoodPoisoning.Incidents.Edit,
                FoodSafePermissions.FoodPoisoning.Incidents.Verify,
                FoodSafePermissions.FoodPoisoning.Incidents.Conclude,
                FoodSafePermissions.Reporting.Default,
                FoodSafePermissions.Reporting.NdtpReports.Default,
                FoodSafePermissions.Reporting.NdtpReports.View,
                FoodSafePermissions.Reporting.NdtpReports.Create,
                FoodSafePermissions.Reporting.NdtpReports.Edit,
                FoodSafePermissions.Reporting.NdtpReports.Delete,
                FoodSafePermissions.Reporting.NdtpReports.Submit,
                FoodSafePermissions.Reporting.NdtpReports.Verify,
                FoodSafePermissions.Reporting.NdtpReports.Return,
                FoodSafePermissions.Reporting.NdtpReports.Complete,
                FoodSafePermissions.Reporting.AtpWorkReports.Default,
                FoodSafePermissions.Reporting.AtpWorkReports.View,
                FoodSafePermissions.Reporting.AtpWorkReports.Create,
                FoodSafePermissions.Reporting.AtpWorkReports.Edit,
                FoodSafePermissions.Reporting.AtpWorkReports.Delete,
                FoodSafePermissions.Reporting.AtpWorkReports.Submit,
                FoodSafePermissions.Reporting.AtpWorkReports.Verify,
                FoodSafePermissions.Reporting.AtpWorkReports.Return,
                FoodSafePermissions.Reporting.AtpWorkReports.Complete,
                FoodSafePermissions.Reporting.ActionMonthReports.Default,
                FoodSafePermissions.Reporting.ActionMonthReports.View,
                FoodSafePermissions.Reporting.ActionMonthReports.Create,
                FoodSafePermissions.Reporting.ActionMonthReports.Edit,
                FoodSafePermissions.Reporting.ActionMonthReports.Delete,
                FoodSafePermissions.Reporting.ActionMonthReports.Submit,
                FoodSafePermissions.Reporting.ActionMonthReports.Verify,
                FoodSafePermissions.Reporting.ActionMonthReports.Return,
                FoodSafePermissions.Reporting.ActionMonthReports.Complete
            ]),
        new(
            "CommuneAdmin",
            "Quản trị cấp xã",
            UserAdministratorPermissions
                .Append(FoodSafePermissions.Licensing.Default)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.Default)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.View)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.Default)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.View)
                .Append(FoodSafePermissions.Licensing.EligibilityCertificates.Default)
                .Append(FoodSafePermissions.Licensing.EligibilityCertificates.View)
                .Append(FoodSafePermissions.Licensing.CfsCertificates.Default)
                .Append(FoodSafePermissions.Licensing.CfsCertificates.View)
                .Append(FoodSafePermissions.Licensing.ExportCertificates.Default)
                .Append(FoodSafePermissions.Licensing.ExportCertificates.View)
                .Append(FoodSafePermissions.ProductRecalls.Default)
                .Append(FoodSafePermissions.ProductRecalls.View)
                .Append(FoodSafePermissions.Inspection.Default)
                .Append(FoodSafePermissions.Inspection.Plans.Default)
                .Append(FoodSafePermissions.Inspection.Plans.View)
                .Append(FoodSafePermissions.Inspection.Results.Default)
                .Append(FoodSafePermissions.Inspection.Results.View)
                .Append(FoodSafePermissions.AlertsAndTesting.Default)
                .Append(FoodSafePermissions.AlertsAndTesting.Alerts.Default)
                .Append(FoodSafePermissions.AlertsAndTesting.Alerts.View)
                .Append(FoodSafePermissions.AlertsAndTesting.News.Default)
                .Append(FoodSafePermissions.AlertsAndTesting.News.View)
                .Append(FoodSafePermissions.FoodPoisoning.Default)
                .Append(FoodSafePermissions.FoodPoisoning.Cases.Default)
                .Append(FoodSafePermissions.FoodPoisoning.Cases.View)
                .Append(FoodSafePermissions.FoodPoisoning.Cases.Create)
                .Append(FoodSafePermissions.FoodPoisoning.Cases.Edit)
                .Append(FoodSafePermissions.FoodPoisoning.Incidents.Default)
                .Append(FoodSafePermissions.FoodPoisoning.Incidents.View)
                .Append(FoodSafePermissions.FoodPoisoning.Incidents.Create)
                .Append(FoodSafePermissions.FoodPoisoning.Incidents.Edit)
                .Append(FoodSafePermissions.Reporting.Default)
                .Append(FoodSafePermissions.Reporting.NdtpReports.Default)
                .Append(FoodSafePermissions.Reporting.NdtpReports.View)
                .Append(FoodSafePermissions.Reporting.NdtpReports.Create)
                .Append(FoodSafePermissions.Reporting.NdtpReports.Edit)
                .Append(FoodSafePermissions.Reporting.NdtpReports.Submit)
                .Append(FoodSafePermissions.Reporting.AtpWorkReports.Default)
                .Append(FoodSafePermissions.Reporting.AtpWorkReports.View)
                .Append(FoodSafePermissions.Reporting.AtpWorkReports.Create)
                .Append(FoodSafePermissions.Reporting.AtpWorkReports.Edit)
                .Append(FoodSafePermissions.Reporting.AtpWorkReports.Submit)
                .Append(FoodSafePermissions.Reporting.ActionMonthReports.Default)
                .Append(FoodSafePermissions.Reporting.ActionMonthReports.View)
                .Append(FoodSafePermissions.Reporting.ActionMonthReports.Create)
                .Append(FoodSafePermissions.Reporting.ActionMonthReports.Edit)
                .Append(FoodSafePermissions.Reporting.ActionMonthReports.Submit)
                .ToArray()),
        new(
            "CommuneStaff",
            "Cán bộ cấp xã",
            [
                FoodSafePermissions.Organizations.Default,
                FoodSafePermissions.Organizations.View,
                FoodSafePermissions.GeographicCatalogs.Default,
                FoodSafePermissions.GeographicCatalogs.View,
                FoodSafePermissions.Catalogs.Default,
                FoodSafePermissions.Catalogs.View,
                FoodSafePermissions.BusinessManagement.Default,
                FoodSafePermissions.BusinessManagement.Businesses.Default,
                FoodSafePermissions.BusinessManagement.Businesses.View,
                FoodSafePermissions.BusinessManagement.Businesses.Create,
                FoodSafePermissions.BusinessManagement.Products.Default,
                FoodSafePermissions.BusinessManagement.Products.View,
                FoodSafePermissions.BusinessManagement.Products.Create,
                FoodSafePermissions.BusinessManagement.Products.Import,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Default,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.View,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Create,
                FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit,
                FoodSafePermissions.Licensing.Default,
                FoodSafePermissions.Licensing.ProductRegistrations.Default,
                FoodSafePermissions.Licensing.ProductRegistrations.View,
                FoodSafePermissions.Licensing.AdRegistrations.Default,
                FoodSafePermissions.Licensing.AdRegistrations.View,
                FoodSafePermissions.Licensing.EligibilityCertificates.Default,
                FoodSafePermissions.Licensing.EligibilityCertificates.View,
                FoodSafePermissions.Licensing.CfsCertificates.Default,
                FoodSafePermissions.Licensing.CfsCertificates.View,
                FoodSafePermissions.Licensing.ExportCertificates.Default,
                FoodSafePermissions.Licensing.ExportCertificates.View,
                FoodSafePermissions.ProductRecalls.Default,
                FoodSafePermissions.ProductRecalls.View,
                FoodSafePermissions.ProductRecalls.Create,
                FoodSafePermissions.ProductRecalls.Edit,
                FoodSafePermissions.Inspection.Default,
                FoodSafePermissions.Inspection.Plans.Default,
                FoodSafePermissions.Inspection.Plans.View,
                FoodSafePermissions.Inspection.Results.Default,
                FoodSafePermissions.Inspection.Results.View,
                FoodSafePermissions.AlertsAndTesting.Default,
                FoodSafePermissions.AlertsAndTesting.Alerts.Default,
                FoodSafePermissions.AlertsAndTesting.Alerts.View,
                FoodSafePermissions.AlertsAndTesting.News.Default,
                FoodSafePermissions.AlertsAndTesting.News.View,
                FoodSafePermissions.FoodPoisoning.Default,
                FoodSafePermissions.FoodPoisoning.Cases.Default,
                FoodSafePermissions.FoodPoisoning.Cases.View,
                FoodSafePermissions.FoodPoisoning.Cases.Create,
                FoodSafePermissions.FoodPoisoning.Cases.Edit,
                FoodSafePermissions.FoodPoisoning.Incidents.Default,
                FoodSafePermissions.FoodPoisoning.Incidents.View,
                FoodSafePermissions.FoodPoisoning.Incidents.Create,
                FoodSafePermissions.FoodPoisoning.Incidents.Edit,
                FoodSafePermissions.Reporting.Default,
                FoodSafePermissions.Reporting.NdtpReports.Default,
                FoodSafePermissions.Reporting.NdtpReports.View,
                FoodSafePermissions.Reporting.NdtpReports.Create,
                FoodSafePermissions.Reporting.NdtpReports.Edit,
                FoodSafePermissions.Reporting.NdtpReports.Submit,
                FoodSafePermissions.Reporting.AtpWorkReports.Default,
                FoodSafePermissions.Reporting.AtpWorkReports.View,
                FoodSafePermissions.Reporting.AtpWorkReports.Create,
                FoodSafePermissions.Reporting.AtpWorkReports.Edit,
                FoodSafePermissions.Reporting.AtpWorkReports.Submit,
                FoodSafePermissions.Reporting.ActionMonthReports.Default,
                FoodSafePermissions.Reporting.ActionMonthReports.View,
                FoodSafePermissions.Reporting.ActionMonthReports.Create,
                FoodSafePermissions.Reporting.ActionMonthReports.Edit,
                FoodSafePermissions.Reporting.ActionMonthReports.Submit
            ])
    ];

    private sealed record RoleSeedDefinition(
        string Name,
        string Description,
        IReadOnlyCollection<string> Permissions);
}
