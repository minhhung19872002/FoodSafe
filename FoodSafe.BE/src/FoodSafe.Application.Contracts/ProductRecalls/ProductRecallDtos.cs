using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.ProductRecalls;

public sealed class ProductRecallListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public Guid? BusinessId { get; set; }
    public RecallType? RecallType { get; set; }
    public ProductRecallStatus? Status { get; set; }

    public ProductRecallListInput()
    {
        MaxResultCount = 20;
        Sorting = "creationTime desc";
    }
}

public sealed class ProductRecallDto : FullAuditedEntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public Guid BusinessId { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public Guid? ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? BatchInfo { get; set; }
    public RecallType RecallType { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? DecisionNumber { get; set; }
    public DateTime? DecisionDate { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? CompletedDate { get; set; }
    public decimal? QuantityRecalled { get; set; }
    public string? QuantityUnit { get; set; }
    public PostRecallAction? PostRecallAction { get; set; }
    public string? ActionDescription { get; set; }
    public ProductRecallStatus Status { get; set; }
    public string? CancelReason { get; set; }
}

public class CreateUpdateProductRecallDto
{
    public Guid BusinessId { get; set; }
    public Guid? ProductId { get; set; }

    [Required, StringLength(500)]
    public string ProductName { get; set; } = string.Empty;

    [StringLength(300)]
    public string? BatchInfo { get; set; }

    [EnumDataType(typeof(RecallType))]
    public RecallType RecallType { get; set; }

    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;

    [StringLength(100)]
    public string? DecisionNumber { get; set; }

    public DateTime? DecisionDate { get; set; }
    public DateTime StartDate { get; set; }

    [Range(0, double.MaxValue)]
    public decimal? QuantityRecalled { get; set; }

    [StringLength(50)]
    public string? QuantityUnit { get; set; }
}

public sealed class CompleteProductRecallDto
{
    [EnumDataType(typeof(PostRecallAction))]
    public PostRecallAction PostRecallAction { get; set; }

    public DateTime CompletedDate { get; set; }

    [StringLength(2000)]
    public string? ActionDescription { get; set; }
}

public sealed class CancelProductRecallDto
{
    [Required, StringLength(2000)]
    public string Reason { get; set; } = string.Empty;
}

public sealed class RecallBusinessOptionDto
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = string.Empty;
}

public interface IProductRecallAppService : IApplicationService
{
    Task<PagedResultDto<ProductRecallDto>> GetListAsync(
        ProductRecallListInput input);
    Task<ProductRecallDto> GetAsync(Guid id);
    Task<IReadOnlyList<RecallBusinessOptionDto>> GetBusinessOptionsAsync();
    Task<ProductRecallDto> CreateAsync(CreateUpdateProductRecallDto input);
    Task<ProductRecallDto> UpdateAsync(
        Guid id,
        CreateUpdateProductRecallDto input);
    Task DeleteAsync(Guid id);
    Task<ProductRecallDto> StartAsync(Guid id);
    Task<ProductRecallDto> CompleteAsync(
        Guid id,
        CompleteProductRecallDto input);
    Task<ProductRecallDto> CancelAsync(
        Guid id,
        CancelProductRecallDto input);
}
