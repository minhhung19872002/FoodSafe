using System.Text;
using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Partner-facing download of published API specifications (FR-50-05).
/// Anonymous at the ASP.NET level: publication is the deliberate access gate, so
/// only the currently published version of a named specification is retrievable;
/// an unknown or unpublished name yields 404. The endpoint streams the raw
/// document as a file and never throws for expected conditions, so it always
/// returns a clean status rather than a leaked 500.
/// </summary>
[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/partner/api-spec")]
public sealed class PartnerApiSpecController(
    IApiSpecificationAppService service) : AbpControllerBase
{
    [HttpGet("{name}")]
    public async Task<IActionResult> DownloadPublishedAsync(string name)
    {
        var download = await service.GetPublishedByNameAsync(name);
        if (download is null)
        {
            return NotFound();
        }

        return File(
            Encoding.UTF8.GetBytes(download.Content),
            download.ContentType,
            download.FileName);
    }
}
