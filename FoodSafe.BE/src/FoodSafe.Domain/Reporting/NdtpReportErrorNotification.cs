using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.Reporting;

public sealed class NdtpReportErrorNotification : Entity<Guid>
{
    public Guid ReportId { get; private set; }
    public Guid FromOrganizationId { get; private set; }
    public string ErrorFields { get; private set; } = string.Empty;
    public string CorrectionDetails { get; private set; } = string.Empty;
    public ReportErrorNotificationStatus Status { get; private set; }
    public string? Response { get; private set; }
    public Guid? RespondedById { get; private set; }
    public DateTime? RespondedAt { get; private set; }
    public DateTime CreationTime { get; private set; }
    public Guid? CreatorId { get; private set; }

    private NdtpReportErrorNotification() { }

    internal NdtpReportErrorNotification(
        Guid id, Guid reportId, Guid fromOrganizationId,
        string errorFields, string correctionDetails, Guid creatorId)
    {
        Id = id;
        ReportId = reportId;
        FromOrganizationId = fromOrganizationId;
        ErrorFields = Check.NotNullOrWhiteSpace(errorFields, nameof(errorFields));
        CorrectionDetails = Check.NotNullOrWhiteSpace(correctionDetails, nameof(correctionDetails));
        Status = ReportErrorNotificationStatus.Pending;
        CreationTime = DateTime.UtcNow;
        CreatorId = creatorId;
    }

    public void Acknowledge()
    {
        Status = ReportErrorNotificationStatus.Acknowledged;
    }

    public void MarkCorrected(Guid responderId, string response)
    {
        RespondedById = responderId;
        RespondedAt = DateTime.UtcNow;
        Response = response;
        Status = ReportErrorNotificationStatus.Corrected;
    }
}
