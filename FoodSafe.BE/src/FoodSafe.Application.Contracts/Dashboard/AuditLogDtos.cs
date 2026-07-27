using FoodSafe.BusinessManagement;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

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
    public string? UserId { get; set; }
    public string? HttpMethod { get; set; }
    public string? Url { get; set; }
    public int? HttpStatusCode { get; set; }
    public int ExecutionDuration { get; set; }
    public string? ClientIpAddress { get; set; }
    public string? BrowserInfo { get; set; }
    public string? CorrelationId { get; set; }
    public string? Exceptions { get; set; }
    public List<AuditLogActionDto> Actions { get; set; } = [];
    public List<EntityChangeDto> EntityChanges { get; set; } = [];
}

public sealed class AuditLogActionDto
{
    public string ServiceName { get; set; } = string.Empty;
    public string MethodName { get; set; } = string.Empty;
    public string? Parameters { get; set; }
    public int ExecutionDuration { get; set; }
}

public sealed class EntityChangeDto
{
    public string EntityTypeFullName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string ChangeType { get; set; } = string.Empty;
    public List<EntityPropertyChangeDto> PropertyChanges { get; set; } = [];
}

public sealed class EntityPropertyChangeDto
{
    public string PropertyName { get; set; } = string.Empty;
    public string? OriginalValue { get; set; }
    public string? NewValue { get; set; }
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

public interface IAuditLogExcelAppService : IApplicationService
{
    Task<ExcelDownloadDto> ExportAsync(GetAuditLogListInput input);
}
