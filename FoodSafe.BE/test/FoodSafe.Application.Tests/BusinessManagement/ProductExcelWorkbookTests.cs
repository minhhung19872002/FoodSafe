using ClosedXML.Excel;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class ProductExcelWorkbookTests
{
    [Fact]
    public void Template_should_be_a_valid_xlsx_with_required_headers()
    {
        var content = ProductExcelWorkbook.CreateTemplate();

        content[0].ShouldBe((byte)'P');
        content[1].ShouldBe((byte)'K');
        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Sản phẩm");
        sheet.Cell(1, 1).GetString().ShouldBe("BusinessId*");
        sheet.Cell(1, 2).GetString().ShouldBe("Code*");
        sheet.Cell(1, 3).GetString().ShouldBe("Name*");
        workbook.Worksheet("Hướng dẫn").ShouldNotBeNull();
    }

    [Fact]
    public void Reader_should_report_changed_headers_before_reading_rows()
    {
        var content = ProductExcelWorkbook.CreateTemplate();
        using var workbook = new XLWorkbook(new MemoryStream(content));
        workbook.Worksheet("Sản phẩm").Cell(1, 3).Value = "Wrong";
        using var output = new MemoryStream();
        workbook.SaveAs(output);

        var result = ProductExcelWorkbook.Read(output.ToArray());

        result.Rows.ShouldBeEmpty();
        result.Errors.ShouldContain(x =>
            x.RowNumber == 1 && x.Field == "Name*");
    }

    [Fact]
    public void Export_should_write_only_the_supplied_scoped_rows()
    {
        var businessId = Guid.NewGuid();
        var content = ProductExcelWorkbook.Export(
        [
            new ProductDto
            {
                Id = Guid.NewGuid(),
                BusinessId = businessId,
                OrganizationId = Guid.NewGuid(),
                Code = "SP-01",
                Name = "Sản phẩm trong phạm vi",
                Status = ProductStatus.Active
            }
        ]);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Sản phẩm");
        sheet.Cell(2, 1).GetString().ShouldBe(businessId.ToString());
        sheet.Cell(2, 2).GetString().ShouldBe("SP-01");
        sheet.LastRowUsed()!.RowNumber().ShouldBe(2);
    }

    [Theory]
    [InlineData("GetTemplateAsync",
        FoodSafePermissions.BusinessManagement.Products.Import)]
    [InlineData("PreviewAsync",
        FoodSafePermissions.BusinessManagement.Products.Import)]
    [InlineData("ConfirmAsync",
        FoodSafePermissions.BusinessManagement.Products.Import)]
    [InlineData("ExportAsync",
        FoodSafePermissions.BusinessManagement.Products.View)]
    public void Excel_operations_require_the_expected_permission(
        string methodName,
        string permission)
    {
        var policies = typeof(ProductExcelAppService)
            .GetMethod(methodName)!
            .GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>()
            .Select(x => x.Policy);

        policies.ShouldContain(permission);
    }

    [Fact]
    public void Confirm_also_requires_create_permission()
    {
        var policies = typeof(ProductExcelAppService)
            .GetMethod("ConfirmAsync")!
            .GetCustomAttributes(typeof(AuthorizeAttribute), true)
            .Cast<AuthorizeAttribute>()
            .Select(x => x.Policy);

        policies.ShouldContain(
            FoodSafePermissions.BusinessManagement.Products.Create);
    }
}
