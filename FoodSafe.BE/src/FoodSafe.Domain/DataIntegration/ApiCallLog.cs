using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

/// <summary>
/// One immutable communication attempt with a partner system (STT 51-57).
/// A logical exchange (envelope) is the original attempt plus its retries:
/// retries append new rows pointing at the root via <see cref="CorrelationId"/>
/// and never overwrite the evidence of a previous attempt.
/// </summary>
public class ApiCallLog : CreationAuditedAggregateRoot<Guid>
{
    public Guid OrganizationId { get; private set; }
    public ApiCallDirection Direction { get; private set; }
    public string ExternalSystemName { get; private set; } = null!;
    public string EndpointUrl { get; private set; } = null!;
    public string HttpMethod { get; private set; } = null!;
    public string? RequestHeaders { get; private set; }
    public string? RequestBody { get; private set; }
    public int? ResponseStatusCode { get; private set; }
    public string? ResponseBody { get; private set; }
    public DateTime CalledAt { get; private set; }
    public long DurationMs { get; private set; }
    public bool IsSuccess { get; private set; }
    public string? ErrorMessage { get; private set; }
    public SharedDataType DataType { get; private set; } = SharedDataType.Other;

    /// <summary>Endpoint used for the call, so failed attempts can be retried.</summary>
    public Guid? EndpointId { get; private set; }

    /// <summary>Id of the envelope's original attempt; null on the original itself.</summary>
    public Guid? CorrelationId { get; private set; }

    /// <summary>1 for the original send, incremented per retry of the same envelope.</summary>
    public int AttemptNumber { get; private set; } = 1;

    /// <summary>SHA-256 hex of the request body, proving retries re-sent the same payload.</summary>
    public string? PayloadChecksum { get; private set; }

    private ApiCallLog() { }

    public static ApiCallLog Create(
        Guid id,
        Guid organizationId,
        ApiCallDirection direction,
        string externalSystemName,
        string endpointUrl,
        string httpMethod,
        DateTime calledAt,
        long durationMs,
        bool isSuccess,
        string? requestHeaders = null,
        string? requestBody = null,
        int? responseStatusCode = null,
        string? responseBody = null,
        string? errorMessage = null,
        SharedDataType dataType = SharedDataType.Other,
        Guid? endpointId = null,
        Guid? correlationId = null,
        int attemptNumber = 1,
        string? payloadChecksum = null)
    {
        Check.NotNullOrWhiteSpace(externalSystemName, nameof(externalSystemName));
        Check.NotNullOrWhiteSpace(endpointUrl, nameof(endpointUrl));
        Check.NotNullOrWhiteSpace(httpMethod, nameof(httpMethod));
        Check.Positive(attemptNumber, nameof(attemptNumber));

        return new ApiCallLog
        {
            Id = id,
            OrganizationId = organizationId,
            Direction = direction,
            ExternalSystemName = externalSystemName,
            EndpointUrl = endpointUrl,
            HttpMethod = httpMethod,
            CalledAt = calledAt,
            DurationMs = durationMs,
            IsSuccess = isSuccess,
            RequestHeaders = requestHeaders,
            RequestBody = requestBody,
            ResponseStatusCode = responseStatusCode,
            ResponseBody = responseBody,
            ErrorMessage = errorMessage,
            DataType = dataType,
            EndpointId = endpointId,
            CorrelationId = correlationId,
            AttemptNumber = attemptNumber,
            PayloadChecksum = payloadChecksum,
        };
    }
}
