using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Npgsql;

namespace FoodSafe.HealthChecks;

/// <summary>
/// Readiness probe for PostgreSQL. Opens a real connection using the same
/// "Default" connection string the application uses and runs <c>SELECT 1</c>.
/// A raw Npgsql connection is used deliberately: it needs no ABP unit of work,
/// so it is safe to run from the health-check pipeline (which has no ambient UoW),
/// and it exercises the exact TCP + auth + (optional) TLS path the app depends on.
/// Tagged "ready" so it is excluded from the liveness endpoint.
/// </summary>
public sealed class PostgreSqlReadinessHealthCheck : IHealthCheck
{
    private readonly IConfiguration _configuration;

    public PostgreSqlReadinessHealthCheck(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var connectionString = _configuration.GetConnectionString("Default");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return HealthCheckResult.Unhealthy(
                "No 'Default' connection string is configured.");
        }

        try
        {
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync(cancellationToken);
            await using var command = new NpgsqlCommand("SELECT 1", connection);
            await command.ExecuteScalarAsync(cancellationToken);
            return HealthCheckResult.Healthy("PostgreSQL connection succeeded.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy(
                "PostgreSQL is not reachable.", ex);
        }
    }
}
