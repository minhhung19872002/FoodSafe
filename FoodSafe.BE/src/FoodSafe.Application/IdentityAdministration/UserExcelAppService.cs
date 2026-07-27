using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.IdentityAdministration;

[RemoteService(false)]
public class UserExcelAppService :
    ApplicationService,
    IUserExcelAppService
{
    private const int PageSize = 500;
    private const int MaximumRows = 10_000;
    private readonly IdentityAdministrationAppService _users;

    public UserExcelAppService(IdentityAdministrationAppService users)
    {
        _users = users;
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Default)]
    public async Task<ExcelDownloadDto> ExportAsync(GetAdminUserListInput input)
    {
        var rows = new List<AdminUserDto>();
        long total;
        do
        {
            var page = await _users.GetUsersAsync(new GetAdminUserListInput
            {
                Filter = input.Filter,
                RoleId = input.RoleId,
                OrganizationId = input.OrganizationId,
                IsActive = input.IsActive,
                IsLocked = input.IsLocked,
                SkipCount = rows.Count,
                MaxResultCount = PageSize,
                Sorting = input.Sorting
            });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException("FoodSafe:UserExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName = $"danh-sach-tai-khoan-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(IReadOnlyList<AdminUserDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Tài khoản người dùng");
        var headers = new[]
        {
            "STT", "Họ và tên", "Tài khoản", "Email",
            "Số điện thoại", "Đơn vị", "Vai trò",
            "Trạng thái", "Khóa tài khoản", "Ngày tạo"
        };
        for (var i = 0; i < headers.Length; i++)
            sheet.Cell(1, i + 1).Value = headers[i];

        var rowNum = 2;
        for (var idx = 0; idx < rows.Count; idx++)
        {
            var item = rows[idx];
            sheet.Cell(rowNum, 1).Value = idx + 1;
            sheet.Cell(rowNum, 2).Value = item.FullName;
            sheet.Cell(rowNum, 3).Value = item.UserName;
            sheet.Cell(rowNum, 4).Value = item.Email;
            sheet.Cell(rowNum, 5).Value = item.PhoneNumber ?? string.Empty;
            sheet.Cell(rowNum, 6).Value = item.OrganizationName ?? "Toàn hệ thống";
            sheet.Cell(rowNum, 7).Value = string.Join(", ", item.RoleNames);
            sheet.Cell(rowNum, 8).Value = item.IsActive ? "Hoạt động" : "Vô hiệu hóa";
            sheet.Cell(rowNum, 9).Value = item.IsLocked ? "Có" : "Không";
            sheet.Cell(rowNum, 10).Value = item.CreationTime;
            sheet.Cell(rowNum, 10).Style.DateFormat.Format = "dd/MM/yyyy";
            rowNum++;
        }

        StyleSheet(sheet, headers.Length, rowNum);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }

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
