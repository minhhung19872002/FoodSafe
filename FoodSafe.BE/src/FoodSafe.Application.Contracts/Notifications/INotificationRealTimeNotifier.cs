namespace FoodSafe.Notifications;

public interface INotificationRealTimeNotifier
{
    Task SendToUserAsync(Guid userId, NotificationDto notification);
    Task SendToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification);
}
