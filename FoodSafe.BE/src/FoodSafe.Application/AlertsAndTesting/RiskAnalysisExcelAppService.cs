using ClosedXML.Excel;
using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(false)]
public class RiskAnalysisExcelAppService :
    ApplicationService,
    IRiskAnalysisExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly RiskAnalysisAppService _analyses;

    public RiskAnalysisExcelAppService(RiskAnalysisAppService analyses)
    {
        _analyses = analyses;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View)]
    public async Task<ExcelDownloadDto> ExportAsync(RiskAnalysisFilterDto input)
    {
        var rows = new List<RiskAnalysisDto>();
        long total;
        do
        {
            var page = await _analyses.GetListAsync(
                new RiskAnalysisFilterDto
                {
                    Filter = input.Filter,
                    Category = input.Category,
                    RiskLevel = input.RiskLevel,
                    Status = input.Status,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:RiskAnalysisExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"phan-tich-nguy-co-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<RiskAnalysisDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Phân tích nguy cơ");
        var headers = new[]
        {
            "Tiêu đề", "Danh mục", "Mức nguy cơ",
            "Sản phẩm liên quan", "Kiến nghị",
            "Trạng thái", "Công khai", "Ngày tạo"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.Title;
            sheet.Cell(row, 2).Value = CategoryLabel(item.Category);
            sheet.Cell(row, 3).Value = RiskLabel(item.RiskLevel);
            sheet.Cell(row, 4).Value = item.RelatedProducts ?? string.Empty;
            sheet.Cell(row, 5).Value = item.Recommendations ?? string.Empty;
            sheet.Cell(row, 6).Value = StatusLabel(item.Status);
            sheet.Cell(row, 7).Value = item.IsPublic ? "Có" : "Không";
            sheet.Cell(row, 8).Value = item.CreationTime;
            sheet.Cell(row, 8).Style.DateFormat.Format = "dd/MM/yyyy";
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

    private static string RiskLabel(RiskLevel r) => r switch
    {
        RiskLevel.Low => "Thấp",
        RiskLevel.Medium => "Trung bình",
        RiskLevel.High => "Cao",
        RiskLevel.Critical => "Nghiêm trọng",
        _ => r.ToString()
    };

    private static string StatusLabel(RiskAnalysisStatus s) => s switch
    {
        RiskAnalysisStatus.Draft => "Nháp",
        RiskAnalysisStatus.Published => "Đã phát hành",
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
