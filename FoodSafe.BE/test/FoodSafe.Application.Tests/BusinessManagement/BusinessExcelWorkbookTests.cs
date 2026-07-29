using ClosedXML.Excel;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessExcelWorkbookTests
{
    private static readonly CatalogData TestCatalogs = new(
        [new(Guid.NewGuid(), "Nhà hàng"), new(Guid.NewGuid(), "Quán ăn")],
        [new(Guid.NewGuid(), "Nguy cơ cao"), new(Guid.NewGuid(), "Nguy cơ thấp")],
        [new(Guid.NewGuid(), "Thực phẩm tươi sống"), new(Guid.NewGuid(), "Đồ uống")]);

    [Fact]
    public void Template_should_be_a_valid_xlsx_with_required_headers()
    {
        var content = BusinessExcelWorkbook.CreateTemplate(TestCatalogs);

        content[0].ShouldBe((byte)'P');
        content[1].ShouldBe((byte)'K');
        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Cơ sở");
        sheet.Cell(1, 1).GetString().ShouldBe("Mã cơ sở*");
        sheet.Cell(1, 2).GetString().ShouldBe("Tên cơ sở*");
        sheet.Cell(1, 4).GetString().ShouldBe("Loại hình");
        sheet.Cell(1, 5).GetString().ShouldBe("Phân loại nguy cơ");
        sheet.Cell(1, 11).GetString().ShouldBe("Nhóm sản phẩm");
        workbook.Worksheet("Hướng dẫn").ShouldNotBeNull();
    }

    [Fact]
    public void Template_should_contain_catalog_reference_sheet()
    {
        var content = BusinessExcelWorkbook.CreateTemplate(TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var catalog = workbook.Worksheet("Danh mục");
        catalog.ShouldNotBeNull();
        catalog.Cell(2, 1).GetString().ShouldBe("Nhà hàng");
        catalog.Cell(3, 1).GetString().ShouldBe("Quán ăn");
        catalog.Cell(2, 2).GetString().ShouldBe("Nguy cơ cao");
        catalog.Cell(2, 3).GetString().ShouldBe("Thực phẩm tươi sống");
    }

    [Fact]
    public void Template_should_have_dropdown_validation_for_catalog_columns()
    {
        var content = BusinessExcelWorkbook.CreateTemplate(TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Cơ sở");
        var validations = sheet.DataValidations.ToList();
        validations.Count.ShouldBe(3);
        var columns = validations
            .SelectMany(v => v.Ranges)
            .Select(r => r.FirstColumn().ColumnNumber())
            .OrderBy(x => x)
            .ToArray();
        columns.ShouldContain(4);
        columns.ShouldContain(5);
        columns.ShouldContain(11);
    }

    [Fact]
    public void Reader_should_report_changed_headers_before_reading_rows()
    {
        var content = BusinessExcelWorkbook.CreateTemplate(TestCatalogs);
        using var workbook = new XLWorkbook(new MemoryStream(content));
        workbook.Worksheet("Cơ sở").Cell(1, 2).Value = "Wrong";
        using var output = new MemoryStream();
        workbook.SaveAs(output);

        var result = BusinessExcelWorkbook.Read(output.ToArray());

        result.Rows.ShouldBeEmpty();
        result.Errors.ShouldContain(x =>
            x.RowNumber == 1 && x.Field == "Tên cơ sở*");
    }

    [Fact]
    public void Export_should_resolve_catalog_names()
    {
        var typeId = TestCatalogs.BusinessTypes[0].Id;
        var classId = TestCatalogs.Classifications[0].Id;
        var groupId = TestCatalogs.ProductGroups[0].Id;

        var content = BusinessExcelWorkbook.Export(
        [
            new BusinessDto
            {
                Id = Guid.NewGuid(),
                OrganizationId = Guid.NewGuid(),
                Code = "CS-01",
                Name = "Cơ sở trong phạm vi",
                BusinessTypeId = typeId,
                BusinessClassificationId = classId,
                ProductGroupIds = [groupId],
                Status = BusinessStatus.Active
            }
        ], TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Cơ sở");
        sheet.Cell(2, 1).GetString().ShouldBe("CS-01");
        sheet.Cell(2, 2).GetString().ShouldBe("Cơ sở trong phạm vi");
        sheet.Cell(2, 4).GetString().ShouldBe("Nhà hàng");
        sheet.Cell(2, 5).GetString().ShouldBe("Nguy cơ cao");
        sheet.Cell(2, 11).GetString().ShouldBe("Thực phẩm tươi sống");
        sheet.LastRowUsed()!.RowNumber().ShouldBe(2);
    }

    [Fact]
    public void File_validation_should_reject_extension_spoofing_and_invalid_zip()
    {
        BusinessExcelAppService.ValidateFile(
                [(byte)'P', (byte)'K', 0, 0],
                "co-so.xlsx")
            .ShouldBe("Cấu trúc nén của workbook .xlsx không hợp lệ.");
        BusinessExcelAppService.ValidateFile(
                BusinessExcelWorkbook.CreateTemplate(TestCatalogs),
                "co-so.xls")
            .ShouldBe("Chỉ chấp nhận file Excel định dạng .xlsx.");
    }
}
