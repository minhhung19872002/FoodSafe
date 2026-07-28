using FoodSafe.Organizations;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;

namespace FoodSafe.Reporting;

/// <summary>
/// Gắn tên đơn vị và tên người thao tác vào DTO báo cáo theo lô,
/// tránh trả GUID thô cho giao diện.
/// </summary>
public class ReportNameEnricher : ITransientDependency
{
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<IdentityUser, Guid> _users;

    public ReportNameEnricher(
        IRepository<Organization, Guid> organizations,
        IRepository<IdentityUser, Guid> users)
    {
        _organizations = organizations;
        _users = users;
    }

    public async Task EnrichAsync(
        IReadOnlyCollection<IReportActorsDto> reports,
        CancellationToken cancellationToken = default)
    {
        if (reports.Count == 0)
            return;

        var organizationIds = reports.Select(r => r.OrganizationId).ToHashSet();
        var userIds = reports
            .SelectMany(r => new[]
            {
                r.SubmittedById, r.VerifiedById, r.ReturnedById, r.CompletedById
            })
            .OfType<Guid>()
            .ToHashSet();

        var organizations = await _organizations.GetListAsync(
            x => organizationIds.Contains(x.Id),
            cancellationToken: cancellationToken);
        var organizationNames = organizations.ToDictionary(x => x.Id, x => x.Name);

        var userNames = new Dictionary<Guid, string>();
        if (userIds.Count > 0)
        {
            var users = await _users.GetListAsync(
                x => userIds.Contains(x.Id),
                cancellationToken: cancellationToken);
            foreach (var user in users)
            {
                userNames[user.Id] = string.IsNullOrWhiteSpace(user.Name)
                    ? user.UserName
                    : user.Name;
            }
        }

        foreach (var report in reports)
        {
            report.OrganizationName =
                organizationNames.GetValueOrDefault(report.OrganizationId);
            report.SubmittedByName = ResolveUserName(report.SubmittedById, userNames);
            report.VerifiedByName = ResolveUserName(report.VerifiedById, userNames);
            report.ReturnedByName = ResolveUserName(report.ReturnedById, userNames);
            report.CompletedByName = ResolveUserName(report.CompletedById, userNames);
        }
    }

    private static string? ResolveUserName(
        Guid? userId,
        IReadOnlyDictionary<Guid, string> userNames) =>
        userId.HasValue ? userNames.GetValueOrDefault(userId.Value) : null;
}
