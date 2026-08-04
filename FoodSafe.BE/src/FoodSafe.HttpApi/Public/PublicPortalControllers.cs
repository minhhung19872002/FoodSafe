using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.PublicPortal;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public")]
public sealed class PublicDirectoryController(
    IPublicDirectoryAppService service) : AbpControllerBase
{
    [HttpGet("businesses/search")]
    public Task<PagedResultDto<PublicBusinessSummaryDto>> SearchBusinessesAsync(
        [FromQuery] PublicBusinessSearchRequestDto input) =>
        service.SearchBusinessesAsync(input);

    [HttpGet("products/search")]
    public Task<PagedResultDto<PublicProductSummaryDto>> SearchProductsAsync(
        [FromQuery] PublicProductSearchRequestDto input) =>
        service.SearchProductsAsync(input);

    [HttpGet("catalog/business-types")]
    public Task<List<CatalogOptionDto>> GetBusinessTypeOptionsAsync() =>
        service.GetBusinessTypeOptionsAsync();

    [HttpGet("catalog/product-groups")]
    public Task<List<CatalogOptionDto>> GetProductGroupOptionsAsync() =>
        service.GetProductGroupOptionsAsync();
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public")]
public sealed class PublicCertificateSearchController(
    IPublicCertificateSearchAppService service) : AbpControllerBase
{
    [HttpGet("eligibility-certificates/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchEligibilityCertificatesAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchEligibilityCertificatesAsync(input);

    [HttpGet("self-declarations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchSelfDeclarationsAsync(input);

    [HttpGet("product-registrations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchProductRegistrationsAsync(input);

    [HttpGet("ad-registrations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchAdRegistrationsAsync(input);

    [HttpGet("cfs-certificates/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchCfsCertificatesAsync(input);

    [HttpGet("export-food-certificates/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(
        [FromQuery] PublicCertificateSearchRequestDto input) =>
        service.SearchExportFoodCertificatesAsync(input);

    [HttpGet("eligibility-certificates/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetEligibilityCertificateDetailAsync(Guid id) =>
        service.GetEligibilityCertificateDetailAsync(id);

    [HttpGet("self-declarations/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetSelfDeclarationDetailAsync(Guid id) =>
        service.GetSelfDeclarationDetailAsync(id);

    [HttpGet("product-registrations/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetProductRegistrationDetailAsync(Guid id) =>
        service.GetProductRegistrationDetailAsync(id);

    [HttpGet("ad-registrations/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetAdRegistrationDetailAsync(Guid id) =>
        service.GetAdRegistrationDetailAsync(id);

    [HttpGet("cfs-certificates/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetCfsCertificateDetailAsync(Guid id) =>
        service.GetCfsCertificateDetailAsync(id);

    [HttpGet("export-food-certificates/{id:guid}")]
    public Task<PublicCertificateDetailDto> GetExportFoodCertificateDetailAsync(Guid id) =>
        service.GetExportFoodCertificateDetailAsync(id);
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public")]
public sealed class PublicContentController(
    IPublicContentAppService service) : AbpControllerBase
{
    [HttpGet("news")]
    public Task<PagedResultDto<PublicNewsListItemDto>> GetNewsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetNewsAsync(input);

    [HttpGet("news/{id:guid}")]
    public Task<PublicNewsDetailDto> GetNewsDetailAsync(Guid id) =>
        service.GetNewsDetailAsync(id);

    [HttpGet("alerts")]
    public Task<PagedResultDto<PublicAlertDto>> GetAlertsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetAlertsAsync(input);

    [HttpGet("warned-businesses")]
    public Task<PagedResultDto<PublicWarnedBusinessDto>> GetWarnedBusinessesAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetWarnedBusinessesAsync(input);

    [HttpGet("documents")]
    public Task<PagedResultDto<PublicDocumentDto>> GetDocumentsAsync(
        [FromQuery] PublicDocumentSearchRequestDto input) =>
        service.GetDocumentsAsync(input);

    [HttpGet("documents/{id:guid}")]
    public Task<PublicDocumentDetailDto> GetDocumentDetailAsync(Guid id) =>
        service.GetDocumentDetailAsync(id);

    [HttpGet("catalog/document-types")]
    public Task<List<CatalogOptionDto>> GetDocumentTypeOptionsAsync() =>
        service.GetDocumentTypeOptionsAsync();

    [HttpGet("catalog/news-categories")]
    public Task<List<string>> GetNewsCategoriesAsync() =>
        service.GetNewsCategoriesAsync();

    [HttpGet("risk-analyses")]
    public Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetRiskAnalysesAsync(input);

    [HttpGet("testing-results")]
    public Task<PagedResultDto<PublicTestingResultDto>> GetTestingResultsAsync(
        [FromQuery] PublicTestingResultSearchRequestDto input) =>
        service.GetTestingResultsAsync(input);

    [HttpGet("inspection-results")]
    public Task<PagedResultDto<PublicInspectionResultDto>> GetInspectionResultsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetInspectionResultsAsync(input);

    /// <summary>
    /// Downloads the certificate of a published testing result (STT 44).
    /// Returns 404 both when the result does not exist and when it is not
    /// published, so the endpoint cannot be used to probe unpublished records.
    /// </summary>
    [HttpGet("testing-results/{id:guid}/certificate")]
    public async Task<IActionResult> GetTestingResultCertificateAsync(Guid id)
    {
        var file = await service.GetTestingResultCertificateAsync(id);
        return file is null
            ? NotFound()
            : File(file.Content, file.ContentType, file.FileName);
    }
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/alert-reports")]
public sealed class CitizenAlertReportController(
    ICitizenAlertReportAppService service) : AbpControllerBase
{
    [HttpPost]
    public Task<CitizenAlertReportResultDto> CreateAsync(
        [FromBody] CreateCitizenAlertReportDto input) =>
        service.CreateAsync(input);
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/citizen-reports")]
public sealed class CitizenReportStatusController(
    IPublicContentAppService service) : AbpControllerBase
{
    /// <summary>
    /// Anonymous tracking code lookup.
    /// Returns 404 when the code is not found; the response time is deliberately
    /// kept constant to prevent timing-based enumeration of valid codes.
    /// No personally identifiable reporter data is included in the response.
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatusAsync([FromQuery] string trackingCode)
    {
        if (string.IsNullOrWhiteSpace(trackingCode))
            return BadRequest("trackingCode is required.");

        var result = await service.GetCitizenReportStatusAsync(trackingCode);
        if (result is null)
            return NotFound();

        return Ok(result);
    }
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public/news-reports")]
public sealed class CitizenNewsReportController(
    ICitizenNewsReportAppService service) : AbpControllerBase
{
    [HttpPost]
    public Task<CitizenAlertReportResultDto> CreateAsync(
        [FromBody] CreateCitizenNewsReportDto input) =>
        service.CreateAsync(input);
}

[RemoteService]
[ApiVersion(ApiContract.Version)]
[AllowAnonymous]
[Route("api/v1/public")]
public sealed class CertificatePdfController(
    ICertificatePdfAppService service) : AbpControllerBase
{
    [HttpGet("eligibility-certificates/{id:guid}/pdf")]
    public async Task<IActionResult> GetEligibilityCertificatePdfAsync(Guid id)
    {
        var file = await service.GetEligibilityCertificatePdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("self-declarations/{id:guid}/pdf")]
    public async Task<IActionResult> GetSelfDeclarationPdfAsync(Guid id)
    {
        var file = await service.GetSelfDeclarationPdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("product-registrations/{id:guid}/pdf")]
    public async Task<IActionResult> GetProductRegistrationPdfAsync(Guid id)
    {
        var file = await service.GetProductRegistrationPdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("cfs-certificates/{id:guid}/pdf")]
    public async Task<IActionResult> GetCfsCertificatePdfAsync(Guid id)
    {
        var file = await service.GetCfsCertificatePdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("export-food-certificates/{id:guid}/pdf")]
    public async Task<IActionResult> GetExportFoodCertificatePdfAsync(Guid id)
    {
        var file = await service.GetExportFoodCertificatePdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }

    [HttpGet("advertisement-registrations/{id:guid}/pdf")]
    public async Task<IActionResult> GetAdvertisementRegistrationPdfAsync(Guid id)
    {
        var file = await service.GetAdvertisementRegistrationPdfAsync(id);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
