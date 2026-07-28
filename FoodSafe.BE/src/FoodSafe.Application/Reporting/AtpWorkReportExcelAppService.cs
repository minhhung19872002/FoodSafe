using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Reporting;

[RemoteService(false)]
public class AtpWorkReportExcelAppService :
    ApplicationService,
    IAtpWorkReportExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly AtpWorkReportAppService _reports;

    public AtpWorkReportExcelAppService(AtpWorkReportAppService reports)
    {
        _reports = reports;
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.View)]
    public async Task<ExcelDownloadDto> ExportAsync(AtpWorkReportFilterDto input)
    {
        var rows = new List<AtpWorkReportDto>();
        long total;
        do
        {
            var page = await _reports.GetListAsync(
                new AtpWorkReportFilterDto
                {
                    Status = input.Status,
                    PeriodType = input.PeriodType,
                    PeriodYear = input.PeriodYear,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:AtpWorkReportExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"bao-cao-cong-tac-attp-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AtpWorkReportDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("CÃ´ng tÃ¡c ATTP");
        var headers = new[]
        {
            "Ká»³", "NÄƒm", "Ná»­a nÄƒm",
            "Tá»•ng CS", "CS má»›i", "Ngá»«ng HÄ", "CÃ³ GCN",
            "ÄKCB", "TCCB", "QC", "ÄÄK", "CFS", "GCN XK",
            "KH thanh tra", "CS kiá»ƒm tra", "Vi pháº¡m", "Pháº¡t", "Tiá»n pháº¡t",
            "Ca NÄ", "Vá»¥ NÄ", "Máº¯c", "Tá»­ vong",
            "Táº­p huáº¥n", "NgÆ°á»i TH", "Truyá»n thÃ´ng", "VB ban hÃ nh",
            "Tráº¡ng thÃ¡i"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = PeriodLabel(item.PeriodType);
            sheet.Cell(row, 2).Value = item.PeriodYear;
            sheet.Cell(row, 3).Value = item.PeriodHalf.HasValue ? $"H{item.PeriodHalf}" : string.Empty;
            sheet.Cell(row, 4).Value = item.TotalBusinesses;
            sheet.Cell(row, 5).Value = item.NewBusinesses;
            sheet.Cell(row, 6).Value = item.InactiveBusinesses;
            sheet.Cell(row, 7).Value = item.BusinessesWithCertificate;
            sheet.Cell(row, 8).Value = item.DkcbIssued;
            sheet.Cell(row, 9).Value = item.SelfDeclarationsReceived;
            sheet.Cell(row, 10).Value = item.AdRegistrationsIssued;
            sheet.Cell(row, 11).Value = item.EligibilityCertificatesIssued;
            sheet.Cell(row, 12).Value = item.CfsIssued;
            sheet.Cell(row, 13).Value = item.ExportCertificatesIssued;
            sheet.Cell(row, 14).Value = item.TotalInspectionPlans;
            sheet.Cell(row, 15).Value = item.BusinessesInspected;
            sheet.Cell(row, 16).Value = item.ViolationsFound;
            sheet.Cell(row, 17).Value = item.FinesIssued;
            sheet.Cell(row, 18).Value = (double)item.FineTotalAmount;
            sheet.Cell(row, 18).Style.NumberFormat.Format = "#,##0";
            sheet.Cell(row, 19).Value = item.PoisoningCaseCount;
            sheet.Cell(row, 20).Value = item.PoisoningIncidentCount;
            sheet.Cell(row, 21).Value = item.TotalAffected;
            sheet.Cell(row, 22).Value = item.TotalDeaths;
            sheet.Cell(row, 23).Value = item.TrainingSessions;
            sheet.Cell(row, 24).Value = item.TrainingParticipants;
            sheet.Cell(row, 25).Value = item.MediaAppearances;
            sheet.Cell(row, 26).Value = item.DocumentsIssued;
            sheet.Cell(row, 27).Value = StatusLabel(item.Status);
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string PeriodLabel(ReportPeriodType t) => t switch
    {
        ReportPeriodType.HalfYear => "6 thÃ¡ng",
        ReportPeriodType.FullYear => "Cáº£ nÄƒm",
        _ => t.ToString()
    };

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
