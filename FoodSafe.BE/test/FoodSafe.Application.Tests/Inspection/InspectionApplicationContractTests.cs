using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.Inspection;

public sealed class InspectionApplicationContractTests
{
    [Theory]
    [InlineData(typeof(InspectionPlanAppService), "GetListAsync", null)]
    [InlineData(typeof(InspectionPlanAppService), "GetAsync", null)]
    [InlineData(typeof(InspectionPlanAppService), "GetBusinessOptionsAsync", null)]
    [InlineData(typeof(InspectionPlanAppService), "CreateAsync",
        FoodSafePermissions.Inspection.Plans.Create)]
    [InlineData(typeof(InspectionPlanAppService), "UpdateAsync",
        FoodSafePermissions.Inspection.Plans.Edit)]
    [InlineData(typeof(InspectionPlanAppService), "DeleteAsync",
        FoodSafePermissions.Inspection.Plans.Delete)]
    [InlineData(typeof(InspectionPlanAppService), "SubmitAsync",
        FoodSafePermissions.Inspection.Plans.Edit)]
    [InlineData(typeof(InspectionPlanAppService), "ApproveAsync",
        FoodSafePermissions.Inspection.Plans.Approve)]
    [InlineData(typeof(InspectionPlanAppService), "RejectAsync",
        FoodSafePermissions.Inspection.Plans.Approve)]
    [InlineData(typeof(InspectionPlanAppService), "CompleteAsync",
        FoodSafePermissions.Inspection.Plans.Edit)]
    [InlineData(typeof(InspectionPlanAppService), "CancelAsync",
        FoodSafePermissions.Inspection.Plans.Edit)]
    [InlineData(typeof(InspectionResultAppService), "GetListAsync", null)]
    [InlineData(typeof(InspectionResultAppService), "GetAsync", null)]
    [InlineData(typeof(InspectionResultAppService), "CreateAsync",
        FoodSafePermissions.Inspection.Results.Create)]
    [InlineData(typeof(InspectionResultAppService), "UpdateAsync",
        FoodSafePermissions.Inspection.Results.Edit)]
    [InlineData(typeof(InspectionResultAppService), "DeleteAsync",
        FoodSafePermissions.Inspection.Results.Delete)]
    [InlineData(typeof(InspectionResultAppService), "MarkViolationRemediedAsync",
        FoodSafePermissions.Inspection.Results.Edit)]
    [InlineData(typeof(InspectionResultAppService), "SetFollowUpResultAsync",
        FoodSafePermissions.Inspection.Results.Edit)]
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
        typeof(InspectionPlanAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Inspection.Plans.View);

        typeof(InspectionResultAppService)
            .GetCustomAttribute<AuthorizeAttribute>()!
            .Policy.ShouldBe(FoodSafePermissions.Inspection.Results.View);
    }

    [Theory]
    [InlineData(typeof(InspectionPlanExcelAppService), "ExportAsync",
        FoodSafePermissions.Inspection.Plans.View)]
    [InlineData(typeof(InspectionResultExcelAppService), "ExportAsync",
        FoodSafePermissions.Inspection.Results.View)]
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
    public void UncompletedItemsExist_error_code_should_be_defined()
    {
        FoodSafeDomainErrorCodes.Inspection.UncompletedItemsExist
            .ShouldBe("FoodSafe:Inspection:0021");
    }
}
