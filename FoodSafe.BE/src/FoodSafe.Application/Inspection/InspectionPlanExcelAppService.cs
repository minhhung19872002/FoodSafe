using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Inspection;

[RemoteService(false)]
public class InspectionPlanExcelAppService :
    ApplicationService,
    IInspectionPlanExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly InspectionPlanAppService _plans;

    public InspectionPlanExcelAppService(
        InspectionPlanAppService plans)
    {
        _plans = plans;
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        InspectionPlanFilterDto input)
    {
        var rows = new List<InspectionPlanDto>();
        long total;
        do
        {
            var page = await _plans.GetListAsync(
                new InspectionPlanFilterDto
                {
                    Filter = input.Filter,
                    PlanType = input.PlanType,
                    Status = input.Status,
                    Year = input.Year,
                    Sorting = input.Sorting,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:InspectionPlanExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"ke-hoach-thanh-tra-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<InspectionPlanDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Kế hoạch thanh tra");
        var headers = new[]
        {
            "Mã kế hoạch",
            "Tên kế hoạch",
            "Loại",
            "Năm",
            "Ngày bắt đầu",
            "Ngày kết thúc",
            "Trạng thái",
            "Tổng CS",
            "Đã hoàn thành"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.PlanCode;
            sheet.Cell(rowNumber, 2).Value = item.Title;
            sheet.Cell(rowNumber, 3).Value = item.PlanType switch
            {
                InspectionPlanType.Annual => "Hàng năm",
                InspectionPlanType.Periodic => "Định kỳ",
                InspectionPlanType.Irregular => "Đột xuất",
                InspectionPlanType.FollowUp => "Tái kiểm tra",
                _ => item.PlanType.ToString()
            };
            sheet.Cell(rowNumber, 4).Value = item.Year;
            if (item.StartDate.HasValue)
            {
                sheet.Cell(rowNumber, 5).Value = item.StartDate.Value;
                sheet.Cell(rowNumber, 5).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            if (item.EndDate.HasValue)
            {
                sheet.Cell(rowNumber, 6).Value = item.EndDate.Value;
                sheet.Cell(rowNumber, 6).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 7).Value = item.Status switch
            {
                InspectionPlanStatus.Draft => "Nháp",
                InspectionPlanStatus.Submitted => "Đã gửi",
                InspectionPlanStatus.Approved => "Đã duyệt",
                InspectionPlanStatus.InProgress => "Đang thực hiện",
                InspectionPlanStatus.Completed => "Hoàn thành",
                InspectionPlanStatus.Cancelled => "Đã hủy",
                _ => item.Status.ToString()
            };
            sheet.Cell(rowNumber, 8).Value = item.TotalItems;
            sheet.Cell(rowNumber, 9).Value = item.CompletedItems;
            rowNumber++;
        }
        var header = sheet.Range(1, 1, 1, headers.Length);
        header.Style.Font.Bold = true;
        header.Style.Font.FontColor = XLColor.White;
        header.Style.Fill.BackgroundColor =
            XLColor.FromHtml("#1677FF");
        sheet.SheetView.FreezeRows(1);
        sheet.Range(1, 1, Math.Max(2, rowNumber - 1), headers.Length)
            .SetAutoFilter();
        sheet.Columns().AdjustToContents(10, 45);
        using var output = new MemoryStream();
        workbook.SaveAs(output);
        return output.ToArray();
    }
}
