using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Organizations;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.IdentityAdministration;

[RemoteService(false)]
public class IdentityAdministrationExcelAppService :
    ApplicationService,
    IIdentityAdministrationExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly IdentityAdministrationAppService _identity;

    public IdentityAdministrationExcelAppService(
        IdentityAdministrationAppService identity)
    {
        _identity = identity;
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Default)]
    public async Task<ExcelDownloadDto> ExportUsersAsync(
        GetAdminUserListInput input)
    {
        var rows = new List<AdminUserDto>();
        long total;
        do
        {
            var page = await _identity.GetUsersAsync(
                new GetAdminUserListInput
                {
                    Filter = input.Filter,
                    RoleId = input.RoleId,
                    OrganizationId = input.OrganizationId,
                    IsActive = input.IsActive,
                    IsLocked = input.IsLocked,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:UserExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"danh-sach-nguoi-dung-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AdminUserDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Người dùng");
        var headers = new[]
        {
            "Tên đăng nhập",
            "Họ và tên",
            "Email",
            "Số điện thoại",
            "Đơn vị",
            "Cấp đơn vị",
            "Chức vụ",
            "Phòng ban",
            "Vai trò",
            "Trạng thái",
            "Bị khóa",
            "Ngày tạo"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.UserName;
            sheet.Cell(rowNumber, 2).Value = item.FullName;
            sheet.Cell(rowNumber, 3).Value = item.Email;
            sheet.Cell(rowNumber, 4).Value = item.PhoneNumber ?? string.Empty;
            sheet.Cell(rowNumber, 5).Value = item.OrganizationName ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value = item.OrganizationLevel switch
            {
                OrganizationLevel.Province => "Tỉnh",
                OrganizationLevel.District => "Huyện/TP",
                OrganizationLevel.Commune => "Xã/Phường",
                _ => string.Empty
            };
            sheet.Cell(rowNumber, 7).Value = item.Position ?? string.Empty;
            sheet.Cell(rowNumber, 8).Value = item.Department ?? string.Empty;
            sheet.Cell(rowNumber, 9).Value = string.Join(", ", item.RoleNames);
            sheet.Cell(rowNumber, 10).Value =
                item.IsActive ? "Hoạt động" : "Vô hiệu hóa";
            sheet.Cell(rowNumber, 11).Value = item.IsLocked ? "Có" : "Không";
            sheet.Cell(rowNumber, 12).Value = item.CreationTime;
            sheet.Cell(rowNumber, 12).Style.DateFormat.Format = "dd/MM/yyyy HH:mm";
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
