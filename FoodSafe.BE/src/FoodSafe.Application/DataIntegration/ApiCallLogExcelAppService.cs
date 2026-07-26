using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

[RemoteService(false)]
public class ApiCallLogExcelAppService :
    ApplicationService,
    IApiCallLogExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly ApiCallLogAppService _logs;

    public ApiCallLogExcelAppService(ApiCallLogAppService logs)
    {
        _logs = logs;
    }

    [Authorize(FoodSafePermissions.DataIntegration.CallHistory.View)]
    public async Task<ExcelDownloadDto> ExportAsync(ApiCallLogFilterDto input)
    {
        var rows = new List<ApiCallLogDto>();
        long total;
        do
        {
            var page = await _logs.GetListAsync(
                new ApiCallLogFilterDto
                {
                    Filter = input.Filter,
                    Direction = input.Direction,
                    ExternalSystem = input.ExternalSystem,
                    IsSuccess = input.IsSuccess,
                    FromDate = input.FromDate,
                    ToDate = input.ToDate,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:ApiCallLogExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"nhat-ky-api-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<ApiCallLogDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Nhật ký API");
        var headers = new[]
        {
            "Chiều", "Hệ thống", "URL", "Method",
            "HTTP Code", "Thời điểm", "Thời gian (ms)",
            "Thành công", "Lỗi"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = DirectionLabel(item.Direction);
            sheet.Cell(row, 2).Value = item.ExternalSystemName;
            sheet.Cell(row, 3).Value = item.EndpointUrl;
            sheet.Cell(row, 4).Value = item.HttpMethod;
            sheet.Cell(row, 5).Value = item.ResponseStatusCode ?? 0;
            sheet.Cell(row, 6).Value = item.CalledAt;
            sheet.Cell(row, 6).Style.DateFormat.Format = "dd/MM/yyyy HH:mm:ss";
            sheet.Cell(row, 7).Value = item.DurationMs;
            sheet.Cell(row, 8).Value = item.IsSuccess ? "Có" : "Không";
            sheet.Cell(row, 9).Value = item.ErrorMessage ?? string.Empty;
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string DirectionLabel(ApiCallDirection d) => d switch
    {
        ApiCallDirection.Inbound => "Nhận",
        ApiCallDirection.Outbound => "Gửi",
        _ => d.ToString()
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
