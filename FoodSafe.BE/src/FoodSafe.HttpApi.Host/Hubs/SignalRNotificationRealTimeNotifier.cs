using FoodSafe.Notifications;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Volo.Abp.DependencyInjection;

namespace FoodSafe.Hubs;

public class SignalRNotificationRealTimeNotifier(
    IHubContext<NotificationHub> hubContext,
    ILogger<SignalRNotificationRealTimeNotifier> logger) :
    INotificationRealTimeNotifier, ITransientDependency
{
    public async Task SendToUserAsync(Guid userId, NotificationDto notification)
    {
        logger.LogInformation(
            "[SignalR] Sending notification {Id} to user {UserId}",
            notification.Id, userId);

        await hubContext.Clients
            .User(userId.ToString())
            .SendAsync("ReceiveNotification", notification);
    }

    public async Task SendToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification)
    {
        var ids = userIds.Select(id => id.ToString()).ToList();
        if (ids.Count == 0) return;

        logger.LogInformation(
            "[SignalR] Sending notification {Id} to {Count} users",
            notification.Id, ids.Count);

        await hubContext.Clients
            .Users(ids)
            .SendAsync("ReceiveNotification", notification);
    }
}
