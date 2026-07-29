using ClosedXML.Excel;

namespace FoodSafe.BusinessManagement;

internal sealed record BusinessOption(Guid Id, string Code, string Name);

internal sealed record ProductCatalogData(
    IReadOnlyList<BusinessOption> Businesses,
    IReadOnlyList<CatalogOption> ProductGroups,
    IReadOnlyList<CatalogOption> Countries);

internal static class ProductExcelWorkbook
{
    private const string SheetName = "Sản phẩm";
    private const string CatalogSheetName = "Danh mục";
    private const int BusinessCodeColumn = 1;
    private const int ProductGroupColumn = 4;
    private const int CountryColumn = 7;
    private static readonly string[] Headers =
    [
        "Mã cơ sở*",
        "Code*",
        "Name*",
        "Nhóm sản phẩm",
        "BrandName",
        "Manufacturer",
        "Quốc gia",
        "NetWeight",
        "Specifications",
        "Ingredients",
        "ExpiryPeriodMonths",
        "StorageConditions",
        "UsageInstructions",
        "Notes"
    ];

    internal static byte[] CreateTemplate(ProductCatalogData catalogs)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        sheet.Cell(2, 1).Value = "CS-001";
        sheet.Cell(2, 2).Value = "SP-001";
        sheet.Cell(2, 3).Value = "Sản phẩm mẫu";
        sheet.Row(2).Style.Font.FontColor = XLColor.Gray;

        WriteCatalogSheet(workbook, catalogs);
        AddDropdownValidation(workbook, sheet, catalogs);

        var instructions = workbook.Worksheets.Add("Hướng dẫn");
        instructions.Cell("A1").Value = "HƯỚNG DẪN IMPORT SẢN PHẨM";
        instructions.Cell("A1").Style.Font.Bold = true;
        instructions.Cell("A3").Value =
            "Không đổi tên sheet hoặc tên các cột.";
        instructions.Cell("A4").Value =
            "Các cột có dấu * là bắt buộc. Xóa dòng mẫu trước khi upload.";
        instructions.Cell("A5").Value =
            "Mã cơ sở, Nhóm sản phẩm, Quốc gia: chọn từ danh sách thả xuống hoặc xem sheet Danh mục.";
        instructions.Cell("A6").Value =
            "Không giới hạn số dòng. Tối đa 10 MB.";
        instructions.Columns().AdjustToContents();
        return Save(workbook);
    }

    internal static ProductWorkbookReadResult Read(byte[] content)
    {
        using var stream = new MemoryStream(content, writable: false);
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets
            .FirstOrDefault(x => x.Name.Equals(
                SheetName,
                StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheet(1);
        var errors = new List<ExcelImportErrorDto>();
        for (var column = 1; column <= Headers.Length; column++)
        {
            var actual = sheet.Cell(1, column).GetString().Trim();
            if (!actual.Equals(Headers[column - 1], StringComparison.Ordinal))
            {
                errors.Add(new ExcelImportErrorDto
                {
                    RowNumber = 1,
                    Field = Headers[column - 1],
                    Message =
                        $"Cột {column} phải có tên \"{Headers[column - 1]}\"."
                });
            }
        }
        if (errors.Count > 0)
        {
            return new ProductWorkbookReadResult([], errors);
        }

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        var rows = new List<ProductExcelRow>();
        for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
        {
            var values = Enumerable.Range(1, Headers.Length)
                .Select(column => sheet.Cell(rowNumber, column).GetString().Trim())
                .ToArray();
            if (values.All(string.IsNullOrWhiteSpace)) continue;
            rows.Add(new ProductExcelRow
            {
                RowNumber = rowNumber,
                BusinessCode = values[0],
                Code = values[1],
                Name = values[2],
                ProductGroup = values[3],
                BrandName = values[4],
                Manufacturer = values[5],
                Country = values[6],
                NetWeight = values[7],
                Specifications = values[8],
                Ingredients = values[9],
                ExpiryPeriodMonths = values[10],
                StorageConditions = values[11],
                UsageInstructions = values[12],
                Notes = values[13]
            });
        }
        return new ProductWorkbookReadResult(rows, errors);
    }

    internal static byte[] Export(
        IReadOnlyList<ProductDto> products,
        ProductCatalogData catalogs)
    {
        var businessMap = catalogs.Businesses
            .ToDictionary(x => x.Id, x => x.Code);
        var groupMap = catalogs.ProductGroups
            .ToDictionary(x => x.Id, x => x.Name);
        var countryMap = catalogs.Countries
            .ToDictionary(x => x.Id, x => x.Name);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        var row = 2;
        foreach (var item in products)
        {
            sheet.Cell(row, 1).Value = businessMap.TryGetValue(
                item.BusinessId, out var bizCode) ? bizCode : string.Empty;
            sheet.Cell(row, 2).Value = item.Code ?? string.Empty;
            sheet.Cell(row, 3).Value = item.Name;
            sheet.Cell(row, 4).Value = item.ProductGroupId.HasValue
                && groupMap.TryGetValue(
                    item.ProductGroupId.Value, out var groupName)
                    ? groupName : string.Empty;
            sheet.Cell(row, 5).Value = item.BrandName ?? string.Empty;
            sheet.Cell(row, 6).Value = item.Manufacturer ?? string.Empty;
            sheet.Cell(row, 7).Value = item.ManufacturingCountryId.HasValue
                && countryMap.TryGetValue(
                    item.ManufacturingCountryId.Value, out var countryName)
                    ? countryName : string.Empty;
            sheet.Cell(row, 8).Value = item.NetWeight ?? string.Empty;
            sheet.Cell(row, 9).Value = item.Specifications ?? string.Empty;
            sheet.Cell(row, 10).Value = item.Ingredients ?? string.Empty;
            if (item.ExpiryPeriodMonths.HasValue)
                sheet.Cell(row, 11).Value = item.ExpiryPeriodMonths.Value;
            sheet.Cell(row, 12).Value =
                item.StorageConditions ?? string.Empty;
            sheet.Cell(row, 13).Value =
                item.UsageInstructions ?? string.Empty;
            sheet.Cell(row, 14).Value = item.Notes ?? string.Empty;
            row++;
        }
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(8, 45);
        return Save(workbook);
    }

    private static void WriteCatalogSheet(
        XLWorkbook workbook,
        ProductCatalogData catalogs)
    {
        var sheet = workbook.Worksheets.Add(CatalogSheetName);
        sheet.Cell(1, 1).Value = "Mã cơ sở";
        sheet.Cell(1, 2).Value = "Tên cơ sở";
        sheet.Cell(1, 3).Value = "Nhóm sản phẩm";
        sheet.Cell(1, 4).Value = "Quốc gia";
        var header = sheet.Range(1, 1, 1, 4);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");

        for (var i = 0; i < catalogs.Businesses.Count; i++)
        {
            sheet.Cell(i + 2, 1).Value = catalogs.Businesses[i].Code;
            sheet.Cell(i + 2, 2).Value = catalogs.Businesses[i].Name;
        }
        WriteColumn(sheet, 3, catalogs.ProductGroups);
        WriteColumn(sheet, 4, catalogs.Countries);
        sheet.Columns().AdjustToContents(10, 40);

        static void WriteColumn(
            IXLWorksheet s, int col, IReadOnlyList<CatalogOption> items)
        {
            for (var i = 0; i < items.Count; i++)
                s.Cell(i + 2, col).Value = items[i].Name;
        }
    }

    private static void AddDropdownValidation(
        XLWorkbook workbook,
        IXLWorksheet sheet,
        ProductCatalogData catalogs)
    {
        const int maxDataRows = 10000;
        var catalogSheet = workbook.Worksheet(CatalogSheetName);
        AddListValidation(sheet, catalogSheet, BusinessCodeColumn, 1,
            catalogs.Businesses.Count);
        AddListValidation(sheet, catalogSheet, ProductGroupColumn, 3,
            catalogs.ProductGroups.Count);
        AddListValidation(sheet, catalogSheet, CountryColumn, 4,
            catalogs.Countries.Count);

        static void AddListValidation(
            IXLWorksheet target,
            IXLWorksheet source,
            int targetColumn,
            int sourceColumn,
            int itemCount)
        {
            if (itemCount == 0) return;
            var sourceRange = source.Range(2, sourceColumn,
                itemCount + 1, sourceColumn);
            target.Range(2, targetColumn, maxDataRows, targetColumn)
                .CreateDataValidation()
                .List(sourceRange, true);
        }
    }

    private static void WriteHeaders(IXLWorksheet sheet)
    {
        for (var index = 0; index < Headers.Length; index++)
            sheet.Cell(1, index + 1).Value = Headers[index];
        var header = sheet.Range(1, 1, 1, Headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(10, 40);
        sheet.Range(1, 1, 1, Headers.Length).SetAutoFilter();
    }

    private static byte[] Save(XLWorkbook workbook)
    {
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}

internal sealed record ProductWorkbookReadResult(
    IReadOnlyList<ProductExcelRow> Rows,
    IReadOnlyList<ExcelImportErrorDto> Errors);

internal sealed class ProductExcelRow
{
    public int RowNumber { get; init; }
    public string BusinessCode { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string ProductGroup { get; init; } = string.Empty;
    public string BrandName { get; init; } = string.Empty;
    public string Manufacturer { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string NetWeight { get; init; } = string.Empty;
    public string Specifications { get; init; } = string.Empty;
    public string Ingredients { get; init; } = string.Empty;
    public string ExpiryPeriodMonths { get; init; } = string.Empty;
    public string StorageConditions { get; init; } = string.Empty;
    public string UsageInstructions { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
}
