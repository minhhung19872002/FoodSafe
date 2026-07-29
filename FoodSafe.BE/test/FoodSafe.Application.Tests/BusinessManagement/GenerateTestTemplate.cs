using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class GenerateTestTemplate
{
    [Fact]
    public void Write_template_to_disk_for_manual_inspection()
    {
        var catalogs = new CatalogData(
            [
                new(Guid.NewGuid(), "Nhà hàng"),
                new(Guid.NewGuid(), "Quán ăn"),
                new(Guid.NewGuid(), "Cửa hàng thực phẩm"),
                new(Guid.NewGuid(), "Bếp ăn tập thể")
            ],
            [
                new(Guid.NewGuid(), "Nguy cơ cao"),
                new(Guid.NewGuid(), "Nguy cơ trung bình"),
                new(Guid.NewGuid(), "Nguy cơ thấp")
            ],
            [
                new(Guid.NewGuid(), "Thực phẩm tươi sống"),
                new(Guid.NewGuid(), "Đồ uống"),
                new(Guid.NewGuid(), "Thực phẩm chế biến"),
                new(Guid.NewGuid(), "Phụ gia thực phẩm")
            ]);

        var content = BusinessExcelWorkbook.CreateTemplate(catalogs);

        var path = Path.Combine(
            Path.GetDirectoryName(typeof(GenerateTestTemplate).Assembly.Location)!,
            "test-template-dropdown.xlsx");
        File.WriteAllBytes(path, content);
    }
}
