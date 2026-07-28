using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

/// <summary>
/// A stored, versioned partner-facing API specification (FR-50-05). Each upload
/// of a named specification produces a new immutable version row; at most one
/// version per <see cref="Name"/> may be <see cref="IsPublished"/> at a time
/// (the published version is the one partners download). The raw OpenAPI
/// document is stored verbatim in <see cref="Content"/>; the parsed
/// <see cref="Title"/>/<see cref="SpecVersion"/>/<see cref="OpenApiVersion"/> are
/// captured at upload time for listing and metadata display.
/// </summary>
public class ApiSpecification : FullAuditedAggregateRoot<Guid>
{
    public const int MaxNameLength = ApiSpecConsts.MaxNameLength;
    public const int MaxTitleLength = ApiSpecConsts.MaxTitleLength;
    public const int MaxSpecVersionLength = ApiSpecConsts.MaxSpecVersionLength;
    public const int MaxOpenApiVersionLength = ApiSpecConsts.MaxOpenApiVersionLength;
    public const int MaxDescriptionLength = ApiSpecConsts.MaxDescriptionLength;
    public const int MaxChecksumLength = ApiSpecConsts.MaxChecksumLength;

    public Guid OrganizationId { get; private set; }

    /// <summary>Logical specification name; groups every version. Unique per org.</summary>
    public string Name { get; private set; } = null!;

    /// <summary>1-based version, auto-incremented per <see cref="Name"/>.</summary>
    public int VersionNumber { get; private set; }

    /// <summary>Parsed <c>info.title</c>.</summary>
    public string Title { get; private set; } = null!;

    /// <summary>Parsed <c>info.version</c> (the API's own version, e.g. "1.2.0").</summary>
    public string SpecVersion { get; private set; } = null!;

    /// <summary>Declared OpenAPI/Swagger version (e.g. "3.0.3", "2.0").</summary>
    public string OpenApiVersion { get; private set; } = null!;

    public ApiSpecFormat Format { get; private set; }

    /// <summary>Raw uploaded document, stored verbatim.</summary>
    public string Content { get; private set; } = null!;

    public long SizeBytes { get; private set; }

    /// <summary>SHA-256 hex of <see cref="Content"/> — integrity + duplicate detection.</summary>
    public string Checksum { get; private set; } = null!;

    public string? Description { get; private set; }

    public bool IsPublished { get; private set; }

    public DateTime? PublishedAt { get; private set; }

    private ApiSpecification() { }

    public static ApiSpecification Create(
        Guid id,
        Guid organizationId,
        string name,
        int versionNumber,
        string title,
        string specVersion,
        string openApiVersion,
        ApiSpecFormat format,
        string content,
        string checksum,
        long sizeBytes,
        string? description)
    {
        Check.NotNullOrWhiteSpace(name, nameof(name), MaxNameLength);
        Check.NotNullOrWhiteSpace(title, nameof(title), MaxTitleLength);
        Check.NotNullOrWhiteSpace(specVersion, nameof(specVersion), MaxSpecVersionLength);
        Check.NotNullOrWhiteSpace(
            openApiVersion, nameof(openApiVersion), MaxOpenApiVersionLength);
        Check.NotNullOrWhiteSpace(content, nameof(content));
        Check.NotNullOrWhiteSpace(checksum, nameof(checksum), MaxChecksumLength);
        if (versionNumber < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(versionNumber));
        }

        return new ApiSpecification
        {
            Id = id,
            OrganizationId = organizationId,
            Name = name.Trim(),
            VersionNumber = versionNumber,
            Title = title.Trim(),
            SpecVersion = specVersion.Trim(),
            OpenApiVersion = openApiVersion.Trim(),
            Format = format,
            Content = content,
            Checksum = checksum,
            SizeBytes = sizeBytes,
            Description = Truncate(description, MaxDescriptionLength),
            IsPublished = false,
        };
    }

    public void Publish(DateTime now)
    {
        IsPublished = true;
        PublishedAt = now;
    }

    public void Unpublish()
    {
        IsPublished = false;
        PublishedAt = null;
    }

    public void UpdateDescription(string? description)
        => Description = Truncate(description, MaxDescriptionLength);

    private static string? Truncate(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..max];
    }
}
