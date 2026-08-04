using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.FoodPoisoning;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/food-poisoning-incident")]
public sealed class FoodPoisoningIncidentPdfController(
    IFoodPoisoningIncidentPdfAppService service) : AbpControllerBase
{
    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> GetPdfAsync(Guid id)
    {
        var bytes = await service.GenerateIncidentClosurePdfAsync(id);
        return File(bytes, "application/pdf", $"vu-ngo-doc-{id:N}.pdf");
    }

    /// <summary>3 mẫu báo cáo vụ theo QĐ 01/2006/QĐ-BYT: initial/update/final.</summary>
    [HttpGet("{id:guid}/emergency-report-pdf")]
    public async Task<IActionResult> GetEmergencyReportPdfAsync(
        Guid id, [FromQuery] PoisoningEmergencyReportKind kind)
    {
        var bytes = await service.GenerateEmergencyReportPdfAsync(id, kind);
        var slug = kind switch
        {
            PoisoningEmergencyReportKind.Initial => "bao-cao-khan-ban-dau",
            PoisoningEmergencyReportKind.Update => "bao-cao-cap-nhat",
            _ => "bao-cao-ket-thuc",
        };
        return File(bytes, "application/pdf", $"{slug}-{id:N}.pdf");
    }
}
