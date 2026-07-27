using Volo.Abp.Application.Dtos;

namespace FoodSafe.DataIntegration;

public class ApiCallLogDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public ApiCallDirection Direction { get; set; }
    public string ExternalSystemName { get; set; } = null!;
    public string EndpointUrl { get; set; } = null!;
    public string HttpMethod { get; set; } = null!;
    public int? ResponseStatusCode { get; set; }
    public DateTime CalledAt { get; set; }
    public long DurationMs { get; set; }
    public bool IsSuccess { get; set; }
    public string? ErrorMessage { get; set; }
    public SharedDataType DataType { get; set; }
    public DateTime CreationTime { get; set; }
}

public class ApiCallLogDetailDto : ApiCallLogDto
{
    public string? RequestHeaders { get; set; }
    public string? RequestBody { get; set; }
    public string? ResponseBody { get; set; }
}

public class ApiCallLogFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public ApiCallDirection? Direction { get; set; }
    public string? ExternalSystem { get; set; }
    public bool? IsSuccess { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public SharedDataType? DataType { get; set; }
}
