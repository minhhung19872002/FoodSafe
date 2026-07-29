namespace FoodSafe.Geocoding;

/// <summary>
/// Configuration for the address-to-coordinate provider. The provider is
/// swappable: only <see cref="IAddressGeocoder"/> implementations read these,
/// so moving off Nominatim later does not touch the application service.
/// </summary>
public sealed class GeocodingOptions
{
    public const string SectionName = "Geocoding";

    /// <summary>Turns geocoding off entirely. The UI degrades to manual pin
    /// dropping, which is always available.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Nominatim-compatible search endpoint.</summary>
    public string SearchUrl { get; set; } =
        "https://nominatim.openstreetmap.org/search";

    /// <summary>
    /// Sent as <c>User-Agent</c>. The OpenStreetMap Nominatim usage policy
    /// requires a genuine identifier with a contact address; requests without
    /// one get blocked. Configure this per deployment.
    /// </summary>
    public string UserAgent { get; set; } =
        "FoodSafe-QuangNinh/1.0 (+https://attp.bluestar.com.vn)";

    /// <summary>Restricts matches to Vietnam so a street name that also exists
    /// abroad cannot win.</summary>
    public string CountryCodes { get; set; } = "vn";

    /// <summary>
    /// Minimum gap between two upstream calls. The public Nominatim service
    /// allows at most one request per second, and exceeding it gets the
    /// deployment banned rather than throttled.
    /// </summary>
    public int MinimumRequestIntervalMilliseconds { get; set; } = 1100;

    /// <summary>Per-request upstream timeout.</summary>
    public int TimeoutSeconds { get; set; } = 10;

    /// <summary>
    /// How long a resolved address stays cached. Addresses barely move, and
    /// caching is the main reason this stays within the provider's rate limit.
    /// </summary>
    public int CacheDays { get; set; } = 30;
}
