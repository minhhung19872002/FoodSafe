namespace FoodSafe.Geocoding;

/// <summary>
/// Text helpers for turning Vietnamese address text into something a
/// street-level geocoder can match.
/// </summary>
public static class AddressQuery
{
    /// <summary>
    /// Leading words that describe the kind of street rather than naming it.
    /// Longer forms come first so "số nhà" wins over "số".
    /// </summary>
    private static readonly string[] StreetPrefixes =
    [
        "số nhà", "khu phố", "đường", "phố", "thôn", "khu", "tổ", "lô", "số"
    ];

    /// <summary>
    /// Drops a leading house number and street-type word, so
    /// "Số 12 phố Cao Thắng" becomes "Cao Thắng". OSM data for Vietnam rarely
    /// carries house numbers, and the wrapper stops even the road itself from
    /// matching.
    /// </summary>
    public static string StripStreetPrefixes(string street)
    {
        var value = street.Trim();
        bool removed;

        do
        {
            removed = false;

            foreach (var prefix in StreetPrefixes)
            {
                if (!value.StartsWith(
                        prefix + " ",
                        StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                value = value[(prefix.Length + 1)..].TrimStart();
                removed = true;
                break;
            }

            // A leading token containing a digit ("12", "B4") is a house or lot
            // number: no geographic meaning once the road name is what we need.
            var space = value.IndexOf(' ');
            if (space > 0 && value[..space].Any(char.IsDigit))
            {
                value = value[(space + 1)..].TrimStart();
                removed = true;
            }
        }
        while (removed && value.Length > 0);

        return value.Trim();
    }
}
