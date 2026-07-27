using ClosedXML.Excel;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Dashboard;

[RemoteService(false)]
public class AuditLogExcelAppService :
    ApplicationService,
    IAuditLogExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly AuditLogAppService _auditLogs;

    public AuditLogExcelAppService(AuditLogAppService auditLogs)
    {
        _auditLogs = auditLogs;
    }

    [Authorize(FoodSafePermissions.SystemAdministration.AuditLogs)]
    public async Task<ExcelDownloadDto> ExportAsync(GetAuditLogListInput input)
    {
        var rows = new List<AuditLogDto>();
        long total;
        do
        {
            var page = await _auditLogs.GetListAsync(
                new GetAuditLogListInput
                {
                    Filter = input.Filter,
                    HttpMethod = input.HttpMethod,
                    HttpStatusCode = input.HttpStatusCode,
                    StartTime = input.StartTime,
                    EndTime = input.EndTime,
                    HasException = input.HasException,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:AuditLogExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"nhat-ky-he-thong-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AuditLogDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Nhật ký hệ thống");
        var headers = new[]
        {
            "Thời gian",
            "Người dùng",
            "Phương thức",
            "URL",
            "Mã trạng thái",
            "Thời lượng (ms)",
            "Địa chỉ IP",
            "Trình duyệt",
            "Correlation ID",
            "Có lỗi"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.ExecutionTime;
            sheet.Cell(rowNumber, 1).Style.DateFormat.Format = "dd/MM/yyyy HH:mm:ss";
            sheet.Cell(rowNumber, 2).Value = item.UserName ?? string.Empty;
            sheet.Cell(rowNumber, 3).Value = item.HttpMethod ?? string.Empty;
            sheet.Cell(rowNumber, 4).Value = item.Url ?? string.Empty;
            sheet.Cell(rowNumber, 5).Value = item.HttpStatusCode ?? 0;
            sheet.Cell(rowNumber, 6).Value = item.ExecutionDuration;
            sheet.Cell(rowNumber, 7).Value = item.ClientIpAddress ?? string.Empty;
            sheet.Cell(rowNumber, 8).Value = item.BrowserInfo ?? string.Empty;
            sheet.Cell(rowNumber, 9).Value = item.CorrelationId ?? string.Empty;
            sheet.Cell(rowNumber, 10).Value = item.HasException ? "Có" : "Không";
            rowNumber++;
        }
        var header = sheet.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(2, rowNumber - 1), headers.Length)
            .SetAutoFilter();
        sheet.Columns().AdjustToContents(10, 60);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}
