using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Reporting;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app")]
public sealed class ReportPdfController(IReportPdfAppService service) : AbpControllerBase
{
    [HttpGet("ndtp-report/{id:guid}/pdf")]
    public async Task<IActionResult> GetNdtpPdfAsync([FromRoute] Guid id)
    {
        var result = await service.GenerateNdtpReportPdfAsync(id);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("atp-work-report/{id:guid}/pdf")]
    public async Task<IActionResult> GetAtpWorkPdfAsync([FromRoute] Guid id)
    {
        var result = await service.GenerateAtpWorkReportPdfAsync(id);
        return File(result.Content, result.ContentType, result.FileName);
    }

    [HttpGet("action-month-report/{id:guid}/pdf")]
    public async Task<IActionResult> GetActionMonthPdfAsync([FromRoute] Guid id)
    {
        var result = await service.GenerateActionMonthReportPdfAsync(id);
        return File(result.Content, result.ContentType, result.FileName);
    }
}
