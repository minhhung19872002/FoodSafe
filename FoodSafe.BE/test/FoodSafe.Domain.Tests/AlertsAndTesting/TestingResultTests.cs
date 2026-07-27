using Shouldly;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public class TestingResultTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly Guid CenterId = Guid.NewGuid();

    private static TestingResult CreateDefault() =>
        TestingResult.Create(
            Guid.NewGuid(), OrgId,
            "M-2026-001",
            "Mẫu rau cải",
            CenterId,
            new DateTime(2026, 7, 1),
            TestingResultOutcome.Pass,
            "Mẫu lấy tại chợ đầu mối");

    [Fact]
    public void Create_ShouldInitialize()
    {
        var tr = CreateDefault();

        tr.SampleCode.ShouldBe("M-2026-001");
        tr.SampleName.ShouldBe("Mẫu rau cải");
        tr.TestingCenterId.ShouldBe(CenterId);
        tr.Outcome.ShouldBe(TestingResultOutcome.Pass);
        tr.IsPublic.ShouldBeFalse();
    }

    [Fact]
    public void Create_EmptySampleCode_ShouldThrow()
    {
        Should.Throw<ArgumentException>(() =>
            TestingResult.Create(Guid.NewGuid(), OrgId, " ", "Sample",
                CenterId, DateTime.UtcNow, TestingResultOutcome.Pass));
    }

    [Fact]
    public void Update_ShouldModifyFields()
    {
        var tr = CreateDefault();
        var newCenter = Guid.NewGuid();

        tr.Update("M-2026-002", "Mẫu thịt",
            newCenter, new DateTime(2026, 8, 1),
            TestingResultOutcome.Fail,
            "Mẫu thịt lợn", null, null, null,
            null, new DateTime(2026, 8, 5),
            "Hàm lượng clenbuterol vượt ngưỡng",
            "PKN-001", null);

        tr.SampleCode.ShouldBe("M-2026-002");
        tr.Outcome.ShouldBe(TestingResultOutcome.Fail);
        tr.FailedCriteria.ShouldBe("Hàm lượng clenbuterol vượt ngưỡng");
        tr.TestingCenterId.ShouldBe(newCenter);
    }

    [Fact]
    public void SetPublic_ShouldToggle()
    {
        var tr = CreateDefault();

        tr.SetPublic(true);
        tr.IsPublic.ShouldBeTrue();

        tr.SetPublic(false);
        tr.IsPublic.ShouldBeFalse();
    }
}
