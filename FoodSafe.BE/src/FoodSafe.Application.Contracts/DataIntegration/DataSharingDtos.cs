using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

public class AlertShareOptionDto
{
    public Guid Id { get; set; }
    public string? AlertNumber { get; set; }
    public string Title { get; set; } = null!;
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
    Task<ShareDataResultDto> ShareAsync(ShareDataInput input);

    /// <summary>
    /// Re-sends a FAILED outbound attempt's stored payload to its endpoint,
    /// appending a new immutable attempt row (STT 51-57 "Thử lại").
    /// </summary>
    Task<ShareDataResultDto> RetryAsync(Guid logId);
}
