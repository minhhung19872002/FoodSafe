using Shouldly;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public class AdministrativeDocumentTests
{
    private static readonly Guid OrgId = Guid.NewGuid();
    private static readonly Guid DocTypeId = Guid.NewGuid();

    private static AdministrativeDocument CreateDefault() =>
        AdministrativeDocument.Create(
            Guid.NewGuid(), OrgId, DocTypeId,
            "123/QĐ-BYT",
            "Quyết định phê duyệt kế hoạch ATTP năm 2026",
            new DateTime(2026, 1, 15),
            "Bộ Y tế",
            new DateTime(2026, 2, 1),
            null,
            "Kế hoạch triển khai kiểm soát ATTP toàn quốc");

    [Fact]
    public void Create_ShouldInitialize()
    {
        var doc = CreateDefault();

        doc.DocumentNumber.ShouldBe("123/QĐ-BYT");
        doc.Title.ShouldBe("Quyết định phê duyệt kế hoạch ATTP năm 2026");
        doc.Status.ShouldBe(DocumentStatus.Active);
        doc.IsPublic.ShouldBeFalse();
        doc.IssuingAuthority.ShouldBe("Bộ Y tế");
    }

    [Fact]
    public void Create_EmptyDocNumber_ShouldThrow()
    {
        Should.Throw<ArgumentException>(() =>
            AdministrativeDocument.Create(Guid.NewGuid(), OrgId, DocTypeId,
                " ", "Title", DateTime.UtcNow));
    }

    [Fact]
    public void Update_ShouldModifyFields()
    {
        var doc = CreateDefault();
        var newTypeId = Guid.NewGuid();

        doc.Update(newTypeId, "456/NĐ-CP", "Nghị định mới",
            new DateTime(2026, 3, 1), "Chính phủ",
            new DateTime(2026, 4, 1), new DateTime(2027, 4, 1),
            "Tóm tắt nội dung");

        doc.DocumentNumber.ShouldBe("456/NĐ-CP");
        doc.DocumentTypeId.ShouldBe(newTypeId);
        doc.ExpiryDate.ShouldBe(new DateTime(2027, 4, 1));
    }

    [Fact]
    public void SetStatus_ShouldChange()
    {
        var doc = CreateDefault();

        doc.SetStatus(DocumentStatus.Expired);
        doc.Status.ShouldBe(DocumentStatus.Expired);

        doc.SetStatus(DocumentStatus.Revoked);
        doc.Status.ShouldBe(DocumentStatus.Revoked);
    }

    [Fact]
    public void SetPublic_ShouldToggle()
    {
        var doc = CreateDefault();

        doc.SetPublic(true);
        doc.IsPublic.ShouldBeTrue();

        doc.SetPublic(false);
        doc.IsPublic.ShouldBeFalse();
    }
}
