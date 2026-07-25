using FoodSafe.Permissions;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.DependencyInjection;
using Volo.Abp.PermissionManagement;

namespace FoodSafe.Data;

public sealed class FoodSafePermissionDataSeedContributor :
    IDataSeedContributor,
    ITransientDependency
{
    private readonly IPermissionDataSeeder _permissionDataSeeder;

    public FoodSafePermissionDataSeedContributor(IPermissionDataSeeder permissionDataSeeder)
    {
        _permissionDataSeeder = permissionDataSeeder;
    }

    public Task SeedAsync(DataSeedContext context) =>
        _permissionDataSeeder.SeedAsync(
            RolePermissionValueProvider.ProviderName,
            "admin",
            [
                FoodSafePermissions.Organizations.Default,
                FoodSafePermissions.Organizations.View,
                FoodSafePermissions.Organizations.Create,
                FoodSafePermissions.Organizations.Edit,
                FoodSafePermissions.Organizations.Delete,
                FoodSafePermissions.GeographicCatalogs.Default,
                FoodSafePermissions.GeographicCatalogs.View,
                FoodSafePermissions.GeographicCatalogs.Manage,
                FoodSafePermissions.DataScope.All
            ],
            context.TenantId);
}
