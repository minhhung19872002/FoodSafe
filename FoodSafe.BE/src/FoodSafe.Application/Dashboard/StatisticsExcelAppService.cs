using ClosedXML.Excel;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Dashboard;

[RemoteService(false)]
[Authorize]
public class StatisticsExcelAppService :
    ApplicationService,
    IStatisticsExcelAppService
{
    private readonly StatisticsAppService _statistics;

    public StatisticsExcelAppService(StatisticsAppService statistics)
    {
        _statistics = statistics;
    }

    public async Task<ExcelDownloadDto> ExportAsync(StatisticsFilterDto input)
    {
        var data = await _statistics.GetAsync(input);
        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(data, input.Year),
            FileName = $"thong-ke-tong-hop-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(StatisticsDto data, int? year)
    {
        using var workbook = new XLWorkbook();
        AddBusinessSheet(workbook, data);
        AddLicenseSheet(workbook, data);
        AddInspectionSheet(workbook, data, year);
        AddPoisoningSheet(workbook, data, year);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static void AddBusinessSheet(XLWorkbook wb, StatisticsDto data)
    {
        var ws = wb.Worksheets.Add("Cơ sở SXKD");

        ws.Cell(1, 1).Value = "Cơ sở theo trạng thái";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 12;

        ws.Cell(2, 1).Value = "Trạng thái";
        ws.Cell(2, 2).Value = "Số cơ sở";
        StyleHeader(ws.Range(2, 1, 2, 2));

        var r = 3;
        foreach (var item in data.BusinessByStatus)
        {
            ws.Cell(r, 1).Value = item.Name;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        r++;

        ws.Cell(r, 1).Value = "Cơ sở theo loại hình (Top 10)";
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.FontSize = 12;
        r++;

        ws.Cell(r, 1).Value = "Loại hình";
        ws.Cell(r, 2).Value = "Số cơ sở";
        StyleHeader(ws.Range(r, 1, r, 2));
        r++;

        foreach (var item in data.BusinessByType)
        {
            ws.Cell(r, 1).Value = item.Name;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        ws.Columns().AdjustToContents(15, 50);
    }

    private static void AddLicenseSheet(XLWorkbook wb, StatisticsDto data)
    {
        var ws = wb.Worksheets.Add("Hồ sơ giấy phép");

        ws.Cell(1, 1).Value = "Phân bố theo loại hồ sơ";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 12;

        ws.Cell(2, 1).Value = "Loại hồ sơ";
        ws.Cell(2, 2).Value = "Số lượng";
        StyleHeader(ws.Range(2, 1, 2, 2));

        var r = 3;
        foreach (var item in data.LicenseByCategory)
        {
            ws.Cell(r, 1).Value = item.Name;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        r++;

        ws.Cell(r, 1).Value = "Phân bố theo trạng thái";
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.FontSize = 12;
        r++;

        ws.Cell(r, 1).Value = "Trạng thái";
        ws.Cell(r, 2).Value = "Số lượng";
        StyleHeader(ws.Range(r, 1, r, 2));
        r++;

        foreach (var item in data.LicenseByStatus)
        {
            ws.Cell(r, 1).Value = item.Name;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        ws.Columns().AdjustToContents(15, 50);
    }

    private static void AddInspectionSheet(XLWorkbook wb, StatisticsDto data, int? year)
    {
        var ws = wb.Worksheets.Add("Thanh kiểm tra");

        var yearSuffix = year.HasValue ? $" — Năm {year}" : string.Empty;
        ws.Cell(1, 1).Value = $"Thanh kiểm tra theo tháng{yearSuffix}";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 12;

        ws.Cell(2, 1).Value = "Tháng";
        ws.Cell(2, 2).Value = "Tổng kiểm tra";
        ws.Cell(2, 3).Value = "Vi phạm";
        StyleHeader(ws.Range(2, 1, 2, 3));

        var violations = data.ViolationsByMonth.ToDictionary(x => x.Month, x => x.Count);
        var r = 3;
        foreach (var item in data.InspectionsByMonth)
        {
            ws.Cell(r, 1).Value = item.Label;
            ws.Cell(r, 2).Value = item.Count;
            ws.Cell(r, 3).Value = violations.GetValueOrDefault(item.Month, 0);
            r++;
        }

        r++;

        ws.Cell(r, 1).Value = "Kết quả kiểm tra";
        ws.Cell(r, 1).Style.Font.Bold = true;
        ws.Cell(r, 1).Style.Font.FontSize = 12;
        r++;

        ws.Cell(r, 1).Value = "Kết quả";
        ws.Cell(r, 2).Value = "Số lượng";
        StyleHeader(ws.Range(r, 1, r, 2));
        r++;

        foreach (var item in data.InspectionOutcome)
        {
            ws.Cell(r, 1).Value = item.Name;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        ws.Columns().AdjustToContents(12, 40);
    }

    private static void AddPoisoningSheet(XLWorkbook wb, StatisticsDto data, int? year)
    {
        var ws = wb.Worksheets.Add("Ngộ độc thực phẩm");

        var yearSuffix = year.HasValue ? $" — Năm {year}" : string.Empty;
        ws.Cell(1, 1).Value = $"Ca ngộ độc thực phẩm theo tháng{yearSuffix}";
        ws.Cell(1, 1).Style.Font.Bold = true;
        ws.Cell(1, 1).Style.Font.FontSize = 12;

        ws.Cell(2, 1).Value = "Tháng";
        ws.Cell(2, 2).Value = "Số ca";
        StyleHeader(ws.Range(2, 1, 2, 2));

        var r = 3;
        foreach (var item in data.PoisoningCasesByMonth)
        {
            ws.Cell(r, 1).Value = item.Label;
            ws.Cell(r, 2).Value = item.Count;
            r++;
        }

        ws.Columns().AdjustToContents(12, 40);
    }

    private static void StyleHeader(IXLRange range)
    {
        range.Style.Font.Bold = true;
        range.Style.Font.FontColor = XLColor.White;
        range.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
    }
}
