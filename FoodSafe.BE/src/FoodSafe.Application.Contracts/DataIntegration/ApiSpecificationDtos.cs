using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Metadata view of one stored partner API specification version (FR-50-05).
/// The raw document body is never carried here — use the download endpoint.
/// </summary>
public class ApiSpecificationDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = null!;
    public int VersionNumber { get; set; }
    public string Title { get; set; } = null!;
    public string SpecVersion { get; set; } = null!;
    public string OpenApiVersion { get; set; } = null!;
    public ApiSpecFormat Format { get; set; }
    public long SizeBytes { get; set; }
    public string Checksum { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public DateTime CreationTime { get; set; }
}

public class UploadApiSpecificationDto
{
    [Required]
    [StringLength(ApiSpecConsts.MaxNameLength)]
    [RegularExpression("^[a-zA-Z0-9_-]+$",
        ErrorMessage = "Tên đặc tả chỉ gồm chữ, số, gạch ngang, gạch dưới.")]
    public string Name { get; set; } = null!;

    /// <summary>Raw OpenAPI 2.0/3.0 document, JSON or YAML. Validated server-side.</summary>
    [Required]
    public string Content { get; set; } = null!;

    [StringLength(ApiSpecConsts.MaxDescriptionLength)]
    public string? Description { get; set; }
}

public class UpdateApiSpecMetadataDto
{
    [StringLength(ApiSpecConsts.MaxDescriptionLength)]
    public string? Description { get; set; }
}

public class ApiSpecificationFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? Name { get; set; }
    public bool? IsPublished { get; set; }
}

/// <summary>The downloadable document body plus the headers a caller needs to save it.</summary>
public class ApiSpecificationDownloadDto
{
    public string Content { get; set; } = null!;
    public ApiSpecFormat Format { get; set; }
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
}

public interface IApiSpecificationAppService : IApplicationService
{
    Task<PagedResultDto<ApiSpecificationDto>> GetListAsync(ApiSpecificationFilterDto input);
    Task<ApiSpecificationDto> GetAsync(Guid id);
    Task<ApiSpecificationDto> UploadAsync(UploadApiSpecificationDto input);
    Task<ApiSpecificationDto> UpdateMetadataAsync(Guid id, UpdateApiSpecMetadataDto input);
    Task<ApiSpecificationDto> PublishAsync(Guid id);
    Task<ApiSpecificationDto> UnpublishAsync(Guid id);
    Task DeleteAsync(Guid id);

    /// <summary>Authenticated management download of any stored version by id.</summary>
    Task<ApiSpecificationDownloadDto> DownloadAsync(Guid id);

    /// <summary>
    /// Partner-facing download of the currently published version of a named spec.
    /// Returns null when no published version exists (caller maps to 404).
    /// </summary>
    Task<ApiSpecificationDownloadDto?> GetPublishedByNameAsync(string name);
}
