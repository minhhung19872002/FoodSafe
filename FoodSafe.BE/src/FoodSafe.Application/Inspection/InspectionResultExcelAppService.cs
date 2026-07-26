using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.Inspection;

[RemoteService(false)]
public class InspectionResultExcelAppService :
    ApplicationService,
    IInspectionResultExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly InspectionResultAppService _results;

    public InspectionResultExcelAppService(
        InspectionResultAppService results)
    {
        _results = results;
    }

    [Authorize(FoodSafePermissions.Inspection.Results.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        InspectionResultFilterDto input)
    {
        var rows = new List<InspectionResultDto>();
        long total;
        do
        {
            var page = await _results.GetListAsync(
                new InspectionResultFilterDto
                {
                    Filter = input.Filter,
                    BusinessId = input.BusinessId,
                    PlanId = input.PlanId,
                    InspectionType = input.InspectionType,
                    OverallResult = input.OverallResult,
                    HasViolation = input.HasViolation,
                    FromDate = input.FromDate,
                    ToDate = input.ToDate,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:InspectionResultExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"ket-qua-thanh-tra-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<InspectionResultDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Kết quả thanh tra");
        var headers = new[]
        {
            "Cơ sở SXKD",
            "Ngày kiểm tra",
            "Loại kiểm tra",
            "Kết quả chung",
            "Trưởng đoàn",
            "Vi phạm",
            "Số vi phạm",
            "Tiền phạt (VND)",
            "Cần tái kiểm",
            "Ngày tái kiểm",
            "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value =
                item.BusinessName ?? string.Empty;
            sheet.Cell(rowNumber, 2).Value = item.InspectionDate;
            sheet.Cell(rowNumber, 2).Style.DateFormat.Format =
                "dd/MM/yyyy";
            sheet.Cell(rowNumber, 3).Value = item.InspectionType switch
            {
                InspectionType.Scheduled => "Theo kế hoạch",
                InspectionType.Unscheduled => "Đột xuất",
                InspectionType.FollowUp => "Tái kiểm tra",
                InspectionType.Emergency => "Khẩn cấp",
                _ => item.InspectionType.ToString()
            };
            sheet.Cell(rowNumber, 4).Value = item.OverallResult switch
            {
                InspectionOverallResult.Pass => "Đạt",
                InspectionOverallResult.Fail => "Không đạt",
                InspectionOverallResult.ConditionalPass =>
                    "Đạt có điều kiện",
                _ => item.OverallResult.ToString()
            };
            sheet.Cell(rowNumber, 5).Value =
                item.TeamLeader ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value =
                item.HasViolation ? "Có" : "Không";
            sheet.Cell(rowNumber, 7).Value = item.Violations.Count;
            if (item.FineAmount.HasValue)
                sheet.Cell(rowNumber, 8).Value = (double)item.FineAmount.Value;
            sheet.Cell(rowNumber, 9).Value =
                item.FollowUpRequired ? "Có" : "Không";
            if (item.FollowUpDate.HasValue)
            {
                sheet.Cell(rowNumber, 10).Value = item.FollowUpDate.Value;
                sheet.Cell(rowNumber, 10).Style.DateFormat.Format =
                    "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 11).Value =
                item.Notes ?? string.Empty;
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
