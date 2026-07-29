using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.Notifications;

public sealed class AppNotification : CreationAuditedAggregateRoot<Guid>
{
    public Guid RecipientUserId { get; private set; }
    public Guid RecipientOrganizationId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string? EntityType { get; private set; }
    public Guid? EntityId { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }

    private AppNotification() { }

    public const int MaxMessageLength = 2000;

    public static AppNotification Create(
        Guid id,
        Guid recipientUserId,
        Guid recipientOrganizationId,
        NotificationType type,
        string title,
        string message,
        string? entityType = null,
        Guid? entityId = null)
    {
        if (recipientUserId == Guid.Empty)
            throw new ArgumentException("Recipient user ID must not be empty.", nameof(recipientUserId));
        if (recipientOrganizationId == Guid.Empty)
            throw new ArgumentException("Recipient organization ID must not be empty.", nameof(recipientOrganizationId));

        return new AppNotification
        {
            Id = id,
            RecipientUserId = recipientUserId,
            RecipientOrganizationId = recipientOrganizationId,
            Type = type,
            Title = Check.NotNullOrWhiteSpace(title, nameof(title), 500),
            Message = Check.NotNullOrWhiteSpace(message, nameof(message), MaxMessageLength),
            EntityType = entityType,
            EntityId = entityId,
            IsRead = false,
        };
    }

    public void MarkRead(DateTime readAt)
    {
        if (IsRead) return;
        IsRead = true;
        ReadAt = readAt;
    }
}
