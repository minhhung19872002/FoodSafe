using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Inspection;

public sealed class InspectionPlanTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTime Now = new(2026, 7, 26, 10, 0, 0);

    [Fact]
    public void Create_should_normalize_plan_code_and_start_as_draft()
    {
        var plan = CreatePlan(planCode: " kh-01 ");

        plan.PlanCode.ShouldBe("KH-01");
        plan.Status.ShouldBe(InspectionPlanStatus.Draft);
        plan.Items.ShouldBeEmpty();
    }

    [Fact]
    public void Create_should_reject_reversed_dates()
    {
        var ex = Should.Throw<BusinessException>(() =>
            CreatePlan(
                startDate: new DateTime(2026, 12, 1),
                endDate: new DateTime(2026, 1, 1)));

        ex.Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.InvalidDateRange);
    }

    [Fact]
    public void AddBusiness_should_reject_duplicate()
    {
        var plan = CreatePlan();
        var businessId = Guid.NewGuid();
        plan.AddBusiness(Guid.NewGuid(), businessId, 1, null, null, null);

        var ex = Should.Throw<BusinessException>(() =>
            plan.AddBusiness(Guid.NewGuid(), businessId, 2, null, null, null));

        ex.Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.DuplicateBusiness);
    }

    [Fact]
    public void AddBusiness_should_reject_when_not_draft()
    {
        var plan = CreateSubmittedPlan();

        Should.Throw<BusinessException>(() =>
                plan.AddBusiness(Guid.NewGuid(), Guid.NewGuid(), 1, null, null, null))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.CannotModifyNonDraft);
    }

    [Fact]
    public void Submit_should_reject_empty_plan()
    {
        var plan = CreatePlan();

        Should.Throw<BusinessException>(() => plan.Submit(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.EmptyPlan);
    }

    [Fact]
    public void Submit_should_set_audit_fields()
    {
        var plan = CreatePlanWithItem();
        plan.Submit(UserId, Now);

        plan.Status.ShouldBe(InspectionPlanStatus.Submitted);
        plan.SubmittedById.ShouldBe(UserId);
        plan.SubmittedAt.ShouldBe(Now);
    }

    [Fact]
    public void Approve_should_transition_from_submitted()
    {
        var plan = CreateSubmittedPlan();
        plan.Approve(UserId, Now);

        plan.Status.ShouldBe(InspectionPlanStatus.Approved);
        plan.ApprovedById.ShouldBe(UserId);
    }

    [Fact]
    public void Approve_should_reject_draft()
    {
        var plan = CreatePlanWithItem();

        Should.Throw<BusinessException>(() => plan.Approve(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.InvalidStatusTransition);
    }

    [Fact]
    public void Reject_should_return_to_draft_with_reason()
    {
        var plan = CreateSubmittedPlan();
        plan.Reject(UserId, Now, "Cần bổ sung thêm");

        plan.Status.ShouldBe(InspectionPlanStatus.Draft);
        plan.RejectedReason.ShouldBe("Cần bổ sung thêm");
    }

    [Fact]
    public void MarkInProgress_should_only_work_from_approved()
    {
        var plan = CreateSubmittedPlan();
        plan.Approve(UserId, Now);
        plan.MarkInProgress();

        plan.Status.ShouldBe(InspectionPlanStatus.InProgress);
    }

    [Fact]
    public void Complete_should_work_from_approved_or_in_progress()
    {
        var plan = CreateSubmittedPlan();
        plan.Approve(UserId, Now);
        plan.Complete();

        plan.Status.ShouldBe(InspectionPlanStatus.Completed);
    }

    [Fact]
    public void Cancel_should_reject_completed()
    {
        var plan = CreateSubmittedPlan();
        plan.Approve(UserId, Now);
        plan.Complete();

        Should.Throw<BusinessException>(() =>
                plan.Cancel(UserId, Now, "Hủy bỏ"))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.CannotCancelCompleted);
    }

    [Fact]
    public void Cancel_should_work_from_draft()
    {
        var plan = CreatePlanWithItem();
        plan.Cancel(UserId, Now, "Hủy kế hoạch");

        plan.Status.ShouldBe(InspectionPlanStatus.Cancelled);
        plan.CancelledReason.ShouldBe("Hủy kế hoạch");
    }

    [Fact]
    public void RemoveBusiness_should_reject_missing()
    {
        var plan = CreatePlan();

        Should.Throw<BusinessException>(() =>
                plan.RemoveBusiness(Guid.NewGuid()))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.BusinessNotInPlan);
    }

    private static InspectionPlan CreatePlan(
        string planCode = "KH-01",
        DateTime? startDate = null,
        DateTime? endDate = null) =>
        InspectionPlan.Create(
            Guid.NewGuid(), OrgId, planCode,
            "Kế hoạch thanh tra", InspectionPlanType.Annual, 2026,
            startDate, endDate, null, null);

    private static InspectionPlan CreatePlanWithItem()
    {
        var plan = CreatePlan();
        plan.AddBusiness(Guid.NewGuid(), Guid.NewGuid(), 1, null, null, null);
        return plan;
    }

    private static InspectionPlan CreateSubmittedPlan()
    {
        var plan = CreatePlanWithItem();
        plan.Submit(UserId, Now);
        return plan;
    }
}
