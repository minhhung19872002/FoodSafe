using FoodSafe.Reporting;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Reporting;

public sealed class NdtpReportTests
{
    private static NdtpReport CreateDraft()
        => NdtpReport.Create(Guid.NewGuid(), Guid.NewGuid(), 2026, 7);

    [Fact]
    public void Create_Sets_Draft_Status()
    {
        var r = CreateDraft();
        r.Status.ShouldBe(ReportStatus.Draft);
        r.PeriodYear.ShouldBe(2026);
        r.PeriodMonth.ShouldBe(7);
        r.SubmissionVersion.ShouldBe((short)0);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(13)]
    [InlineData(-1)]
    public void Create_Rejects_Invalid_Month(int month)
    {
        Should.Throw<BusinessException>(() =>
            NdtpReport.Create(Guid.NewGuid(), Guid.NewGuid(), 2026, month));
    }

    [Fact]
    public void UpdateStats_Clamps_Negatives()
    {
        var r = CreateDraft();
        r.UpdateStats(-1, 10, 5, 0, -3, 20, 8, 1);
        r.CaseCount.ShouldBe(0);
        r.CaseAffected.ShouldBe(10);
        r.IncidentCount.ShouldBe(0);
        r.IncidentAffected.ShouldBe(20);
    }

    [Fact]
    public void UpdateStats_Rejects_NonDraft()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            r.UpdateStats(1, 1, 1, 0, 1, 1, 1, 0));
    }

    [Fact]
    public void UpdateNarrative_Works_When_Draft()
    {
        var r = CreateDraft();
        r.UpdateNarrative("prevention", "risk", "recommendations");
        r.PreventionActivities.ShouldBe("prevention");
        r.RiskFactors.ShouldBe("risk");
        r.Recommendations.ShouldBe("recommendations");
    }

    [Fact]
    public void Submit_Transitions_Draft_To_Submitted()
    {
        var r = CreateDraft();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        r.Submit(userId, now);
        r.Status.ShouldBe(ReportStatus.Submitted);
        r.SubmittedById.ShouldBe(userId);
        r.SubmittedAt.ShouldBe(now);
        r.SubmissionVersion.ShouldBe((short)1);
    }

    [Fact]
    public void Submit_Rejects_NonDraft()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            r.Submit(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void Verify_Transitions_Submitted_To_Verified()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        var verifier = Guid.NewGuid();
        r.Verify(verifier, DateTime.UtcNow);
        r.Status.ShouldBe(ReportStatus.Verified);
        r.VerifiedById.ShouldBe(verifier);
    }

    [Fact]
    public void Verify_Rejects_Draft()
    {
        var r = CreateDraft();
        Should.Throw<BusinessException>(() =>
            r.Verify(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void Return_From_Submitted_Works()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Sai số liệu");
        r.Status.ShouldBe(ReportStatus.Returned);
        r.ReturnReason.ShouldBe("Sai số liệu");
    }

    [Fact]
    public void Return_From_Verified_Works()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Cần bổ sung");
        r.Status.ShouldBe(ReportStatus.Returned);
    }

    [Fact]
    public void Return_Rejects_Draft()
    {
        var r = CreateDraft();
        Should.Throw<BusinessException>(() =>
            r.Return(Guid.NewGuid(), DateTime.UtcNow, "reason"));
    }

    [Fact]
    public void Return_Rejects_Empty_Reason()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
                r.Return(Guid.NewGuid(), DateTime.UtcNow, ""))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Report.ReturnReasonRequired);
    }

    [Fact]
    public void Complete_Transitions_Verified_To_Completed()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var completer = Guid.NewGuid();
        r.Complete(completer, DateTime.UtcNow);
        r.Status.ShouldBe(ReportStatus.Completed);
        r.CompletedById.ShouldBe(completer);
    }

    [Fact]
    public void Complete_Rejects_Submitted()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            r.Complete(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void ReturnToDraft_Works_After_Return()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Fix");
        r.ReturnToDraft();
        r.Status.ShouldBe(ReportStatus.Draft);
    }

    [Fact]
    public void ReturnToDraft_Rejects_Draft()
    {
        var r = CreateDraft();
        Should.Throw<BusinessException>(() => r.ReturnToDraft());
    }

    [Fact]
    public void Resubmit_Increments_Version()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Fix");
        r.ReturnToDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.SubmissionVersion.ShouldBe((short)2);
    }

    [Fact]
    public void AddErrorNotification_Works_When_Verified()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.AddErrorNotification(Guid.NewGuid(), Guid.NewGuid(), "field1", "fix it", Guid.NewGuid());
        r.ErrorNotifications.Count.ShouldBe(1);
    }

    [Fact]
    public void AddErrorNotification_Rejects_Draft()
    {
        var r = CreateDraft();
        Should.Throw<BusinessException>(() =>
            r.AddErrorNotification(Guid.NewGuid(), Guid.NewGuid(), "f", "d", Guid.NewGuid()));
    }

    [Fact]
    public void AddErrorNotification_Rejects_Completed()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.Complete(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            r.AddErrorNotification(Guid.NewGuid(), Guid.NewGuid(), "f", "d", Guid.NewGuid()));
    }
}
