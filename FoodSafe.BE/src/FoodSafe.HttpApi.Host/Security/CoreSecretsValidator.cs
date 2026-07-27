namespace FoodSafe.Security;

/// <summary>
/// Validates that core application secrets are configured and are not left at a
/// value that is known to have been committed to source history (blocker B-3).
/// </summary>
/// <remarks>
/// Real production secrets live only in the git-ignored <c>.env</c> /
/// <c>appsettings.secrets.json</c> and were never committed. The values guarded
/// here are the commodity dev defaults / placeholders that DID appear in tracked
/// config before commit <c>06656c8</c> (postgres/postgres connection credential,
/// the <c>change-this-in-production</c> passphrase). Rejecting them in Production
/// operationalizes rotation: even if a leaked default is copied into a production
/// config, the application refuses to start rather than run on a known credential.
/// </remarks>
public static class CoreSecretsValidator
{
    /// <summary>The exact passphrase placeholder that was committed to history.</summary>
    public const string LeakedPassPhrase = "change-this-in-production";

    /// <summary>The username committed in the historical default connection string.</summary>
    internal const string LeakedDbUser = "postgres";

    /// <summary>The password committed in the historical default connection string.</summary>
    internal const string LeakedDbPassword = "postgres";

    /// <summary>
    /// Throws <see cref="InvalidOperationException"/> when a required core secret is
    /// missing, or (in Production) when it still carries a value known to have leaked
    /// into source history.
    /// </summary>
    /// <param name="connectionString">The resolved <c>ConnectionStrings:Default</c>.</param>
    /// <param name="passPhrase">The resolved <c>StringEncryption:DefaultPassPhrase</c>.</param>
    /// <param name="isProduction">Whether the host is running in the Production environment.</param>
    public static void Validate(string? connectionString, string? passPhrase, bool isProduction)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Default is not configured. Provide it via "
                + "environment variable ConnectionStrings__Default or "
                + "appsettings.secrets.json (never commit credentials).");
        }

        if (string.IsNullOrWhiteSpace(passPhrase)
            || passPhrase == LeakedPassPhrase)
        {
            throw new InvalidOperationException(
                "StringEncryption:DefaultPassPhrase is missing or uses the "
                + "known default. Provide a unique value via environment "
                + "variable StringEncryption__DefaultPassPhrase or "
                + "appsettings.secrets.json.");
        }

        if (!isProduction)
            return;

        // Reject the exact DB credential that was committed to history (B-3):
        // the postgres/postgres localhost default must never authenticate in Production.
        var user = PostgreSqlSslValidator.ExtractValue(connectionString, "Username")
                ?? PostgreSqlSslValidator.ExtractValue(connectionString, "User Id")
                ?? PostgreSqlSslValidator.ExtractValue(connectionString, "UserId");
        var password = PostgreSqlSslValidator.ExtractValue(connectionString, "Password");

        if (string.Equals(user, LeakedDbUser, StringComparison.Ordinal)
            && string.Equals(password, LeakedDbPassword, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Default uses the postgres/postgres credential that "
                + "was committed to source history and must be considered compromised. "
                + "Provision a dedicated production database role with a rotated, unique "
                + "password and supply it via ConnectionStrings__Default. "
                + "The default credential is rejected in Production.");
        }
    }
}
