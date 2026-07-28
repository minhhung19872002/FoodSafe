using ClosedXML.Excel;
using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(false)]
public class AdministrativeDocumentExcelAppService :
    ApplicationService,
    IAdministrativeDocumentExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly AdministrativeDocumentAppService _docs;

    public AdministrativeDocumentExcelAppService(
        AdministrativeDocumentAppService docs)
    {
        _docs = docs;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        AdministrativeDocumentFilterDto input)
    {
        var rows = new List<AdministrativeDocumentDto>();
        long total;
        do
        {
            var page = await _docs.GetListAsync(
                new AdministrativeDocumentFilterDto
                {
                    Filter = input.Filter,
                    DocumentTypeId = input.DocumentTypeId,
                    Status = input.Status,
                    Sorting = input.Sorting,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:AdministrativeDocumentExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"van-ban-hanh-chinh-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<AdministrativeDocumentDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Văn bản hành chính");
        var headers = new[]
        {
            "Số hiệu", "Tiêu đề", "Loại VB",
            "Cơ quan ban hành", "Ngày ban hành",
            "Ngày hiệu lực", "Ngày hết hạn",
            "Trạng thái", "Công khai"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var row = 2;
        foreach (var item in rows)
        {
            sheet.Cell(row, 1).Value = item.DocumentNumber;
            sheet.Cell(row, 2).Value = item.Title;
            sheet.Cell(row, 3).Value = item.DocumentTypeName ?? string.Empty;
            sheet.Cell(row, 4).Value = item.IssuingAuthority ?? string.Empty;
            sheet.Cell(row, 5).Value = item.IssuedDate;
            sheet.Cell(row, 5).Style.DateFormat.Format = "dd/MM/yyyy";
            if (item.EffectiveDate.HasValue)
            {
                sheet.Cell(row, 6).Value = item.EffectiveDate.Value;
                sheet.Cell(row, 6).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            if (item.ExpiryDate.HasValue)
            {
                sheet.Cell(row, 7).Value = item.ExpiryDate.Value;
                sheet.Cell(row, 7).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            sheet.Cell(row, 8).Value = StatusLabel(item.Status);
            sheet.Cell(row, 9).Value = item.IsPublic ? "Có" : "Không";
            row++;
        }

        StyleSheet(sheet, headers.Length, row);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string StatusLabel(DocumentStatus s) => s switch
    {
        DocumentStatus.Active => "Hiệu lực",
        DocumentStatus.Expired => "Hết hạn",
        DocumentStatus.Revoked => "Thu hồi",
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
