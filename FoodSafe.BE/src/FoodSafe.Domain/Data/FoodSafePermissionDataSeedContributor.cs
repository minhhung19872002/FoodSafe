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
                FoodSafePermissions.Licensing.AdRegistrations.Edit
            ]),
        new(
            "DistrictAdmin",
            "Quản trị cấp huyện",
            UserAdministratorPermissions
                .Append(FoodSafePermissions.BusinessManagement.Businesses.Import)
                .Append(FoodSafePermissions.Licensing.Default)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.Default)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.View)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.Create)
                .Append(FoodSafePermissions.Licensing.ProductRegistrations.Edit)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.Default)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.View)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.Create)
                .Append(FoodSafePermissions.Licensing.AdRegistrations.Edit)
                .ToArray()),
        new(
            "DistrictStaff",
            "Cán bộ cấp huyện",
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
                FoodSafePermissions.Licensing.AdRegistrations.Edit
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
                FoodSafePermissions.Licensing.AdRegistrations.View
            ])
    ];

    private sealed record RoleSeedDefinition(
        string Name,
        string Description,
        IReadOnlyCollection<string> Permissions);
}
