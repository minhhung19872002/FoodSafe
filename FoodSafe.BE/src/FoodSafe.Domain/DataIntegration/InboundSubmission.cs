using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.DataIntegration;

/// <summary>
/// One durable inbound data submission received from an authenticated partner
/// (INT-03). The payload is stored verbatim for evidence and later business
/// ingestion once the official TT 31/2026 field mapping is published
/// (EXTERNALLY_BLOCKED — see docs/functional-audit). The pair
/// (PartnerAccountId, RequestId) is unique among live rows, which gives
/// database-enforced idempotency: a duplicate delivery returns the original
/// submission instead of creating a second one.
/// </summary>
public class InboundSubmission : CreationAuditedAggregateRoot<Guid>
{
    public const int MaxRequestIdLength = InboundSubmissionConsts.MaxRequestIdLength;
    public const int MaxSchemaVersionLength = InboundSubmissionConsts.MaxSchemaVersionLength;
    public const int MaxCorrelationIdLength = InboundSubmissionConsts.MaxCorrelationIdLength;
    public const int MaxRejectReasonLength = InboundSubmissionConsts.MaxRejectReasonLength;

    public Guid PartnerAccountId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public SharedDataType DataType { get; private set; }
    public string SchemaVersion { get; private set; } = null!;

    /// <summary>Partner-supplied idempotency key (X-Request-Id).</summary>
    public string RequestId { get; private set; } = null!;

    /// <summary>Partner-supplied or server-generated correlation id for tracing.</summary>
    public string? CorrelationId { get; private set; }

    /// <summary>The received JSON payload, stored verbatim.</summary>
    public string Payload { get; private set; } = null!;

    public int RecordCount { get; private set; }
    public DateTime ReceivedAt { get; private set; }
    public InboundSubmissionStatus Status { get; private set; }
    public string? RejectReason { get; private set; }

    /// <summary>Officer who approved or rejected the submission (null while Received).</summary>
    public Guid? ProcessedById { get; private set; }
    public DateTime? ProcessedAt { get; private set; }

    private InboundSubmission() { }

    public static InboundSubmission Create(
        Guid id,
        Guid partnerAccountId,
        Guid organizationId,
        SharedDataType dataType,
        string schemaVersion,
        string requestId,
        string payload,
        int recordCount,
        DateTime receivedAt,
        string? correlationId = null)
    {
        Check.NotNullOrWhiteSpace(
            schemaVersion, nameof(schemaVersion), MaxSchemaVersionLength);
        Check.NotNullOrWhiteSpace(
            requestId, nameof(requestId), MaxRequestIdLength);
        Check.NotNullOrWhiteSpace(payload, nameof(payload));
        Check.Range(recordCount, nameof(recordCount), 0, int.MaxValue);

        return new InboundSubmission
        {
            Id = id,
            PartnerAccountId = partnerAccountId,
            OrganizationId = organizationId,
            DataType = dataType,
            SchemaVersion = schemaVersion,
            RequestId = requestId,
            Payload = payload,
            RecordCount = recordCount,
            ReceivedAt = receivedAt,
            Status = InboundSubmissionStatus.Received,
            CorrelationId = correlationId,
        };
    }

    /// <summary>
    /// Approves the submission (Received → Processed). Terminal: a submission that
    /// already carries a disposition cannot be re-dispositioned, so a repeated call
    /// — a double-clicked button, a retried request — cannot rewrite the audit trail.
    /// </summary>
    public void MarkProcessed(Guid processedById, DateTime processedAt)
    {
        EnsureAwaitingDisposition();

        Status = InboundSubmissionStatus.Processed;
        ProcessedById = processedById;
        ProcessedAt = processedAt;
    }

    /// <summary>Rejects the submission with a mandatory reason (Received → Rejected).</summary>
    public void Reject(Guid rejectedById, DateTime rejectedAt, string reason)
    {
        EnsureAwaitingDisposition();

        RejectReason = Check.NotNullOrWhiteSpace(
            reason, nameof(reason), MaxRejectReasonLength).Trim();
        Status = InboundSubmissionStatus.Rejected;
        ProcessedById = rejectedById;
        ProcessedAt = rejectedAt;
    }

    private void EnsureAwaitingDisposition()
    {
        if (Status != InboundSubmissionStatus.Received)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.SubmissionAlreadyDisposed);
        }
    }
}
