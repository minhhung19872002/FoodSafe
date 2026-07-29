using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Guids;

namespace FoodSafe.Notifications;

public class NotificationCreator(
    IRepository<AppNotification, Guid> notifications,
    IGuidGenerator guidGenerator) :
    ITransientDependency
{
    public async Task CreateForRecipientsAsync(
        IEnumerable<NotificationRecipient> recipients,
        NotificationType type,
        string title,
        string message,
        string? entityType,
        Guid? entityId,
        CancellationToken ct = default)
    {
        var items = recipients
            .Select(r => AppNotification.Create(
                guidGenerator.Create(),
                r.UserId,
                r.OrganizationId,
                type, title, message,
                entityType, entityId))
            .ToList();

        if (items.Count == 0) return;

        await notifications.InsertManyAsync(items, autoSave: true, cancellationToken: ct);
    }

    public async Task CreateForUserAsync(
        NotificationRecipient recipient,
        NotificationType type,
        string title,
        string message,
        string? entityType,
        Guid? entityId,
        CancellationToken ct = default)
    {
        var notification = AppNotification.Create(
            guidGenerator.Create(),
            recipient.UserId,
            recipient.OrganizationId,
            type, title, message,
            entityType, entityId);

        await notifications.InsertAsync(notification, autoSave: true, cancellationToken: ct);
    }
}
