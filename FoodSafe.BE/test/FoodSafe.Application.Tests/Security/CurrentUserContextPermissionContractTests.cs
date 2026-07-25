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
    }
}
