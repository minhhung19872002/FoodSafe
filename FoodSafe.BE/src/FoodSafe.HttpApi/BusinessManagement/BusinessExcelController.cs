using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.BusinessManagement;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/business/excel")]
public sealed class BusinessExcelController(
    IBusinessExcelAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 10 * 1024 * 1024 + 64 * 1024;

    [HttpGet("template")]
    public async Task<IActionResult> GetTemplateAsync()
    {
        var file = await service.GetTemplateAsync();
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpPost("preview")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ExcelImportPreviewDto> PreviewAsync(IFormFile file)
    {
        if (file is null)
        {
            throw new UserFriendlyException("Vui lòng chọn file Excel.");
        }
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.PreviewAsync(stream.ToArray(), file.FileName);
    }

    [HttpPost("confirm")]
    public Task<ExcelImportResultDto> ConfirmAsync(
        [FromBody] ConfirmExcelImportDto input) =>
        service.ConfirmAsync(input);

    [HttpGet("export")]
    public async Task<IActionResult> ExportAsync(
        [FromQuery] BusinessListInput input)
    {
        var file = await service.ExportAsync(input);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
