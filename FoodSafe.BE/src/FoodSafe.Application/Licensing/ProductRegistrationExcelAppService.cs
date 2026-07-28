using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

[RemoteService(false)]
public class ProductRegistrationExcelAppService :
    ApplicationService,
    IProductRegistrationExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IProductRegistrationAppService _registrations;

    public ProductRegistrationExcelAppService(
        IProductRegistrationAppService registrations)
    {
        _registrations = registrations;
    }

    [Authorize(FoodSafePermissions.Licensing.ProductRegistrations.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        ProductRegistrationListInput input)
    {
        var rows = new List<ProductRegistrationDto>();
        long total;
        do
        {
            var page = await _registrations.GetListAsync(
                new ProductRegistrationListInput
                {
                    Filter = input.Filter,
                    BusinessId = input.BusinessId,
                    ProductId = input.ProductId,
                    Status = input.Status,
                    ExpiringWithinDays = input.ExpiringWithinDays,
                    Sorting = input.Sorting,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:ProductRegistrationExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"dang-ky-cong-bo-san-pham-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<ProductRegistrationDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Đăng ký công bố");
        var headers = new[]
        {
            "Cơ sở", "Số đăng ký", "Số tiếp nhận", "Ngày đăng ký",
            "Ngày tiếp nhận", "Sản phẩm", "Nhà sản xuất",
            "Cơ quan cấp", "Ngày hết hạn", "Trạng thái",
            "Số ngày còn lại", "Lý do thu hồi", "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.BusinessName;
            sheet.Cell(rowNumber, 2).Value = item.RegistrationNumber;
            sheet.Cell(rowNumber, 3).Value =
                item.ReceiptNumber ?? string.Empty;
            sheet.Cell(rowNumber, 4).Value = item.RegistrationDate;
            sheet.Cell(rowNumber, 4).Style.DateFormat.Format = "dd/MM/yyyy";
            if (item.ReceiptDate.HasValue)
            {
                sheet.Cell(rowNumber, 5).Value = item.ReceiptDate.Value;
                sheet.Cell(rowNumber, 5).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 6).Value = item.ProductName;
            sheet.Cell(rowNumber, 7).Value =
                item.Manufacturer ?? string.Empty;
            sheet.Cell(rowNumber, 8).Value =
                item.CertifyingAuthority ?? string.Empty;
            if (item.ExpiryDate.HasValue)
            {
                sheet.Cell(rowNumber, 9).Value = item.ExpiryDate.Value;
                sheet.Cell(rowNumber, 9).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 10).Value = item.Status switch
            {
                LicenseStatus.Active => "Còn hiệu lực",
                LicenseStatus.Expired => "Hết hạn",
                LicenseStatus.Revoked => "Đã thu hồi",
                _ => item.Status.ToString()
            };
            if (item.DaysUntilExpiry.HasValue)
                sheet.Cell(rowNumber, 11).Value =
                    item.DaysUntilExpiry.Value;
            sheet.Cell(rowNumber, 12).Value =
                item.RevokeReason ?? string.Empty;
            sheet.Cell(rowNumber, 13).Value =
                item.Notes ?? string.Empty;
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
