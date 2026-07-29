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
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IOrganizationAppService _organizations;

    public OrganizationExcelAppService(IOrganizationAppService organizations)
    {
        _organizations = organizations;
    }

    [Authorize(FoodSafePermissions.Organizations.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        GetOrganizationListInput input)
    {
        var rows = new List<OrganizationDto>();
        long total;
        do
        {
            var page = await _organizations.GetListAsync(
                new GetOrganizationListInput
                {
                    Filter = input.Filter,
                    Level = input.Level,
                    ParentId = input.ParentId,
                    IsActive = input.IsActive,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:OrganizationExport:TooLarge")
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
        var sheet = workbook.Worksheets.Add("Đơn vị");
        var headers = new[]
        {
            "Mã đơn vị",
            "Tên đơn vị",
            "Cấp",
            "Địa chỉ",
            "Điện thoại",
            "Email",
            "Lãnh đạo",
            "Trạng thái",
            "Ngày tạo"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.Code;
            sheet.Cell(rowNumber, 2).Value = item.Name;
            sheet.Cell(rowNumber, 3).Value = item.Level switch
            {
                OrganizationLevel.Province => "Tỉnh",
                OrganizationLevel.Commune => "Xã/Phường",
                _ => item.Level.ToString()
            };
            sheet.Cell(rowNumber, 4).Value = item.Address ?? string.Empty;
            sheet.Cell(rowNumber, 5).Value = item.Phone ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value = item.Email ?? string.Empty;
            sheet.Cell(rowNumber, 7).Value = item.LeaderName ?? string.Empty;
            sheet.Cell(rowNumber, 8).Value =
                item.IsActive ? "Hoạt động" : "Ngừng hoạt động";
            sheet.Cell(rowNumber, 9).Value = item.CreationTime;
            sheet.Cell(rowNumber, 9).Style.DateFormat.Format = "dd/MM/yyyy";
            rowNumber++;
        }
        var header = sheet.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor = XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(2, rowNumber - 1), headers.Length)
            .SetAutoFilter();
        sheet.Columns().AdjustToContents(10, 45);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}
