using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.FoodPoisoning;

public sealed class FoodPoisoningCaseTests
{
    private static readonly Guid OrgId = Guid.NewGuid();

    private static FoodPoisoningCase CreateDraft() =>
        FoodPoisoningCase.Create(Guid.NewGuid(), OrgId, "NDTP-QN-2026-001", DateOnly.FromDateTime(DateTime.Today));

    [Fact]
    public void Create_Sets_Draft_Status()
    {
        var c = CreateDraft();
        c.Status.ShouldBe(PoisoningCaseStatus.Draft);
        c.CaseCode.ShouldBe("NDTP-QN-2026-001");
        c.OrganizationId.ShouldBe(OrgId);
    }

    [Fact]
    public void Create_Rejects_Empty_CaseCode()
    {
        Should.Throw<ArgumentException>(() =>
            FoodPoisoningCase.Create(Guid.NewGuid(), OrgId, "", DateOnly.FromDateTime(DateTime.Today)));
    }

    [Fact]
    public void Update_Changes_Fields_When_Draft()
    {
        var c = CreateDraft();
        var incidentId = Guid.NewGuid();
        c.Update(DateOnly.FromDateTime(DateTime.Today.AddDays(1)), DateTime.UtcNow, incidentId, "notes");
        c.IncidentId.ShouldBe(incidentId);
        c.Notes.ShouldBe("notes");
    }

    [Fact]
    public void Update_Rejects_When_Reported()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            c.Update(DateOnly.FromDateTime(DateTime.Today), null, null, null));
    }

    [Fact]
    public void SetVictimInfo_Works_When_Draft()
    {
        var c = CreateDraft();
        c.SetVictimInfo("John", 30, VictimGender.Male, "0123456789", "123 St");
        c.VictimName.ShouldBe("John");
        c.VictimAge.ShouldBe(30);
    }

    [Fact]
    public void SetLocation_Rejects_When_Reported()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            c.SetLocation("addr", null, null, null, null, null));
    }

    [Fact]
    public void Submit_Sets_Reported_Status()
    {
        var c = CreateDraft();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        c.Submit(userId, now);
        c.Status.ShouldBe(PoisoningCaseStatus.Reported);
        c.ReportedById.ShouldBe(userId);
        c.ReportedAt.ShouldBe(now);
    }

    [Fact]
    public void Submit_Rejects_Non_Draft()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() => c.Submit(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void Verify_Sets_Verified_Status()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        var verifier = Guid.NewGuid();
        var now = DateTime.UtcNow;
        c.Verify(verifier, now);
        c.Status.ShouldBe(PoisoningCaseStatus.Verified);
        c.VerifiedById.ShouldBe(verifier);
    }

    [Fact]
    public void Verify_Rejects_Draft()
    {
        var c = CreateDraft();
        Should.Throw<BusinessException>(() => c.Verify(Guid.NewGuid(), DateTime.UtcNow));
    }

    [Fact]
    public void AddErrorReport_Works_When_Verified()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        c.Verify(Guid.NewGuid(), DateTime.UtcNow);
        var report = c.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "wrong data", "fix it", Guid.NewGuid());
        c.ErrorReports.Count.ShouldBe(1);
        report.Status.ShouldBe(ErrorReportStatus.Pending);
    }

    [Fact]
    public void AddErrorReport_Rejects_Draft()
    {
        var c = CreateDraft();
        Should.Throw<BusinessException>(() =>
            c.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null));
    }

    [Fact]
    public void AddErrorReport_Rejects_Reported()
    {
        var c = CreateDraft();
        c.Submit(Guid.NewGuid(), DateTime.UtcNow);
        Should.Throw<BusinessException>(() =>
            c.AddErrorReport(Guid.NewGuid(), Guid.NewGuid(), "err", "fix", null));
    }

    [Fact]
    public void SetFoodInfo_Works_When_Draft()
    {
        var c = CreateDraft();
        c.SetFoodInfo("rice", "vendor A", DateOnly.FromDateTime(DateTime.Today), "vomiting", DateTime.UtcNow);
        c.SuspectedFood.ShouldBe("rice");
        c.FoodSource.ShouldBe("vendor A");
    }

    [Fact]
    public void SetMedicalInfo_Works_When_Draft()
    {
        var c = CreateDraft();
        c.SetMedicalInfo("Hospital A", DateOnly.FromDateTime(DateTime.Today), TreatmentResult.Recovered);
        c.MedicalFacility.ShouldBe("Hospital A");
        c.TreatmentResult.ShouldBe(TreatmentResult.Recovered);
    }
}
