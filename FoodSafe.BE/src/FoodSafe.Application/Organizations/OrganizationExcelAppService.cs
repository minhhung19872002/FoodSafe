using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Organizations;

[RemoteService(false)]
public class OrganizationExcelAppService :
    ApplicationService,
    IOrganizationExcelAppService
{
    private const int PageSize = 500;
    private const int MaximumRows = 5_000;
    private readonly OrganizationAppService _organizations;

    public OrganizationExcelAppService(OrganizationAppService organizations)
    {
        _organizations = organizations;
    }

    [Authorize(FoodSafePermissions.Organizations.View)]
    public async Task<ExcelDownloadDto> ExportAsync(GetOrganizationListInput input)
    {
        var rows = new List<OrganizationDto>();
        long total;
        do
        {
            var page = await _organizations.GetListAsync(new GetOrganizationListInput
            {
                Filter = input.Filter,
                Level = input.Level,
                ParentId = input.ParentId,
                IsActive = input.IsActive,
                SkipCount = rows.Count,
                MaxResultCount = PageSize,
                Sorting = input.Sorting
            });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:OrganizationExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"danh-sach-don-vi-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<OrganizationDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Đơn vị hành chính");
        var headers = new[]
        {
            "STT", "Mã đơn vị", "Tên đơn vị", "Cấp độ",
            "Địa chỉ", "Điện thoại", "Email",
            "Trưởng đơn vị", "Trạng thái"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var rowNum = 2;
        for (var idx = 0; idx < rows.Count; idx++)
        {
            var item = rows[idx];
            sheet.Cell(rowNum, 1).Value = idx + 1;
            sheet.Cell(rowNum, 2).Value = item.Code;
            sheet.Cell(rowNum, 3).Value = item.Name;
            sheet.Cell(rowNum, 4).Value = LevelLabel(item.Level);
            sheet.Cell(rowNum, 5).Value = item.Address ?? string.Empty;
            sheet.Cell(rowNum, 6).Value = item.Phone ?? string.Empty;
            sheet.Cell(rowNum, 7).Value = item.Email ?? string.Empty;
            sheet.Cell(rowNum, 8).Value = item.LeaderName ?? string.Empty;
            sheet.Cell(rowNum, 9).Value = item.IsActive ? "Đang hoạt động" : "Đã vô hiệu hóa";
            rowNum++;
        }

        StyleSheet(sheet, headers.Length, rowNum);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

    private static string LevelLabel(OrganizationLevel level) => level switch
    {
        OrganizationLevel.Province => "Tỉnh/Thành phố",
        OrganizationLevel.District => "Huyện/Quận",
        OrganizationLevel.Commune => "Xã/Phường",
        _ => level.ToString()
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
