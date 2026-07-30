using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

public class AlertShareOptionDto
{
    public Guid Id { get; set; }
    public string? AlertNumber { get; set; }
    public string Title { get; set; } = null!;
}

public class InspectionResultShareOptionDto
{
    public Guid Id { get; set; }
    public string BusinessName { get; set; } = null!;
    public DateTime InspectionDate { get; set; }
    public string? AdminDecisionNumber { get; set; }
}

public class FoodPoisoningShareOptionDto
{
    public Guid Id { get; set; }
    public string IncidentCode { get; set; } = null!;
    public DateTime? OccurrenceDate { get; set; }
}

public class LicenseShareOptionDto
{
    public Guid Id { get; set; }
    public string Kind { get; set; } = null!;
    public string Number { get; set; } = null!;
    public string BusinessName { get; set; } = null!;
    public DateTime IssueDate { get; set; }
}

public class ProductShareOptionDto
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = null!;
    public string? BrandName { get; set; }
}

public class NewsShareOptionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Category { get; set; }
    public DateTime? PublishedAt { get; set; }
}

public class BusinessShareOptionDto
{
    public Guid Id { get; set; }
    public string? Code { get; set; }
    public string Name { get; set; } = null!;
    public string? TaxCode { get; set; }
}

public class ShareDataInput
{
    [Required]
    public Guid EndpointId { get; set; }

    [EnumDataType(typeof(SharedDataType))]
    public SharedDataType DataType { get; set; }

    /// <summary>Optional identifier of the shared record.</summary>
    public Guid? EntityId { get; set; }

    [StringLength(2000)]
    public string? Note { get; set; }
}

public class ShareDataResultDto
{
    public Guid LogId { get; set; }
    public bool IsSuccess { get; set; }
    public int? StatusCode { get; set; }
    public string? ErrorMessage { get; set; }
}

public interface IDataSharingAppService : IApplicationService
{
    Task<List<AlertShareOptionDto>> GetAlertOptionsAsync(string? filter);
    Task<List<InspectionResultShareOptionDto>> GetInspectionResultOptionsAsync(
        string? filter);
    Task<List<FoodPoisoningShareOptionDto>> GetFoodPoisoningOptionsAsync(
        string? filter);
    Task<List<LicenseShareOptionDto>> GetLicenseOptionsAsync(string? filter);
    Task<List<ProductShareOptionDto>> GetProductOptionsAsync(string? filter);
    Task<List<NewsShareOptionDto>> GetNewsOptionsAsync(string? filter);
    Task<List<BusinessShareOptionDto>> GetBusinessOptionsAsync(string? filter);
    Task<ShareDataResultDto> ShareAsync(ShareDataInput input);

    /// <summary>
    /// Re-sends a FAILED outbound attempt's stored payload to its endpoint,
    /// appending a new immutable attempt row (STT 51-57 "Thử lại").
    /// </summary>
    Task<ShareDataResultDto> RetryAsync(Guid logId);
}
