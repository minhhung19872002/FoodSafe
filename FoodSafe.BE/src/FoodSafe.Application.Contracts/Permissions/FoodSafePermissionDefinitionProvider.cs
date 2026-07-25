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
    }
}
