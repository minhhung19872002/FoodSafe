using FoodSafe.Organizations;
using FoodSafe.Security;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;

namespace FoodSafe.Notifications;

public record NotificationRecipient(Guid UserId, Guid OrganizationId);

public interface INotificationRecipientResolver
{
    Task<List<NotificationRecipient>> GetUsersInOrganizationAsync(
        Guid organizationId, CancellationToken ct = default);

    Task<List<NotificationRecipient>> GetUsersInParentOrganizationAsync(
        Guid childOrganizationId, CancellationToken ct = default);

    Task<NotificationRecipient?> GetSingleUserAsync(
        Guid userId, CancellationToken ct = default);
}

public class NotificationRecipientResolver(
    IRepository<AppUserProfile, Guid> profiles,
    IRepository<Organization, Guid> organizations,
    IAsyncQueryableExecuter asyncExecuter) :
    INotificationRecipientResolver,
    ITransientDependency
{
    public async Task<List<NotificationRecipient>> GetUsersInOrganizationAsync(
        Guid organizationId, CancellationToken ct = default)
    {
        var query = await profiles.GetQueryableAsync();
        return await asyncExecuter.ToListAsync(
            query.Where(p => p.OrganizationId == organizationId)
                 .Select(p => new NotificationRecipient(p.UserId, p.OrganizationId)),
            ct);
    }

    public async Task<List<NotificationRecipient>> GetUsersInParentOrganizationAsync(
        Guid childOrganizationId, CancellationToken ct = default)
    {
        var orgQuery = await organizations.GetQueryableAsync();
        var parentId = await asyncExecuter.FirstOrDefaultAsync(
            orgQuery.Where(o => o.Id == childOrganizationId)
                    .Select(o => o.ParentId),
            ct);

        if (parentId is null) return [];

        return await GetUsersInOrganizationAsync(parentId.Value, ct);
    }

    public async Task<NotificationRecipient?> GetSingleUserAsync(
        Guid userId, CancellationToken ct = default)
    {
        var query = await profiles.GetQueryableAsync();
        return await asyncExecuter.FirstOrDefaultAsync(
            query.Where(p => p.UserId == userId)
                 .Select(p => new NotificationRecipient(p.UserId, p.OrganizationId)),
            ct);
    }
}
