using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Services;

namespace FoodSafe.Application.Contracts.BusinessManagement;

public sealed class PublicSelfDeclarationDto
{
    public Guid Id { get; set; }
    public string DeclarationNumber { get; set; } = string.Empty;
    public DateTime DeclarationDate { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductStandard { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
}

public interface IPublicSelfDeclarationAppService : IApplicationService
{
    Task<PublicSelfDeclarationDto> FindByNumberAsync(string number);
}
