using ClosedXML.Excel;

namespace FoodSafe.Catalogs;

/// <summary>Kiểu dữ liệu của một cột trong file mẫu import danh mục.</summary>
internal enum CatalogColumnType
{
    Text,
    Integer,
    Decimal,
    Date,
    Boolean,
    Lookup
}

/// <summary>
/// Đặc tả một cột của file mẫu. <paramref name="LookupKey"/> trỏ tới danh sách
/// tham chiếu được ghi ra sheet "Danh mục tham chiếu" và dùng làm dropdown.
/// </summary>
internal sealed record CatalogColumn(
    string Field,
    string Header,
    CatalogColumnType Type = CatalogColumnType.Text,
    bool Required = false,
    string? LookupKey = null,
    string? Hint = null);

/// <summary>Danh sách tham chiếu (tên hiển thị → id) dùng cho cột Lookup.</summary>
internal sealed record CatalogLookup(
    string Key,
    string Header,
    IReadOnlyList<string> Values);

internal sealed record CatalogSheetDefinition(
    MasterCatalogKind Kind,
    string SheetName,
    string FileSlug,
    IReadOnlyList<CatalogColumn> Columns,
    IReadOnlyList<string> Instructions);

internal sealed record CatalogRow(int RowNumber, IReadOnlyDictionary<string, string> Values)
{
    internal string Get(string field) => Values.GetValueOrDefault(field, string.Empty);
}

internal sealed record CatalogWorkbookReadResult(
    IReadOnlyList<CatalogRow> Rows,
    IReadOnlyList<BusinessManagement.ExcelImportErrorDto> Errors);

/// <summary>
/// Sinh file mẫu và đọc file import cho toàn bộ danh mục dùng chung. Cấu trúc
/// cột được khai báo dữ liệu (table-driven) nên thêm danh mục mới chỉ cần khai
/// báo thêm một <see cref="CatalogSheetDefinition"/>.
/// </summary>
internal static class MasterCatalogExcelWorkbook
{
    private const string LookupSheetName = "Danh mục tham chiếu";
    private const int MaximumTemplateRows = 5000;

    private static readonly IReadOnlyDictionary<MasterCatalogKind, CatalogSheetDefinition>
        Definitions = BuildDefinitions();

    internal static CatalogSheetDefinition GetDefinition(MasterCatalogKind kind) =>
        Definitions.TryGetValue(kind, out var definition)
            ? definition
            : throw new ArgumentOutOfRangeException(
                nameof(kind),
                kind,
                "Danh mục không hỗ trợ import Excel.");

    internal static byte[] CreateTemplate(
        MasterCatalogKind kind,
        IReadOnlyList<CatalogLookup> lookups)
    {
        var definition = GetDefinition(kind);
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(definition.SheetName);
        WriteHeaders(sheet, definition);
        WriteLookupSheet(workbook, lookups);
        AddDropdownValidation(sheet, workbook, definition, lookups);
        WriteInstructions(workbook, definition);
        return Save(workbook);
    }

    internal static CatalogWorkbookReadResult Read(
        MasterCatalogKind kind,
        byte[] content)
    {
        var definition = GetDefinition(kind);
        using var stream = new MemoryStream(content, writable: false);
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets
            .FirstOrDefault(x => x.Name.Equals(
                definition.SheetName,
                StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheet(1);

        var errors = new List<BusinessManagement.ExcelImportErrorDto>();
        for (var column = 1; column <= definition.Columns.Count; column++)
        {
            var expected = definition.Columns[column - 1].Header;
            var actual = sheet.Cell(1, column).GetString().Trim();
            if (!actual.Equals(expected, StringComparison.Ordinal))
            {
                errors.Add(new BusinessManagement.ExcelImportErrorDto
                {
                    RowNumber = 1,
                    Field = expected,
                    Message = $"Cột {column} phải có tên \"{expected}\"."
                });
            }
        }
        if (errors.Count > 0)
        {
            return new CatalogWorkbookReadResult([], errors);
        }

        var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 1;
        var rows = new List<CatalogRow>();
        for (var rowNumber = 2; rowNumber <= lastRow; rowNumber++)
        {
            var values = new Dictionary<string, string>(StringComparer.Ordinal);
            var empty = true;
            for (var column = 1; column <= definition.Columns.Count; column++)
            {
                var raw = ReadCell(sheet, rowNumber, column,
                    definition.Columns[column - 1].Type);
                values[definition.Columns[column - 1].Field] = raw;
                if (!string.IsNullOrWhiteSpace(raw)) empty = false;
            }
            if (empty) continue;
            rows.Add(new CatalogRow(rowNumber, values));
        }

        return new CatalogWorkbookReadResult(rows, errors);
    }

    // Ngày tháng trong Excel là số serial — GetString() sẽ trả về số thô nên
    // phải đọc theo đúng kiểu để không mất định dạng người dùng nhập.
    private static string ReadCell(
        IXLWorksheet sheet,
        int row,
        int column,
        CatalogColumnType type)
    {
        var cell = sheet.Cell(row, column);
        if (type == CatalogColumnType.Date && cell.DataType == XLDataType.DateTime)
        {
            return cell.GetDateTime().ToString("dd/MM/yyyy");
        }
        return cell.GetString().Trim();
    }

    private static void WriteHeaders(
        IXLWorksheet sheet,
        CatalogSheetDefinition definition)
    {
        for (var index = 0; index < definition.Columns.Count; index++)
        {
            var column = definition.Columns[index];
            var cell = sheet.Cell(1, index + 1);
            cell.Value = column.Header;
            if (column.Hint is not null)
            {
                cell.CreateComment().AddText(column.Hint);
            }
        }
        var header = sheet.Range(1, 1, 1, definition.Columns.Count);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        header.SetAutoFilter();
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(12, 42);
    }

    private static void WriteLookupSheet(
        XLWorkbook workbook,
        IReadOnlyList<CatalogLookup> lookups)
    {
        if (lookups.Count == 0) return;
        var sheet = workbook.Worksheets.Add(LookupSheetName);
        for (var index = 0; index < lookups.Count; index++)
        {
            sheet.Cell(1, index + 1).Value = lookups[index].Header;
            for (var row = 0; row < lookups[index].Values.Count; row++)
            {
                sheet.Cell(row + 2, index + 1).Value = lookups[index].Values[row];
            }
        }
        var header = sheet.Range(1, 1, 1, lookups.Count);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.Columns().AdjustToContents(12, 42);
    }

    private static void AddDropdownValidation(
        IXLWorksheet sheet,
        XLWorkbook workbook,
        CatalogSheetDefinition definition,
        IReadOnlyList<CatalogLookup> lookups)
    {
        for (var index = 0; index < definition.Columns.Count; index++)
        {
            var column = definition.Columns[index];
            var targetRange = sheet.Range(
                2, index + 1, MaximumTemplateRows, index + 1);

            if (column.Type == CatalogColumnType.Boolean)
            {
                targetRange.CreateDataValidation().List("\"Có,Không\"", true);
                continue;
            }
            if (column.LookupKey is null) continue;

            var lookupIndex = IndexOfLookup(lookups, column.LookupKey);
            if (lookupIndex < 0 || lookups[lookupIndex].Values.Count == 0) continue;

            var source = workbook.Worksheet(LookupSheetName).Range(
                2,
                lookupIndex + 1,
                lookups[lookupIndex].Values.Count + 1,
                lookupIndex + 1);
            targetRange.CreateDataValidation().List(source, true);
        }
    }

    private static int IndexOfLookup(
        IReadOnlyList<CatalogLookup> lookups,
        string key)
    {
        for (var index = 0; index < lookups.Count; index++)
        {
            if (lookups[index].Key == key) return index;
        }
        return -1;
    }

    private static void WriteInstructions(
        XLWorkbook workbook,
        CatalogSheetDefinition definition)
    {
        var sheet = workbook.Worksheets.Add("Hướng dẫn");
        sheet.Cell("A1").Value = $"HƯỚNG DẪN IMPORT — {definition.SheetName}";
        sheet.Cell("A1").Style.Font.Bold = true;
        var row = 3;
        sheet.Cell(row++, 1).Value =
            $"Không đổi tên sheet \"{definition.SheetName}\" và không đổi tên cột.";
        sheet.Cell(row++, 1).Value =
            "Các cột có dấu * là bắt buộc. Không để trống.";
        sheet.Cell(row++, 1).Value =
            "Cột có dropdown: chọn từ danh sách, không tự nhập giá trị mới.";
        sheet.Cell(row++, 1).Value =
            "Ngày tháng nhập theo định dạng dd/MM/yyyy.";
        sheet.Cell(row++, 1).Value =
            "Cột Trạng thái nhận giá trị \"Có\" (hoạt động) hoặc \"Không\" (ngừng).";
        foreach (var instruction in definition.Instructions)
        {
            sheet.Cell(row++, 1).Value = instruction;
        }
        row++;
        sheet.Cell(row, 1).Value = "DANH SÁCH CỘT";
        sheet.Cell(row++, 1).Style.Font.Bold = true;
        foreach (var column in definition.Columns)
        {
            sheet.Cell(row, 1).Value = column.Header;
            sheet.Cell(row++, 2).Value = column.Hint ?? string.Empty;
        }
        sheet.Columns().AdjustToContents(12, 70);
    }

    private static byte[] Save(XLWorkbook workbook)
    {
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    // Các cột dùng chung khai báo dạng biến cục bộ: nếu để static field thì thứ
    // tự khởi tạo static (Definitions được khai báo trước) sẽ khiến chúng còn
    // null lúc BuildDefinitions() chạy.
    private static IReadOnlyDictionary<MasterCatalogKind, CatalogSheetDefinition>
        BuildDefinitions()
    {
        var code = new CatalogColumn("Code", "Mã*", Required: true,
            Hint: "Mã duy nhất trong danh mục.");
        var name = new CatalogColumn("Name", "Tên*", Required: true);
        var description = new CatalogColumn("Description", "Mô tả");
        var sortOrder = new CatalogColumn(
            "SortOrder", "Thứ tự", CatalogColumnType.Integer,
            Hint: "Số nguyên, để trống = 0.");
        var active = new CatalogColumn(
            "IsActive", "Trạng thái", CatalogColumnType.Boolean,
            Hint: "Có = hoạt động, Không = ngừng. Để trống = Có.");

        var simple = new[] { code, name, description, sortOrder, active };

        return new Dictionary<MasterCatalogKind, CatalogSheetDefinition>
        {
            [MasterCatalogKind.Country] = new(
                MasterCatalogKind.Country,
                "Quốc gia",
                "quoc-gia",
                [
                    new("CodeAlpha2", "Mã ISO Alpha-2*", Required: true,
                        Hint: "Đúng 2 chữ cái, ví dụ VN."),
                    new("CodeAlpha3", "Mã ISO Alpha-3",
                        Hint: "Đúng 3 chữ cái, ví dụ VNM."),
                    new("NameVi", "Tên tiếng Việt*", Required: true),
                    new("NameEn", "Tên tiếng Anh"),
                    sortOrder,
                    active
                ],
                ["Mã Alpha-2 là mã định danh, không được trùng."]),

            [MasterCatalogKind.Region] = new(
                MasterCatalogKind.Region,
                "Vùng",
                "vung",
                [code, name, description, sortOrder, active],
                ["Mã vùng tối đa 20 ký tự."]),

            [MasterCatalogKind.ProductGroup] = new(
                MasterCatalogKind.ProductGroup,
                "Nhóm sản phẩm",
                "nhom-san-pham",
                [
                    code,
                    name,
                    new("Level", "Cấp*", CatalogColumnType.Integer, Required: true,
                        Hint: "1 = nhóm cha, 2 = nhóm con."),
                    new("ParentName", "Nhóm cha", LookupKey: "product-group",
                        Hint: "Bắt buộc khi Cấp = 2. Chọn theo tên nhóm cấp 1."),
                    description,
                    sortOrder,
                    active
                ],
                [
                    "Nhóm cha phải tồn tại sẵn trong hệ thống (import nhóm cấp 1 trước).",
                    "Cấp = 1 thì để trống cột Nhóm cha."
                ]),

            [MasterCatalogKind.BusinessType] = new(
                MasterCatalogKind.BusinessType,
                "Loại hình cơ sở",
                "loai-hinh-co-so",
                simple,
                []),

            [MasterCatalogKind.BusinessClassification] = new(
                MasterCatalogKind.BusinessClassification,
                "Phân loại cơ sở",
                "phan-loai-co-so",
                [
                    code,
                    name,
                    new("RiskLevel", "Rủi ro*", Required: true,
                        LookupKey: "risk-level",
                        Hint: "Cao, Trung bình hoặc Thấp."),
                    new("Criteria", "Tiêu chí phân loại*", Required: true),
                    description,
                    sortOrder,
                    active
                ],
                []),

            [MasterCatalogKind.AdvertisementType] = new(
                MasterCatalogKind.AdvertisementType,
                "Loại quảng cáo",
                "loai-quang-cao",
                simple,
                []),

            [MasterCatalogKind.DocumentType] = new(
                MasterCatalogKind.DocumentType,
                "Loại văn bản",
                "loai-van-ban",
                simple,
                []),

            [MasterCatalogKind.TestingCenter] = new(
                MasterCatalogKind.TestingCenter,
                "Trung tâm kiểm nghiệm",
                "trung-tam-kiem-nghiem",
                [
                    code,
                    name,
                    new("Address", "Địa chỉ*", Required: true),
                    new("ProvinceName", "Tỉnh/Thành phố*", Required: true,
                        LookupKey: "province"),
                    new("CommuneName", "Phường/Xã", LookupKey: "commune",
                        Hint: "Phải thuộc tỉnh/thành phố đã chọn."),
                    new("ContactPerson", "Người liên hệ"),
                    new("Phone", "Điện thoại"),
                    new("Email", "Email"),
                    new("AccreditationNumber", "Số công nhận*", Required: true),
                    new("AccreditationScope", "Phạm vi công nhận*", Required: true),
                    new("AccreditationExpiresAt", "Hết hạn công nhận*",
                        CatalogColumnType.Date, Required: true,
                        Hint: "Định dạng dd/MM/yyyy."),
                    description,
                    sortOrder,
                    active
                ],
                ["Phường/Xã bỏ trống nếu chưa xác định."]),

            [MasterCatalogKind.TestingService] = new(
                MasterCatalogKind.TestingService,
                "Dịch vụ kiểm nghiệm",
                "dich-vu-kiem-nghiem",
                [
                    code,
                    name,
                    new("TestingCenterName", "Trung tâm kiểm nghiệm*",
                        Required: true, LookupKey: "testing-center"),
                    new("Unit", "Đơn vị tính*", Required: true),
                    new("Method", "Phương pháp*", Required: true),
                    new("Price", "Đơn giá (VND)", CatalogColumnType.Decimal,
                        Hint: "Số không âm, để trống = 0."),
                    new("TurnaroundDays", "Thời gian trả KQ (ngày)",
                        CatalogColumnType.Integer, Hint: "0 đến 3650."),
                    description,
                    sortOrder,
                    active
                ],
                ["Trung tâm kiểm nghiệm phải tồn tại sẵn trong hệ thống."])
        };
    }
}
