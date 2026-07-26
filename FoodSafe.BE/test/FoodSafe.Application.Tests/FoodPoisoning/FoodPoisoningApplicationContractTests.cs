using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.FoodPoisoning;

public sealed class FoodPoisoningApplicationContractTests
{
    [Theory]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "GetListAsync", null)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "GetAsync", null)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "CreateAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Create)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "UpdateAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "DeleteAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Delete)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "SubmitAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "VerifyAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Verify)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "ConcludeAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Conclude)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "GetErrorReportsAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.View)]
    [InlineData(typeof(FoodPoisoningIncidentAppService), "AddErrorReportAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "GetListAsync", null)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "GetAsync", null)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "CreateAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Create)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "UpdateAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "DeleteAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Delete)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "SubmitAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "VerifyAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Verify)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "GetErrorReportsAsync",
        FoodSafePermissions.FoodPoisoning.Cases.View)]
    [InlineData(typeof(FoodPoisoningCaseAppService), "AddErrorReportAsync",
        FoodSafePermissions.FoodPoisoning.Cases.Edit)]
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
        typeof(FoodPoisoningIncidentAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.FoodPoisoning.Incidents.View);

        typeof(FoodPoisoningCaseAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.FoodPoisoning.Cases.View);
    }

    [Theory]
    [InlineData(typeof(FoodPoisoningIncidentExcelAppService), "ExportAsync",
        FoodSafePermissions.FoodPoisoning.Incidents.View)]
    [InlineData(typeof(FoodPoisoningCaseExcelAppService), "ExportAsync",
        FoodSafePermissions.FoodPoisoning.Cases.View)]
    public void Excel_exports_require_view_permission(
        Type serviceType, string methodName, string permission)
    {
        var method = serviceType.GetMethod(methodName);
        method.ShouldNotBeNull();
        method!.GetCustomAttributes<AuthorizeAttribute>()
            .Select(x => x.Policy)
            .ShouldContain(permission);
    }
}
