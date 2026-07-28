using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.FoodPoisoning;

public sealed class PoisoningIncidentErrorReport : Entity<Guid>
{
    public Guid IncidentId { get; private set; }
    public Guid FromOrganizationId { get; private set; }
    public string ErrorDescription { get; private set; } = string.Empty;
    public string CorrectionRequest { get; private set; } = string.Empty;
    public ErrorReportStatus Status { get; private set; }
    public string? Response { get; private set; }
    public DateTime? RespondedAt { get; private set; }
    public Guid? RespondedById { get; private set; }
    public DateTime CreationTime { get; private set; }
    public Guid? CreatorId { get; private set; }

    private PoisoningIncidentErrorReport() { }

    internal PoisoningIncidentErrorReport(
        Guid id,
        Guid incidentId,
        Guid fromOrganizationId,
        string errorDescription,
        string correctionRequest,
        Guid? creatorId)
        : base(id)
    {
        IncidentId = incidentId;
        FromOrganizationId = fromOrganizationId;
        ErrorDescription = errorDescription.Trim();
        CorrectionRequest = correctionRequest.Trim();
        Status = ErrorReportStatus.Pending;
        CreationTime = DateTime.UtcNow;
        CreatorId = creatorId;
    }

    public void Acknowledge()
    {
        if (Status != ErrorReportStatus.Pending)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.FoodPoisoning.ErrorReportAlreadyProcessed);

        Status = ErrorReportStatus.Acknowledged;
    }

    public void MarkCorrected(Guid responderId, string response)
    {
        if (Status == ErrorReportStatus.Corrected)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.FoodPoisoning.ErrorReportAlreadyProcessed);
        Check.NotNullOrWhiteSpace(response, nameof(response));

        Status = ErrorReportStatus.Corrected;
        RespondedById = responderId;
        RespondedAt = DateTime.UtcNow;
        Response = response.Trim();
    }
}
