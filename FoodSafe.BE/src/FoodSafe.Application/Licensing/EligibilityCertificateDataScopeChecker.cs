using FoodSafe.BusinessManagement;
using FoodSafe.Security;
using Volo.Abp.Authorization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

public interface IEligibilityCertificateDataScopeChecker
{
    Task EnsureAccessAsync(Guid id, DataScopeOperation operation);
}

public sealed class EligibilityCertificateDataScopeChecker(
    IRepository<EligibilityCertificate, Guid> certificates,
    IRepository<Business, Guid> businesses,
    IRepository<BusinessProductGroup> businessProductGroups,
    ICurrentDataScopeProvider dataScopeProvider,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter) :
    IEligibilityCertificateDataScopeChecker,
    ITransientDependency
{
    public async Task EnsureAccessAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await dataScopeProvider.GetAsync(
            operation,
            cancellationTokens.Token);
        var query = await certificates.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var allowed = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowed.Contains(x.BusinessId));
        }
        if (!await asyncExecuter.AnyAsync(
                query.Where(x => x.Id == id),
                cancellationTokens.Token))
            throw new AbpAuthorizationException(
                "The eligibility certificate is outside the current user's data scope.");
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope) =>
        EligibilityCertificateScope.AllowedBusinessIds(
            await businesses.GetQueryableAsync(),
            await businessProductGroups.GetQueryableAsync(),
            scope);
}
