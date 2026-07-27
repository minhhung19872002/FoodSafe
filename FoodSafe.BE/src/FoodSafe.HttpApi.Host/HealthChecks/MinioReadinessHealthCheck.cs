using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace FoodSafe.HealthChecks;

/// <summary>
/// Readiness probe for the MinIO object store that backs file attachments.
/// Calls MinIO's own unauthenticated liveness endpoint
/// (<c>/minio/health/live</c>) over the same host/scheme the blob-storing
/// provider is configured with (<c>BlobStorage:Endpoint</c> +
/// <c>BlobStorage:WithSsl</c>). Tagged "ready" so it is excluded from the
/// liveness endpoint.
/// </summary>
public sealed class MinioReadinessHealthCheck : IHealthCheck
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    public MinioReadinessHealthCheck(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var endpoint = _configuration["BlobStorage:Endpoint"];
        if (string.IsNullOrWhiteSpace(endpoint))
        {
            return HealthCheckResult.Unhealthy(
                "BlobStorage:Endpoint is not configured.");
        }

        var withSsl = _configuration.GetValue("BlobStorage:WithSsl", false);
        var scheme = withSsl ? "https" : "http";
        var url = $"{scheme}://{endpoint}/minio/health/live";

        try
        {
            var client = _httpClientFactory.CreateClient("minio-health");
            client.Timeout = TimeSpan.FromSeconds(5);
            using var response = await client.GetAsync(url, cancellationToken);
            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("MinIO liveness endpoint responded.")
                : HealthCheckResult.Unhealthy(
                    $"MinIO liveness endpoint returned HTTP {(int)response.StatusCode}.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("MinIO is not reachable.", ex);
        }
    }
}
