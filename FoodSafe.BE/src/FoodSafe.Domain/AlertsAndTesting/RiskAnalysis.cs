using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.AlertsAndTesting;

public sealed class RiskAnalysis : FullAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Content { get; private set; } = string.Empty;
    public AlertCategory Category { get; private set; }
    public RiskLevel RiskLevel { get; private set; }
    public string? RelatedProducts { get; private set; }
    public List<Guid> ProductGroupIds { get; private set; } = [];
    public string? Evidence { get; private set; }
    public string? Recommendations { get; private set; }
    public RiskAnalysisStatus Status { get; private set; }
    public bool IsPublic { get; private set; }
    public Guid? PublishedById { get; private set; }
    public DateTime? PublishedAt { get; private set; }

    private RiskAnalysis() { }

    private RiskAnalysis(Guid id) : base(id) { }

    public static RiskAnalysis Create(
        Guid id,
        Guid organizationId,
        string title,
        string content,
        AlertCategory category,
        RiskLevel riskLevel,
        List<Guid>? productGroupIds = null,
        string? relatedProducts = null,
        string? evidence = null,
        string? recommendations = null)
    {
        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        return new RiskAnalysis(id)
        {
            OrganizationId = organizationId,
            Title = title.Trim(),
            Content = content.Trim(),
            Category = category,
            RiskLevel = riskLevel,
            ProductGroupIds = productGroupIds ?? [],
            RelatedProducts = Normalize(relatedProducts),
            Evidence = Normalize(evidence),
            Recommendations = Normalize(recommendations),
            Status = RiskAnalysisStatus.Draft,
            IsPublic = false
        };
    }

    public void Update(
        string title,
        string content,
        AlertCategory category,
        RiskLevel riskLevel,
        List<Guid>? productGroupIds,
        string? relatedProducts,
        string? evidence,
        string? recommendations)
    {
        EnsureDraft();

        Check.NotNullOrWhiteSpace(title, nameof(title), 500);
        Check.NotNullOrWhiteSpace(content, nameof(content));

        Title = title.Trim();
        Content = content.Trim();
        Category = category;
        RiskLevel = riskLevel;
        ProductGroupIds = productGroupIds ?? [];
        RelatedProducts = Normalize(relatedProducts);
        Evidence = Normalize(evidence);
        Recommendations = Normalize(recommendations);
    }

    public void Publish(Guid publisherId, DateTime publishedAt, bool isPublic = true)
    {
        EnsureDraft();

        Status = RiskAnalysisStatus.Published;
        PublishedById = publisherId;
        PublishedAt = publishedAt;
        IsPublic = isPublic;
    }

    private void EnsureDraft()
    {
        if (Status != RiskAnalysisStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.RiskAnalysis.CannotModifyNonDraft);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
