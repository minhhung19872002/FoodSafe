using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

[RemoteService(false)]
public class EligibilityCertificateExcelAppService :
    ApplicationService,
    IEligibilityCertificateExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IEligibilityCertificateAppService _certificates;

    public EligibilityCertificateExcelAppService(
        IEligibilityCertificateAppService certificates)
    {
        _certificates = certificates;
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        EligibilityCertificateListInput input)
    {
        var rows = new List<EligibilityCertificateDto>();
        long total;
        do
        {
            var page = await _certificates.GetListAsync(
                new EligibilityCertificateListInput
                {
                    Filter = input.Filter,
                    BusinessId = input.BusinessId,
                    Status = input.Status,
                    ExpiringWithinDays = input.ExpiringWithinDays,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:EligibilityCertificateExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);
        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"giay-du-dieu-kien-attp-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<EligibilityCertificateDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Giấy đủ điều kiện");
        var headers = new[]
        {
            "Cơ sở", "Số giấy", "Ngày cấp", "Ngày hết hạn",
            "Cơ quan cấp", "Phạm vi chứng nhận", "Trạng thái",
            "Số ngày còn lại", "Lý do thu hồi", "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.BusinessName;
            sheet.Cell(rowNumber, 2).Value = item.CertificateNumber;
            sheet.Cell(rowNumber, 3).Value = item.IssueDate;
            sheet.Cell(rowNumber, 3).Style.DateFormat.Format = "dd/MM/yyyy";
            if (item.ExpiryDate.HasValue)
            {
                sheet.Cell(rowNumber, 4).Value = item.ExpiryDate.Value;
                sheet.Cell(rowNumber, 4).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 5).Value =
                item.CertifyingAuthority ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value =
                item.CertificationScope ?? string.Empty;
            sheet.Cell(rowNumber, 7).Value = item.Status switch
            {
                LicenseStatus.Active => "Còn hiệu lực",
                LicenseStatus.Expired => "Hết hạn",
                LicenseStatus.Revoked => "Đã thu hồi",
                _ => item.Status.ToString()
            };
            if (item.DaysUntilExpiry.HasValue)
                sheet.Cell(rowNumber, 8).Value =
                    item.DaysUntilExpiry.Value;
            sheet.Cell(rowNumber, 9).Value =
                item.RevokeReason ?? string.Empty;
            sheet.Cell(rowNumber, 10).Value = item.Notes ?? string.Empty;
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
