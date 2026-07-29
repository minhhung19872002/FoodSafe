using System.Net;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.AuditLogging;

namespace FoodSafe.Dashboard;

[Authorize(FoodSafePermissions.SystemAdministration.AuditLogs)]
public class AuditLogAppService : ApplicationService
{
    private readonly IAuditLogRepository _auditLogs;

    public AuditLogAppService(IAuditLogRepository auditLogs)
    {
        _auditLogs = auditLogs;
    }

    public async Task<PagedResultDto<AuditLogDto>> GetListAsync(GetAuditLogListInput input)
    {
        var sorting = NormalizeSorting(input.Sorting);

        var totalCount = await _auditLogs.GetCountAsync(
            startTime: input.StartTime,
            endTime: input.EndTime,
            httpMethod: input.HttpMethod,
            url: input.Filter,
            userName: input.UserName,
            httpStatusCode: input.HttpStatusCode.HasValue ? (HttpStatusCode)input.HttpStatusCode.Value : null,
            hasException: input.HasException,
            cancellationToken: CancellationToken.None);

        var logs = await _auditLogs.GetListAsync(
            sorting: sorting,
            maxResultCount: input.MaxResultCount,
            skipCount: input.SkipCount,
            startTime: input.StartTime,
            endTime: input.EndTime,
            httpMethod: input.HttpMethod,
            url: input.Filter,
            userName: input.UserName,
            httpStatusCode: input.HttpStatusCode.HasValue ? (HttpStatusCode)input.HttpStatusCode.Value : null,
            hasException: input.HasException,
            includeDetails: false,
            cancellationToken: CancellationToken.None);

        var items = logs.Select(log => new AuditLogDto
        {
            Id = log.Id,
            ExecutionTime = log.ExecutionTime,
            UserName = log.UserName,
            HttpMethod = log.HttpMethod,
            Url = log.Url,
            HttpStatusCode = log.HttpStatusCode,
            ExecutionDuration = log.ExecutionDuration,
            ClientIpAddress = log.ClientIpAddress,
            BrowserInfo = log.BrowserInfo,
            CorrelationId = log.CorrelationId,
            HasException = !string.IsNullOrWhiteSpace(log.Exceptions)
        }).ToList();

        return new PagedResultDto<AuditLogDto>(totalCount, items);
    }

    public async Task<AuditLogDetailDto> GetAsync(Guid id)
    {
        var log = await _auditLogs.GetAsync(id, includeDetails: true);

        return new AuditLogDetailDto
        {
            Id = log.Id,
            ExecutionTime = log.ExecutionTime,
            UserName = log.UserName,
            HttpMethod = log.HttpMethod,
            Url = log.Url,
            HttpStatusCode = log.HttpStatusCode,
            ExecutionDuration = log.ExecutionDuration,
            ClientIpAddress = log.ClientIpAddress,
            BrowserInfo = log.BrowserInfo,
            CorrelationId = log.CorrelationId,
            ApplicationName = log.ApplicationName,
            Exceptions = log.Exceptions,
            Comments = log.Comments,
            Actions = log.Actions
                .OrderBy(a => a.ExecutionTime)
                .Select(a => new AuditLogActionDto
                {
                    ServiceName = a.ServiceName,
                    MethodName = a.MethodName,
                    Parameters = a.Parameters,
                    ExecutionTime = a.ExecutionTime,
                    ExecutionDuration = a.ExecutionDuration
                }).ToList(),
            EntityChanges = log.EntityChanges
                .OrderBy(c => c.ChangeTime)
                .Select(c => new AuditLogEntityChangeDto
                {
                    EntityTypeFullName = c.EntityTypeFullName,
                    EntityId = c.EntityId,
                    ChangeType = c.ChangeType.ToString(),
                    ChangeTime = c.ChangeTime,
                    PropertyChanges = c.PropertyChanges
                        .Select(p => new AuditLogPropertyChangeDto
                        {
                            PropertyName = p.PropertyName,
                            PropertyTypeFullName = p.PropertyTypeFullName,
                            OriginalValue = p.OriginalValue,
                            NewValue = p.NewValue
                        }).ToList()
                }).ToList()
        };
    }

    private static string NormalizeSorting(string? sorting)
    {
        if (string.IsNullOrWhiteSpace(sorting))
            return "ExecutionTime DESC";

        return sorting.Contains("executionTime", StringComparison.OrdinalIgnoreCase)
            ? sorting
            : "ExecutionTime DESC";
    }
}
