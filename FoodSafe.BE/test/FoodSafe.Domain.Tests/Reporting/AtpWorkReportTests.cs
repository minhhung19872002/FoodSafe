using FoodSafe.Reporting;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Reporting;

public sealed class AtpWorkReportTests
{
    private static AtpWorkReport CreateHalfYear()
        => AtpWorkReport.Create(Guid.NewGuid(), Guid.NewGuid(), ReportPeriodType.HalfYear, 2026, 1);

    private static AtpWorkReport CreateFullYear()
        => AtpWorkReport.Create(Guid.NewGuid(), Guid.NewGuid(), ReportPeriodType.FullYear, 2026, null);

    [Fact]
    public void Create_HalfYear_Sets_Correct_Period()
    {
        var r = CreateHalfYear();
        r.PeriodType.ShouldBe(ReportPeriodType.HalfYear);
        r.PeriodYear.ShouldBe(2026);
        r.PeriodHalf.ShouldBe(1);
        r.Status.ShouldBe(ReportStatus.Draft);
    }

    [Fact]
    public void Create_FullYear_Nullifies_Half()
    {
        var r = CreateFullYear();
        r.PeriodType.ShouldBe(ReportPeriodType.FullYear);
        r.PeriodHalf.ShouldBeNull();
    }

    [Fact]
    public void Create_HalfYear_Rejects_Invalid_Half()
    {
        Should.Throw<BusinessException>(() =>
            AtpWorkReport.Create(Guid.NewGuid(), Guid.NewGuid(), ReportPeriodType.HalfYear, 2026, 3));
    }

    [Fact]
    public void Create_HalfYear_Rejects_Null_Half()
    {
        Should.Throw<BusinessException>(() =>
            AtpWorkReport.Create(Guid.NewGuid(), Guid.NewGuid(), ReportPeriodType.HalfYear, 2026, null));
    }

    [Fact]
    public void UpdateBusinessStats_Clamps_Negatives()
    {
        var r = CreateHalfYear();
        r.UpdateBusinessStats(-5, 10, -1, 3);
        r.TotalBusinesses.ShouldBe(0);
        r.NewBusinesses.ShouldBe(10);
        r.InactiveBusinesses.ShouldBe(0);
        r.BusinessesWithCertificate.ShouldBe(3);
    }

    [Fact]
    public void UpdateLicensingStats_Works_When_Draft()
    {
        var r = CreateHalfYear();
        r.UpdateLicensingStats(10, 20, 5, 8, 3, 2);
        r.DkcbIssued.ShouldBe(10);
        r.SelfDeclarationsReceived.ShouldBe(20);
        r.ExportCertificatesIssued.ShouldBe(2);
    }

    [Fact]
    public void UpdateInspectionStats_Works_When_Draft()
    {
        var r = CreateHalfYear();
        r.UpdateInspectionStats(5, 100, 20, 10, 50_000_000m);
        r.TotalInspectionPlans.ShouldBe(5);
        r.BusinessesInspected.ShouldBe(100);
        r.FineTotalAmount.ShouldBe(50_000_000m);
    }

    [Fact]
    public void UpdatePoisoningStats_Works_When_Draft()
    {
        var r = CreateHalfYear();
        r.UpdatePoisoningStats(3, 1, 25, 0);
        r.PoisoningCaseCount.ShouldBe(3);
        r.PoisoningIncidentCount.ShouldBe(1);
    }

    [Fact]
    public void UpdateCommunicationStats_Works_When_Draft()
    {
        var r = CreateHalfYear();
        r.UpdateCommunicationStats(5, 200, 10, 3);
        r.TrainingSessions.ShouldBe(5);
        r.TrainingParticipants.ShouldBe(200);
    }

    [Fact]
    public void UpdateNarrative_Works_When_Draft()
    {
        var r = CreateHalfYear();
        r.UpdateNarrative("overview", "ach", "lim", "sol", "plan");
        r.Overview.ShouldBe("overview");
        r.NextPeriodPlan.ShouldBe("plan");
    }

    [Fact]
    public void All_Update_Methods_Reject_Submitted()
    {
        var r = CreateHalfYear();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);

        Should.Throw<BusinessException>(() => r.UpdateBusinessStats(1, 1, 1, 1));
        Should.Throw<BusinessException>(() => r.UpdateLicensingStats(1, 1, 1, 1, 1, 1));
        Should.Throw<BusinessException>(() => r.UpdateInspectionStats(1, 1, 1, 1, 1m));
        Should.Throw<BusinessException>(() => r.UpdatePoisoningStats(1, 1, 1, 1));
        Should.Throw<BusinessException>(() => r.UpdateCommunicationStats(1, 1, 1, 1));
        Should.Throw<BusinessException>(() => r.UpdateNarrative("a", "b", "c", "d", "e"));
    }

    [Fact]
    public void Full_Workflow_Submit_Verify_Complete()
    {
        var r = CreateHalfYear();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.Complete(Guid.NewGuid(), DateTime.UtcNow);
        r.Status.ShouldBe(ReportStatus.Completed);
    }

    [Fact]
    public void Full_Workflow_Submit_Return_Resubmit()
    {
        var r = CreateHalfYear();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Fix numbers");
        r.ReturnToDraft();
        r.UpdateBusinessStats(100, 5, 2, 80);
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.SubmissionVersion.ShouldBe((short)2);
        r.Status.ShouldBe(ReportStatus.Submitted);
    }
}
