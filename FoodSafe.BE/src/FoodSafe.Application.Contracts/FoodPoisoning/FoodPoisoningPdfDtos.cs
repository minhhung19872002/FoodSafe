using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

public interface IFoodPoisoningCasePdfAppService : IApplicationService
{
    Task<byte[]> GenerateCasePdfAsync(Guid caseId);
}

public interface IFoodPoisoningIncidentPdfAppService : IApplicationService
{
    Task<byte[]> GenerateIncidentClosurePdfAsync(Guid incidentId);
}
