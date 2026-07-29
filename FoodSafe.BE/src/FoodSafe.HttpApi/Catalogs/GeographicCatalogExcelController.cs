using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.Catalogs;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/geographic-catalog/excel")]
public sealed class GeographicCatalogExcelController(
    IGeographicCatalogAppService service) : AbpControllerBase
{
    private const long MaximumRequestBytes = 10 * 1024 * 1024 + 64 * 1024; // 10 MB + overhead

    /// <summary>
    /// Import huyện/xã từ file Excel theo chuẩn DVHCVN.
    /// Cột A: Mã huyện, B: Tên huyện, C: Mã xã, D: Tên xã, E: Loại.
    /// </summary>
    [HttpPost("import")]
    [RequestSizeLimit(MaximumRequestBytes)]
    [Consumes("multipart/form-data")]
    public async Task<ImportGeographyResultDto> ImportAsync(
        [FromForm] Guid provinceId,
        IFormFile file)
    {
        if (file is null)
            throw new UserFriendlyException("Vui lòng chọn file Excel.");

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new UserFriendlyException("Chỉ hỗ trợ định dạng .xlsx.");

        await using var stream = new MemoryStream();
        await file.CopyToAsync(stream, HttpContext.RequestAborted);

        return await service.ImportDistrictsAndCommunesFromExcelAsync(
            new ImportGeographyFromExcelInput
            {
                ProvinceId = provinceId,
                ExcelBytes = stream.ToArray()
            });
    }
}
