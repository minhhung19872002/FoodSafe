using Microsoft.Extensions.Logging;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Guids;
using Volo.Abp.Uow;

namespace FoodSafe.Notifications;

public class NotificationCreator(
    IRepository<AppNotification, Guid> notifications,
    IGuidGenerator guidGenerator,
    INotificationRealTimeNotifier realTimeNotifier,
    IUnitOfWorkManager unitOfWorkManager,
    ILogger<NotificationCreator> logger) :
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

        var uow = unitOfWorkManager.Current;
        if (uow is not null)
        {
            uow.OnCompleted(async () =>
            {
                foreach (var item in items)
                {
                    await SendRealTimeAsync(item);
                }
            });
        }
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

        var uow = unitOfWorkManager.Current;
        if (uow is not null)
        {
            uow.OnCompleted(async () =>
            {
                await SendRealTimeAsync(notification);
            });
        }
    }

    private async Task SendRealTimeAsync(AppNotification n)
    {
        try
        {
            var dto = new NotificationDto
            {
                Id = n.Id,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                EntityType = n.EntityType,
                EntityId = n.EntityId,
                IsRead = n.IsRead,
                ReadAt = n.ReadAt,
                CreationTime = n.CreationTime,
            };
            await realTimeNotifier.SendToUserAsync(n.RecipientUserId, dto);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send real-time notification {Id} to user {UserId}",
                n.Id, n.RecipientUserId);
        }
    }
}
