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
        typeof(DataSharingAppService).GetMethod("GetAlertOptionsAsync").ShouldNotBeNull();
        typeof(DataSharingAppService)
            .GetMethod("GetInspectionResultOptionsAsync").ShouldNotBeNull();
        typeof(IDataSharingAppService).GetMethod("GetAlertOptionsAsync").ShouldNotBeNull();
        typeof(IDataSharingAppService)
            .GetMethod("GetInspectionResultOptionsAsync").ShouldNotBeNull();
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

    [Theory]
    [InlineData("GetListAsync", null)]
    [InlineData("GetAsync", null)]
    [InlineData("CreateAsync", FoodSafePermissions.DataIntegration.Partners.Create)]
    [InlineData("UpdateAsync", FoodSafePermissions.DataIntegration.Partners.Edit)]
    [InlineData("ToggleStatusAsync", FoodSafePermissions.DataIntegration.Partners.Edit)]
    [InlineData("DeleteAsync", FoodSafePermissions.DataIntegration.Partners.Delete)]
    [InlineData("GetKeysAsync", FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    [InlineData("IssueKeyAsync", FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    [InlineData("RevokeKeyAsync", FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    [InlineData("GetSubmissionsAsync", null)]
    [InlineData("GetSubmissionAsync", null)]
    [InlineData("ProcessSubmissionAsync",
        FoodSafePermissions.DataIntegration.Partners.Moderate)]
    [InlineData("RejectSubmissionAsync",
        FoodSafePermissions.DataIntegration.Partners.Moderate)]
    public void Partner_admin_operations_should_use_least_privilege(
        string methodName, string? expectedPermission)
    {
        typeof(PartnerAccountAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.DataIntegration.Partners.View);

        var method = typeof(PartnerAccountAppService).GetMethod(methodName);
        method.ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>()?.Policy
            .ShouldBe(expectedPermission);
    }

    [Fact]
    public void Inbound_receive_service_authenticates_by_api_key_not_session()
    {
        // The partner-facing endpoint is anonymous at the ASP.NET layer by
        // DESIGN: authentication is the hashed X-Api-Key, enforced inside
        // ReceiveAsync, whose outcome the controller maps to 401/403/400.
        typeof(PartnerInboundAppService)
            .GetCustomAttribute<Microsoft.AspNetCore.Authorization.AllowAnonymousAttribute>()
            .ShouldNotBeNull();
        var receive = typeof(PartnerInboundAppService).GetMethod("ReceiveAsync");
        receive.ShouldNotBeNull();
        // Argument validation must stay OFF: the interceptor would throw
        // AbpValidationException ahead of the body, which the IActionResult
        // controller surfaces as a 500 leaking the ABP error shape. The
        // service validates in-method and returns outcomes as data.
        receive.GetCustomAttribute<Volo.Abp.Validation.DisableValidationAttribute>()
            .ShouldNotBeNull();
    }

    [Fact]
    public void Partner_key_material_is_hashed_prefix_addressable_and_verifiable()
    {
        var (rawKey, keyPrefix, keyHash) = PartnerKeyMaterial.Generate();

        rawKey.ShouldStartWith(PartnerKeyMaterial.Prefix);
        keyPrefix.ShouldBe(rawKey[..PartnerApiKeyConsts.PrefixLength]);
        keyHash.Length.ShouldBe(PartnerApiKeyConsts.HashLength);
        keyHash.ShouldBe(keyHash.ToLowerInvariant());
        // The stored hash never contains the raw key material.
        keyHash.ShouldNotContain(rawKey[4..]);

        PartnerKeyMaterial.Verify(rawKey, keyHash).ShouldBeTrue();
        PartnerKeyMaterial.Verify(rawKey + "x", keyHash).ShouldBeFalse();

        var second = PartnerKeyMaterial.Generate();
        second.RawKey.ShouldNotBe(rawKey);
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
