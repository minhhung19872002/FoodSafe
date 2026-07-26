using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

[RemoteService(false)]
public class FoodPoisoningIncidentExcelAppService :
    ApplicationService,
    IFoodPoisoningIncidentExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly FoodPoisoningIncidentAppService _incidents;

    public FoodPoisoningIncidentExcelAppService(
        FoodPoisoningIncidentAppService incidents)
    {
        _incidents = incidents;
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        FoodPoisoningIncidentFilterDto input)
    {
        var rows = new List<FoodPoisoningIncidentDto>();
        long total;
        do
        {
            var page = await _incidents.GetListAsync(
                new FoodPoisoningIncidentFilterDto
                {
                    Filter = input.Filter,
                    Status = input.Status,
                    OccurrenceDateFrom = input.OccurrenceDateFrom,
                    OccurrenceDateTo = input.OccurrenceDateTo,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:IncidentExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"vu-ngo-doc-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<FoodPoisoningIncidentDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Vụ ngộ độc");
        var headers = new[]
        {
            "Mã vụ",
            "Ngày xảy ra",
            "Ngày kết thúc",
            "Địa điểm",
            "Phơi nhiễm",
            "Mắc",
            "Nhập viện",
            "Tử vong",
            "Thực phẩm nghi ngờ",
            "Nguồn thực phẩm",
            "Đánh giá nguyên nhân",
            "Tác nhân gây bệnh",
            "Số ca",
            "Trạng thái",
            "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.IncidentCode;
            if (item.OccurrenceDate.HasValue)
            {
                sheet.Cell(rowNumber, 2).Value = item.OccurrenceDate.Value;
                sheet.Cell(rowNumber, 2).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            if (item.EndDate.HasValue)
            {
                sheet.Cell(rowNumber, 3).Value = item.EndDate.Value;
                sheet.Cell(rowNumber, 3).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 4).Value = item.LocationDescription ?? string.Empty;
            sheet.Cell(rowNumber, 5).Value = item.ExposedCount;
            sheet.Cell(rowNumber, 6).Value = item.AffectedCount;
            sheet.Cell(rowNumber, 7).Value = item.HospitalizedCount;
            sheet.Cell(rowNumber, 8).Value = item.DeathCount;
            sheet.Cell(rowNumber, 9).Value = item.SuspectedFood ?? string.Empty;
            sheet.Cell(rowNumber, 10).Value = item.FoodSource ?? string.Empty;
            sheet.Cell(rowNumber, 11).Value = item.CauseAssessmentValue switch
            {
                CauseAssessment.Confirmed => "Xác định",
                CauseAssessment.Probable => "Có thể",
                CauseAssessment.Suspected => "Nghi ngờ",
                CauseAssessment.Unknown => "Chưa rõ",
                _ => string.Empty
            };
            sheet.Cell(rowNumber, 12).Value = item.CausativeAgent ?? string.Empty;
            sheet.Cell(rowNumber, 13).Value = item.CaseCount;
            sheet.Cell(rowNumber, 14).Value = item.Status switch
            {
                PoisoningIncidentStatus.Draft => "Nháp",
                PoisoningIncidentStatus.Reported => "Đã báo cáo",
                PoisoningIncidentStatus.Verified => "Đã xác minh",
                PoisoningIncidentStatus.Concluded => "Đã kết luận",
                _ => item.Status.ToString()
            };
            sheet.Cell(rowNumber, 15).Value = item.Notes ?? string.Empty;
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
