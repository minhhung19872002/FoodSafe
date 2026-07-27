using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public class AtpAlertTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly DateTime Now = new(2026, 7, 1, 12, 0, 0);

    private static AtpAlert CreateAlert(
        AlertCategory category = AlertCategory.FoodSafety,
        AlertSeverity severity = AlertSeverity.Medium,
        AlertSource source = AlertSource.Internal) =>
        AtpAlert.Create(
            Guid.NewGuid(), OrgId,
            "Cảnh báo test", "Nội dung cảnh báo",
            category, severity, source);

    [Fact]
    public void Create_Should_Set_Draft_Status()
    {
        var alert = CreateAlert();

        alert.Status.ShouldBe(AlertStatus.Draft);
        alert.IsPublic.ShouldBeFalse();
        alert.Title.ShouldBe("Cảnh báo test");
        alert.Content.ShouldBe("Nội dung cảnh báo");
        alert.Category.ShouldBe(AlertCategory.FoodSafety);
        alert.Severity.ShouldBe(AlertSeverity.Medium);
        alert.Source.ShouldBe(AlertSource.Internal);
        alert.OrganizationId.ShouldBe(OrgId);
    }

    [Fact]
    public void Create_Should_Normalize_Optional_Fields()
    {
        var alert = AtpAlert.Create(
            Guid.NewGuid(), OrgId,
            "  Test  ", "  Content  ",
            AlertCategory.Chemical, AlertSeverity.High,
            AlertSource.PublicReport,
            alertNumber: "  ABC-001  ",
            affectedArea: "  Quảng Ninh  ",
            reporterName: "  Nguyễn Văn A  ");

        alert.Title.ShouldBe("Test");
        alert.Content.ShouldBe("Content");
        alert.AlertNumber.ShouldBe("ABC-001");
        alert.AffectedArea.ShouldBe("Quảng Ninh");
        alert.ReporterName.ShouldBe("Nguyễn Văn A");
    }

    [Fact]
    public void Create_Should_Reject_Empty_Title()
    {
        Should.Throw<ArgumentException>(() =>
            AtpAlert.Create(
                Guid.NewGuid(), OrgId, "", "content",
                AlertCategory.FoodSafety, AlertSeverity.Low,
                AlertSource.Internal));
    }

    [Fact]
    public void Update_Should_Change_Fields_When_Draft()
    {
        var alert = CreateAlert();

        alert.Update(
            "Updated Title", "Updated Content",
            AlertCategory.Contamination, AlertSeverity.Critical,
            "NEW-001", "Hà Nội", "Sữa bột",
            null, "Reporter", "0901234567", "test@test.com");

        alert.Title.ShouldBe("Updated Title");
        alert.Content.ShouldBe("Updated Content");
        alert.Category.ShouldBe(AlertCategory.Contamination);
        alert.Severity.ShouldBe(AlertSeverity.Critical);
        alert.AlertNumber.ShouldBe("NEW-001");
    }

    [Fact]
    public void Update_Should_Reject_When_Published()
    {
        var alert = CreateAlert();
        alert.Publish(UserId, Now);

        Should.Throw<BusinessException>(() =>
            alert.Update("X", "Y", AlertCategory.Other, AlertSeverity.Low,
                null, null, null, null, null, null, null))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Alert.InvalidStatusTransition);
    }

    [Fact]
    public void Publish_Should_Set_Published_Status()
    {
        var alert = CreateAlert();

        alert.Publish(UserId, Now, isPublic: true);

        alert.Status.ShouldBe(AlertStatus.Published);
        alert.PublishedById.ShouldBe(UserId);
        alert.PublishedAt.ShouldBe(Now);
        alert.IsPublic.ShouldBeTrue();
    }

    [Fact]
    public void Publish_Should_Reject_Non_Draft()
    {
        var alert = CreateAlert();
        alert.Publish(UserId, Now);

        Should.Throw<BusinessException>(() => alert.Publish(UserId, Now))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Alert.InvalidStatusTransition);
    }

    [Fact]
    public void Recall_Should_Set_Recalled_Status()
    {
        var alert = CreateAlert();
        alert.Publish(UserId, Now);

        alert.Recall(UserId, Now.AddHours(1), "Sai thông tin");

        alert.Status.ShouldBe(AlertStatus.Recalled);
        alert.RecalledById.ShouldBe(UserId);
        alert.RecalledAt.ShouldBe(Now.AddHours(1));
        alert.RecallReason.ShouldBe("Sai thông tin");
    }

    [Fact]
    public void Recall_Should_Reject_Draft()
    {
        var alert = CreateAlert();

        Should.Throw<BusinessException>(() => alert.Recall(UserId, Now, "Reason"))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Alert.CanOnlyRecallPublished);
    }

    [Fact]
    public void Recall_Should_Reject_Empty_Reason()
    {
        var alert = CreateAlert();
        alert.Publish(UserId, Now);

        Should.Throw<ArgumentException>(() => alert.Recall(UserId, Now, ""));
    }
}
