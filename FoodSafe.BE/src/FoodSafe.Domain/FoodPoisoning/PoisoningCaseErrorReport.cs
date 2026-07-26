using Volo.Abp.Domain.Entities;

namespace FoodSafe.FoodPoisoning;

public sealed class PoisoningCaseErrorReport : Entity<Guid>
{
    public Guid CaseId { get; private set; }
    public Guid FromOrganizationId { get; private set; }
    public string ErrorDescription { get; private set; } = string.Empty;
    public string CorrectionRequest { get; private set; } = string.Empty;
    public ErrorReportStatus Status { get; private set; }
    public string? Response { get; private set; }
    public DateTime? RespondedAt { get; private set; }
    public Guid? RespondedById { get; private set; }
    public DateTime CreationTime { get; private set; }
    public Guid? CreatorId { get; private set; }

    private PoisoningCaseErrorReport() { }

    internal PoisoningCaseErrorReport(
        Guid id,
        Guid caseId,
        Guid fromOrganizationId,
        string errorDescription,
        string correctionRequest,
        Guid? creatorId)
        : base(id)
    {
        CaseId = caseId;
        FromOrganizationId = fromOrganizationId;
        ErrorDescription = errorDescription.Trim();
        CorrectionRequest = correctionRequest.Trim();
        Status = ErrorReportStatus.Pending;
        CreationTime = DateTime.UtcNow;
        CreatorId = creatorId;
    }

    public void Acknowledge()
    {
        Status = ErrorReportStatus.Acknowledged;
    }

    public void MarkCorrected(Guid responderId, string response)
    {
        Status = ErrorReportStatus.Corrected;
        RespondedById = responderId;
        RespondedAt = DateTime.UtcNow;
        Response = response?.Trim();
    }
}
