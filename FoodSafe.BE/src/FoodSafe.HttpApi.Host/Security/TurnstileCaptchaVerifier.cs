using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace FoodSafe.Security;

public interface ICaptchaVerifier
{
    Task<bool> VerifyAsync(
        string token,
        string? remoteIpAddress,
        CancellationToken cancellationToken);
}

public sealed class TurnstileCaptchaVerifier(
    HttpClient httpClient,
    IOptions<CaptchaOptions> options,
    IHostEnvironment environment,
    ILogger<TurnstileCaptchaVerifier> logger) : ICaptchaVerifier
{
    private readonly CaptchaOptions _options = options.Value;

    public async Task<bool> VerifyAsync(
        string token,
        string? remoteIpAddress,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
        {
            return false;
        }

        var fields = new Dictionary<string, string>
        {
            ["secret"] = _options.SecretKey,
            ["response"] = token,
            ["idempotency_key"] = Guid.NewGuid().ToString()
        };
        if (!string.IsNullOrWhiteSpace(remoteIpAddress))
        {
            fields["remoteip"] = remoteIpAddress;
        }

        try
        {
            using var content = new FormUrlEncodedContent(fields);
            using var response = await httpClient.PostAsync(
                _options.SiteVerifyUrl,
                content,
                cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning(
                    "Turnstile verification returned HTTP {StatusCode}.",
                    (int)response.StatusCode);
                return false;
            }

            var result = await response.Content.ReadFromJsonAsync<TurnstileResponse>(
                cancellationToken);
            if (result?.Success != true)
            {
                logger.LogWarning(
                    "Turnstile verification failed with codes {ErrorCodes}.",
                    result?.ErrorCodes is null
                        ? "unknown"
                        : string.Join(",", result.ErrorCodes));
                return false;
            }

            if (!environment.IsProduction())
            {
                return true;
            }

            return string.Equals(
                       result.Action,
                       _options.Action,
                       StringComparison.Ordinal)
                   && string.Equals(
                       result.Hostname,
                       _options.ExpectedHostname,
                       StringComparison.OrdinalIgnoreCase);
        }
        catch (Exception exception) when (
            exception is HttpRequestException
                or TaskCanceledException
                or System.Text.Json.JsonException)
        {
            logger.LogWarning(
                exception,
                "Turnstile verification was unavailable.");
            return false;
        }
    }

    private sealed class TurnstileResponse
    {
        public bool Success { get; init; }
        public string? Action { get; init; }
        public string? Hostname { get; init; }

        [JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; init; }
    }
}
