using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Catalogs;

[RemoteService(false)]
public class TestingServiceExcelAppService :
    ApplicationService,
    ITestingServiceExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IMasterCatalogAppService _catalogs;

    public TestingServiceExcelAppService(IMasterCatalogAppService catalogs)
    {
        _catalogs = catalogs;
    }

    [Authorize(FoodSafePermissions.Catalogs.View)]
    public async Task<ExcelDownloadDto> ExportAsync(MasterCatalogListInput input)
    {
        var rows = new List<TestingServiceDto>();
        long total;
        do
        {
            var page = await _catalogs.GetTestingServicesAsync(
                new MasterCatalogListInput
                {
                    Filter = input.Filter,
                    IsActive = input.IsActive,
                    TestingCenterId = input.TestingCenterId,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:TestingServiceExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        var centerNames = await LoadCenterNamesAsync(
            rows.Select(r => r.TestingCenterId).Distinct().ToList());

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows, centerNames),
            FileName = $"dich-vu-kiem-nghiem-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private async Task<Dictionary<Guid, string>> LoadCenterNamesAsync(
        IReadOnlyList<Guid> centerIds)
    {
        var names = new Dictionary<Guid, string>();
        var loaded = 0;
        long total;
        do
        {
            var page = await _catalogs.GetTestingCentersAsync(
                new MasterCatalogListInput
                {
                    SkipCount = loaded,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            loaded += page.Items.Count;
            foreach (var center in page.Items.Where(c => centerIds.Contains(c.Id)))
                names[center.Id] = center.Name;
        } while (loaded < total);

        return names;
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<TestingServiceDto> rows,
        IReadOnlyDictionary<Guid, string> centerNames)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Dịch vụ kiểm nghiệm");
        var headers = new[]
        {
            "Mã dịch vụ",
            "Tên dịch vụ",
            "Cơ sở kiểm nghiệm",
            "Đơn vị tính",
            "Phương pháp",
            "Đơn giá (VND)",
            "Thời gian trả KQ (ngày)",
            "Trạng thái"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.Code;
            sheet.Cell(rowNumber, 2).Value = item.Name;
            sheet.Cell(rowNumber, 3).Value =
                centerNames.GetValueOrDefault(item.TestingCenterId, string.Empty);
            sheet.Cell(rowNumber, 4).Value = item.Unit;
            sheet.Cell(rowNumber, 5).Value = item.Method;
            sheet.Cell(rowNumber, 6).Value = item.Price;
            sheet.Cell(rowNumber, 6).Style.NumberFormat.Format = "#,##0";
            sheet.Cell(rowNumber, 7).Value = item.TurnaroundDays;
            sheet.Cell(rowNumber, 8).Value =
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
        sheet.Columns().AdjustToContents(10, 45);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}
