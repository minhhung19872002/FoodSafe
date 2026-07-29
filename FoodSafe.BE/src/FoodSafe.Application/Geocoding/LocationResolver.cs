using System.Text;
using FoodSafe.Catalogs;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using Volo.Abp.Caching;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;

namespace FoodSafe.Geocoding;

public sealed record LocationResolveResult(
    double Latitude,
    double Longitude,
    string MatchedAddress,
    string Query);

public interface ILocationResolver
{
    Task<LocationResolveResult?> ResolveAsync(
        GeocodeAddressInput input,
        CancellationToken cancellationToken = default);
}

public class LocationResolver : ILocationResolver, ITransientDependency
{
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IAddressGeocoder _geocoder;
    private readonly IDistributedCache<GeocodeCacheItem, string> _cache;
    private readonly GeocodingOptions _options;

    public LocationResolver(
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Commune, Guid> communes,
        IAddressGeocoder geocoder,
        IDistributedCache<GeocodeCacheItem, string> cache,
        IOptions<GeocodingOptions> options)
    {
        _provinces = provinces;
        _districts = districts;
        _communes = communes;
        _geocoder = geocoder;
        _cache = cache;
        _options = options.Value;
    }

    public async Task<LocationResolveResult?> ResolveAsync(
        GeocodeAddressInput input,
        CancellationToken cancellationToken = default)
    {
        foreach (var candidate in await BuildQueryCandidatesAsync(input, cancellationToken))
        {
            var result = await ResolveCandidateAsync(candidate, cancellationToken);
            if (result is not null)
                return result;
        }

        return null;
    }

    private async Task<LocationResolveResult?> ResolveCandidateAsync(
        GeocodeQuery candidate, CancellationToken cancellationToken)
    {
        var query = candidate.Describe();
        var cacheKey = (candidate.FreeText is null ? "ROAD|" : "TEXT|")
                       + query.ToUpperInvariant();

        var cached = await _cache.GetAsync(cacheKey, token: cancellationToken);
        if (cached is not null)
        {
            return cached.Found
                ? new LocationResolveResult(
                    cached.Latitude, cached.Longitude,
                    cached.MatchedAddress, query)
                : null;
        }

        var point = await _geocoder.GeocodeAsync(candidate, cancellationToken);

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
            token: cancellationToken);

        return point is null
            ? null
            : new LocationResolveResult(
                point.Latitude, point.Longitude,
                point.MatchedAddress, query);
    }

    internal async Task<IReadOnlyList<GeocodeQuery>> BuildQueryCandidatesAsync(
        GeocodeAddressInput input, CancellationToken cancellationToken)
    {
        string? commune = null;
        string? district = null;
        string? province = null;

        if (input.CommuneId.HasValue)
        {
            var entity = await _communes.FindAsync(
                input.CommuneId.Value, cancellationToken: cancellationToken);
            commune = entity is null ? null : Prefix(entity.Type) + entity.Name;
        }

        if (input.DistrictId.HasValue)
        {
            var entity = await _districts.FindAsync(
                input.DistrictId.Value, cancellationToken: cancellationToken);
            district = entity is null ? null : Prefix(entity.Type) + entity.Name;
        }

        if (input.ProvinceId.HasValue)
        {
            var entity = await _provinces.FindAsync(
                input.ProvinceId.Value, cancellationToken: cancellationToken);
            province = entity?.Name;
        }

        var candidates = new List<GeocodeQuery>(5);
        var street = input.Street?.Trim();

        if (!string.IsNullOrWhiteSpace(street))
        {
            var roadName = AddressQuery.StripStreetPrefixes(street);
            if (roadName.Length > 0)
                candidates.Add(GeocodeQuery.Road(roadName, province));

            if (!string.Equals(roadName, street, StringComparison.Ordinal))
                candidates.Add(GeocodeQuery.Road(street, province));
        }

        AddText(commune, district, province);
        AddText(district, province);
        AddText(province);

        return candidates
            .Where(c => !c.IsEmpty)
            .DistinctBy(c => c.Describe(), StringComparer.OrdinalIgnoreCase)
            .ToList();

        void AddText(params string?[] parts)
        {
            var text = BuildQueryString(
                parts.Where(p => !string.IsNullOrWhiteSpace(p))
                    .Select(p => p!)
                    .ToList());
            if (text.Length > 0)
                candidates.Add(GeocodeQuery.Text(text));
        }
    }

    private static string BuildQueryString(IReadOnlyList<string> parts)
    {
        var builder = new StringBuilder();
        foreach (var part in parts)
        {
            if (builder.Length > 0)
                builder.Append(", ");
            builder.Append(part);
        }
        return builder.ToString();
    }

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
