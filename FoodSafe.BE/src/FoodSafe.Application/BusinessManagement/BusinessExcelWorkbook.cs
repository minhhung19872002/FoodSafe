using ClosedXML.Excel;

namespace FoodSafe.BusinessManagement;

internal sealed record CatalogOption(Guid Id, string Name);

internal sealed record CatalogData(
    IReadOnlyList<CatalogOption> BusinessTypes,
    IReadOnlyList<CatalogOption> Classifications,
    IReadOnlyList<CatalogOption> ProductGroups);

internal static class BusinessExcelWorkbook
{
    private const string SheetName = "Cơ sở";
    private const string CatalogSheetName = "Danh mục";
    private const int BusinessTypeColumn = 4;
    private const int ClassificationColumn = 5;
    private const int ProductGroupsColumn = 11;
    private static readonly string[] Headers =
    [
        "Mã cơ sở*",
        "Tên cơ sở*",
        "Mã số thuế",
        "Loại hình",
        "Phân loại nguy cơ",
        "Địa chỉ",
        "Điện thoại",
        "Email",
        "Vĩ độ",
        "Kinh độ",
        "Nhóm sản phẩm"
    ];

    internal static byte[] CreateTemplate(CatalogData catalogs)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        sheet.Cell(2, 1).Value = "CS-001";
        sheet.Cell(2, 2).Value = "Cơ sở mẫu";
        sheet.Row(2).Style.Font.FontColor = XLColor.Gray;

        WriteCatalogSheet(workbook, catalogs);
        AddDropdownValidation(workbook, sheet, catalogs);

        var instructions = workbook.Worksheets.Add("Hướng dẫn");
        instructions.Cell("A1").Value = "HƯỚNG DẪN IMPORT CƠ SỞ";
        instructions.Cell("A1").Style.Font.Bold = true;
        instructions.Cell("A3").Value =
            "Không đổi tên sheet \"Cơ sở\" hoặc tên các cột.";
        instructions.Cell("A4").Value =
            "Các cột có dấu * là bắt buộc. Xóa dòng mẫu trước khi upload.";
        instructions.Cell("A5").Value =
            "Loại hình, Phân loại nguy cơ: chọn từ danh sách thả xuống.";
        instructions.Cell("A6").Value =
            "Nhóm sản phẩm: nhập nhiều tên cách nhau bằng dấu ; (xem sheet Danh mục).";
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
                        $"Cột {column} phải có tên \"{Headers[column - 1]}\"."
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
                Code = values[0],
                Name = values[1],
                TaxCode = values[2],
                BusinessType = values[3],
                Classification = values[4],
                Address = values[5],
                Phone = values[6],
                Email = values[7],
                Latitude = values[8],
                Longitude = values[9],
                ProductGroups = values[10]
            });
        }

        return new WorkbookReadResult(rows, errors);
    }

    // Nhãn tiếng Việt cho 4 cột miễn GCN trong file export (GAP-CAT-1).
    private static readonly Dictionary<EligibilityExemptionReason, string>
        ExemptionLabels = new()
        {
            [EligibilityExemptionReason.SmallScalePrimaryProduction] =
                "a) Sản xuất ban đầu nhỏ lẻ",
            [EligibilityExemptionReason.NoFixedLocation] =
                "b) SXKD thực phẩm không có địa điểm cố định",
            [EligibilityExemptionReason.SmallScalePreliminaryProcessing] =
                "c) Sơ chế nhỏ lẻ",
            [EligibilityExemptionReason.SmallScaleTrading] =
                "d) Kinh doanh thực phẩm nhỏ lẻ",
            [EligibilityExemptionReason.PrepackagedFoodTrading] =
                "đ) Kinh doanh thực phẩm bao gói sẵn",
            [EligibilityExemptionReason.PackagingMaterialProduction] =
                "e) SXKD dụng cụ, vật liệu bao gói thực phẩm",
            [EligibilityExemptionReason.HotelRestaurant] =
                "g) Nhà hàng trong khách sạn",
            [EligibilityExemptionReason.CollectiveKitchenNoRegistration] =
                "h) Bếp ăn tập thể không đăng ký ngành nghề",
            [EligibilityExemptionReason.StreetFood] =
                "i) Kinh doanh thức ăn đường phố",
            [EligibilityExemptionReason.QualitySystemCertified] =
                "k) Đã có chứng nhận GMP/HACCP/ISO 22000/IFS/BRC/FSSC 22000",
        };

    private static readonly Dictionary<QualityCertificationType, string>
        QualityCertLabels = new()
        {
            [QualityCertificationType.Gmp] = "GMP",
            [QualityCertificationType.Haccp] = "HACCP",
            [QualityCertificationType.Iso22000] = "ISO 22000",
            [QualityCertificationType.Ifs] = "IFS",
            [QualityCertificationType.Brc] = "BRC",
            [QualityCertificationType.Fssc22000] = "FSSC 22000",
            [QualityCertificationType.Other] = "Tương đương khác",
        };

    internal static byte[] Export(
        IReadOnlyList<BusinessDto> businesses,
        CatalogData catalogs)
    {
        var typeMap = catalogs.BusinessTypes
            .ToDictionary(x => x.Id, x => x.Name);
        var classMap = catalogs.Classifications
            .ToDictionary(x => x.Id, x => x.Name);
        var groupMap = catalogs.ProductGroups
            .ToDictionary(x => x.Id, x => x.Name);

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(SheetName);
        WriteHeaders(sheet);
        // Extra export-only columns (import ignores columns beyond the template).
        string[] extraHeaders =
        [
            "Miễn GCN ĐĐK (Điều 12 NĐ 15/2018)",
            "Loại chứng nhận chất lượng",
            "Số chứng nhận chất lượng",
            "Hết hạn chứng nhận chất lượng"
        ];
        for (var index = 0; index < extraHeaders.Length; index++)
        {
            var cell = sheet.Cell(1, Headers.Length + index + 1);
            cell.Value = extraHeaders[index];
            cell.Style.Font.Bold = true;
            cell.Style.Font.FontColor = XLColor.White;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        }
        var row = 2;
        foreach (var item in businesses)
        {
            sheet.Cell(row, 1).Value = item.Code ?? string.Empty;
            sheet.Cell(row, 2).Value = item.Name;
            sheet.Cell(row, 3).Value = item.TaxCode ?? string.Empty;
            sheet.Cell(row, 4).Value = item.BusinessTypeId.HasValue
                && typeMap.TryGetValue(item.BusinessTypeId.Value, out var typeName)
                    ? typeName : string.Empty;
            sheet.Cell(row, 5).Value = item.BusinessClassificationId.HasValue
                && classMap.TryGetValue(
                    item.BusinessClassificationId.Value, out var className)
                    ? className : string.Empty;
            sheet.Cell(row, 6).Value = item.AddressStreet ?? string.Empty;
            sheet.Cell(row, 7).Value = item.ContactPhone ?? string.Empty;
            sheet.Cell(row, 8).Value = item.ContactEmail ?? string.Empty;
            if (item.AddressLatitude.HasValue)
                sheet.Cell(row, 9).Value = item.AddressLatitude.Value;
            if (item.AddressLongitude.HasValue)
                sheet.Cell(row, 10).Value = item.AddressLongitude.Value;
            sheet.Cell(row, 11).Value = string.Join("; ",
                item.ProductGroupIds
                    .Where(groupMap.ContainsKey)
                    .Select(id => groupMap[id]));
            sheet.Cell(row, 12).Value =
                item.EligibilityExemptionReason.HasValue &&
                ExemptionLabels.TryGetValue(
                    item.EligibilityExemptionReason.Value, out var exemption)
                    ? exemption : string.Empty;
            sheet.Cell(row, 13).Value =
                item.QualityCertificationType.HasValue &&
                QualityCertLabels.TryGetValue(
                    item.QualityCertificationType.Value, out var certType)
                    ? certType : string.Empty;
            sheet.Cell(row, 14).Value =
                item.QualityCertificationNumber ?? string.Empty;
            if (item.QualityCertificationExpiry.HasValue)
            {
                sheet.Cell(row, 15).Value =
                    item.QualityCertificationExpiry.Value.ToString("dd/MM/yyyy");
            }
            row++;
        }
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(8, 45);
        return Save(workbook);
    }

    private static void WriteCatalogSheet(
        XLWorkbook workbook,
        CatalogData catalogs)
    {
        var sheet = workbook.Worksheets.Add(CatalogSheetName);
        sheet.Cell(1, 1).Value = "Loại hình";
        sheet.Cell(1, 2).Value = "Phân loại nguy cơ";
        sheet.Cell(1, 3).Value = "Nhóm sản phẩm";
        var header = sheet.Range(1, 1, 1, 3);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");

        WriteColumn(sheet, 1, catalogs.BusinessTypes);
        WriteColumn(sheet, 2, catalogs.Classifications);
        WriteColumn(sheet, 3, catalogs.ProductGroups);
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
        CatalogData catalogs)
    {
        const int maxDataRows = 10000;
        var catalogSheet = workbook.Worksheet(CatalogSheetName);
        AddListValidation(sheet, catalogSheet, BusinessTypeColumn, 1,
            catalogs.BusinessTypes.Count);
        AddListValidation(sheet, catalogSheet, ClassificationColumn, 2,
            catalogs.Classifications.Count);
        AddListValidation(sheet, catalogSheet, ProductGroupsColumn, 3,
            catalogs.ProductGroups.Count);

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
        {
            sheet.Cell(1, index + 1).Value = Headers[index];
        }
        var header = sheet.Range(1, 1, 1, Headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(10, 40);
        sheet.Range(1, 1, 1, Headers.Length)
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
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public string TaxCode { get; init; } = string.Empty;
    public string BusinessType { get; init; } = string.Empty;
    public string Classification { get; init; } = string.Empty;
    public string Address { get; init; } = string.Empty;
    public string Phone { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Latitude { get; init; } = string.Empty;
    public string Longitude { get; init; } = string.Empty;
    public string ProductGroups { get; init; } = string.Empty;
}
