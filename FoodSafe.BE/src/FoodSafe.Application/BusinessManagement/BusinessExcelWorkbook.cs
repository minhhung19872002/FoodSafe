using ClosedXML.Excel;

namespace FoodSafe.BusinessManagement;

internal static class BusinessExcelWorkbook
{
    internal const int MaximumRows = 1000;
    private const string SheetName = "Cơ sở";
    private static readonly string[] Headers =
    [
        "OrganizationId*",
        "Code*",
        "Name*",
        "TaxCode",
        "BusinessTypeId",
        "ClassificationId",
        "Address",
        "Phone",
        "Email",
        "Latitude",
        "Longitude",
        "ProductGroupIds"
    ];

    internal static byte[] CreateTemplate()
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        sheet.Cell(2, 1).Value = "00000000-0000-0000-0000-000000000000";
        sheet.Cell(2, 2).Value = "CS-001";
        sheet.Cell(2, 3).Value = "Cơ sở mẫu";
        sheet.Cell(2, 12).Value =
            "guid-nhóm-1;guid-nhóm-2";
        sheet.Row(2).Style.Font.FontColor = XLColor.Gray;

        var instructions = workbook.Worksheets.Add("Hướng dẫn");
        instructions.Cell("A1").Value = "HƯỚNG DẪN IMPORT CƠ SỞ";
        instructions.Cell("A1").Style.Font.Bold = true;
        instructions.Cell("A3").Value =
            "Không đổi tên sheet “Cơ sở” hoặc tên các cột.";
        instructions.Cell("A4").Value =
            "Các cột có dấu * là bắt buộc. Xóa dòng mẫu trước khi upload.";
        instructions.Cell("A5").Value =
            "ProductGroupIds nhận nhiều GUID, phân cách bằng dấu chấm phẩy (;).";
        instructions.Cell("A6").Value =
            $"Tối đa {MaximumRows} dòng dữ liệu trong mỗi lần import.";
        instructions.Columns().AdjustToContents();
        return Save(workbook);
    }

    internal static WorkbookReadResult Read(byte[] content)
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
                        $"Cột {column} phải có tên “{Headers[column - 1]}”."
                });
            }
        }
        if (errors.Count > 0)
        {
            return new WorkbookReadResult([], errors);
        }

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        var rows = new List<BusinessExcelRow>();
        for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
        {
            var values = Enumerable.Range(1, Headers.Length)
                .Select(column => sheet.Cell(rowNumber, column).GetString().Trim())
                .ToArray();
            if (values.All(string.IsNullOrWhiteSpace))
            {
                continue;
            }
            rows.Add(new BusinessExcelRow
            {
                RowNumber = rowNumber,
                OrganizationId = values[0],
                Code = values[1],
                Name = values[2],
                TaxCode = values[3],
                BusinessTypeId = values[4],
                ClassificationId = values[5],
                Address = values[6],
                Phone = values[7],
                Email = values[8],
                Latitude = values[9],
                Longitude = values[10],
                ProductGroupIds = values[11]
            });
        }

        if (rows.Count > MaximumRows)
        {
            errors.Add(new ExcelImportErrorDto
            {
                RowNumber = MaximumRows + 2,
                Field = "File",
                Message = $"File chỉ được chứa tối đa {MaximumRows} dòng."
            });
        }
        return new WorkbookReadResult(rows.Take(MaximumRows).ToList(), errors);
    }

    internal static byte[] Export(IReadOnlyList<BusinessDto> businesses)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        var row = 2;
        foreach (var item in businesses)
        {
            sheet.Cell(row, 1).Value = item.OrganizationId.ToString();
            sheet.Cell(row, 2).Value = item.Code ?? string.Empty;
            sheet.Cell(row, 3).Value = item.Name;
            sheet.Cell(row, 4).Value = item.TaxCode ?? string.Empty;
            sheet.Cell(row, 5).Value = item.BusinessTypeId?.ToString() ?? "";
            sheet.Cell(row, 6).Value =
                item.BusinessClassificationId?.ToString() ?? "";
            sheet.Cell(row, 7).Value = item.AddressStreet ?? string.Empty;
            sheet.Cell(row, 8).Value = item.ContactPhone ?? string.Empty;
            sheet.Cell(row, 9).Value = item.ContactEmail ?? string.Empty;
            if (item.AddressLatitude.HasValue)
                sheet.Cell(row, 10).Value = item.AddressLatitude.Value;
            if (item.AddressLongitude.HasValue)
                sheet.Cell(row, 11).Value = item.AddressLongitude.Value;
            sheet.Cell(row, 12).Value =
                string.Join(';', item.ProductGroupIds);
            row++;
        }
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(8, 45);
        return Save(workbook);
    }

    private static void WriteHeaders(IXLWorksheet sheet)
    {
        for (var index = 0; index < Headers.Length; index++)
        {
            sheet.Cell(1, index + 1).Value = Headers[index];
        }
        var header = sheet.Range(1, 1, 1, Headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(10, 40);
        sheet.Range(1, 1, MaximumRows + 1, Headers.Length)
            .SetAutoFilter();
    }

    private static byte[] Save(XLWorkbook workbook)
    {
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}

internal sealed record WorkbookReadResult(
    IReadOnlyList<BusinessExcelRow> Rows,
    IReadOnlyList<ExcelImportErrorDto> Errors);

internal sealed class BusinessExcelRow
{
    public int RowNumber { get; init; }
    public string OrganizationId { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string TaxCode { get; init; } = string.Empty;
    public string BusinessTypeId { get; init; } = string.Empty;
    public string ClassificationId { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Latitude { get; init; } = string.Empty;
    public string Longitude { get; init; } = string.Empty;
    public string ProductGroupIds { get; init; } = string.Empty;
}
