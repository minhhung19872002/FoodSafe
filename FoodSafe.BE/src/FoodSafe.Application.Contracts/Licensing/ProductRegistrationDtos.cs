using System.ComponentModel.DataAnnotations;
using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Licensing;

public sealed class ProductRegistrationListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public ProductRegistrationListInput()
    {
        MaxResultCount = 20;
        Sorting = "RegistrationDate desc";
    }
}

public sealed class ProductRegistrationDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string? LinkedProductName { get; set; }
    public Guid OrganizationId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string? ReceiptNumber { get; set; }
    public DateTime RegistrationDate { get; set; }
    public DateTime? ReceiptDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? CertifyingAuthority { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
}

public class UpsertProductRegistrationDto
{
    public Guid BusinessId { get; set; }
    public Guid? ProductId { get; set; }

    [Required, StringLength(100)]
    public string RegistrationNumber { get; set; } = string.Empty;

    [StringLength(100)]
    public string? ReceiptNumber { get; set; }

    public DateTime RegistrationDate { get; set; }
    public DateTime? ReceiptDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [Required, StringLength(500)]
    public string ProductName { get; set; } = string.Empty;

    [StringLength(300)]
    public string? Manufacturer { get; set; }

    [StringLength(200)]
    public string? CertifyingAuthority { get; set; }

    public string? Notes { get; set; }
}

public sealed class UpdateProductRegistrationDto :
    UpsertProductRegistrationDto;

public sealed class RevokeProductRegistrationDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class PublicProductRegistrationDto
{
    public string RegistrationNumber { get; set; } = string.Empty;
    public string? ReceiptNumber { get; set; }
    public DateTime RegistrationDate { get; set; }
    public DateTime? ReceiptDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? CertifyingAuthority { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public LicenseStatus Status { get; set; }
}

public interface IPublicProductRegistrationAppService :
    IApplicationService
{
    Task<PublicProductRegistrationDto> FindByNumberAsync(string number);
}

public interface IProductRegistrationAppService : IApplicationService
{
    Task<PagedResultDto<ProductRegistrationDto>> GetListAsync(
        ProductRegistrationListInput input);
    Task<ProductRegistrationDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId);
    Task<ProductRegistrationDto> CreateAsync(
        UpsertProductRegistrationDto input);
    Task<ProductRegistrationDto> UpdateAsync(
        Guid id,
        UpdateProductRegistrationDto input);
    Task DeleteAsync(Guid id);
    Task<ProductRegistrationDto> RevokeAsync(
        Guid id,
        RevokeProductRegistrationDto input);
}
