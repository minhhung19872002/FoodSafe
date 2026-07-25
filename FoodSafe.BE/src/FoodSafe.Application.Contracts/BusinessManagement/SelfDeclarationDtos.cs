using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.BusinessManagement;

public sealed class SelfDeclarationListInput :
    PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public Guid? ProductId { get; set; }
    public LicenseStatus? Status { get; set; }

    [Range(1, 3650)]
    public int? ExpiringWithinDays { get; set; }

    public SelfDeclarationListInput()
    {
        MaxResultCount = 20;
        Sorting = "DeclarationDate desc";
    }
}

public sealed class SelfDeclarationDto : FullAuditedEntityDto<Guid>
{
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string? LinkedProductName { get; set; }
    public Guid OrganizationId { get; set; }
    public string DeclarationNumber { get; set; } = string.Empty;
    public DateTime DeclarationDate { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Manufacturer { get; set; }
    public string? Purpose { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public LicenseStatus Status { get; set; }
    public int? DaysUntilExpiry { get; set; }
    public string? RevokeReason { get; set; }
    public DateTime? RevokedAt { get; set; }
    public Guid? RevokedById { get; set; }
    public string? Notes { get; set; }
}

public class UpsertSelfDeclarationDto
{
    public Guid BusinessId { get; set; }
    public Guid? ProductId { get; set; }

    [Required, StringLength(100)]
    public string DeclarationNumber { get; set; } = string.Empty;

    public DateTime DeclarationDate { get; set; }

    [Required, StringLength(500)]
    public string ProductName { get; set; } = string.Empty;

    [StringLength(300)]
    public string? Manufacturer { get; set; }

    [StringLength(200)]
    public string? Purpose { get; set; }

    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}

public sealed class UpdateSelfDeclarationDto : UpsertSelfDeclarationDto;

public sealed class RevokeSelfDeclarationDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class SelfDeclarationProductOptionDto
{
    public Guid Id { get; set; }
    public Guid BusinessId { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
}

public interface ISelfDeclarationAppService : IApplicationService
{
    Task<PagedResultDto<SelfDeclarationDto>> GetListAsync(
        SelfDeclarationListInput input);
    Task<SelfDeclarationDto> GetAsync(Guid id);
    Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync();
    Task<IReadOnlyList<SelfDeclarationProductOptionDto>>
        GetProductOptionsAsync(Guid businessId);
    Task<SelfDeclarationDto> CreateAsync(UpsertSelfDeclarationDto input);
    Task<SelfDeclarationDto> UpdateAsync(
        Guid id,
        UpdateSelfDeclarationDto input);
    Task DeleteAsync(Guid id);
    Task<SelfDeclarationDto> RevokeAsync(
        Guid id,
        RevokeSelfDeclarationDto input);
}
