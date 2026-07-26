using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(false)]
public class AtpNewsExcelAppService :
    ApplicationService,
    IAtpNewsExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly AtpNewsAppService _news;

    public AtpNewsExcelAppService(AtpNewsAppService news)
    {
        _news = news;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.View)]
    public async Task<ExcelDownloadDto> ExportAsync(AtpNewsFilterDto input)
    {
        var rows = new List<AtpNewsDto>();
        long total;
        do
        {
            var page = await _news.GetListAsync(
                new AtpNewsFilterDto
                {
                    Filter = input.Filter,
                    Category = input.Category,
                    Status = input.Status,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:AtpNewsExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"tin-tuc-attp-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AtpNewsDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Tin tức ATTP");
        var headers = new[]
        {
            "Tiêu đề", "Danh mục", "Lượt xem",
            "Trạng thái", "Công khai", "Nổi bật",
            "Ngày phát hành", "Ngày tạo"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.Title;
            sheet.Cell(row, 2).Value = item.Category ?? string.Empty;
            sheet.Cell(row, 3).Value = item.ViewCount;
            sheet.Cell(row, 4).Value = StatusLabel(item.Status);
            sheet.Cell(row, 5).Value = item.IsPublic ? "Có" : "Không";
            sheet.Cell(row, 6).Value = item.IsFeatured ? "Có" : "Không";
            if (item.PublishedAt.HasValue)
            {
                sheet.Cell(row, 7).Value = item.PublishedAt.Value;
                sheet.Cell(row, 7).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            sheet.Cell(row, 8).Value = item.CreationTime;
            sheet.Cell(row, 8).Style.DateFormat.Format = "dd/MM/yyyy";
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string StatusLabel(NewsStatus s) => s switch
    {
        NewsStatus.Draft => "Nháp",
        NewsStatus.Published => "Đã phát hành",
        NewsStatus.Recalled => "Thu hồi",
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
