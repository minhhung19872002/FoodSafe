namespace FoodSafe.Geocoding;

/// <summary>
/// One attempt at locating an address.
/// </summary>
/// <remarks>
/// Nominatim exposes two search modes and they behave very differently on
/// Vietnamese data, so both are needed:
/// <list type="bullet">
///   <item><description><b>Structured</b> (<see cref="Street"/> +
///   <see cref="State"/>) is the only reliable way to find a road, and pinning
///   the province stops a same-named street in another province from
///   winning.</description></item>
///   <item><description><b>Free text</b> matches administrative areas
///   ("Phường Hồng Hà, Thành phố Hạ Long, Quảng Ninh") that the structured
///   <c>city</c> parameter fails to resolve.</description></item>
/// </list>
/// </remarks>
public sealed record GeocodeQuery
{
    private GeocodeQuery(string? freeText, string? street, string? state)
    {
        FreeText = freeText;
        Street = street;
        State = state;
    }

    public string? FreeText { get; }
    public string? Street { get; }
    public string? State { get; }

    public bool IsEmpty =>
        string.IsNullOrWhiteSpace(FreeText)
        && string.IsNullOrWhiteSpace(Street)
        && string.IsNullOrWhiteSpace(State);

    /// <summary>Human-readable form, used as the cache key and echoed to the
    /// caller so a surprising match can be traced.</summary>
    public string Describe() =>
        FreeText is not null
            ? FreeText
            : string.Join(", ", new[] { Street, State }.Where(
                part => !string.IsNullOrWhiteSpace(part)));

    public static GeocodeQuery Text(string value) => new(value, null, null);

    public static GeocodeQuery Road(string street, string? state) =>
        new(null, street, state);
}

/// <summary>A single coordinate match returned by a geocoding provider.</summary>
public sealed record GeocodedPoint(
    double Latitude,
    double Longitude,
    string MatchedAddress);

/// <summary>
/// Provider abstraction for turning an address into coordinates.
/// Implementations must never throw for upstream failures — geocoding only
/// assists the user, who can still place the pin by hand.
/// </summary>
public interface IAddressGeocoder
{
    /// <summary>
    /// Returns the best match for <paramref name="query"/>, or <c>null</c> when
    /// there is no match or the provider is unavailable.
    /// </summary>
    Task<GeocodedPoint?> GeocodeAsync(
        GeocodeQuery query,
        CancellationToken cancellationToken = default);
}
