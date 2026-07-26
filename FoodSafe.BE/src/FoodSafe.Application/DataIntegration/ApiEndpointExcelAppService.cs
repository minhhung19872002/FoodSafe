using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

[RemoteService(false)]
public class ApiEndpointExcelAppService :
    ApplicationService,
    IApiEndpointExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly ApiEndpointAppService _endpoints;

    public ApiEndpointExcelAppService(ApiEndpointAppService endpoints)
    {
        _endpoints = endpoints;
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiEndpoints.View)]
    public async Task<ExcelDownloadDto> ExportAsync(ApiEndpointFilterDto input)
    {
        var rows = new List<ApiEndpointDto>();
        long total;
        do
        {
            var page = await _endpoints.GetListAsync(
                new ApiEndpointFilterDto
                {
                    Filter = input.Filter,
                    ExternalSystem = input.ExternalSystem,
                    Status = input.Status,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:ApiEndpointExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"api-endpoints-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<ApiEndpointDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("API Endpoints");
        var headers = new[]
        {
            "Tên", "URL", "Method", "Hệ thống",
            "Mô tả", "Xác thực", "Trạng thái"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.Name;
            sheet.Cell(row, 2).Value = item.Url;
            sheet.Cell(row, 3).Value = item.HttpMethod;
            sheet.Cell(row, 4).Value = item.ExternalSystem;
            sheet.Cell(row, 5).Value = item.Description ?? string.Empty;
            sheet.Cell(row, 6).Value = AuthLabel(item.AuthType);
            sheet.Cell(row, 7).Value = StatusLabel(item.Status);
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string AuthLabel(ApiAuthType a) => a switch
    {
        ApiAuthType.None => "Không",
        ApiAuthType.ApiKey => "API Key",
        ApiAuthType.BearerToken => "Bearer Token",
        ApiAuthType.BasicAuth => "Basic Auth",
        _ => a.ToString()
    };

    private static string StatusLabel(ApiEndpointStatus s) => s switch
    {
        ApiEndpointStatus.Active => "Hoạt động",
        ApiEndpointStatus.Inactive => "Ngừng",
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
