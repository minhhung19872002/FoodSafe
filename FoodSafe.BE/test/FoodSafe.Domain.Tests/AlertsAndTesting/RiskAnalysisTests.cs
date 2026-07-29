using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public class RiskAnalysisTests
{
    private static readonly Guid OrgId = Guid.NewGuid();

    private static RiskAnalysis CreateDefault() =>
        RiskAnalysis.Create(
            Guid.NewGuid(), OrgId,
            "Nguy cơ nhiễm kim loại nặng",
            "Phát hiện hàm lượng chì vượt ngưỡng cho phép",
            AlertCategory.Chemical,
            RiskLevel.High,
            null,
            "Rau, củ, quả",
            "Kết quả kiểm nghiệm mẫu 2026",
            "Tăng cường kiểm soát nguồn gốc");

    [Fact]
    public void Create_ShouldInitializeDraft()
    {
        var ra = CreateDefault();

        ra.Status.ShouldBe(RiskAnalysisStatus.Draft);
        ra.IsPublic.ShouldBeFalse();
        ra.Title.ShouldBe("Nguy cơ nhiễm kim loại nặng");
        ra.RiskLevel.ShouldBe(RiskLevel.High);
    }

    [Fact]
    public void Create_EmptyTitle_ShouldThrow()
    {
        Should.Throw<ArgumentException>(() =>
            RiskAnalysis.Create(Guid.NewGuid(), OrgId, " ", "content",
                AlertCategory.FoodSafety, RiskLevel.Low));
    }

    [Fact]
    public void Update_Draft_ShouldSucceed()
    {
        var ra = CreateDefault();

        ra.Update("Tiêu đề mới", "Nội dung mới",
            AlertCategory.Biological, RiskLevel.Critical,
            null, null, null, null);

        ra.Title.ShouldBe("Tiêu đề mới");
        ra.Category.ShouldBe(AlertCategory.Biological);
        ra.RiskLevel.ShouldBe(RiskLevel.Critical);
    }

    [Fact]
    public void Update_Published_ShouldThrow()
    {
        var ra = CreateDefault();
        ra.Publish(Guid.NewGuid(), DateTime.UtcNow);

        Should.Throw<BusinessException>(() =>
            ra.Update("New", "Content", AlertCategory.FoodSafety, RiskLevel.Low, null, null, null, null))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.RiskAnalysis.CannotModifyNonDraft);
    }

    [Fact]
    public void Publish_Draft_ShouldTransition()
    {
        var ra = CreateDefault();
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;

        ra.Publish(userId, now);

        ra.Status.ShouldBe(RiskAnalysisStatus.Published);
        ra.PublishedById.ShouldBe(userId);
        ra.PublishedAt.ShouldBe(now);
        ra.IsPublic.ShouldBeTrue();
    }

    [Fact]
    public void Publish_AlreadyPublished_ShouldThrow()
    {
        var ra = CreateDefault();
        ra.Publish(Guid.NewGuid(), DateTime.UtcNow);

        Should.Throw<BusinessException>(() =>
            ra.Publish(Guid.NewGuid(), DateTime.UtcNow))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.RiskAnalysis.CannotModifyNonDraft);
    }
}
