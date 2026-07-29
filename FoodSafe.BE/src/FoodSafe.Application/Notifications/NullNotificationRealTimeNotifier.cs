using Volo.Abp.DependencyInjection;

namespace FoodSafe.Notifications;

public class NullNotificationRealTimeNotifier : INotificationRealTimeNotifier, ITransientDependency
{
    public Task SendToUserAsync(Guid userId, NotificationDto notification) => Task.CompletedTask;
    public Task SendToUsersAsync(IEnumerable<Guid> userIds, NotificationDto notification) => Task.CompletedTask;
}
