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
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchBusinessesAsync(input);

    [HttpGet("products/search")]
    public Task<PagedResultDto<PublicProductSummaryDto>> SearchProductsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchProductsAsync(input);
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
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchEligibilityCertificatesAsync(input);

    [HttpGet("self-declarations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchSelfDeclarationsAsync(input);

    [HttpGet("product-registrations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchProductRegistrationsAsync(input);

    [HttpGet("ad-registrations/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchAdRegistrationsAsync(input);

    [HttpGet("cfs-certificates/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchCfsCertificatesAsync(input);

    [HttpGet("export-food-certificates/search")]
    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.SearchExportFoodCertificatesAsync(input);
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
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetDocumentsAsync(input);

    [HttpGet("risk-analyses")]
    public Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(
        [FromQuery] PublicSearchRequestDto input) =>
        service.GetRiskAnalysesAsync(input);
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
}
