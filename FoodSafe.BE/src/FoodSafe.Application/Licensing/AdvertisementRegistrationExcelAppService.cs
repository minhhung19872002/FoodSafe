using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

[RemoteService(false)]
public class AdvertisementRegistrationExcelAppService :
    ApplicationService,
    IAdvertisementRegistrationExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IAdvertisementRegistrationAppService _registrations;

    public AdvertisementRegistrationExcelAppService(
        IAdvertisementRegistrationAppService registrations)
    {
        _registrations = registrations;
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        AdvertisementRegistrationListInput input)
    {
        var rows = new List<AdvertisementRegistrationDto>();
        long total;
        do
        {
            var page = await _registrations.GetListAsync(
                new AdvertisementRegistrationListInput
                {
                    Filter = input.Filter,
                    BusinessId = input.BusinessId,
                    ProductId = input.ProductId,
                    AdvertisementTypeId = input.AdvertisementTypeId,
                    Status = input.Status,
                    ExpiringWithinDays = input.ExpiringWithinDays,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:AdvertisementRegistrationExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);
        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"dang-ky-noi-dung-quang-cao-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<AdvertisementRegistrationDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Đăng ký quảng cáo");
        var headers = new[]
        {
            "Cơ sở", "Số đăng ký", "Loại quảng cáo", "Sản phẩm",
            "Phương tiện", "Nội dung", "Ngày đăng ký", "Ngày hết hạn",
            "Trạng thái", "Số ngày còn lại", "Lý do thu hồi", "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.BusinessName;
            sheet.Cell(rowNumber, 2).Value = item.RegistrationNumber;
            sheet.Cell(rowNumber, 3).Value =
                item.AdvertisementTypeName ?? string.Empty;
            sheet.Cell(rowNumber, 4).Value =
                string.Join(", ", item.Products.Select(x => x.Name));
            sheet.Cell(rowNumber, 5).Value = item.Medium ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value =
                item.ContentDescription ?? string.Empty;
            sheet.Cell(rowNumber, 7).Value = item.RegistrationDate;
            sheet.Cell(rowNumber, 7).Style.DateFormat.Format = "dd/MM/yyyy";
            if (item.ExpiryDate.HasValue)
            {
                sheet.Cell(rowNumber, 8).Value = item.ExpiryDate.Value;
                sheet.Cell(rowNumber, 8).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 9).Value = item.Status switch
            {
                LicenseStatus.Active => "Còn hiệu lực",
                LicenseStatus.Expired => "Hết hạn",
                LicenseStatus.Revoked => "Đã thu hồi",
                _ => item.Status.ToString()
            };
            if (item.DaysUntilExpiry.HasValue)
                sheet.Cell(rowNumber, 10).Value =
                    item.DaysUntilExpiry.Value;
            sheet.Cell(rowNumber, 11).Value =
                item.RevokeReason ?? string.Empty;
            sheet.Cell(rowNumber, 12).Value = item.Notes ?? string.Empty;
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
