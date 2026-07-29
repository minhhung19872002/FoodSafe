using System.Text;
using FoodSafe.Catalogs;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Caching;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Microsoft.Extensions.Caching.Distributed;

namespace FoodSafe.Geocoding;

/// <summary>
/// Server-side proxy in front of the geocoding provider. Requests never leave
/// the browser directly, so the provider credentials/User-Agent stay on the
/// server, the query is built from trusted catalog data, and results are cached
/// to keep the deployment inside the provider's rate limit.
/// </summary>
// GeocodingController fronts this service so a "no match" can answer 204
// instead of a 200 with a null body. Without this attribute ABP would also
// auto-generate a controller on the same route, and the two would collide.
[RemoteService(false)]
[Authorize]
public class GeocodingAppService : ApplicationService, IGeocodingAppService
{
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IAddressGeocoder _geocoder;
    private readonly IDistributedCache<GeocodeCacheItem, string> _cache;
    private readonly IPermissionChecker _permissionChecker;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly GeocodingOptions _options;

    public GeocodingAppService(
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes,
        IAddressGeocoder geocoder,
        IDistributedCache<GeocodeCacheItem, string> cache,
        IPermissionChecker permissionChecker,
        ICancellationTokenProvider cancellationTokens,
        IOptions<GeocodingOptions> options)
    {
        _provinces = provinces;
        _districts = districts;
        _communes = communes;
        _geocoder = geocoder;
        _cache = cache;
        _permissionChecker = permissionChecker;
        _cancellationTokens = cancellationTokens;
        _options = options.Value;
    }

    public async Task<GeocodeResultDto?> ResolveAsync(GeocodeAddressInput input)
    {
        // Geocoding only makes sense while filling in the business form, so it
        // is gated on the write permissions rather than on plain View.
        await EnsureCanEditBusinessesAsync();

        // Try the most specific address first, then progressively coarser ones.
        // House-level Vietnamese street text ("Số 12 phố Cao Thắng") frequently
        // has no OSM match, and landing on the correct ward beats leaving the
        // pin wherever it happened to be. The caller sees the matched address
        // and can still refine it by clicking the map.
        foreach (var query in await BuildQueryCandidatesAsync(input))
        {
            var result = await ResolveCandidateAsync(query);
            if (result is not null)
            {
                return result;
            }
        }

        return null;
    }

    private async Task<GeocodeResultDto?> ResolveCandidateAsync(GeocodeQuery candidate)
    {
        var query = candidate.Describe();
        var cacheKey = (candidate.FreeText is null ? "ROAD|" : "TEXT|")
                       + query.ToUpperInvariant();
        var cached = await _cache.GetAsync(
            cacheKey,
            token: _cancellationTokens.Token);
        if (cached is not null)
        {
            return cached.Found
                ? new GeocodeResultDto
                {
                    Latitude = cached.Latitude,
                    Longitude = cached.Longitude,
                    MatchedAddress = cached.MatchedAddress,
                    Query = query
                }
                : null;
        }

        var point = await _geocoder.GeocodeAsync(
            candidate,
            _cancellationTokens.Token);

        // Cache misses too: an address the provider cannot find stays unfindable,
        // and re-asking on every attempt would burn the rate limit.
        await _cache.SetAsync(
            cacheKey,
            new GeocodeCacheItem
            {
                Found = point is not null,
                Latitude = point?.Latitude ?? 0,
                Longitude = point?.Longitude ?? 0,
                MatchedAddress = point?.MatchedAddress ?? string.Empty
            },
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow =
                    TimeSpan.FromDays(Math.Max(1, _options.CacheDays))
            },
            token: _cancellationTokens.Token);

        return point is null
            ? null
            : new GeocodeResultDto
            {
                Latitude = point.Latitude,
                Longitude = point.Longitude,
                MatchedAddress = point.MatchedAddress,
                Query = query
            };
    }

    private async Task EnsureCanEditBusinessesAsync()
    {
        if (await _permissionChecker.IsGrantedAsync(
                FoodSafePermissions.BusinessManagement.Businesses.Create)
            || await _permissionChecker.IsGrantedAsync(
                FoodSafePermissions.BusinessManagement.Businesses.Edit))
        {
            return;
        }

        throw new AbpAuthorizationException();
    }

    /// <summary>
    /// Builds the ordered list of address strings to try, most specific first.
    /// The administrative-area names come from the database rather than the
    /// request, so a caller cannot smuggle arbitrary text into the upstream
    /// query — only <see cref="GeocodeAddressInput.Street"/> is caller-supplied.
    /// </summary>
    private async Task<IReadOnlyList<GeocodeQuery>> BuildQueryCandidatesAsync(
        GeocodeAddressInput input)
    {
        string? commune = null;
        string? district = null;
        string? province = null;

        if (input.CommuneId.HasValue)
        {
            var entity = await _communes.FindAsync(
                input.CommuneId.Value,
                cancellationToken: _cancellationTokens.Token);
            commune = entity is null ? null : Prefix(entity.Type) + entity.Name;
        }

        if (input.DistrictId.HasValue)
        {
            var entity = await _districts.FindAsync(
                input.DistrictId.Value,
                cancellationToken: _cancellationTokens.Token);
            district = entity is null ? null : Prefix(entity.Type) + entity.Name;
        }

        if (input.ProvinceId.HasValue)
        {
            var entity = await _provinces.FindAsync(
                input.ProvinceId.Value,
                cancellationToken: _cancellationTokens.Token);
            province = entity?.Name;
        }

        var candidates = new List<GeocodeQuery>(5);
        var street = input.Street?.Trim();

        if (!string.IsNullOrWhiteSpace(street))
        {
            // Structured road lookup, constrained to the province. Free-text
            // with all three area levels reliably returns nothing on Vietnamese
            // OSM data, so the road is looked up this way instead.
            var roadName = AddressQuery.StripStreetPrefixes(street);
            if (roadName.Length > 0)
            {
                candidates.Add(GeocodeQuery.Road(roadName, province));
            }

            if (!string.Equals(roadName, street, StringComparison.Ordinal))
            {
                candidates.Add(GeocodeQuery.Road(street, province));
            }
        }

        // Administrative fallbacks, most specific first. Free text handles these
        // where the structured `city` parameter does not.
        AddText(commune, district, province);
        AddText(district, province);
        AddText(province);

        return candidates
            .Where(candidate => !candidate.IsEmpty)
            .DistinctBy(
                candidate => candidate.Describe(),
                StringComparer.OrdinalIgnoreCase)
            .ToList();

        void AddText(params string?[] parts)
        {
            var text = BuildQueryString(
                parts.Where(part => !string.IsNullOrWhiteSpace(part))
                    .Select(part => part!)
                    .ToList());
            if (text.Length > 0)
            {
                candidates.Add(GeocodeQuery.Text(text));
            }
        }
    }


    private static string BuildQueryString(IReadOnlyList<string> parts)
    {
        var builder = new StringBuilder();
        foreach (var part in parts)
        {
            if (builder.Length > 0)
            {
                builder.Append(", ");
            }

            builder.Append(part);
        }

        return builder.ToString();
    }

    /// <summary>
    /// Vietnamese administrative prefixes. Nominatim matches noticeably better
    /// with them than with a bare name, because "Hồng Hà" alone is ambiguous
    /// while "Phường Hồng Hà" is not.
    /// </summary>
    private static string Prefix(CommuneType type) => type switch
    {
        CommuneType.Ward => "Phường ",
        CommuneType.Township => "Thị trấn ",
        _ => "Xã "
    };

    private static string Prefix(DistrictType type) => type switch
    {
        DistrictType.UrbanDistrict => "Quận ",
        DistrictType.Town => "Thị xã ",
        DistrictType.ProvincialCity => "Thành phố ",
        _ => "Huyện "
    };
}

/// <summary>Cached provider answer, including "no match" so repeated lookups
/// of an unfindable address do not hit the provider again.</summary>
public sealed class GeocodeCacheItem
{
    public bool Found { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string MatchedAddress { get; set; } = string.Empty;
}
