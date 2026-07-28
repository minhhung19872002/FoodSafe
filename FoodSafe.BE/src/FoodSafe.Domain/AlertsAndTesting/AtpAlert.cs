using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.AlertsAndTesting;

public sealed class AtpAlert : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string? AlertNumber { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public AlertCategory Category { get; private set; }
    public AlertSeverity Severity { get; private set; }
    public string? AffectedArea { get; private set; }
    public string? AffectedProducts { get; private set; }
    public Guid? BusinessId { get; private set; }
    public AlertSource Source { get; private set; }

    public string? ReporterName { get; private set; }
    public string? ReporterPhone { get; private set; }
    public string? ReporterEmail { get; private set; }

    public AlertStatus Status { get; private set; }
    public Guid? PublishedById { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public Guid? RecalledById { get; private set; }
    public DateTime? RecalledAt { get; private set; }
    public string? RecallReason { get; private set; }
    public bool IsPublic { get; private set; }

    private AtpAlert() { }

    private AtpAlert(Guid id) : base(id) { }

    public static AtpAlert Create(
        Guid id,
        Guid organizationId,
        string title,
        string content,
        AlertCategory category,
        AlertSeverity severity,
        AlertSource source,
        string? alertNumber = null,
        string? affectedArea = null,
        string? affectedProducts = null,
        Guid? businessId = null,
        string? reporterName = null,
        string? reporterPhone = null,
        string? reporterEmail = null)
    {
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        return new AtpAlert(id)
        {
            OrganizationId = organizationId,
            AlertNumber = Normalize(alertNumber),
            Title = title.Trim(),
            Content = content.Trim(),
            Category = category,
            Severity = severity,
            AffectedArea = Normalize(affectedArea),
            AffectedProducts = Normalize(affectedProducts),
            BusinessId = businessId,
            Source = source,
            ReporterName = Normalize(reporterName),
            ReporterPhone = Normalize(reporterPhone),
            ReporterEmail = Normalize(reporterEmail),
            Status = AlertStatus.Draft,
            IsPublic = false
        };
    }

    public void Update(
        string title,
        string content,
        AlertCategory category,
        AlertSeverity severity,
        AlertSource source,
        string? alertNumber,
        string? affectedArea,
        string? affectedProducts,
        Guid? businessId,
        string? reporterName,
        string? reporterPhone,
        string? reporterEmail)
    {
        EnsureDraft();

        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        AlertNumber = Normalize(alertNumber);
        Title = title.Trim();
        Content = content.Trim();
        Category = category;
        Severity = severity;
        Source = source;
        AffectedArea = Normalize(affectedArea);
        AffectedProducts = Normalize(affectedProducts);
        BusinessId = businessId;
        ReporterName = Normalize(reporterName);
        ReporterPhone = Normalize(reporterPhone);
        ReporterEmail = Normalize(reporterEmail);
    }

    public void Publish(Guid publisherId, DateTime publishedAt, bool isPublic = true)
    {
        EnsureDraft();

        Status = AlertStatus.Published;
        PublishedById = publisherId;
        PublishedAt = publishedAt;
        IsPublic = isPublic;
    }

    public void Recall(Guid recallerId, DateTime recalledAt, string reason)
    {
        if (Status != AlertStatus.Published)
            throw new BusinessException(FoodSafeDomainErrorCodes.Alert.CanOnlyRecallPublished);

        Check.NotNullOrWhiteSpace(reason, nameof(reason));

        Status = AlertStatus.Recalled;
        RecalledById = recallerId;
        RecalledAt = recalledAt;
        RecallReason = reason.Trim();
    }

    private void EnsureDraft()
    {
        if (Status != AlertStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Alert.InvalidStatusTransition);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
