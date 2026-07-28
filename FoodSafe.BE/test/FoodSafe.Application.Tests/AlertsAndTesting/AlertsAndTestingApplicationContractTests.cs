using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public sealed class AlertsAndTestingApplicationContractTests
{
    [Theory]
    [InlineData(typeof(AtpAlertAppService), "GetListAsync", null)]
    [InlineData(typeof(AtpAlertAppService), "GetAsync", null)]
    [InlineData(typeof(AtpAlertAppService), "CreateAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Create)]
    [InlineData(typeof(AtpAlertAppService), "UpdateAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Edit)]
    [InlineData(typeof(AtpAlertAppService), "DeleteAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Delete)]
    [InlineData(typeof(AtpAlertAppService), "PublishAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Publish)]
    [InlineData(typeof(AtpAlertAppService), "RecallAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Publish)]
    [InlineData(typeof(AtpAlertAppService), "RejectAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.Publish)]
    [InlineData(typeof(AtpNewsAppService), "GetListAsync", null)]
    [InlineData(typeof(AtpNewsAppService), "GetAsync", null)]
    [InlineData(typeof(AtpNewsAppService), "GetAlertOptionsAsync", null)]
    [InlineData(typeof(AtpNewsAppService), "CreateAsync",
        FoodSafePermissions.AlertsAndTesting.News.Create)]
    [InlineData(typeof(AtpNewsAppService), "UpdateAsync",
        FoodSafePermissions.AlertsAndTesting.News.Edit)]
    [InlineData(typeof(AtpNewsAppService), "DeleteAsync",
        FoodSafePermissions.AlertsAndTesting.News.Delete)]
    [InlineData(typeof(AtpNewsAppService), "PublishAsync",
        FoodSafePermissions.AlertsAndTesting.News.Publish)]
    [InlineData(typeof(AtpNewsAppService), "RecallAsync",
        FoodSafePermissions.AlertsAndTesting.News.Publish)]
    [InlineData(typeof(AtpNewsAppService), "RejectAsync",
        FoodSafePermissions.AlertsAndTesting.News.Publish)]
    [InlineData(typeof(RiskAnalysisAppService), "GetListAsync", null)]
    [InlineData(typeof(RiskAnalysisAppService), "GetAsync", null)]
    [InlineData(typeof(RiskAnalysisAppService), "CreateAsync",
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Create)]
    [InlineData(typeof(RiskAnalysisAppService), "UpdateAsync",
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Edit)]
    [InlineData(typeof(RiskAnalysisAppService), "DeleteAsync",
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Delete)]
    [InlineData(typeof(RiskAnalysisAppService), "PublishAsync",
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Publish)]
    [InlineData(typeof(AdministrativeDocumentAppService), "GetListAsync", null)]
    [InlineData(typeof(AdministrativeDocumentAppService), "GetAsync", null)]
    [InlineData(typeof(AdministrativeDocumentAppService), "CreateAsync",
        FoodSafePermissions.AlertsAndTesting.Documents.Create)]
    [InlineData(typeof(AdministrativeDocumentAppService), "UpdateAsync",
        FoodSafePermissions.AlertsAndTesting.Documents.Edit)]
    [InlineData(typeof(AdministrativeDocumentAppService), "DeleteAsync",
        FoodSafePermissions.AlertsAndTesting.Documents.Delete)]
    [InlineData(typeof(TestingResultAppService), "GetListAsync", null)]
    [InlineData(typeof(TestingResultAppService), "GetAsync", null)]
    [InlineData(typeof(TestingResultAppService), "CreateAsync",
        FoodSafePermissions.AlertsAndTesting.TestingResults.Create)]
    [InlineData(typeof(TestingResultAppService), "UpdateAsync",
        FoodSafePermissions.AlertsAndTesting.TestingResults.Edit)]
    [InlineData(typeof(TestingResultAppService), "DeleteAsync",
        FoodSafePermissions.AlertsAndTesting.TestingResults.Delete)]
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
        typeof(AtpAlertAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.AlertsAndTesting.Alerts.View);

        typeof(AtpNewsAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.AlertsAndTesting.News.View);

        typeof(RiskAnalysisAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View);

        typeof(AdministrativeDocumentAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.AlertsAndTesting.Documents.View);

        typeof(TestingResultAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.AlertsAndTesting.TestingResults.View);
    }

    [Theory]
    [InlineData(typeof(AtpAlertExcelAppService), "ExportAsync",
        FoodSafePermissions.AlertsAndTesting.Alerts.View)]
    [InlineData(typeof(AtpNewsExcelAppService), "ExportAsync",
        FoodSafePermissions.AlertsAndTesting.News.View)]
    [InlineData(typeof(RiskAnalysisExcelAppService), "ExportAsync",
        FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View)]
    [InlineData(typeof(AdministrativeDocumentExcelAppService), "ExportAsync",
        FoodSafePermissions.AlertsAndTesting.Documents.View)]
    [InlineData(typeof(TestingResultExcelAppService), "ExportAsync",
        FoodSafePermissions.AlertsAndTesting.TestingResults.View)]
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
