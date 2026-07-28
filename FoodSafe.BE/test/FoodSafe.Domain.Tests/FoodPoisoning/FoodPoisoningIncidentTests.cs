using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.FoodPoisoning;

public sealed class FoodPoisoningIncidentTests
{
    private static readonly Guid OrgId = Guid.NewGuid();

    private static FoodPoisoningIncident CreateDraft() =>
        FoodPoisoningIncident.Create(Guid.NewGuid(), OrgId, "VND-QN-2026-001");

    [Fact]
    public void Create_Sets_Draft_Status()
    {
        var i = CreateDraft();
        i.Status.ShouldBe(PoisoningIncidentStatus.Draft);
        i.IncidentCode.ShouldBe("VND-QN-2026-001");
        i.OrganizationId.ShouldBe(OrgId);
    }

    [Fact]
    public void Create_Rejects_Empty_Code()
    {
        Should.Throw<ArgumentException>(() =>
            FoodPoisoningIncident.Create(Guid.NewGuid(), OrgId, ""));
    }

    [Fact]
    public void Update_Changes_Fields_When_Draft()
    {
        var i = CreateDraft();
        var now = DateTime.UtcNow;
        i.Update(now, now.AddDays(3), "Some notes");
        i.OccurrenceDate.ShouldBe(now);
        i.Notes.ShouldBe("Some notes");
    }

    [Fact]
    public void Update_Rejects_When_Reported()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() => i.Update(null, null, null));
    }

    [Fact]
    public void SetStatistics_Clamps_Negatives()
    {
        var i = CreateDraft();
        i.SetStatistics(-5, 10, 3, 0);
        i.ExposedCount.ShouldBe(0);
        i.AffectedCount.ShouldBe(10);
        i.HospitalizedCount.ShouldBe(3);
    }

    [Fact]
    public void SetLocation_Works_When_Draft()
    {
        var i = CreateDraft();
        i.SetLocation("Market", null, null, null, 21.0, 107.0);
        i.LocationDescription.ShouldBe("Market");
        i.LocationLatitude.ShouldBe(21.0);
    }

    [Fact]
    public void SetFoodInfo_Works_When_Draft()
    {
        var i = CreateDraft();
        i.SetFoodInfo("noodles", "street vendor", "bếp ăn tập thể");
        i.SuspectedFood.ShouldBe("noodles");
        i.FoodServiceType.ShouldBe("bếp ăn tập thể");
    }

    [Fact]
    public void SetCauseInfo_Works_When_Draft()
    {
        var i = CreateDraft();
        i.SetCauseInfo(CauseAssessment.Confirmed, "Salmonella", "S. enterica");
        i.CauseAssessmentValue.ShouldBe(CauseAssessment.Confirmed);
        i.CausativeAgent.ShouldBe("Salmonella");
    }

    [Fact]
    public void Submit_Sets_Reported()
    {
        var i = CreateDraft();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        i.Submit(userId, now);
        i.Status.ShouldBe(PoisoningIncidentStatus.Reported);
        i.ReportedById.ShouldBe(userId);
    }

    [Fact]
    public void Submit_Rejects_Non_Draft()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() => i.Submit(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void Verify_Sets_Verified()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        var verifier = Guid.NewGuid();
        i.Verify(verifier, DateTime.UtcNow);
        i.Status.ShouldBe(PoisoningIncidentStatus.Verified);
        i.VerifiedById.ShouldBe(verifier);
    }

    [Fact]
    public void Verify_Rejects_Draft()
    {
        var i = CreateDraft();
        Should.Throw<BusinessException>(() => i.Verify(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void Conclude_Sets_Concluded()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var concluder = Guid.NewGuid();
        var now = DateTime.UtcNow;
        i.Conclude(concluder, now, "Final conclusion");
        i.Status.ShouldBe(PoisoningIncidentStatus.Concluded);
        i.ConcludedById.ShouldBe(concluder);
        i.Conclusion.ShouldBe("Final conclusion");
    }

    [Fact]
    public void Conclude_Rejects_Non_Verified()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            i.Conclude(Guid.NewGuid(), DateTime.UtcNow, "conclusion"));
    }

    [Fact]
    public void Conclude_Rejects_Empty_Conclusion()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<ArgumentException>(() =>
            i.Conclude(Guid.NewGuid(), DateTime.UtcNow, ""));
    }

    [Fact]
    public void AddErrorReport_Works_When_Verified()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var report = i.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "wrong data", "fix it", Guid.NewGuid());
        i.ErrorReports.Count.ShouldBe(1);
        report.Status.ShouldBe(ErrorReportStatus.Pending);
    }

    [Fact]
    public void AddErrorReport_Rejects_Draft()
    {
        var i = CreateDraft();
        Should.Throw<BusinessException>(() =>
            i.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null));
    }

    [Fact]
    public void AddErrorReport_Rejects_Concluded()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        i.Conclude(Guid.NewGuid(), DateTime.UtcNow, "done");
        Should.Throw<BusinessException>(() =>
            i.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null));
    }

    [Fact]
    public void Acknowledge_Rejects_Already_Processed_Report()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var report = i.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null);
        report.Acknowledge();
        Should.Throw<BusinessException>(() => report.Acknowledge());
    }

    [Fact]
    public void MarkCorrected_Rejects_Corrected_Report()
    {
        var i = CreateDraft();
        i.Submit(Guid.NewGuid(), DateTime.UtcNow);
        i.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var report = i.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null);
        report.MarkCorrected(Guid.NewGuid(), "đã sửa");
        Should.Throw<BusinessException>(() => report.MarkCorrected(Guid.NewGuid(), "sửa lại"));
    }

    [Fact]
    public void SetInvestigationInfo_Works_When_Draft()
    {
        var i = CreateDraft();
        i.SetInvestigationInfo("Team A", "Sealed food", "Better hygiene");
        i.InvestigationTeam.ShouldBe("Team A");
        i.ControlMeasures.ShouldBe("Sealed food");
        i.PreventionMeasures.ShouldBe("Better hygiene");
    }
}
