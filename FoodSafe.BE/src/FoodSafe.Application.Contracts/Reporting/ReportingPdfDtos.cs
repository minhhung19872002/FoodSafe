using Volo.Abp.Application.Services;

namespace FoodSafe.Reporting;

public class ReportPdfDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/pdf";
}

public interface IReportPdfAppService : IApplicationService
{
    Task<ReportPdfDto> GenerateNdtpReportPdfAsync(Guid reportId);
    Task<ReportPdfDto> GenerateAtpWorkReportPdfAsync(Guid reportId);
    Task<ReportPdfDto> GenerateActionMonthReportPdfAsync(Guid reportId);
}
