using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Inspection;

public sealed class InspectionResultTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly DateTime Today = new(2026, 7, 26);

    [Fact]
    public void Create_should_normalize_date_and_currency()
    {
        var result = CreateResult();

        result.InspectionDate.ShouldBe(Today);
        result.FineCurrency.ShouldBe("VND");
        result.OverallResult.ShouldBe(InspectionOverallResult.Pass);
    }

    [Fact]
    public void Create_should_reject_plan_without_item()
    {
        Should.Throw<BusinessException>(() =>
                InspectionResult.Create(
                    Guid.NewGuid(), Guid.NewGuid(), OrgId,
                    planId: Guid.NewGuid(), planItemId: null,
                    Today, InspectionType.Scheduled,
                    null, null, InspectionOverallResult.Pass,
                    false, null, null, null, null, false, null, null, null, null))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.PlanItemWithoutPlan);
    }

    [Fact]
    public void Create_should_reject_item_without_plan()
    {
        Should.Throw<BusinessException>(() =>
                InspectionResult.Create(
                    Guid.NewGuid(), Guid.NewGuid(), OrgId,
                    planId: null, planItemId: Guid.NewGuid(),
                    Today, InspectionType.Scheduled,
                    null, null, InspectionOverallResult.Pass,
                    false, null, null, null, null, false, null, null, null, null))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.PlanItemWithoutPlan);
    }

    [Fact]
    public void Explicit_fine_total_should_survive_itemised_violations()
    {
        var result = InspectionResult.Create(
            Guid.NewGuid(), Guid.NewGuid(), OrgId,
            null, null, Today, InspectionType.Scheduled,
            null, null, InspectionOverallResult.Fail,
            true, null, 5_000_000m, null, null, false, null, null, null, null);

        result.AddViolation(Guid.NewGuid(), "V01", "Vi phạm", null, null, null, null);

        result.FineAmount.ShouldBe(5_000_000m);
        result.HasViolation.ShouldBeTrue();
    }

    [Fact]
    public void Create_should_reject_negative_fine()
    {
        Should.Throw<ArgumentException>(() =>
            InspectionResult.Create(
                Guid.NewGuid(), Guid.NewGuid(), OrgId,
                null, null, Today, InspectionType.Scheduled,
                null, null, InspectionOverallResult.Pass,
                false, null, -100m, null, null, false, null, null, null, null));
    }

    [Fact]
    public void AddViolation_should_recalculate_state()
    {
        var result = CreateResult();
        result.AddViolation(Guid.NewGuid(), "V01", "Vi phạm 1", null, 500_000m, null, null);
        result.AddViolation(Guid.NewGuid(), "V02", "Vi phạm 2", null, 300_000m, null, null);

        result.HasViolation.ShouldBeTrue();
        result.FineAmount.ShouldBe(800_000m);
        result.Violations.Count.ShouldBe(2);
    }

    [Fact]
    public void RemoveViolation_should_recalculate_state()
    {
        var result = CreateResult();
        var v = result.AddViolation(Guid.NewGuid(), "V01", "Vi phạm", null, 500_000m, null, null);
        result.RemoveViolation(v.Id);

        result.HasViolation.ShouldBeFalse();
        result.FineAmount.ShouldBeNull();
    }

    [Fact]
    public void RemoveViolation_should_reject_missing()
    {
        var result = CreateResult();

        Should.Throw<BusinessException>(() =>
                result.RemoveViolation(Guid.NewGuid()))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Inspection.ViolationNotFound);
    }

    [Fact]
    public void MarkViolationRemedied_should_set_remedied_fields()
    {
        var result = CreateResult();
        var v = result.AddViolation(Guid.NewGuid(), "V01", "Vi phạm", null, null, null, null);
        result.MarkViolationRemedied(v.Id, Today, "Đã khắc phục");

        var violation = result.Violations.Single();
        violation.IsRemedied.ShouldBeTrue();
        violation.RemediedAt.ShouldBe(Today);
        violation.RemediedNotes.ShouldBe("Đã khắc phục");
    }

    [Fact]
    public void SetInspectors_should_replace_all()
    {
        var result = CreateResult();
        var user1 = Guid.NewGuid();
        var user2 = Guid.NewGuid();

        result.SetInspectors([(user1, true), (user2, false)]);
        result.Inspectors.Count.ShouldBe(2);

        result.SetInspectors([(user1, false)]);
        result.Inspectors.Count.ShouldBe(1);
        result.Inspectors[0].IsTeamLeader.ShouldBeFalse();
    }

    [Fact]
    public void SetFollowUpResult_should_set_value()
    {
        var result = CreateResult();
        result.SetFollowUpResult(FollowUpResult.Passed);
        result.FollowUpResultValue.ShouldBe(FollowUpResult.Passed);
    }

    private static InspectionResult CreateResult() =>
        InspectionResult.Create(
            Guid.NewGuid(), Guid.NewGuid(), OrgId,
            null, null, Today, InspectionType.Scheduled,
            "Nguyễn Văn A", null, InspectionOverallResult.Pass,
            false, null, null, null, null, false, null, null, null, null);
}
