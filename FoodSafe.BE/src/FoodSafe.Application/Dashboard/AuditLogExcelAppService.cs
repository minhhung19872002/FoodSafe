using ClosedXML.Excel;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Dashboard;

[RemoteService(false)]
public class AuditLogExcelAppService : ApplicationService, IAuditLogExcelAppService
{
    private const int PageSize = 1000;
    private const int MaxRows = 50_000;
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
            var page = await _auditLogs.GetListAsync(new GetAuditLogListInput
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
            if (total > MaxRows)
                throw new BusinessException("FoodSafe:AuditLogExport:TooLarge")
                    .WithData("MaximumRows", MaxRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"nhat-ky-hoat-dong-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AuditLogDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Nhật ký hoạt động");
        var headers = new[]
        {
            "Thời gian", "Người dùng", "Phương thức", "URL",
            "Mã trạng thái", "Thời gian (ms)", "Địa chỉ IP", "Có lỗi"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.ExecutionTime;
            sheet.Cell(row, 1).Style.DateFormat.Format = "dd/MM/yyyy HH:mm:ss";
            sheet.Cell(row, 2).Value = item.UserName ?? string.Empty;
            sheet.Cell(row, 3).Value = item.HttpMethod ?? string.Empty;
            sheet.Cell(row, 4).Value = item.Url ?? string.Empty;
            sheet.Cell(row, 5).Value = item.HttpStatusCode?.ToString() ?? string.Empty;
            sheet.Cell(row, 6).Value = item.ExecutionDuration;
            sheet.Cell(row, 7).Value = item.ClientIpAddress ?? string.Empty;
            sheet.Cell(row, 8).Value = item.HasException ? "Có" : "Không";
            row++;
        }

        var header = sheet.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#E8F5E9");
        sheet.Columns().AdjustToContents();

        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}
