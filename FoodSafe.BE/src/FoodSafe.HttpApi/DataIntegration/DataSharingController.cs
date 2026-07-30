using Asp.Versioning;
using FoodSafe.BusinessManagement;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Volo.Abp;
using Volo.Abp.AspNetCore.Mvc;

namespace FoodSafe.DataIntegration;

[RemoteService]
[ApiVersion(ApiContract.Version)]
[Authorize]
[Route("api/v1/app/data-sharing")]
public sealed class DataSharingController(
    IDataSharingAppService service) : AbpControllerBase
{
    [HttpGet("alert-options")]
    public Task<List<AlertShareOptionDto>> GetAlertOptionsAsync(
        [FromQuery] string? filter) =>
        service.GetAlertOptionsAsync(filter);

    [HttpGet("inspection-result-options")]
    public Task<List<InspectionResultShareOptionDto>>
        GetInspectionResultOptionsAsync([FromQuery] string? filter) =>
        service.GetInspectionResultOptionsAsync(filter);

    [HttpGet("food-poisoning-options")]
    public Task<List<FoodPoisoningShareOptionDto>>
        GetFoodPoisoningOptionsAsync([FromQuery] string? filter) =>
        service.GetFoodPoisoningOptionsAsync(filter);

    [HttpGet("license-options")]
    public Task<List<LicenseShareOptionDto>> GetLicenseOptionsAsync(
        [FromQuery] string? filter) =>
        service.GetLicenseOptionsAsync(filter);

    [HttpGet("product-options")]
    public Task<List<ProductShareOptionDto>> GetProductOptionsAsync(
        [FromQuery] string? filter) =>
        service.GetProductOptionsAsync(filter);

    [HttpGet("news-options")]
    public Task<List<NewsShareOptionDto>> GetNewsOptionsAsync(
        [FromQuery] string? filter) =>
        service.GetNewsOptionsAsync(filter);

    [HttpGet("business-options")]
    public Task<List<BusinessShareOptionDto>> GetBusinessOptionsAsync(
        [FromQuery] string? filter) =>
        service.GetBusinessOptionsAsync(filter);

    [HttpPost("share")]
    public Task<ShareDataResultDto> ShareAsync(
        [FromBody] ShareDataInput input) =>
        service.ShareAsync(input);

    [HttpPost("retry/{logId:guid}")]
    public Task<ShareDataResultDto> RetryAsync(Guid logId) =>
        service.RetryAsync(logId);
}
