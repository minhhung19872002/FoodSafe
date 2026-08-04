using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

public interface IFoodPoisoningCasePdfAppService : IApplicationService
{
    Task<byte[]> GenerateCasePdfAsync(Guid caseId);
}

public interface IFoodPoisoningIncidentPdfAppService : IApplicationService
{
    Task<byte[]> GenerateIncidentClosurePdfAsync(Guid incidentId);

    /// <summary>Ba mẫu báo cáo vụ theo QĐ 01/2006/QĐ-BYT (GAP-POIS-2).</summary>
    Task<byte[]> GenerateEmergencyReportPdfAsync(
        Guid incidentId, PoisoningEmergencyReportKind kind);
}
