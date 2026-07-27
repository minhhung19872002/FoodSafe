using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Reporting;

[RemoteService(false)]
public class NdtpReportExcelAppService :
    ApplicationService,
    INdtpReportExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly NdtpReportAppService _reports;

    public NdtpReportExcelAppService(NdtpReportAppService reports)
    {
        _reports = reports;
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.View)]
    public async Task<ExcelDownloadDto> ExportAsync(NdtpReportFilterDto input)
    {
        var rows = new List<NdtpReportDto>();
        long total;
        do
        {
            var page = await _reports.GetListAsync(
                new NdtpReportFilterDto
                {
                    Filter = input.Filter,
                    Status = input.Status,
                    PeriodYear = input.PeriodYear,
                    PeriodMonth = input.PeriodMonth,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:NdtpReportExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"bao-cao-ndtp-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<NdtpReportDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Báo cáo NĐTP");
        var headers = new[]
        {
            "Năm", "Tháng",
            "Số ca", "Số mắc", "Số nhập viện", "Số tử vong",
            "Số vụ", "Số mắc (vụ)", "Nhập viện (vụ)", "Tử vong (vụ)",
            "Hoạt động phòng chống", "Yếu tố nguy cơ", "Kiến nghị",
            "Trạng thái", "Ghi chú"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.PeriodYear;
            sheet.Cell(row, 2).Value = item.PeriodMonth;
            sheet.Cell(row, 3).Value = item.CaseCount;
            sheet.Cell(row, 4).Value = item.CaseAffected;
            sheet.Cell(row, 5).Value = item.CaseHospitalized;
            sheet.Cell(row, 6).Value = item.CaseDeaths;
            sheet.Cell(row, 7).Value = item.IncidentCount;
            sheet.Cell(row, 8).Value = item.IncidentAffected;
            sheet.Cell(row, 9).Value = item.IncidentHospitalized;
            sheet.Cell(row, 10).Value = item.IncidentDeaths;
            sheet.Cell(row, 11).Value = item.PreventionActivities ?? string.Empty;
            sheet.Cell(row, 12).Value = item.RiskFactors ?? string.Empty;
            sheet.Cell(row, 13).Value = item.Recommendations ?? string.Empty;
            sheet.Cell(row, 14).Value = StatusLabel(item.Status);
            sheet.Cell(row, 15).Value = item.Notes ?? string.Empty;
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string StatusLabel(ReportStatus s) => s switch
    {
        ReportStatus.Draft => "Nháp",
        ReportStatus.Submitted => "Đã gửi",
        ReportStatus.Verified => "Đã xác minh",
        ReportStatus.Returned => "Trả lại",
        ReportStatus.Completed => "Hoàn thành",
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
