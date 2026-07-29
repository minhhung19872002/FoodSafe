using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.Notifications;

public interface INotificationAppService : IApplicationService
{
    Task<PagedResultDto<NotificationDto>> GetListAsync(NotificationFilterDto input);
    Task<UnreadCountDto> GetUnreadCountAsync();
    Task MarkReadAsync(Guid id);
    Task MarkAllReadAsync();
    Task DeleteAsync(Guid id);
}
