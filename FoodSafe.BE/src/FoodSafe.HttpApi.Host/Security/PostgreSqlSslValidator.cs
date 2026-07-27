namespace FoodSafe.Security;

/// <summary>
/// Validates that PostgreSQL SSL mode satisfies production encryption requirements.
/// </summary>
public static class PostgreSqlSslValidator
{
    // Modes that permit a plaintext connection path in whole or in part.
    private static readonly HashSet<string> InsecureModes =
        new(StringComparer.OrdinalIgnoreCase) { "Disable", "Allow", "Prefer" };

    /// <summary>
    /// Throws <see cref="InvalidOperationException"/> if <paramref name="isProduction"/>
    /// is <see langword="true"/> and the connection string specifies an SSL mode that
    /// allows plaintext fallback (Disable, Allow, or Prefer).
    /// </summary>
    /// <remarks>
    /// The three secure production modes and what each verifies:
    /// <list type="bullet">
    ///   <item><term>Require</term><description>Client demands SSL; no certificate identity check.</description></item>
    ///   <item><term>VerifyCA</term><description>SSL required; server certificate signed by trusted CA.</description></item>
    ///   <item><term>VerifyFull</term><description>SSL required; CA-signed cert AND hostname match (strongest).</description></item>
    /// </list>
    /// Development environments may use Disable or Prefer without triggering this check.
    /// </remarks>
    public static void Validate(string? connectionString, bool isProduction)
    {
        if (!isProduction)
            return;

        if (string.IsNullOrWhiteSpace(connectionString))
            return; // ValidateCoreSecrets already catches a missing connection string

        var sslMode = ExtractValue(connectionString, "SslMode")
                   ?? ExtractValue(connectionString, "SSL Mode");

        if (sslMode is null || InsecureModes.Contains(sslMode))
        {
            var current = sslMode ?? "Prefer (implicit default)";
            throw new InvalidOperationException(
                $"Production PostgreSQL connection requires SSL. "
                + $"Current SslMode is '{current}', which permits plaintext connections. "
                + "Set the POSTGRES_SSL_MODE environment variable to 'Require', 'VerifyCA', "
                + "or 'VerifyFull'. See .env.example for configuration guidance. "
                + "Note: the PostgreSQL server must also have SSL enabled (ssl=on in postgresql.conf).");
        }
    }

    internal static string? ExtractValue(string connectionString, string key)
    {
        foreach (var segment in connectionString.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var eq = segment.IndexOf('=');
            if (eq <= 0)
                continue;
            if (segment[..eq].Trim().Equals(key, StringComparison.OrdinalIgnoreCase))
                return segment[(eq + 1)..].Trim();
        }
        return null;
    }
}
