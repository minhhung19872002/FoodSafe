using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.Reporting;

public sealed class ReportingApplicationContractTests
{
    [Theory]
    [InlineData(typeof(NdtpReportAppService), "GetListAsync", null)]
    [InlineData(typeof(NdtpReportAppService), "GetAsync", null)]
    [InlineData(typeof(NdtpReportAppService), "CreateAsync",
        FoodSafePermissions.Reporting.NdtpReports.Create)]
    [InlineData(typeof(NdtpReportAppService), "UpdateStatsAsync",
        FoodSafePermissions.Reporting.NdtpReports.Edit)]
    [InlineData(typeof(NdtpReportAppService), "UpdateNarrativeAsync",
        FoodSafePermissions.Reporting.NdtpReports.Edit)]
    [InlineData(typeof(NdtpReportAppService), "DeleteAsync",
        FoodSafePermissions.Reporting.NdtpReports.Delete)]
    [InlineData(typeof(NdtpReportAppService), "SubmitAsync",
        FoodSafePermissions.Reporting.NdtpReports.Submit)]
    [InlineData(typeof(NdtpReportAppService), "VerifyAsync",
        FoodSafePermissions.Reporting.NdtpReports.Verify)]
    [InlineData(typeof(NdtpReportAppService), "ReturnAsync",
        FoodSafePermissions.Reporting.NdtpReports.Return)]
    [InlineData(typeof(NdtpReportAppService), "CompleteAsync",
        FoodSafePermissions.Reporting.NdtpReports.Complete)]
    [InlineData(typeof(NdtpReportAppService), "ReturnToDraftAsync",
        FoodSafePermissions.Reporting.NdtpReports.Edit)]
    [InlineData(typeof(AtpWorkReportAppService), "GetListAsync", null)]
    [InlineData(typeof(AtpWorkReportAppService), "GetAsync", null)]
    [InlineData(typeof(AtpWorkReportAppService), "CreateAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Create)]
    [InlineData(typeof(AtpWorkReportAppService), "UpdateStatsAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
    [InlineData(typeof(AtpWorkReportAppService), "UpdateNarrativeAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
    [InlineData(typeof(AtpWorkReportAppService), "DeleteAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Delete)]
    [InlineData(typeof(AtpWorkReportAppService), "SubmitAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Submit)]
    [InlineData(typeof(AtpWorkReportAppService), "VerifyAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Verify)]
    [InlineData(typeof(AtpWorkReportAppService), "ReturnAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Return)]
    [InlineData(typeof(AtpWorkReportAppService), "CompleteAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Complete)]
    [InlineData(typeof(AtpWorkReportAppService), "ReturnToDraftAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
    [InlineData(typeof(ActionMonthReportAppService), "GetListAsync", null)]
    [InlineData(typeof(ActionMonthReportAppService), "GetAsync", null)]
    [InlineData(typeof(ActionMonthReportAppService), "CreateAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Create)]
    [InlineData(typeof(ActionMonthReportAppService), "UpdateStatsAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
    [InlineData(typeof(ActionMonthReportAppService), "UpdateNarrativeAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
    [InlineData(typeof(ActionMonthReportAppService), "DeleteAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Delete)]
    [InlineData(typeof(ActionMonthReportAppService), "SubmitAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Submit)]
    [InlineData(typeof(ActionMonthReportAppService), "VerifyAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Verify)]
    [InlineData(typeof(ActionMonthReportAppService), "ReturnAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Return)]
    [InlineData(typeof(ActionMonthReportAppService), "CompleteAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Complete)]
    [InlineData(typeof(ActionMonthReportAppService), "ReturnToDraftAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
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
        typeof(NdtpReportAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Reporting.NdtpReports.View);

        typeof(AtpWorkReportAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Reporting.AtpWorkReports.View);

        typeof(ActionMonthReportAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Reporting.ActionMonthReports.View);
    }

    [Theory]
    [InlineData(typeof(NdtpReportExcelAppService), "ExportAsync",
        FoodSafePermissions.Reporting.NdtpReports.View)]
    [InlineData(typeof(AtpWorkReportExcelAppService), "ExportAsync",
        FoodSafePermissions.Reporting.AtpWorkReports.View)]
    [InlineData(typeof(ActionMonthReportExcelAppService), "ExportAsync",
        FoodSafePermissions.Reporting.ActionMonthReports.View)]
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
