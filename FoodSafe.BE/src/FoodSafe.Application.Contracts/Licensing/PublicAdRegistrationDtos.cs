using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.Licensing;

public sealed class PublicAdRegistrationDto
{
    public string RegistrationNumber { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ContentDescription { get; set; }
    public string? Medium { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
}

public interface IPublicAdRegistrationAppService : IApplicationService
{
    Task<PublicAdRegistrationDto> FindByNumberAsync(string number);
}
