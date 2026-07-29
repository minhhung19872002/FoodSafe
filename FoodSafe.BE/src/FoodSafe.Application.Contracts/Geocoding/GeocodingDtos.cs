using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.Geocoding;

/// <summary>
/// Address to resolve into coordinates. The administrative-area ids are
/// resolved to their Vietnamese names server-side so the caller never has to
/// send display text that could be tampered with.
/// </summary>
public sealed class GeocodeAddressInput
{
    [StringLength(500)]
    public string? Street { get; set; }

    public Guid? ProvinceId { get; set; }
    public Guid? DistrictId { get; set; }
    public Guid? CommuneId { get; set; }
}

public sealed class GeocodeResultDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }

    /// <summary>Address the provider actually matched, shown so the user can
    /// judge whether the suggestion is good enough before accepting it.</summary>
    public string MatchedAddress { get; set; } = string.Empty;

    /// <summary>The query sent to the provider, echoed back for troubleshooting
    /// when a match looks wrong.</summary>
    public string Query { get; set; } = string.Empty;
}

public interface IGeocodingAppService : IApplicationService
{
    /// <summary>
    /// Resolves an address to coordinates, or returns <c>null</c> when the
    /// provider finds no match. Never throws for provider outages — geocoding
    /// is an assist, and the user can always drop the pin manually.
    /// </summary>
    Task<GeocodeResultDto?> ResolveAsync(GeocodeAddressInput input);
}
