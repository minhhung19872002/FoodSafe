using Volo.Abp.Application.Services;

namespace FoodSafe.FoodPoisoning;

public interface IFoodPoisoningCasePdfAppService : IApplicationService
{
    Task<byte[]> GenerateCasePdfAsync(Guid caseId);
}
