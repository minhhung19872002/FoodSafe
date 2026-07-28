using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Dtos;

namespace FoodSafe.DataIntegration;

public class ApiEndpointDto : EntityDto<Guid>
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = null!;
    public string Url { get; set; } = null!;
    public string HttpMethod { get; set; } = null!;
    public string ExternalSystem { get; set; } = null!;
    public string? Description { get; set; }
    public ApiAuthType AuthType { get; set; }
    public ApiEndpointStatus Status { get; set; }

    /// <summary>
    /// True when an outbound-auth credential is stored. The credential value
    /// itself is write-only and never returned to the client.
    /// </summary>
    public bool HasCredential { get; set; }

    public DateTime CreationTime { get; set; }
}

public class CreateUpdateApiEndpointDto
{
    [Required]
    [StringLength(256)]
    public string Name { get; set; } = null!;

    [Required]
    [StringLength(2048)]
    public string Url { get; set; } = null!;

    [Required]
    [StringLength(10)]
    public string HttpMethod { get; set; } = null!;

    [Required]
    [StringLength(256)]
    public string ExternalSystem { get; set; } = null!;

    [StringLength(1024)]
    public string? Description { get; set; }

    public ApiAuthType AuthType { get; set; }

    /// <summary>
    /// Write-only outbound-auth secret (API key / bearer token / "user:pass"
    /// for Basic). Encrypted at rest server-side and never returned. On update,
    /// leave null to keep the stored value unchanged.
    /// </summary>
    [StringLength(4096)]
    public string? Credential { get; set; }

    /// <summary>On update, set true to remove the stored credential.</summary>
    public bool ClearCredential { get; set; }
}

public class ApiEndpointFilterDto : PagedAndSortedResultRequestDto
{
    public string? Filter { get; set; }
    public string? ExternalSystem { get; set; }
    public ApiEndpointStatus? Status { get; set; }
}

public class TestConnectionResultDto
{
    public bool IsSuccess { get; set; }
    public int? StatusCode { get; set; }
    public long DurationMs { get; set; }
    public string? ErrorMessage { get; set; }
}
