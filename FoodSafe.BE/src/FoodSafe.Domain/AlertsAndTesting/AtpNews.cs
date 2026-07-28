using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.AlertsAndTesting;

public sealed class AtpNews : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string? Summary { get; private set; }
    public string Content { get; private set; } = string.Empty;
    public string? ThumbnailStoragePath { get; private set; }
    public string? Category { get; private set; }
    public string? Tags { get; private set; }
    public int ViewCount { get; private set; }
    public NewsStatus Status { get; private set; }
    public DateTime? PublishedAt { get; private set; }
    public Guid? PublishedById { get; private set; }
    public Guid? RecalledById { get; private set; }
    public DateTime? RecalledAt { get; private set; }
    public Guid? RejectedById { get; private set; }
    public DateTime? RejectedAt { get; private set; }
    public string? RejectedReason { get; private set; }
    public bool IsPublic { get; private set; }
    public bool IsFeatured { get; private set; }
    public AlertSource Source { get; private set; } = AlertSource.Internal;
    public string? ReporterName { get; private set; }
    public string? ReporterContact { get; private set; }

    private readonly List<NewsLinkedAlert> _linkedAlerts = new();
    public IReadOnlyList<NewsLinkedAlert> LinkedAlerts => _linkedAlerts.AsReadOnly();

    private AtpNews() { }

    private AtpNews(Guid id) : base(id) { }

    public static AtpNews Create(
        Guid id,
        Guid organizationId,
        string title,
        string content,
        string? summary = null,
        string? thumbnailStoragePath = null,
        string? category = null,
        string? tags = null,
        bool isFeatured = false)
    {
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        return new AtpNews(id)
        {
            OrganizationId = organizationId,
            Title = title.Trim(),
            Content = content.Trim(),
            Summary = Normalize(summary),
            ThumbnailStoragePath = Normalize(thumbnailStoragePath),
            Category = Normalize(category),
            Tags = Normalize(tags),
            IsFeatured = isFeatured,
            Status = NewsStatus.Draft,
            IsPublic = false,
            Source = AlertSource.Internal,
            ViewCount = 0
        };
    }

    public static AtpNews CreateCitizenSubmission(
        Guid id,
        Guid organizationId,
        string title,
        string content,
        string? reporterName,
        string? reporterContact)
    {
        var news = Create(id, organizationId, title, content,
            category: "Phản ánh người dân");
        news.Source = AlertSource.PublicReport;
        news.ReporterName = Normalize(reporterName);
        news.ReporterContact = Normalize(reporterContact);
        return news;
    }

    public void Update(
        string title,
        string content,
        string? summary,
        string? thumbnailStoragePath,
        string? category,
        string? tags,
        bool isFeatured)
    {
        EnsureDraft();

        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        Title = title.Trim();
        Content = content.Trim();
        Summary = Normalize(summary);
        ThumbnailStoragePath = Normalize(thumbnailStoragePath);
        Category = Normalize(category);
        Tags = Normalize(tags);
        IsFeatured = isFeatured;
    }

    public void Publish(Guid publisherId, DateTime publishedAt, bool isPublic = true)
    {
        EnsureDraft();

        Status = NewsStatus.Published;
        PublishedById = publisherId;
        PublishedAt = publishedAt;
        IsPublic = isPublic;
    }

    /// <summary>
    /// Moderation refusal of a draft — used for citizen activity reports that are not
    /// published (FR-30-07). Kept with its reason instead of deleted so the decision
    /// stays auditable.
    /// </summary>
    public void Reject(Guid rejecterId, DateTime rejectedAt, string reason)
    {
        EnsureDraft();

        Check.NotNullOrWhiteSpace(reason, nameof(reason), 1000);

        Status = NewsStatus.Rejected;
        RejectedById = rejecterId;
        RejectedAt = rejectedAt;
        RejectedReason = reason.Trim();
        IsPublic = false;
    }

    public void Recall(Guid recallerId, DateTime recalledAt)
    {
        if (Status != NewsStatus.Published)
            throw new BusinessException(FoodSafeDomainErrorCodes.News.CanOnlyRecallPublished);

        Status = NewsStatus.Recalled;
        RecalledById = recallerId;
        RecalledAt = recalledAt;
    }

    public void IncrementViewCount() => ViewCount++;

    public NewsLinkedAlert LinkAlert(Guid linkId, Guid alertId)
    {
        if (_linkedAlerts.Any(la => la.AlertId == alertId))
            throw new BusinessException(FoodSafeDomainErrorCodes.News.DuplicateLinkedAlert);

        var link = new NewsLinkedAlert(linkId, Id, alertId);
        _linkedAlerts.Add(link);
        return link;
    }

    public void UnlinkAlert(Guid alertId)
    {
        var link = _linkedAlerts.FirstOrDefault(la => la.AlertId == alertId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.News.LinkedAlertNotFound);
        _linkedAlerts.Remove(link);
    }

    private void EnsureDraft()
    {
        if (Status != NewsStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.News.InvalidStatusTransition);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
