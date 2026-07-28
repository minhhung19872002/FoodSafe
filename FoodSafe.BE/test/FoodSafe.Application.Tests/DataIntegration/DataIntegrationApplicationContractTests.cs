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
    public void Data_sharing_share_and_retry_should_require_share_permission()
    {
        typeof(DataSharingAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.DataIntegration.Share);

        typeof(DataSharingAppService).GetMethod("ShareAsync").ShouldNotBeNull();
        typeof(DataSharingAppService).GetMethod("RetryAsync").ShouldNotBeNull();
        typeof(IDataSharingAppService).GetMethod("RetryAsync").ShouldNotBeNull();
    }

    [Fact]
    public void Every_shared_data_type_should_have_exactly_one_payload_builder()
    {
        // Builders only touch their repositories inside BuildRecordsAsync, so
        // metadata can be read from instances constructed with null services.
        var builders = new ISharedDataPayloadBuilder[]
        {
            new AlertSharedDataPayloadBuilder(null!, null!),
            new NewsSharedDataPayloadBuilder(null!, null!),
            new InspectionResultSharedDataPayloadBuilder(null!, null!),
            new FoodPoisoningSharedDataPayloadBuilder(null!, null!),
            new ProductSharedDataPayloadBuilder(null!, null!),
            new BusinessSharedDataPayloadBuilder(null!, null!),
            new LicenseSharedDataPayloadBuilder(null!, null!, null!, null!, null!),
        };

        var expected = Enum.GetValues<SharedDataType>()
            .Where(t => t != SharedDataType.Other);
        builders.Select(b => b.DataType)
            .OrderBy(t => t)
            .ShouldBe(expected.OrderBy(t => t));

        var registered = typeof(ISharedDataPayloadBuilder).Assembly.GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract &&
                        typeof(ISharedDataPayloadBuilder).IsAssignableFrom(t));
        registered.Count().ShouldBe(builders.Length);
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
