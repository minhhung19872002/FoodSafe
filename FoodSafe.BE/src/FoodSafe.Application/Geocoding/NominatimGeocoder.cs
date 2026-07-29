using System.Globalization;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace FoodSafe.Geocoding;

/// <summary>
/// Geocoder backed by a Nominatim-compatible search endpoint (OpenStreetMap).
/// </summary>
/// <remarks>
/// The public OSM instance permits at most one request per second and requires
/// an identifying User-Agent. Both are honoured here: the User-Agent comes from
/// configuration, and <see cref="Gate"/> serialises callers so concurrent users
/// cannot burst past the limit. Callers should still cache results — the gate
/// only slows requests down, it does not reduce their number.
/// </remarks>
public sealed class NominatimGeocoder(
    HttpClient httpClient,
    IOptions<GeocodingOptions> options,
    ILogger<NominatimGeocoder> logger) : IAddressGeocoder
{
    /// <summary>
    /// Process-wide rate gate. Static because the limit is per deployment, not
    /// per request scope, and this client is registered as transient.
    /// </summary>
    private static readonly SemaphoreSlim Gate = new(1, 1);
    private static DateTimeOffset _nextAllowedCallUtc = DateTimeOffset.MinValue;

    private readonly GeocodingOptions _options = options.Value;

    public async Task<GeocodedPoint?> GeocodeAsync(
        GeocodeQuery query,
        CancellationToken cancellationToken = default)
    {
        if (!_options.Enabled || query.IsEmpty)
        {
            return null;
        }

        try
        {
            await WaitForRateLimitAsync(cancellationToken);

            var url = BuildRequestUrl(query);
            var matches = await httpClient.GetFromJsonAsync<NominatimMatch[]>(
                url,
                cancellationToken);

            var match = matches?.FirstOrDefault();
            if (match is null
                || !TryParseCoordinate(match.Latitude, out var latitude)
                || !TryParseCoordinate(match.Longitude, out var longitude))
            {
                return null;
            }

            return new GeocodedPoint(
                latitude,
                longitude,
                match.DisplayName ?? query.Describe());
        }
        catch (Exception exception) when (
            exception is HttpRequestException
                or TaskCanceledException
                or System.Text.Json.JsonException)
        {
            // An unavailable geocoder must not block saving a business: the user
            // can always drop the pin manually.
            logger.LogWarning(
                exception,
                "Geocoding provider was unavailable for query {Query}.",
                query);
            return null;
        }
    }

    private string BuildRequestUrl(GeocodeQuery query)
    {
        var parameters = HttpUtility.ParseQueryString(string.Empty);
        if (query.FreeText is not null)
        {
            parameters["q"] = query.FreeText;
        }
        else
        {
            // Structured search: `street` finds the road, `state` keeps the
            // match inside the right province.
            if (!string.IsNullOrWhiteSpace(query.Street))
            {
                parameters["street"] = query.Street;
            }

            if (!string.IsNullOrWhiteSpace(query.State))
            {
                parameters["state"] = query.State;
            }
        }

        parameters["format"] = "jsonv2";
        parameters["limit"] = "1";
        parameters["addressdetails"] = "0";
        if (!string.IsNullOrWhiteSpace(_options.CountryCodes))
        {
            parameters["countrycodes"] = _options.CountryCodes;
        }

        var separator = _options.SearchUrl.Contains('?') ? "&" : "?";
        return $"{_options.SearchUrl}{separator}{parameters}";
    }

    /// <summary>
    /// Blocks until the configured minimum gap since the previous upstream call
    /// has elapsed, then reserves the next slot.
    /// </summary>
    private async Task WaitForRateLimitAsync(CancellationToken cancellationToken)
    {
        var interval = TimeSpan.FromMilliseconds(
            Math.Max(0, _options.MinimumRequestIntervalMilliseconds));

        await Gate.WaitAsync(cancellationToken);
        try
        {
            var now = DateTimeOffset.UtcNow;
            var delay = _nextAllowedCallUtc - now;
            if (delay > TimeSpan.Zero)
            {
                await Task.Delay(delay, cancellationToken);
                now = DateTimeOffset.UtcNow;
            }

            _nextAllowedCallUtc = now + interval;
        }
        finally
        {
            Gate.Release();
        }
    }

    private static bool TryParseCoordinate(string? value, out double result) =>
        double.TryParse(
            value,
            NumberStyles.Float,
            CultureInfo.InvariantCulture,
            out result);

    private sealed class NominatimMatch
    {
        [JsonPropertyName("lat")]
        public string? Latitude { get; init; }

        [JsonPropertyName("lon")]
        public string? Longitude { get; init; }

        [JsonPropertyName("display_name")]
        public string? DisplayName { get; init; }
    }
}
