using Volo.Abp.Application.Services;

namespace FoodSafe.DataIntegration;

/// <summary>External-system select options (GAP-INT-2 / G-16).</summary>
public interface IExternalSystemOptionsAppService : IApplicationService
{
    Task<List<string>> GetListAsync();
}
