using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Catalogs;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/master-catalog/excel")]
public sealed class MasterCatalogExcelController(
    IMasterCatalogExcelAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 10 * 1024 * 1024 + 64 * 1024;

    [HttpGet("template")]
    public async Task<IActionResult> GetTemplateAsync(
        [FromQuery] MasterCatalogKind kind)
    {
        var file = await service.GetTemplateAsync(kind);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpPost("preview")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ExcelImportPreviewDto> PreviewAsync(
        [FromQuery] MasterCatalogKind kind,
        IFormFile file)
    {
        if (file is null)
        {
            throw new UserFriendlyException("Vui lòng chọn file Excel.");
        }
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.PreviewAsync(kind, stream.ToArray(), file.FileName);
    }

    [HttpPost("confirm")]
    public Task<ExcelImportResultDto> ConfirmAsync(
        [FromBody] ConfirmExcelImportDto input) =>
        service.ConfirmAsync(input);
}
