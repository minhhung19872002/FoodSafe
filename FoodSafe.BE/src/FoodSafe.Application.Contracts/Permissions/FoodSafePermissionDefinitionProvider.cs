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
