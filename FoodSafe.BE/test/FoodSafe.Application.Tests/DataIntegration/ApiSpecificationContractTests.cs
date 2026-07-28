using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Authorization contract for FR-50-05 partner API specification management:
/// least-privilege permissions per operation, and a partner-facing download that
/// is anonymous by design (publication is the access gate).
/// </summary>
public sealed class ApiSpecificationContractTests
{
    [Fact]
    public void Service_root_should_require_view_permission()
    {
        typeof(ApiSpecificationAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.DataIntegration.ApiSpecs.View);
    }

    [Theory]
    [InlineData("GetListAsync", null)]
    [InlineData("GetAsync", null)]
    [InlineData("DownloadAsync", null)]
    [InlineData("UploadAsync", FoodSafePermissions.DataIntegration.ApiSpecs.Create)]
    [InlineData("UpdateMetadataAsync", FoodSafePermissions.DataIntegration.ApiSpecs.Create)]
    [InlineData("PublishAsync", FoodSafePermissions.DataIntegration.ApiSpecs.Publish)]
    [InlineData("UnpublishAsync", FoodSafePermissions.DataIntegration.ApiSpecs.Publish)]
    [InlineData("DeleteAsync", FoodSafePermissions.DataIntegration.ApiSpecs.Delete)]
    public void Operations_should_use_least_privilege_permissions(
        string methodName, string? expectedPermission)
    {
        var method = typeof(ApiSpecificationAppService).GetMethod(methodName);
        method.ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>()?.Policy
            .ShouldBe(expectedPermission);
    }

    [Fact]
    public void Partner_download_by_name_is_anonymous_by_design()
    {
        // Partners fetch published specs without a session; publication is the
        // deliberate access gate, so the method opts out of the class-level view
        // permission. It must never require the FoodSafe cookie session.
        var method = typeof(ApiSpecificationAppService)
            .GetMethod(nameof(ApiSpecificationAppService.GetPublishedByNameAsync));
        method.ShouldNotBeNull();
        method.GetCustomAttribute<AllowAnonymousAttribute>().ShouldNotBeNull();
        method.GetCustomAttribute<AuthorizeAttribute>().ShouldBeNull();
    }
}
