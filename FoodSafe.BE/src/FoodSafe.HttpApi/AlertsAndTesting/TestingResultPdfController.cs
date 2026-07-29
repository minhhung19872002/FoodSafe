using Asp.Versioning;
using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.AlertsAndTesting;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.View)]
[Route("api/v1/app/testing-result/pdf")]
public sealed class TestingResultPdfController(
    ITestingResultPdfAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 10L * 1024 * 1024 + 64 * 1024;

    /// <summary>
    /// Upload a phiếu kiểm nghiệm PDF.
    /// Returns the storage path to be stored in CreateUpdateTestingResultDto.StoragePath.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.Create)]
    public async Task<TestingResultPdfUploadResultDto> UploadAsync(IFormFile file)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn file PDF.");
        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);
        return await service.UploadAsync(stream.ToArray(), file.FileName, file.ContentType);
    }

    /// <summary>
    /// Serve a previously uploaded phiếu kiểm nghiệm PDF.
    /// The path must start with "testing-result-pdfs/".
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAsync([FromQuery] string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return BadRequest();

        var pdf = await service.GetAsync(path);
        if (pdf is null)
            return NotFound();

        return File(pdf.Content, pdf.ContentType);
    }
}
