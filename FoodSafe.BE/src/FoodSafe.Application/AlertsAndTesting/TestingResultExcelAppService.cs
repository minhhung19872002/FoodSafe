using ClosedXML.Excel;
using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(false)]
public class TestingResultExcelAppService :
    ApplicationService,
    ITestingResultExcelAppService
{
    private const int PageSize = 1000;
    private const int MaximumRows = 50_000;
    private readonly TestingResultAppService _results;

    public TestingResultExcelAppService(
        TestingResultAppService results)
    {
        _results = results;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.View)]
    public async Task<ExcelDownloadDto> ExportAsync(
        TestingResultFilterDto input)
    {
        var rows = new List<TestingResultDto>();
        long total;
        do
        {
            var page = await _results.GetListAsync(
                new TestingResultFilterDto
                {
                    Filter = input.Filter,
                    BusinessId = input.BusinessId,
                    TestingCenterId = input.TestingCenterId,
                    Outcome = input.Outcome,
                    Sorting = input.Sorting,
                    SkipCount = rows.Count,
                    MaxResultCount = PageSize
                });
            total = page.TotalCount;
            if (total > MaximumRows)
                throw new BusinessException(
                        "FoodSafe:TestingResultExport:TooLarge")
                    .WithData("MaximumRows", MaximumRows);
            rows.AddRange(page.Items);
        } while (rows.Count < total);

        return new ExcelDownloadDto
        {
            Content = CreateWorkbook(rows),
            FileName =
                $"ket-qua-kiem-nghiem-{Clock.Now:yyyyMMdd-HHmmss}.xlsx"
        };
    }

    private static byte[] CreateWorkbook(
        IReadOnlyList<TestingResultDto> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Kết quả kiểm nghiệm");
        var headers = new[]
        {
            "Mã mẫu",
            "Tên mẫu",
            "Cơ sở SXKD",
            "Sản phẩm",
            "Trung tâm KN",
            "Dịch vụ KN",
            "Ngày lấy mẫu",
            "Ngày gửi",
            "Ngày có KQ",
            "Kết quả",
            "Chỉ tiêu không đạt",
            "Số GCN",
            "Công khai"
        };
        for (var index = 0; index < headers.Length; index++)
            sheet.Cell(1, index + 1).Value = headers[index];
        var rowNumber = 2;
        foreach (var item in rows)
        {
            sheet.Cell(rowNumber, 1).Value = item.SampleCode;
            sheet.Cell(rowNumber, 2).Value = item.SampleName;
            sheet.Cell(rowNumber, 3).Value = item.BusinessName ?? string.Empty;
            sheet.Cell(rowNumber, 4).Value = item.ProductName ?? string.Empty;
            sheet.Cell(rowNumber, 5).Value = item.TestingCenterName ?? string.Empty;
            sheet.Cell(rowNumber, 6).Value = item.TestingServiceName ?? string.Empty;
            sheet.Cell(rowNumber, 7).Value = item.SampleDate;
            sheet.Cell(rowNumber, 7).Style.DateFormat.Format = "dd/MM/yyyy";
            if (item.SubmissionDate.HasValue)
            {
                sheet.Cell(rowNumber, 8).Value = item.SubmissionDate.Value;
                sheet.Cell(rowNumber, 8).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            if (item.ResultDate.HasValue)
            {
                sheet.Cell(rowNumber, 9).Value = item.ResultDate.Value;
                sheet.Cell(rowNumber, 9).Style.DateFormat.Format = "dd/MM/yyyy";
            }
            sheet.Cell(rowNumber, 10).Value = item.Outcome switch
            {
                TestingResultOutcome.Pass => "Đạt",
                TestingResultOutcome.Fail => "Không đạt",
                TestingResultOutcome.Conditional => "Có điều kiện",
                _ => item.Outcome.ToString()
            };
            sheet.Cell(rowNumber, 11).Value = item.FailedCriteria ?? string.Empty;
            sheet.Cell(rowNumber, 12).Value = item.CertificateNumber ?? string.Empty;
            sheet.Cell(rowNumber, 13).Value = item.IsPublic ? "Có" : "Không";
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
