using Volo.Abp.Application.Services;

namespace FoodSafe.Search;

public interface IGlobalSearchAppService : IApplicationService
{
    Task<GlobalSearchResultDto> GetAsync(GlobalSearchInput input);
}
