using FoodSafe.Reporting;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Reporting;

public sealed class ActionMonthReportTests
{
    private static ActionMonthReport CreateDraft()
        => ActionMonthReport.Create(Guid.NewGuid(), Guid.NewGuid(), 2026);

    [Fact]
    public void Create_Sets_Draft_Status()
    {
        var r = CreateDraft();
        r.Status.ShouldBe(ReportStatus.Draft);
        r.PeriodYear.ShouldBe(2026);
    }

    [Fact]
    public void UpdateHeader_Works_When_Draft()
    {
        var r = CreateDraft();
        r.UpdateHeader("Vì sức khỏe cộng đồng", "15/4 - 15/5/2026");
        r.ActionMonthTheme.ShouldBe("Vì sức khỏe cộng đồng");
        r.ActionMonthDates.ShouldBe("15/4 - 15/5/2026");
    }

    [Fact]
    public void UpdateCommunicationStats_Clamps_Negatives()
    {
        var r = CreateDraft();
        r.UpdateCommunicationStats(-1, 5, 10, 200, -3, 1000);
        r.MediaArticles.ShouldBe(0);
        r.BroadcastPrograms.ShouldBe(5);
        r.PostersDistributed.ShouldBe(0);
        r.LeafletsDistributed.ShouldBe(1000);
    }

    [Fact]
    public void UpdateInspectionStats_Works_When_Draft()
    {
        var r = CreateDraft();
        r.UpdateInspectionStats(50, 10, 5, 25_000_000m);
        r.BusinessesInspected.ShouldBe(50);
        r.FineAmount.ShouldBe(25_000_000m);
    }

    [Fact]
    public void UpdateOtherStats_Works_When_Draft()
    {
        var r = CreateDraft();
        r.UpdateOtherStats(15);
        r.NewSelfDeclarations.ShouldBe(15);
    }

    [Fact]
    public void UpdateNarrative_Works_When_Draft()
    {
        var r = CreateDraft();
        r.UpdateNarrative("ach", "lim", "lessons", "next");
        r.Achievements.ShouldBe("ach");
        r.LessonsLearned.ShouldBe("lessons");
    }

    [Fact]
    public void All_Update_Methods_Reject_Submitted()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);

        Should.Throw<BusinessException>(() => r.UpdateHeader("a", "b"));
        Should.Throw<BusinessException>(() => r.UpdateCommunicationStats(1, 1, 1, 1, 1, 1));
        Should.Throw<BusinessException>(() => r.UpdateInspectionStats(1, 1, 1, 1m));
        Should.Throw<BusinessException>(() => r.UpdateOtherStats(1));
        Should.Throw<BusinessException>(() => r.UpdateNarrative("a", "b", "c", "d"));
    }

    [Fact]
    public void Full_Lifecycle_Submit_Verify_Complete()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.Complete(Guid.NewGuid(), DateTime.UtcNow);
        r.Status.ShouldBe(ReportStatus.Completed);
    }

    [Fact]
    public void Full_Lifecycle_Submit_Return_Fix_Resubmit()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Return(Guid.NewGuid(), DateTime.UtcNow, "Thiếu số liệu");
        r.ReturnToDraft();
        r.UpdateCommunicationStats(5, 3, 10, 300, 500, 2000);
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.SubmissionVersion.ShouldBe((short)2);
    }

    [Fact]
    public void AddErrorNotification_Works_When_Verified()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        r.Verify(Guid.NewGuid(), DateTime.UtcNow);
        r.AddErrorNotification(Guid.NewGuid(), Guid.NewGuid(), "stats", "recount", Guid.NewGuid());
        r.ErrorNotifications.Count.ShouldBe(1);
        r.ErrorNotifications[0].Status.ShouldBe(ReportErrorNotificationStatus.Pending);
    }

    [Fact]
    public void AddErrorNotification_Rejects_Submitted()
    {
        var r = CreateDraft();
        r.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            r.AddErrorNotification(Guid.NewGuid(), Guid.NewGuid(), "f", "d", Guid.NewGuid()));
    }
}
