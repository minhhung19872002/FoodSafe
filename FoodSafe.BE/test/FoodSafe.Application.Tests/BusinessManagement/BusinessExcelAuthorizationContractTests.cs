using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessExcelAuthorizationContractTests
{
    [Theory]
    [InlineData("GetTemplateAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Import)]
    [InlineData("PreviewAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Import)]
    [InlineData("ConfirmAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Import)]
    [InlineData("ExportAsync",
        FoodSafePermissions.BusinessManagement.Businesses.View)]
    public void Excel_operations_require_the_expected_permission(
        string methodName,
        string permission)
    {
        var method = typeof(BusinessExcelAppService).GetMethod(methodName);

        method.ShouldNotBeNull();
        method!.GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(permission);
    }

    [Fact]
    public void Confirm_also_requires_create_permission()
    {
        var permissions = typeof(BusinessExcelAppService)
            .GetMethod("ConfirmAsync")!
            .GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ToArray();

        permissions.ShouldContain(
            FoodSafePermissions.BusinessManagement.Businesses.Create);
    }
}
