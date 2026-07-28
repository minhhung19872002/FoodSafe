using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public sealed class AdvertisementRegistrationListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? AdvertisementTypeId { get; set; }
    public Guid? ProductId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public AdvertisementRegistrationListInput()
    {
        MaxResultCount = 20;
    }
}

public sealed class AdvertisementRegistrationDto :
    FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid OrganizationId { get; set; }
    public Guid? AdvertisementTypeId { get; set; }
    public string? AdvertisementTypeName { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public DateTime RegistrationDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ContentDescription { get; set; }
    public string? Medium { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
    public IReadOnlyList<SelfDeclarationProductOptionDto> Products
    { get; set; } = [];
}

public class UpsertAdvertisementRegistrationDto
{
    public Guid BusinessId { get; set; }
    public Guid? AdvertisementTypeId { get; set; }

    [Required, StringLength(100)]
    public string RegistrationNumber { get; set; } = string.Empty;

    public DateTime RegistrationDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? ContentDescription { get; set; }

    [StringLength(200)]
    public string? Medium { get; set; }

    public string? Notes { get; set; }

    [MinLength(1)]
    public IReadOnlyList<Guid> ProductIds { get; set; } = [];
}

public sealed class UpdateAdvertisementRegistrationDto :
    UpsertAdvertisementRegistrationDto;

public sealed class RevokeAdvertisementRegistrationDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class AdvertisementTypeOptionDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public interface IAdvertisementRegistrationAppService :
    IApplicationService
{
    Task<PagedResultDto<AdvertisementRegistrationDto>> GetListAsync(
        AdvertisementRegistrationListInput input);
    Task<AdvertisementRegistrationDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId);
    Task<IReadOnlyList<AdvertisementTypeOptionDto>>
        GetAdvertisementTypeOptionsAsync();
    Task<AdvertisementRegistrationDto> CreateAsync(
        UpsertAdvertisementRegistrationDto input);
    Task<AdvertisementRegistrationDto> UpdateAsync(
        Guid id,
        UpdateAdvertisementRegistrationDto input);
    Task DeleteAsync(Guid id);
    Task<AdvertisementRegistrationDto> RevokeAsync(
        Guid id,
        RevokeAdvertisementRegistrationDto input);
}
