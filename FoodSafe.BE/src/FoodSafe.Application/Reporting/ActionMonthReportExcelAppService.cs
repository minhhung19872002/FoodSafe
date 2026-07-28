using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Reporting;

[RemoteService(false)]
public class ActionMonthReportExcelAppService :
    ApplicationService,
    IActionMonthReportExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly ActionMonthReportAppService _reports;

    public ActionMonthReportExcelAppService(ActionMonthReportAppService reports)
    {
        _reports = reports;
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.View)]
    public async Task<ExcelDownloadDto> ExportAsync(ActionMonthReportFilterDto input)
    {
        var rows = new List<ActionMonthReportDto>();
        long total;
        do
        {
            var page = await _reports.GetListAsync(
                new ActionMonthReportFilterDto
                {
                    Status = input.Status,
                    PeriodYear = input.PeriodYear,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:ActionMonthReportExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"bao-cao-thang-hanh-dong-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<ActionMonthReportDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("ThÃ¡ng hÃ nh Ä‘á»™ng");
        var headers = new[]
        {
            "NÄƒm", "Chá»§ Ä‘á»", "Thá»i gian",
            "BÃ i bÃ¡o", "PhÃ¡t sÃ³ng", "TuyÃªn truyá»n", "NgÆ°á»i tham gia",
            "Ãp phÃ­ch", "Tá» rÆ¡i",
            "CS kiá»ƒm tra", "Vi pháº¡m", "Pháº¡t", "Tiá»n pháº¡t",
            "TCCB má»›i",
            "Tráº¡ng thÃ¡i"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.PeriodYear;
            sheet.Cell(row, 2).Value = item.ActionMonthTheme ?? string.Empty;
            sheet.Cell(row, 3).Value = item.ActionMonthDates ?? string.Empty;
            sheet.Cell(row, 4).Value = item.MediaArticles;
            sheet.Cell(row, 5).Value = item.BroadcastPrograms;
            sheet.Cell(row, 6).Value = item.PropagandaSessions;
            sheet.Cell(row, 7).Value = item.Participants;
            sheet.Cell(row, 8).Value = item.PostersDistributed;
            sheet.Cell(row, 9).Value = item.LeafletsDistributed;
            sheet.Cell(row, 10).Value = item.BusinessesInspected;
            sheet.Cell(row, 11).Value = item.ViolationsFound;
            sheet.Cell(row, 12).Value = item.FinesIssued;
            sheet.Cell(row, 13).Value = (double)item.FineAmount;
            sheet.Cell(row, 13).Style.NumberFormat.Format = "#,##0";
            sheet.Cell(row, 14).Value = item.NewSelfDeclarations;
            sheet.Cell(row, 15).Value = StatusLabel(item.Status);
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string StatusLabel(ReportStatus s) => s switch
    {
        ReportStatus.Draft => "NhÃ¡p",
        ReportStatus.Submitted => "ÄÃ£ gá»­i",
        ReportStatus.Verified => "ÄÃ£ xÃ¡c minh",
        ReportStatus.Returned => "Tráº£ láº¡i",
        ReportStatus.Completed => "HoÃ n thÃ nh",
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
