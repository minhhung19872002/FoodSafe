using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(false)]
public class AtpAlertExcelAppService :
    ApplicationService,
    IAtpAlertExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly AtpAlertAppService _alerts;

    public AtpAlertExcelAppService(AtpAlertAppService alerts)
    {
        _alerts = alerts;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.View)]
    public async Task<ExcelDownloadDto> ExportAsync(AtpAlertFilterDto input)
    {
        var rows = new List<AtpAlertDto>();
        long total;
        do
        {
            var page = await _alerts.GetListAsync(
                new AtpAlertFilterDto
                {
                    Filter = input.Filter,
                    Category = input.Category,
                    Severity = input.Severity,
                    Source = input.Source,
                    Status = input.Status,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:AtpAlertExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"canh-bao-attp-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AtpAlertDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Cảnh báo ATTP");
        var headers = new[]
        {
            "Số cảnh báo", "Tiêu đề", "Danh mục", "Mức độ",
            "Nguồn", "Khu vực", "Sản phẩm", "Cơ sở",
            "Trạng thái", "Công khai", "Ngày tạo"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.AlertNumber ?? string.Empty;
            sheet.Cell(row, 2).Value = item.Title;
            sheet.Cell(row, 3).Value = CategoryLabel(item.Category);
            sheet.Cell(row, 4).Value = SeverityLabel(item.Severity);
            sheet.Cell(row, 5).Value = SourceLabel(item.Source);
            sheet.Cell(row, 6).Value = item.AffectedArea ?? string.Empty;
            sheet.Cell(row, 7).Value = item.AffectedProducts ?? string.Empty;
            sheet.Cell(row, 8).Value = item.BusinessName ?? string.Empty;
            sheet.Cell(row, 9).Value = StatusLabel(item.Status);
            sheet.Cell(row, 10).Value = item.IsPublic ? "Có" : "Không";
            sheet.Cell(row, 11).Value = item.CreationTime;
            sheet.Cell(row, 11).Style.DateFormat.Format = "dd/MM/yyyy";
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string CategoryLabel(AlertCategory c) => c switch
    {
        AlertCategory.FoodSafety => "An toàn TP",
        AlertCategory.Contamination => "Ô nhiễm",
        AlertCategory.Chemical => "Hóa chất",
        AlertCategory.Biological => "Sinh học",
        AlertCategory.Physical => "Vật lý",
        AlertCategory.Other => "Khác",
        _ => c.ToString()
    };

    private static string SeverityLabel(AlertSeverity s) => s switch
    {
        AlertSeverity.Low => "Thấp",
        AlertSeverity.Medium => "Trung bình",
        AlertSeverity.High => "Cao",
        AlertSeverity.Critical => "Nghiêm trọng",
        _ => s.ToString()
    };

    private static string SourceLabel(AlertSource s) => s switch
    {
        AlertSource.Internal => "Nội bộ",
        AlertSource.PublicReport => "Phản ánh",
        AlertSource.ExternalSystem => "Hệ thống ngoài",
        _ => s.ToString()
    };

    private static string StatusLabel(AlertStatus s) => s switch
    {
        AlertStatus.Draft => "Nháp",
        AlertStatus.Published => "Đã phát hành",
        AlertStatus.Recalled => "Thu hồi",
        _ => s.ToString()
    };

    private static void StyleSheet(IXLWorksheet sheet, int colCount, int lastRow)
    {
        var header = sheet.Range(1, 1, 1, colCount);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(2, lastRow - 1), colCount).SetAutoFilter();
        sheet.Columns().AdjustToContents(10, 45);
    }
}
