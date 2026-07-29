using ClosedXML.Excel;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class ProductExcelWorkbookTests
{
    private static readonly ProductCatalogData TestCatalogs = new(
        [
            new BusinessOption(Guid.NewGuid(), "CS-001", "Nhà hàng ABC"),
            new BusinessOption(Guid.NewGuid(), "CS-002", "Quán ăn XYZ")
        ],
        [
            new CatalogOption(Guid.NewGuid(), "Thực phẩm tươi sống"),
            new CatalogOption(Guid.NewGuid(), "Đồ uống")
        ],
        [
            new CatalogOption(Guid.NewGuid(), "Việt Nam"),
            new CatalogOption(Guid.NewGuid(), "Nhật Bản"),
            new CatalogOption(Guid.NewGuid(), "Hàn Quốc")
        ]);

    [Fact]
    public void Template_should_be_a_valid_xlsx_with_required_headers()
    {
        var content = ProductExcelWorkbook.CreateTemplate(TestCatalogs);

        content[0].ShouldBe((byte)'P');
        content[1].ShouldBe((byte)'K');
        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Sản phẩm");
        sheet.Cell(1, 1).GetString().ShouldBe("Mã cơ sở*");
        sheet.Cell(1, 2).GetString().ShouldBe("Code*");
        sheet.Cell(1, 3).GetString().ShouldBe("Name*");
        sheet.Cell(1, 4).GetString().ShouldBe("Nhóm sản phẩm");
        sheet.Cell(1, 7).GetString().ShouldBe("Quốc gia");
        workbook.Worksheet("Hướng dẫn").ShouldNotBeNull();
    }

    [Fact]
    public void Template_should_contain_catalog_reference_sheet()
    {
        var content = ProductExcelWorkbook.CreateTemplate(TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var catalog = workbook.Worksheet("Danh mục");
        catalog.ShouldNotBeNull();
        catalog.Cell(2, 1).GetString().ShouldBe("CS-001");
        catalog.Cell(2, 2).GetString().ShouldBe("Nhà hàng ABC");
        catalog.Cell(3, 1).GetString().ShouldBe("CS-002");
        catalog.Cell(2, 3).GetString().ShouldBe("Thực phẩm tươi sống");
        catalog.Cell(2, 4).GetString().ShouldBe("Việt Nam");
    }

    [Fact]
    public void Template_should_have_dropdown_validation_for_catalog_columns()
    {
        var content = ProductExcelWorkbook.CreateTemplate(TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Sản phẩm");
        var validations = sheet.DataValidations.ToList();
        validations.Count.ShouldBe(3);
        var columns = validations
            .SelectMany(v => v.Ranges)
            .Select(r => r.FirstColumn().ColumnNumber())
            .OrderBy(x => x)
            .ToArray();
        columns.ShouldContain(1);
        columns.ShouldContain(4);
        columns.ShouldContain(7);
    }

    [Fact]
    public void Reader_should_report_changed_headers_before_reading_rows()
    {
        var content = ProductExcelWorkbook.CreateTemplate(TestCatalogs);
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
    public void Export_should_resolve_catalog_names()
    {
        var bizId = TestCatalogs.Businesses[0].Id;
        var groupId = TestCatalogs.ProductGroups[0].Id;
        var countryId = TestCatalogs.Countries[0].Id;

        var content = ProductExcelWorkbook.Export(
        [
            new ProductDto
            {
                Id = Guid.NewGuid(),
                BusinessId = bizId,
                OrganizationId = Guid.NewGuid(),
                Code = "SP-01",
                Name = "Sản phẩm trong phạm vi",
                ProductGroupId = groupId,
                ManufacturingCountryId = countryId,
                Status = ProductStatus.Active
            }
        ], TestCatalogs);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Sản phẩm");
        sheet.Cell(2, 1).GetString().ShouldBe("CS-001");
        sheet.Cell(2, 2).GetString().ShouldBe("SP-01");
        sheet.Cell(2, 4).GetString().ShouldBe("Thực phẩm tươi sống");
        sheet.Cell(2, 7).GetString().ShouldBe("Việt Nam");
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
