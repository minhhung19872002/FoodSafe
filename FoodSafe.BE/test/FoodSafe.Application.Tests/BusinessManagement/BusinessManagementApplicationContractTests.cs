using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessManagementApplicationContractTests
{
    [Theory]
    [InlineData(typeof(BusinessAppService), "GetListAsync", null)]
    [InlineData(typeof(BusinessAppService), "CreateAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Create)]
    [InlineData(typeof(BusinessAppService), "UpdateAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Edit)]
    [InlineData(typeof(BusinessAppService), "DeleteAsync",
        FoodSafePermissions.BusinessManagement.Businesses.Delete)]
    [InlineData(typeof(ProductAppService), "GetListAsync", null)]
    [InlineData(typeof(ProductAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(ProductAppService), "CreateAsync",
        FoodSafePermissions.BusinessManagement.Products.Create)]
    [InlineData(typeof(ProductAppService), "UpdateAsync",
        FoodSafePermissions.BusinessManagement.Products.Edit)]
    [InlineData(typeof(ProductAppService), "DeleteAsync",
        FoodSafePermissions.BusinessManagement.Products.Delete)]
    [InlineData(typeof(SelfDeclarationAppService), "GetListAsync", null)]
    [InlineData(typeof(SelfDeclarationAppService), "GetAsync", null)]
    [InlineData(typeof(SelfDeclarationAppService), "CreateAsync",
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Create)]
    [InlineData(typeof(SelfDeclarationAppService), "UpdateAsync",
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    [InlineData(typeof(SelfDeclarationAppService), "DeleteAsync",
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Delete)]
    [InlineData(typeof(SelfDeclarationAppService), "RevokeAsync",
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    public void Operations_should_use_least_privilege_permissions(
        Type serviceType,
        string methodName,
        string? expectedPermission)
    {
        var method = serviceType.GetMethod(methodName);

        method.ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>()?.Policy
            .ShouldBe(expectedPermission);
    }

    [Fact]
    public void Service_roots_should_require_view_permissions()
    {
        typeof(BusinessAppService).GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(
                FoodSafePermissions.BusinessManagement.Businesses.View);
        typeof(ProductAppService).GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(
                FoodSafePermissions.BusinessManagement.Products.View);
        typeof(SelfDeclarationAppService).GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(
                FoodSafePermissions.BusinessManagement.SelfDeclarations.View);
    }
}
