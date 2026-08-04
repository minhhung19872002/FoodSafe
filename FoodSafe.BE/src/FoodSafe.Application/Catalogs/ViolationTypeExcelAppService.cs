using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

/// <summary>Excel export of the NĐ 115/2018 violation-type catalog (GAP-CAT-1).</summary>
[RemoteService(false)]
public class ViolationTypeExcelAppService :
    ApplicationService,
    IViolationTypeExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IMasterCatalogAppService _catalogs;

    public ViolationTypeExcelAppService(IMasterCatalogAppService catalogs)
    {
        _catalogs = catalogs;
    }

    [Authorize(FoodSafePermissions.Catalogs.View)]
    public async Task<ExcelDownloadDto> ExportAsync(MasterCatalogListInput input)
    {
        var rows = new List<ViolationTypeDto>();
        long total;
        do
        {
            var page = await _catalogs.GetViolationTypesAsync(
                new MasterCatalogListInput
                {
                    Filter = input.Filter,
                    IsActive = input.IsActive,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:ViolationTypeExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"hanh-vi-vi-pham-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<ViolationTypeDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Hành vi vi phạm");
        var headers = new[]
        {
            "Mã",
            "Tên hành vi",
            "Căn cứ pháp lý",
            "Mức phạt tối thiểu (VND)",
            "Mức phạt tối đa (VND)",
            "Mô tả",
            "Trạng thái"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.Code;
            sheet.Cell(rowNumber, 2).Value = item.Name;
            sheet.Cell(rowNumber, 3).Value = item.LegalReference;
            if (item.MinFine.HasValue)
            {
                sheet.Cell(rowNumber, 4).Value = item.MinFine.Value;
                sheet.Cell(rowNumber, 4).Style.NumberFormat.Format = "#,##0";
            }
            if (item.MaxFine.HasValue)
            {
                sheet.Cell(rowNumber, 5).Value = item.MaxFine.Value;
                sheet.Cell(rowNumber, 5).Style.NumberFormat.Format = "#,##0";
            }
            sheet.Cell(rowNumber, 6).Value = item.Description ?? string.Empty;
            sheet.Cell(rowNumber, 7).Value =
                item.IsActive ? "Hoạt động" : "Ngừng sử dụng";
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
