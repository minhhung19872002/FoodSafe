using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.DataIntegration;

public sealed class DataIntegrationApplicationContractTests
{
    [Theory]
    [InlineData(typeof(ApiEndpointAppService), "GetListAsync", null)]
    [InlineData(typeof(ApiEndpointAppService), "GetAsync", null)]
    [InlineData(typeof(ApiEndpointAppService), "CreateAsync",
        FoodSafePermissions.DataIntegration.ApiEndpoints.Create)]
    [InlineData(typeof(ApiEndpointAppService), "UpdateAsync",
        FoodSafePermissions.DataIntegration.ApiEndpoints.Edit)]
    [InlineData(typeof(ApiEndpointAppService), "ToggleStatusAsync",
        FoodSafePermissions.DataIntegration.ApiEndpoints.Edit)]
    [InlineData(typeof(ApiEndpointAppService), "DeleteAsync",
        FoodSafePermissions.DataIntegration.ApiEndpoints.Delete)]
    [InlineData(typeof(ApiCallLogAppService), "GetListAsync", null)]
    [InlineData(typeof(ApiCallLogAppService), "GetAsync", null)]
    public void Operations_should_use_least_privilege_permissions(
        Type serviceType, string methodName, string? expectedPermission)
    {
        var method = serviceType.GetMethod(methodName);
        method.ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>()?.Policy
            .ShouldBe(expectedPermission);
    }

    [Fact]
    public void Service_roots_should_require_view_permissions()
    {
        typeof(ApiEndpointAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.DataIntegration.ApiEndpoints.View);

        typeof(ApiCallLogAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.DataIntegration.CallHistory.View);
    }

    [Theory]
    [InlineData(typeof(ApiEndpointExcelAppService), "ExportAsync",
        FoodSafePermissions.DataIntegration.ApiEndpoints.View)]
    [InlineData(typeof(ApiCallLogExcelAppService), "ExportAsync",
        FoodSafePermissions.DataIntegration.CallHistory.View)]
    public void Excel_exports_require_view_permission(
        Type serviceType, string methodName, string permission)
    {
        var method = serviceType.GetMethod(methodName);
        method.ShouldNotBeNull();
        method!.GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(permission);
    }

    [Fact]
    public void Call_log_service_should_be_read_only()
    {
        var methods = typeof(ApiCallLogAppService)
            .GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly);

        methods.ShouldAllBe(m =>
            m.Name.StartsWith("Get") ||
            m.Name == "ToString" ||
            m.Name == "Equals" ||
            m.Name == "GetHashCode");
    }
}
