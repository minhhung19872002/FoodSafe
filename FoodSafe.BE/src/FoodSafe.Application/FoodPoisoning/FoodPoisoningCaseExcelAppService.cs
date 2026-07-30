using ClosedXML.Excel;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

[RemoteService(false)]
public class FoodPoisoningCaseExcelAppService :
    ApplicationService,
    IFoodPoisoningCaseExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly FoodPoisoningCaseAppService _cases;

    public FoodPoisoningCaseExcelAppService(
        FoodPoisoningCaseAppService cases)
    {
        _cases = cases;
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        FoodPoisoningCaseFilterDto input)
    {
        var rows = new List<FoodPoisoningCaseDto>();
        long total;
        do
        {
            var page = await _cases.GetListAsync(
                new FoodPoisoningCaseFilterDto
                {
                    Filter = input.Filter,
                    Status = input.Status,
                    ReportDateFrom = input.ReportDateFrom,
                    ReportDateTo = input.ReportDateTo,
                    IncidentId = input.IncidentId,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:CaseExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"ca-ngo-doc-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<FoodPoisoningCaseDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Ca ngộ độc");
        var headers = new[]
        {
            "Mã ca",
            "Ngày báo cáo",
            "Ngày xảy ra",
            "Nạn nhân",
            "Tuổi",
            "Giới tính",
            "Thực phẩm nghi ngờ",
            "Triệu chứng",
            "Cơ sở y tế",
            "Kết quả điều trị",
            "Địa điểm",
            "Trạng thái",
            "Ghi chú"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.CaseCode;
            sheet.Cell(rowNumber, 2).Value = item.ReportDate.ToString("dd/MM/yyyy");
            if (item.OccurrenceDate.HasValue)
            {
                sheet.Cell(rowNumber, 3).Value = item.OccurrenceDate.Value;
                sheet.Cell(rowNumber, 3).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 4).Value = item.Victims.Count > 0
                ? string.Join(", ", item.Victims.Select(v => v.Name))
                : (item.VictimName ?? string.Empty);
            if (item.VictimAge.HasValue)
                sheet.Cell(rowNumber, 5).Value = item.VictimAge.Value;
            sheet.Cell(rowNumber, 6).Value = item.VictimGender switch
            {
                VictimGender.Male => "Nam",
                VictimGender.Female => "Nữ",
                VictimGender.Other => "Khác",
                _ => string.Empty
            };
            sheet.Cell(rowNumber, 7).Value = item.SuspectedFood ?? string.Empty;
            sheet.Cell(rowNumber, 8).Value = item.Symptoms ?? string.Empty;
            sheet.Cell(rowNumber, 9).Value = item.MedicalFacility ?? string.Empty;
            sheet.Cell(rowNumber, 10).Value = item.TreatmentResult switch
            {
                TreatmentResult.Recovered => "Hồi phục",
                TreatmentResult.Hospitalized => "Nhập viện",
                TreatmentResult.Deceased => "Tử vong",
                _ => string.Empty
            };
            sheet.Cell(rowNumber, 11).Value = item.LocationDescription ?? string.Empty;
            sheet.Cell(rowNumber, 12).Value = item.Status switch
            {
                PoisoningCaseStatus.Draft => "Nháp",
                PoisoningCaseStatus.Reported => "Đã báo cáo",
                PoisoningCaseStatus.Verified => "Đã xác minh",
                _ => item.Status.ToString()
            };
            sheet.Cell(rowNumber, 13).Value = item.Notes ?? string.Empty;
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
