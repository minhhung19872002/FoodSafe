using Volo.Abp.Application.Dtos;

namespace FoodSafe.Notifications;

public class NotificationDto
{
    public Guid Id { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public Guid? EntityId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class NotificationFilterDto : PagedResultRequestDto
{
    public NotificationFilterDto()
    {
        MaxResultCount = 20;
    }

    public override int MaxResultCount
    {
        get => base.MaxResultCount;
        set => base.MaxResultCount = Math.Min(value, 50);
    }

    public bool? IsRead { get; set; }
}

public class UnreadCountDto
{
    public int Count { get; set; }
}
