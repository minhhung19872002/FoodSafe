using Asp.Versioning;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Dashboard;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/statistics/excel")]
public sealed class StatisticsExcelController(
    IStatisticsExcelAppService service) : AbpControllerBase
{
    [HttpGet("licenses-by-business-type")]
    public async Task<IActionResult> ExportLicensesByBusinessTypeAsync(
        [FromQuery] ReportStatisticsFilterDto input)
    {
        var file = await service.ExportLicensesByBusinessTypeAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("poisoning-by-area")]
    public async Task<IActionResult> ExportPoisoningByAreaAsync(
        [FromQuery] ReportStatisticsFilterDto input)
    {
        var file = await service.ExportPoisoningByAreaAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("inspection-summary")]
    public async Task<IActionResult> ExportInspectionSummaryAsync(
        [FromQuery] ReportStatisticsFilterDto input)
    {
        var file = await service.ExportInspectionSummaryAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("business-breakdown")]
    public async Task<IActionResult> ExportBusinessBreakdownAsync(
        [FromQuery] ReportStatisticsFilterDto input)
    {
        var file = await service.ExportBusinessBreakdownAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
