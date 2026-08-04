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
    private readonly ReportStatisticsAppService _statistics;
    private readonly DashboardAppService _dashboard;

    public StatisticsExcelAppService(
        ReportStatisticsAppService statistics,
        DashboardAppService dashboard)
    {
        _statistics = statistics;
        _dashboard = dashboard;
    }

    public async Task<ExcelDownloadDto> ExportLicensesByBusinessTypeAsync(
        ReportStatisticsFilterDto input)
    {
        var data = await _statistics.GetAsync(input);
        return Build(
            "Giấy phép theo loại hình",
            $"giay-phep-theo-loai-hinh-{Clock.Now:yyyyMMdd-HHmmss}.xlsx",
            [
                "Loại hình cơ sở", "Tự công bố", "Đăng ký công bố",
                "Giấy ĐĐK ATTP", "Chứng nhận CFS", "GCN Xuất khẩu",
                "Quảng cáo", "Tổng"
            ],
            data.LicensesByBusinessType,
            (sheet, row, item) =>
            {
                sheet.Cell(row, 1).Value = item.BusinessTypeName;
                sheet.Cell(row, 2).Value = item.SelfDeclarations;
                sheet.Cell(row, 3).Value = item.ProductRegistrations;
                sheet.Cell(row, 4).Value = item.EligibilityCertificates;
                sheet.Cell(row, 5).Value = item.CfsCertificates;
                sheet.Cell(row, 6).Value = item.ExportCertificates;
                sheet.Cell(row, 7).Value = item.AdRegistrations;
                sheet.Cell(row, 8).Value = item.Total;
            });
    }

    public async Task<ExcelDownloadDto> ExportPoisoningByAreaAsync(
        ReportStatisticsFilterDto input)
    {
        var data = await _statistics.GetAsync(input);
        return Build(
            "Ngộ độc theo địa bàn",
            $"ngo-doc-theo-dia-ban-{Clock.Now:yyyyMMdd-HHmmss}.xlsx",
            ["Địa bàn", "Số ca", "Nhập viện", "Tử vong"],
            data.PoisoningByArea,
            (sheet, row, item) =>
            {
                sheet.Cell(row, 1).Value = item.AreaName;
                sheet.Cell(row, 2).Value = item.CaseCount;
                sheet.Cell(row, 3).Value = item.HospitalizedCount;
                sheet.Cell(row, 4).Value = item.DeceasedCount;
            });
    }

    public async Task<ExcelDownloadDto> ExportInspectionSummaryAsync(
        ReportStatisticsFilterDto input)
    {
        var data = await _statistics.GetAsync(input);
        return Build(
            "Kết quả thanh kiểm tra",
            $"ket-qua-thanh-kiem-tra-{Clock.Now:yyyyMMdd-HHmmss}.xlsx",
            [
                "Đơn vị", "Số kế hoạch", "Số lượt kiểm tra",
                "Số vụ vi phạm", "Số vụ xử lý"
            ],
            data.InspectionByOrganization,
            (sheet, row, item) =>
            {
                sheet.Cell(row, 1).Value = item.OrganizationName;
                sheet.Cell(row, 2).Value = item.PlanCount;
                sheet.Cell(row, 3).Value = item.InspectionCount;
                sheet.Cell(row, 4).Value = item.ViolationCount;
                sheet.Cell(row, 5).Value = item.SanctionCount;
            });
    }

    public async Task<ExcelDownloadDto> ExportBusinessBreakdownAsync(
        ReportStatisticsFilterDto input)
    {
        var data = await _statistics.GetAsync(input);
        using var workbook = new XLWorkbook();
        AddBreakdownSheet(workbook, "Theo loại hình", data.BusinessesByType);
        AddBreakdownSheet(workbook, "Theo vùng", data.BusinessesByRegion);
        AddBreakdownSheet(workbook, "Theo tỉnh-TP", data.BusinessesByProvince);
        AddBreakdownSheet(workbook, "Theo đầu mối quản lý",
            data.BusinessesByOrganization);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return new ExcelDownloadDto
        {
            Content = output.ToArray(),
            FileName = $"co-so-sxkd-thong-ke-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    public async Task<ExcelDownloadDto> ExportReportComplianceAsync(
        DashboardFilterDto input)
    {
        var rows = await _dashboard.GetReportComplianceAsync(input);
        return Build(
            "Trạng thái báo cáo theo đơn vị",
            $"trang-thai-bao-cao-theo-don-vi-{Clock.Now:yyyyMMdd-HHmmss}.xlsx",
            [
                "Đơn vị", "NĐTP đã nộp (tháng)", "NĐTP phải nộp (tháng)",
                "Công tác ATTP đã nộp", "Công tác ATTP phải nộp",
                "Tháng hành động đã nộp", "Tháng hành động phải nộp"
            ],
            rows.Items,
            (sheet, row, item) =>
            {
                sheet.Cell(row, 1).Value = item.OrganizationName;
                sheet.Cell(row, 2).Value = item.NdtpSubmittedMonths;
                sheet.Cell(row, 3).Value = item.NdtpExpectedMonths;
                sheet.Cell(row, 4).Value = item.AtpWorkSubmitted;
                sheet.Cell(row, 5).Value = item.AtpWorkExpected;
                sheet.Cell(row, 6).Value = item.ActionMonthSubmitted;
                sheet.Cell(row, 7).Value = item.ActionMonthExpected;
            });
    }

    private static void AddBreakdownSheet(
        XLWorkbook workbook, string title,
        IReadOnlyList<BusinessBreakdownRow> rows)
    {
        var sheet = workbook.Worksheets.Add(title);
        sheet.Cell(1, 1).Value = "Nhóm";
        sheet.Cell(1, 2).Value = "Số cơ sở";
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.GroupName;
            sheet.Cell(rowNumber, 2).Value = item.Count;
            rowNumber++;
        }
        StyleSheet(sheet, 2, rowNumber);
    }

    private static ExcelDownloadDto Build<TRow>(
        string sheetName, string fileName, string[] headers,
        IReadOnlyList<TRow> rows,
        Action<IXLWorksheet, int, TRow> writeRow)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName);
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            writeRow(sheet, rowNumber, item);
            rowNumber++;
        }
        StyleSheet(sheet, headers.Length, rowNumber);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return new ExcelDownloadDto
        {
            Content = output.ToArray(),
            FileName = fileName
        };
    }

    private static void StyleSheet(
        IXLWorksheet sheet, int columnCount, int nextRow)
    {
        var header = sheet.Range(1, 1, 1, columnCount);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(2, nextRow - 1), columnCount)
            .SetAutoFilter();
        sheet.Columns().AdjustToContents(10, 45);
    }
}
