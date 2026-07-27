using Volo.Abp.Application.Dtos;

namespace FoodSafe.Application.Contracts.Dashboard;

public sealed class AuditLogDto : EntityDto<Guid>
{
    public DateTime ExecutionTime { get; set; }
    public string? UserName { get; set; }
    public string? HttpMethod { get; set; }
    public string? Url { get; set; }
    public int? HttpStatusCode { get; set; }
    public int ExecutionDuration { get; set; }
    public string? ClientIpAddress { get; set; }
    public string? BrowserInfo { get; set; }
    public string? CorrelationId { get; set; }
    public bool HasException { get; set; }
}

public sealed class GetAuditLogListInput : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? HttpMethod { get; set; }
    public int? HttpStatusCode { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public bool? HasException { get; set; }
}
