using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.BusinessManagement;

public sealed class PublicBusinessDto
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? TaxCode { get; set; }
    public string? RepresentativeName { get; set; }
    public string? ContactPhone { get; set; }
    public string? AddressStreet { get; set; }
    public BusinessStatus Status { get; set; }
    public bool HasEligibilityCertificate { get; set; }
    public bool HasVsattpCommitment { get; set; }
}

public interface IPublicBusinessAppService : IApplicationService
{
    Task<PublicBusinessDto> FindByNameOrCodeAsync(string keyword);
}
