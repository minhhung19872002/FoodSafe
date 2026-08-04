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
/// <paramref name="Sample"/> là giá trị minh họa ghi ở dòng 2 của file mẫu; cột
/// tham chiếu bắt buộc sẽ tự lấy giá trị đầu tiên trong danh sách thay cho
/// <paramref name="Sample"/> để dòng mẫu luôn khớp dropdown.
/// </summary>
internal sealed record CatalogColumn(
    string Field,
    string Header,
    CatalogColumnType Type = CatalogColumnType.Text,
    bool Required = false,
    string? LookupKey = null,
    string? Hint = null,
    string? Sample = null);

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
        WriteSampleRow(sheet, definition, lookups);
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

    /// <summary>
    /// Ghi dòng minh họa ở dòng 2 (chữ xám, in nghiêng) giống file mẫu import
    /// cơ sở. Người dùng phải xóa dòng này trước khi upload — sheet "Hướng dẫn"
    /// nhắc lại yêu cầu đó.
    /// </summary>
    private static void WriteSampleRow(
        IXLWorksheet sheet,
        CatalogSheetDefinition definition,
        IReadOnlyList<CatalogLookup> lookups)
    {
        for (var index = 0; index < definition.Columns.Count; index++)
        {
            var column = definition.Columns[index];
            var value = ResolveSample(column, lookups);
            if (value is null) continue;
            sheet.Cell(2, index + 1).Value = value;
        }
        var row = sheet.Range(2, 1, 2, definition.Columns.Count);
        row.Style.Font.FontColor = XLColor.Gray;
        row.Style.Font.Italic = true;

        // Nhắc ngay cạnh dòng mẫu — nằm ngoài vùng cột nên không bị đọc khi import.
        var note = sheet.Cell(2, definition.Columns.Count + 2);
        note.Value = "← Dòng mẫu, xóa trước khi upload";
        note.Style.Font.FontColor = XLColor.Red;
        note.Style.Font.Bold = true;
    }

    // Cột tham chiếu bắt buộc lấy giá trị thật đầu tiên để dòng mẫu không vi
    // phạm dropdown; cột tham chiếu không bắt buộc để trống cho an toàn (ví dụ
    // Phường/Xã phải thuộc đúng Tỉnh/Thành phố đã chọn).
    private static string? ResolveSample(
        CatalogColumn column,
        IReadOnlyList<CatalogLookup> lookups)
    {
        if (column.LookupKey is null) return column.Sample;
        if (!column.Required) return null;
        var index = IndexOfLookup(lookups, column.LookupKey);
        if (index < 0) return null;
        var values = lookups[index].Values;
        return values.Count == 0 ? null : values[0];
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
            "Dòng 2 (chữ xám, in nghiêng) là dòng mẫu — XÓA trước khi upload.";
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
        // Các cột dùng chung nhận giá trị mẫu theo từng danh mục để dòng minh
        // họa đọc lên có nghĩa thay vì "Mã mẫu / Tên mẫu" chung chung.
        static CatalogColumn Code(string sample) =>
            new("Code", "Mã*", Required: true,
                Hint: "Mã duy nhất trong danh mục.", Sample: sample);
        static CatalogColumn Name(string sample) =>
            new("Name", "Tên*", Required: true, Sample: sample);
        static CatalogColumn Description(string? sample = null) =>
            new("Description", "Mô tả", Sample: sample);

        var sortOrder = new CatalogColumn(
            "SortOrder", "Thứ tự", CatalogColumnType.Integer,
            Hint: "Số nguyên, để trống = 0.", Sample: "1");
        var active = new CatalogColumn(
            "IsActive", "Trạng thái", CatalogColumnType.Boolean,
            Hint: "Có = hoạt động, Không = ngừng. Để trống = Có.", Sample: "Có");

        CatalogColumn[] Simple(string codeSample, string nameSample, string? note) =>
            [Code(codeSample), Name(nameSample), Description(note), sortOrder, active];

        return new Dictionary<MasterCatalogKind, CatalogSheetDefinition>
        {
            [MasterCatalogKind.Country] = new(
                MasterCatalogKind.Country,
                "Quốc gia",
                "quoc-gia",
                [
                    new("CodeAlpha2", "Mã ISO Alpha-2*", Required: true,
                        Hint: "Đúng 2 chữ cái, ví dụ VN.", Sample: "JP"),
                    new("CodeAlpha3", "Mã ISO Alpha-3",
                        Hint: "Đúng 3 chữ cái, ví dụ VNM.", Sample: "JPN"),
                    new("NameVi", "Tên tiếng Việt*", Required: true,
                        Sample: "Nhật Bản"),
                    new("NameEn", "Tên tiếng Anh", Sample: "Japan"),
                    sortOrder,
                    active
                ],
                ["Mã Alpha-2 là mã định danh, không được trùng."]),

            [MasterCatalogKind.Region] = new(
                MasterCatalogKind.Region,
                "Vùng",
                "vung",
                Simple("DBSH", "Đồng bằng sông Hồng",
                    "Gồm các tỉnh/thành thuộc đồng bằng sông Hồng"),
                ["Mã vùng tối đa 20 ký tự."]),

            [MasterCatalogKind.ProductGroup] = new(
                MasterCatalogKind.ProductGroup,
                "Nhóm sản phẩm",
                "nhom-san-pham",
                [
                    Code("NSP-01"),
                    Name("Nước mắm và gia vị"),
                    new("Level", "Cấp*", CatalogColumnType.Integer, Required: true,
                        Hint: "1 = nhóm cha, 2 = nhóm con.", Sample: "1"),
                    new("ParentName", "Nhóm cha", LookupKey: "product-group",
                        Hint: "Bắt buộc khi Cấp = 2. Chọn theo tên nhóm cấp 1."),
                    Description(),
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
                Simple("LH-01", "Cơ sở sản xuất, chế biến thực phẩm", null),
                []),

            [MasterCatalogKind.BusinessClassification] = new(
                MasterCatalogKind.BusinessClassification,
                "Phân loại cơ sở",
                "phan-loai-co-so",
                [
                    Code("LOAI-A"),
                    Name("Loại A — Tốt"),
                    new("RiskLevel", "Rủi ro*", Required: true,
                        LookupKey: "risk-level",
                        Hint: "Cao, Trung bình hoặc Thấp."),
                    new("Criteria", "Tiêu chí phân loại*", Required: true,
                        Sample: "Cơ sở đáp ứng đầy đủ điều kiện bảo đảm an toàn "
                            + "thực phẩm; tần suất thanh kiểm tra 01 lần/năm."),
                    Description(),
                    sortOrder,
                    active
                ],
                []),

            [MasterCatalogKind.AdvertisementType] = new(
                MasterCatalogKind.AdvertisementType,
                "Loại quảng cáo",
                "loai-quang-cao",
                Simple("QC-01", "Quảng cáo trên báo điện tử", null),
                []),

            [MasterCatalogKind.DocumentType] = new(
                MasterCatalogKind.DocumentType,
                "Loại văn bản",
                "loai-van-ban",
                Simple("VB-01", "Nghị định", null),
                []),

            [MasterCatalogKind.TestingCenter] = new(
                MasterCatalogKind.TestingCenter,
                "Trung tâm kiểm nghiệm",
                "trung-tam-kiem-nghiem",
                [
                    Code("TTKN-01"),
                    Name("Trung tâm Kiểm nghiệm ATTP Quảng Ninh"),
                    new("Address", "Địa chỉ*", Required: true,
                        Sample: "Số 651 đường Nguyễn Văn Cừ"),
                    new("ProvinceName", "Tỉnh/Thành phố*", Required: true,
                        LookupKey: "province"),
                    new("CommuneName", "Phường/Xã", LookupKey: "commune",
                        Hint: "Phải thuộc tỉnh/thành phố đã chọn."),
                    new("ContactPerson", "Người liên hệ", Sample: "Nguyễn Văn A"),
                    new("Phone", "Điện thoại", Sample: "0203 3825 111"),
                    new("Email", "Email", Sample: "ttkn@quangninh.gov.vn"),
                    new("AccreditationNumber", "Số công nhận*", Required: true,
                        Sample: "VILAS 1234"),
                    new("AccreditationScope", "Phạm vi công nhận*", Required: true,
                        Sample: "Vi sinh, hóa lý thực phẩm"),
                    new("AccreditationExpiresAt", "Hết hạn công nhận*",
                        CatalogColumnType.Date, Required: true,
                        Hint: "Định dạng dd/MM/yyyy.", Sample: "31/12/2027"),
                    Description(),
                    sortOrder,
                    active
                ],
                ["Phường/Xã bỏ trống nếu chưa xác định."]),

            [MasterCatalogKind.TestingService] = new(
                MasterCatalogKind.TestingService,
                "Dịch vụ kiểm nghiệm",
                "dich-vu-kiem-nghiem",
                [
                    Code("DV-01"),
                    Name("Định lượng E.coli trong thực phẩm"),
                    new("TestingCenterName", "Trung tâm kiểm nghiệm*",
                        Required: true, LookupKey: "testing-center"),
                    new("Unit", "Đơn vị tính*", Required: true, Sample: "mẫu"),
                    new("Method", "Phương pháp*", Required: true,
                        Sample: "TCVN 6846:2007"),
                    new("Price", "Đơn giá (VND)", CatalogColumnType.Decimal,
                        Hint: "Số không âm, để trống = 0.", Sample: "350000"),
                    new("TurnaroundDays", "Thời gian trả KQ (ngày)",
                        CatalogColumnType.Integer, Hint: "0 đến 3650.", Sample: "5"),
                    Description(),
                    sortOrder,
                    active
                ],
                ["Trung tâm kiểm nghiệm phải tồn tại sẵn trong hệ thống."]),

            [MasterCatalogKind.ViolationType] = new(
                MasterCatalogKind.ViolationType,
                "Hành vi vi phạm",
                "hanh-vi-vi-pham",
                [
                    Code("VP-115-15-2"),
                    Name("Không thực hiện chế độ kiểm thực ba bước; không lưu mẫu thức ăn"),
                    new("LegalReference", "Căn cứ pháp lý*", Required: true,
                        Hint: "Điều/khoản của Nghị định 115/2018/NĐ-CP (tối đa 500 ký tự).",
                        Sample: "Khoản 2 Điều 15 Nghị định 115/2018/NĐ-CP"),
                    new("MinFine", "Mức phạt tối thiểu (VND)", CatalogColumnType.Decimal,
                        Hint: "Mức cá nhân; tổ chức gấp 2 lần. Để trống nếu chưa xác định.",
                        Sample: "3000000"),
                    new("MaxFine", "Mức phạt tối đa (VND)", CatalogColumnType.Decimal,
                        Hint: "Phải lớn hơn hoặc bằng mức tối thiểu.",
                        Sample: "5000000"),
                    Description(),
                    sortOrder,
                    active
                ],
                ["Khung phạt nhập theo mức cá nhân (tổ chức gấp 2 lần theo NĐ 115/2018)."])
        };
    }
}
