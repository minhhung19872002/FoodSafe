using Volo.Abp.Domain.Entities;

namespace FoodSafe.AlertsAndTesting;

public sealed class NewsLinkedAlert : Entity<Guid>
{
    public Guid NewsId { get; private set; }
    public Guid AlertId { get; private set; }

    private NewsLinkedAlert() { }

    internal NewsLinkedAlert(Guid id, Guid newsId, Guid alertId) : base(id)
    {
        NewsId = newsId;
        AlertId = alertId;
    }
}
