using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

[RemoteService(false)]
public class ApiSpecificationExcelAppService :
    ApplicationService,
    IApiSpecificationExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly ApiSpecificationAppService _specs;

    public ApiSpecificationExcelAppService(ApiSpecificationAppService specs)
    {
        _specs = specs;
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.View)]
    public async Task<ExcelDownloadDto> ExportAsync(ApiSpecificationFilterDto input)
    {
        var rows = new List<ApiSpecificationDto>();
        long total;
        do
        {
            var page = await _specs.GetListAsync(
                new ApiSpecificationFilterDto
                {
                    Filter = input.Filter,
                    Name = input.Name,
                    IsPublished = input.IsPublished,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:ApiSpecificationExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"api-specifications-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<ApiSpecificationDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("API Specifications");
        var headers = new[]
        {
            "Tên đặc tả", "Phiên bản", "Tiêu đề", "Phiên bản API",
            "OpenAPI", "Định dạng", "Dung lượng", "Trạng thái",
            "Ngày xuất bản", "Ngày tải lên"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.Name;
            sheet.Cell(row, 2).Value = $"v{item.VersionNumber}";
            sheet.Cell(row, 3).Value = item.Title;
            sheet.Cell(row, 4).Value = item.SpecVersion;
            sheet.Cell(row, 5).Value = item.OpenApiVersion;
            sheet.Cell(row, 6).Value = FormatLabel(item.Format);
            sheet.Cell(row, 7).Value = FormatBytes(item.SizeBytes);
            sheet.Cell(row, 8).Value = item.IsPublished ? "Đã xuất bản" : "Nháp";
            sheet.Cell(row, 9).Value = item.PublishedAt?.ToString("dd/MM/yyyy HH:mm") ?? string.Empty;
            sheet.Cell(row, 10).Value = item.CreationTime.ToString("dd/MM/yyyy HH:mm");
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string FormatLabel(ApiSpecFormat f) => f switch
    {
        ApiSpecFormat.Json => "JSON",
        ApiSpecFormat.Yaml => "YAML",
        _ => f.ToString()
    };

    private static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
        return $"{bytes / (1024.0 * 1024.0):F2} MB";
    }

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
