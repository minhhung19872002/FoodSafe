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

public sealed class AuditLogDetailDto : EntityDto<Guid>
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
    public string? ApplicationName { get; set; }
    public string? Exceptions { get; set; }
    public string? Comments { get; set; }
    public List<AuditLogActionDto> Actions { get; set; } = [];
    public List<AuditLogEntityChangeDto> EntityChanges { get; set; } = [];
}

public sealed class AuditLogActionDto
{
    public string? ServiceName { get; set; }
    public string? MethodName { get; set; }
    public string? Parameters { get; set; }
    public DateTime ExecutionTime { get; set; }
    public int ExecutionDuration { get; set; }
}

public sealed class AuditLogEntityChangeDto
{
    public string? EntityTypeFullName { get; set; }
    public string? EntityId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public DateTime ChangeTime { get; set; }
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
