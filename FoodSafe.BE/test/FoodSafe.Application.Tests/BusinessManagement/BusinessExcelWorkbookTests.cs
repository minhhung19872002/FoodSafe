using ClosedXML.Excel;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessExcelWorkbookTests
{
    [Fact]
    public void Template_should_be_a_valid_xlsx_with_required_headers()
    {
        var content = BusinessExcelWorkbook.CreateTemplate();

        content[0].ShouldBe((byte)'P');
        content[1].ShouldBe((byte)'K');
        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Cơ sở");
        sheet.Cell(1, 1).GetString().ShouldBe("OrganizationId*");
        sheet.Cell(1, 2).GetString().ShouldBe("Code*");
        sheet.Cell(1, 3).GetString().ShouldBe("Name*");
        workbook.Worksheet("Hướng dẫn").ShouldNotBeNull();
    }

    [Fact]
    public void Reader_should_report_changed_headers_before_reading_rows()
    {
        var content = BusinessExcelWorkbook.CreateTemplate();
        using var workbook = new XLWorkbook(new MemoryStream(content));
        workbook.Worksheet("Cơ sở").Cell(1, 3).Value = "Wrong";
        using var output = new MemoryStream();
        workbook.SaveAs(output);

        var result = BusinessExcelWorkbook.Read(output.ToArray());

        result.Rows.ShouldBeEmpty();
        result.Errors.ShouldContain(x =>
            x.RowNumber == 1 && x.Field == "Name*");
    }

    [Fact]
    public void Export_should_write_only_the_supplied_scoped_rows()
    {
        var content = BusinessExcelWorkbook.Export(
        [
            new BusinessDto
            {
                Id = Guid.NewGuid(),
                OrganizationId = Guid.NewGuid(),
                Code = "CS-01",
                Name = "Cơ sở trong phạm vi",
                Status = BusinessStatus.Active
            }
        ]);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Cơ sở");
        sheet.Cell(2, 2).GetString().ShouldBe("CS-01");
        sheet.Cell(2, 3).GetString().ShouldBe("Cơ sở trong phạm vi");
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
                BusinessExcelWorkbook.CreateTemplate(),
                "co-so.xls")
            .ShouldBe("Chỉ chấp nhận file Excel định dạng .xlsx.");
    }
}
