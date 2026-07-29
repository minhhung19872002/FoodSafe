using System.Text.Json;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Versioned envelope a partner POSTs to the inbound receive endpoint
/// (INT-03). Mirrors the outbound share envelope. Records are opaque JSON
/// until the official TT 31/2026 field mapping is published; they are
/// validated structurally (array, size caps) and stored verbatim.
/// </summary>
/// <remarks>
/// Deliberately carries NO DataAnnotation attributes. ABP's method-argument
/// <c>ValidationInterceptor</c> would otherwise throw an
/// <see cref="Volo.Abp.Validation.AbpValidationException"/> before the
/// receive path runs; because the inbound controller returns
/// <see cref="Microsoft.AspNetCore.Mvc.IActionResult"/> (not an object result),
/// ABP does not wrap that exception and it leaks to the partner as a raw 500
/// carrying the ABP error shape. Every field is validated in-method by
/// <see cref="PartnerInboundAppService"/> and surfaced as a mapped
/// <see cref="InboundReceiveOutcome"/> instead — see
/// <see cref="MaxSourceSystemLength"/>.
/// </remarks>
public class InboundEnvelopeDto
{
    public const int MaxRecords = 500;
    public const int MaxSourceSystemLength = 256;

    public string SchemaVersion { get; set; } = null!;

    public List<JsonElement> Records { get; set; } = [];

    public string? SourceSystem { get; set; }

    public DateTime? SentAt { get; set; }
}

public class InboundReceiveResultDto
{
    public Guid SubmissionId { get; set; }
    public string CorrelationId { get; set; } = null!;

    /// <summary>True when this X-Request-Id was already received (idempotent replay).</summary>
    public bool Duplicate { get; set; }

    public DateTime ReceivedAt { get; set; }
}

/// <summary>Outcome of one inbound receive attempt; the controller maps it to an HTTP status.</summary>
public enum InboundReceiveOutcome
{
    /// <summary>201-equivalent: submission persisted.</summary>
    Accepted = 1,

    /// <summary>200: same X-Request-Id already received — original submission returned.</summary>
    Duplicate = 2,

    /// <summary>401: missing/unknown/revoked/expired API key or suspended partner.</summary>
    Unauthorized = 3,

    /// <summary>403: authenticated, but the data type is not allowed for this partner.</summary>
    Forbidden = 4,

    /// <summary>400: malformed envelope, bad/missing headers, stale timestamp.</summary>
    InvalidRequest = 5,
}

public class InboundReceiveOperationDto
{
    public InboundReceiveOutcome Outcome { get; set; }
    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }
    public InboundReceiveResultDto? Result { get; set; }
}

/// <summary>Transport headers of one inbound request, extracted by the controller.</summary>
public class InboundRequestContext
{
    public string? ApiKey { get; set; }
    public string? RequestId { get; set; }
    public string? Timestamp { get; set; }
    public string? CorrelationId { get; set; }
    public string Path { get; set; } = "";
}

public interface IPartnerInboundAppService : Volo.Abp.Application.Services.IApplicationService
{
    Task<InboundReceiveOperationDto> ReceiveAsync(
        string dataTypeSegment,
        InboundRequestContext context,
        InboundEnvelopeDto envelope);

    Task<InboundSubmissionStatusDto> GetSubmissionStatusAsync(
        string requestId,
        InboundRequestContext context);
}

/// <summary>Status response returned to the submitting partner for their requestId.</summary>
public class InboundSubmissionStatusDto
{
    public Guid SubmissionId { get; set; }
    public string RequestId { get; set; } = "";
    public string DataType { get; set; } = "";
    public int RecordCount { get; set; }
    public DateTime ReceivedAt { get; set; }
    public string Status { get; set; } = "";
    public string? RejectionReason { get; set; }
    public DateTime? DispositionAt { get; set; }
}
