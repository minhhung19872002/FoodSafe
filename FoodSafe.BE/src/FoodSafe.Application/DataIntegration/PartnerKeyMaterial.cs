using System.Security.Cryptography;
using System.Text;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Generates and verifies partner API keys (INT-03). Raw keys are shown once
/// at issuance and never persisted: storage keeps only the lookup prefix and
/// a SHA-256 hash, and verification uses a fixed-time comparison.
/// </summary>
public static class PartnerKeyMaterial
{
    public const string Prefix = "fsp_";
    private const string Alphabet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private const int RandomLength = 40;

    public static (string RawKey, string KeyPrefix, string KeyHash) Generate()
    {
        var random = new char[RandomLength];
        var bytes = RandomNumberGenerator.GetBytes(RandomLength);
        for (var i = 0; i < RandomLength; i++)
        {
            random[i] = Alphabet[bytes[i] % Alphabet.Length];
        }

        var rawKey = Prefix + new string(random);
        return (rawKey, rawKey[..PartnerApiKey.PrefixLength], Hash(rawKey));
    }

    public static string Hash(string rawKey) =>
        Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(rawKey)))
            .ToLowerInvariant();

    /// <summary>Fixed-time comparison so key verification does not leak prefix-match timing.</summary>
    public static bool Verify(string rawKey, string storedHash) =>
        CryptographicOperations.FixedTimeEquals(
            Encoding.ASCII.GetBytes(Hash(rawKey)),
            Encoding.ASCII.GetBytes(storedHash));
}
