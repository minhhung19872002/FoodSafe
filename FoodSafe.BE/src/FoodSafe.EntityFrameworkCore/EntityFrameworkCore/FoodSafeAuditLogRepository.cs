using System;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Volo.Abp.AuditLogging;
using Volo.Abp.AuditLogging.EntityFrameworkCore;
using Volo.Abp.EntityFrameworkCore;

namespace FoodSafe.EntityFrameworkCore;

// Overrides ABP's default EfCoreAuditLogRepository, which matches UserName with an
// exact "==" comparison (unlike Url, which already uses Contains). Audit log search
// by user name should behave the same as URL search: partial/substring match.
public class FoodSafeAuditLogRepository : EfCoreAuditLogRepository
{
    public FoodSafeAuditLogRepository(IDbContextProvider<IAuditLoggingDbContext> dbContextProvider)
        : base(dbContextProvider)
    {
    }

    protected override async Task<IQueryable<AuditLog>> GetListQueryAsync(
        DateTime? startTime = null,
        DateTime? endTime = null,
        string httpMethod = null,
        string url = null,
        string clientId = null,
        Guid? userId = null,
        string userName = null,
        string applicationName = null,
        string clientIpAddress = null,
        string correlationId = null,
        int? maxExecutionDuration = null,
        int? minExecutionDuration = null,
        bool? hasException = null,
        HttpStatusCode? httpStatusCode = null,
        bool includeDetails = false)
    {
        var nHttpStatusCode = (int?)httpStatusCode;

        IQueryable<AuditLog> query = (await GetDbSetAsync()).AsNoTracking()
            .IncludeDetails(includeDetails);

        if (startTime.HasValue)
            query = query.Where(auditLog => auditLog.ExecutionTime >= startTime);
        if (endTime.HasValue)
            query = query.Where(auditLog => auditLog.ExecutionTime <= endTime);
        if (hasException.HasValue && hasException.Value)
            query = query.Where(auditLog => auditLog.Exceptions != null && auditLog.Exceptions != "");
        if (hasException.HasValue && !hasException.Value)
            query = query.Where(auditLog => auditLog.Exceptions == null || auditLog.Exceptions == "");
        if (!string.IsNullOrEmpty(httpMethod))
            query = query.Where(auditLog => auditLog.HttpMethod == httpMethod);
        if (!string.IsNullOrEmpty(url))
            query = query.Where(auditLog => auditLog.Url != null && auditLog.Url.Contains(url));
        if (!string.IsNullOrEmpty(clientId))
            query = query.Where(auditLog => auditLog.ClientId == clientId);
        if (userId != null)
            query = query.Where(auditLog => auditLog.UserId == userId);
        if (!string.IsNullOrEmpty(userName))
            query = query.Where(auditLog => auditLog.UserName != null && auditLog.UserName.Contains(userName));
        if (!string.IsNullOrEmpty(applicationName))
            query = query.Where(auditLog => auditLog.ApplicationName == applicationName);
        if (!string.IsNullOrEmpty(clientIpAddress))
            query = query.Where(auditLog => auditLog.ClientIpAddress != null && auditLog.ClientIpAddress == clientIpAddress);
        if (!string.IsNullOrEmpty(correlationId))
            query = query.Where(auditLog => auditLog.CorrelationId == correlationId);
        if (httpStatusCode != null && httpStatusCode > 0)
            query = query.Where(auditLog => auditLog.HttpStatusCode == nHttpStatusCode);
        if (maxExecutionDuration != null && maxExecutionDuration.Value > 0)
            query = query.Where(auditLog => auditLog.ExecutionDuration <= maxExecutionDuration);
        if (minExecutionDuration != null && minExecutionDuration.Value > 0)
            query = query.Where(auditLog => auditLog.ExecutionDuration >= minExecutionDuration);

        return query;
    }
}
