using System.Diagnostics;
using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Uow;
using Volo.Abp.Validation;

namespace FoodSafe.DataIntegration;

/// <summary>
/// The partner-facing inbound receive path (INT-03). Authenticates the caller
/// by hashed API key, enforces partner status + per-partner data-type
/// authorization, replay protection (timestamp window + unique request id),
/// database-backed idempotency, and records every attributable attempt as an
/// Inbound ApiCallLog row. The submission payload is persisted verbatim for
/// later TT 31/2026 business ingestion (EXTERNALLY_BLOCKED).
///
/// Outcomes are returned as data — the controller maps them to HTTP statuses —
/// so unauthenticated probing cannot distinguish key states by exception shape.
/// </summary>
[RemoteService(IsEnabled = false)]
[AllowAnonymous]
public class PartnerInboundAppService :
    ApplicationService,
    IPartnerInboundAppService
{
    /// <summary>Replay window: requests must be timestamped within ±5 minutes.</summary>
    public const int TimestampToleranceSeconds = 300;

    public const string SupportedSchemaVersion = "1.0";

    private static readonly Dictionary<string, SharedDataType> DataTypeSegments =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["alert"] = SharedDataType.Alert,
            ["inspection-result"] = SharedDataType.InspectionResult,
            ["food-poisoning"] = SharedDataType.FoodPoisoning,
            ["license"] = SharedDataType.License,
            ["product"] = SharedDataType.Product,
            ["news"] = SharedDataType.News,
            ["business"] = SharedDataType.Business,
        };

    private static readonly JsonSerializerOptions PayloadJsonOptions =
        new(JsonSerializerDefaults.Web)
        {
            // Payloads are Vietnamese-language evidence rendered as plain text
            // in the admin UI — store them human-readable, not \uXXXX-escaped.
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        };

    private readonly IRepository<PartnerAccount, Guid> _partners;
    private readonly IRepository<PartnerApiKey, Guid> _keys;
    private readonly IRepository<InboundSubmission, Guid> _submissions;
    private readonly IRepository<ApiCallLog, Guid> _logs;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PartnerInboundAppService(
        IRepository<PartnerAccount, Guid> partners,
        IRepository<PartnerApiKey, Guid> keys,
        IRepository<InboundSubmission, Guid> submissions,
        IRepository<ApiCallLog, Guid> logs,
        ICancellationTokenProvider cancellationTokens)
    {
        _partners = partners;
        _keys = keys;
        _submissions = submissions;
        _logs = logs;
        _cancellationTokens = cancellationTokens;
    }

    // ABP's method-argument validator would reject the envelope's annotations
    // with an AbpValidationException BEFORE this body runs; through the
    // IActionResult-returning controller that surfaces as a 500 and leaks the
    // ABP error shape to partners. Validation stays in-method so every outcome
    // is data the controller maps to a status.
    [DisableValidation]
    public async Task<InboundReceiveOperationDto> ReceiveAsync(
        string dataTypeSegment,
        InboundRequestContext context,
        InboundEnvelopeDto envelope)
    {
        var ct = _cancellationTokens.Token;
        var now = Clock.Now;
        var stopwatch = Stopwatch.StartNew();

        if (!DataTypeSegments.TryGetValue(
                dataTypeSegment ?? "", out var dataType))
        {
            return Invalid("UnknownDataType",
                $"Unknown data type segment '{dataTypeSegment}'.");
        }

        if (envelope is null)
        {
            return Invalid("MalformedBody",
                "Request body must be a JSON submission envelope.");
        }

        // ── request hygiene (before touching any credential material) ────────
        if (context.RequestId.IsNullOrWhiteSpace() ||
            context.RequestId!.Length > InboundSubmission.MaxRequestIdLength)
        {
            return Invalid("MissingRequestId",
                "Header X-Request-Id is required (max 128 chars).");
        }
        if (!TryParseTimestamp(context.Timestamp, out var requestTime))
        {
            return Invalid("MissingTimestamp",
                "Header X-Timestamp is required (ISO-8601 or unix seconds).");
        }
        if (Math.Abs((now - requestTime).TotalSeconds) > TimestampToleranceSeconds)
        {
            return Invalid("StaleTimestamp",
                $"X-Timestamp outside the ±{TimestampToleranceSeconds}s replay window.");
        }
        if (!string.Equals(
                envelope.SchemaVersion, SupportedSchemaVersion,
                StringComparison.Ordinal))
        {
            return Invalid("UnsupportedSchemaVersion",
                $"schemaVersion '{envelope.SchemaVersion}' is not supported (expected {SupportedSchemaVersion}).");
        }
        if (envelope.Records is null ||
            envelope.Records.Count is 0 or > InboundEnvelopeDto.MaxRecords)
        {
            return Invalid("InvalidRecords",
                $"records must contain 1..{InboundEnvelopeDto.MaxRecords} items.");
        }
        if (envelope.SourceSystem is { Length: > InboundEnvelopeDto.MaxSourceSystemLength })
        {
            return Invalid("InvalidSourceSystem",
                $"sourceSystem must be at most {InboundEnvelopeDto.MaxSourceSystemLength} characters.");
        }

        // ── authentication ───────────────────────────────────────────────────
        var rawKey = context.ApiKey;
        if (rawKey.IsNullOrWhiteSpace() ||
            !rawKey!.StartsWith(PartnerKeyMaterial.Prefix, StringComparison.Ordinal) ||
            rawKey.Length <= PartnerApiKey.PrefixLength)
        {
            Logger.LogWarning(
                "Inbound partner request rejected: missing/malformed API key (path {Path}).",
                context.Path);
            return Unauthorized();
        }

        var prefix = rawKey[..PartnerApiKey.PrefixLength];
        var key = await _keys.FindAsync(
            k => k.KeyPrefix == prefix, cancellationToken: ct);
        if (key is null || !PartnerKeyMaterial.Verify(rawKey, key.KeyHash))
        {
            // Unattributable: no partner identified, so no ApiCallLog row.
            Logger.LogWarning(
                "Inbound partner request rejected: unknown API key prefix {Prefix} (path {Path}).",
                prefix, context.Path);
            return Unauthorized();
        }

        var partner = await _partners.FindAsync(
            key.PartnerAccountId, cancellationToken: ct);
        if (partner is null)
        {
            Logger.LogWarning(
                "Inbound partner request rejected: key {KeyId} has no live partner.",
                key.Id);
            return Unauthorized();
        }

        if (key.IsRevoked)
        {
            await LogInboundAsync(partner, context, dataType, now,
                stopwatch, success: false, "API key revoked.", ct);
            return Unauthorized();
        }
        if (key.IsExpired(now))
        {
            await LogInboundAsync(partner, context, dataType, now,
                stopwatch, success: false, "API key expired.", ct);
            return Unauthorized();
        }
        if (partner.Status != PartnerAccountStatus.Active)
        {
            await LogInboundAsync(partner, context, dataType, now,
                stopwatch, success: false, "Partner suspended.", ct);
            return Unauthorized();
        }

        // ── per-partner authorization ────────────────────────────────────────
        if (!partner.IsDataTypeAllowed(dataType))
        {
            await LogInboundAsync(partner, context, dataType, now,
                stopwatch, success: false,
                $"Data type {dataType} not allowed for this partner.", ct);
            return new InboundReceiveOperationDto
            {
                Outcome = InboundReceiveOutcome.Forbidden,
                ErrorCode = "DataTypeNotAllowed",
                ErrorMessage = $"Partner is not allowed to submit '{dataTypeSegment}'.",
            };
        }

        key.MarkUsed(now);
        await _keys.UpdateAsync(key, cancellationToken: ct);

        // ── idempotency (fast path) ──────────────────────────────────────────
        var existing = await _submissions.FindAsync(
            s => s.PartnerAccountId == partner.Id &&
                 s.RequestId == context.RequestId,
            cancellationToken: ct);
        if (existing is not null)
        {
            await LogInboundAsync(partner, context, dataType, now,
                stopwatch, success: true,
                $"Duplicate delivery of request {context.RequestId}.", ct);
            return Duplicate(existing);
        }

        // ── persist ──────────────────────────────────────────────────────────
        var correlationId = context.CorrelationId.IsNullOrWhiteSpace()
            ? GuidGenerator.Create().ToString("N")
            : context.CorrelationId!.Length <= InboundSubmission.MaxCorrelationIdLength
                ? context.CorrelationId
                : context.CorrelationId[..InboundSubmission.MaxCorrelationIdLength];
        var payload = JsonSerializer.Serialize(envelope, PayloadJsonOptions);

        var submission = InboundSubmission.Create(
            GuidGenerator.Create(),
            partner.Id,
            partner.OrganizationId,
            dataType,
            envelope.SchemaVersion,
            context.RequestId!,
            payload,
            envelope.Records.Count,
            now,
            correlationId);
        try
        {
            await _submissions.InsertAsync(
                submission, autoSave: true, cancellationToken: ct);
        }
        catch (Exception exception) when (
            exception.ToString().Contains("uq_di_is_partner_request"))
        {
            // Two identical deliveries raced: the unique index kept exactly one.
            var winner = await _submissions.FindAsync(
                s => s.PartnerAccountId == partner.Id &&
                     s.RequestId == context.RequestId,
                cancellationToken: ct);
            if (winner is not null)
            {
                return Duplicate(winner);
            }
            throw;
        }

        await LogInboundAsync(partner, context, dataType, now,
            stopwatch, success: true, errorMessage: null, ct,
            requestBody: Truncate(payload, 4000));

        return new InboundReceiveOperationDto
        {
            Outcome = InboundReceiveOutcome.Accepted,
            Result = new InboundReceiveResultDto
            {
                SubmissionId = submission.Id,
                CorrelationId = correlationId!,
                Duplicate = false,
                ReceivedAt = now,
            },
        };
    }

    private static bool TryParseTimestamp(string? value, out DateTime utcTime)
    {
        utcTime = default;
        if (value.IsNullOrWhiteSpace())
            return false;

        if (long.TryParse(value, NumberStyles.Integer,
                CultureInfo.InvariantCulture, out var unixSeconds))
        {
            utcTime = DateTimeOffset.FromUnixTimeSeconds(unixSeconds).UtcDateTime;
            return true;
        }
        if (DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture,
                DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal,
                out var parsed))
        {
            utcTime = parsed.UtcDateTime;
            return true;
        }
        return false;
    }

    [UnitOfWork(isTransactional: false)]
    protected virtual async Task LogInboundAsync(
        PartnerAccount partner,
        InboundRequestContext context,
        SharedDataType dataType,
        DateTime calledAt,
        Stopwatch stopwatch,
        bool success,
        string? errorMessage,
        CancellationToken ct,
        string? requestBody = null)
    {
        stopwatch.Stop();
        var log = ApiCallLog.Create(
            GuidGenerator.Create(),
            partner.OrganizationId,
            ApiCallDirection.Inbound,
            partner.ExternalSystem,
            context.Path.IsNullOrWhiteSpace() ? "/api/v1/partner" : context.Path,
            "POST",
            calledAt,
            stopwatch.ElapsedMilliseconds,
            success,
            requestHeaders:
                $"X-Request-Id: {context.RequestId}; X-Correlation-Id: {context.CorrelationId}",
            requestBody: requestBody,
            errorMessage: errorMessage,
            dataType: dataType);
        await _logs.InsertAsync(log, autoSave: true, cancellationToken: ct);
    }

    private static InboundReceiveOperationDto Invalid(
        string code, string message) => new()
        {
            Outcome = InboundReceiveOutcome.InvalidRequest,
            ErrorCode = code,
            ErrorMessage = message,
        };

    private static InboundReceiveOperationDto Unauthorized() => new()
    {
        Outcome = InboundReceiveOutcome.Unauthorized,
        ErrorCode = "InvalidApiKey",
        // One generic message for every credential failure: probing cannot
        // distinguish unknown vs revoked vs expired vs suspended.
        ErrorMessage = "Invalid API key.",
    };

    private static InboundReceiveOperationDto Duplicate(
        InboundSubmission existing) => new()
        {
            Outcome = InboundReceiveOutcome.Duplicate,
            Result = new InboundReceiveResultDto
            {
                SubmissionId = existing.Id,
                CorrelationId = existing.CorrelationId ?? "",
                Duplicate = true,
                ReceivedAt = existing.ReceivedAt,
            },
        };

    private static string? Truncate(string? value, int maximumLength) =>
        value is null || value.Length <= maximumLength
            ? value
            : value[..maximumLength];
}
