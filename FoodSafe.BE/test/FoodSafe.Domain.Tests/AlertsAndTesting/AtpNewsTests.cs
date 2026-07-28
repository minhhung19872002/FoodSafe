using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public class AtpNewsTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTime Now = new(2026, 7, 1, 12, 0, 0);

    private static AtpNews CreateNews() =>
        AtpNews.Create(
            Guid.NewGuid(), OrgId,
            "Tin tức test", "Nội dung tin tức",
            summary: "Tóm tắt",
            category: "Hoạt động ATTP");

    [Fact]
    public void Create_Should_Set_Draft_Status()
    {
        var news = CreateNews();

        news.Status.ShouldBe(NewsStatus.Draft);
        news.IsPublic.ShouldBeFalse();
        news.ViewCount.ShouldBe(0);
        news.Title.ShouldBe("Tin tức test");
        news.Content.ShouldBe("Nội dung tin tức");
        news.Summary.ShouldBe("Tóm tắt");
        news.Category.ShouldBe("Hoạt động ATTP");
        news.OrganizationId.ShouldBe(OrgId);
    }

    [Fact]
    public void Create_Should_Normalize_Whitespace()
    {
        var news = AtpNews.Create(
            Guid.NewGuid(), OrgId,
            "  Title  ", "  Content  ",
            summary: "  Summary  ",
            tags: "  tag1, tag2  ");

        news.Title.ShouldBe("Title");
        news.Content.ShouldBe("Content");
        news.Summary.ShouldBe("Summary");
        news.Tags.ShouldBe("tag1, tag2");
    }

    [Fact]
    public void Create_Should_Reject_Empty_Title()
    {
        Should.Throw<ArgumentException>(() =>
            AtpNews.Create(Guid.NewGuid(), OrgId, "", "content"));
    }

    [Fact]
    public void Update_Should_Change_Fields_When_Draft()
    {
        var news = CreateNews();

        news.Update(
            "Updated Title", "Updated Content",
            "New summary", null, "Tin mới", "tag1", true);

        news.Title.ShouldBe("Updated Title");
        news.Content.ShouldBe("Updated Content");
        news.Summary.ShouldBe("New summary");
        news.Category.ShouldBe("Tin mới");
        news.IsFeatured.ShouldBeTrue();
    }

    [Fact]
    public void Update_Should_Reject_When_Published()
    {
        var news = CreateNews();
        news.Publish(UserId, Now);

        Should.Throw<BusinessException>(() =>
            news.Update("X", "Y", null, null, null, null, false))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.InvalidStatusTransition);
    }

    [Fact]
    public void Publish_Should_Set_Published_Status()
    {
        var news = CreateNews();

        news.Publish(UserId, Now, isPublic: true);

        news.Status.ShouldBe(NewsStatus.Published);
        news.PublishedById.ShouldBe(UserId);
        news.PublishedAt.ShouldBe(Now);
        news.IsPublic.ShouldBeTrue();
    }

    [Fact]
    public void Publish_Should_Reject_Non_Draft()
    {
        var news = CreateNews();
        news.Publish(UserId, Now);

        Should.Throw<BusinessException>(() => news.Publish(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.InvalidStatusTransition);
    }

    [Fact]
    public void Reject_Should_Set_Rejected_Status_With_Reason()
    {
        var news = CreateNews();

        news.Reject(UserId, Now, "  Nội dung trùng lặp  ");

        news.Status.ShouldBe(NewsStatus.Rejected);
        news.RejectedById.ShouldBe(UserId);
        news.RejectedAt.ShouldBe(Now);
        news.RejectedReason.ShouldBe("Nội dung trùng lặp");
        news.IsPublic.ShouldBeFalse();
    }

    [Fact]
    public void Reject_Should_Require_A_Reason()
    {
        var news = CreateNews();

        Should.Throw<ArgumentException>(() => news.Reject(UserId, Now, " "));
        news.Status.ShouldBe(NewsStatus.Draft);
    }

    [Fact]
    public void Reject_Should_Refuse_Non_Draft()
    {
        var news = CreateNews();
        news.Publish(UserId, Now);

        Should.Throw<BusinessException>(() => news.Reject(UserId, Now, "Đổi ý"))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.InvalidStatusTransition);
        news.Status.ShouldBe(NewsStatus.Published);
    }

    [Fact]
    public void Publish_Should_Refuse_A_Rejected_Article()
    {
        var news = CreateNews();
        news.Reject(UserId, Now, "Nội dung trùng lặp");

        Should.Throw<BusinessException>(() => news.Publish(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.InvalidStatusTransition);
        news.IsPublic.ShouldBeFalse();
    }

    [Fact]
    public void Recall_Should_Set_Recalled_Status()
    {
        var news = CreateNews();
        news.Publish(UserId, Now);

        news.Recall(UserId, Now.AddHours(1));

        news.Status.ShouldBe(NewsStatus.Recalled);
    }

    [Fact]
    public void Recall_Should_Reject_Draft()
    {
        var news = CreateNews();

        Should.Throw<BusinessException>(() => news.Recall(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.CanOnlyRecallPublished);
    }

    [Fact]
    public void IncrementViewCount_Should_Increase()
    {
        var news = CreateNews();

        news.IncrementViewCount();
        news.IncrementViewCount();

        news.ViewCount.ShouldBe(2);
    }

    [Fact]
    public void LinkAlert_Should_Add_Link()
    {
        var news = CreateNews();
        var alertId = Guid.NewGuid();

        var link = news.LinkAlert(Guid.NewGuid(), alertId);

        news.LinkedAlerts.Count.ShouldBe(1);
        link.AlertId.ShouldBe(alertId);
        link.NewsId.ShouldBe(news.Id);
    }

    [Fact]
    public void LinkAlert_Should_Reject_Duplicate()
    {
        var news = CreateNews();
        var alertId = Guid.NewGuid();
        news.LinkAlert(Guid.NewGuid(), alertId);

        Should.Throw<BusinessException>(() => news.LinkAlert(Guid.NewGuid(), alertId))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.DuplicateLinkedAlert);
    }

    [Fact]
    public void UnlinkAlert_Should_Remove_Link()
    {
        var news = CreateNews();
        var alertId = Guid.NewGuid();
        news.LinkAlert(Guid.NewGuid(), alertId);

        news.UnlinkAlert(alertId);

        news.LinkedAlerts.Count.ShouldBe(0);
    }

    [Fact]
    public void UnlinkAlert_Should_Reject_Missing()
    {
        var news = CreateNews();

        Should.Throw<BusinessException>(() => news.UnlinkAlert(Guid.NewGuid()))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.News.LinkedAlertNotFound);
    }
}
