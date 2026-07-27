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
        CurrentDataScope scope)
    {
        var businessQuery = await businesses.GetQueryableAsync();
        var links = await businessProductGroups.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return businessQuery.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 scope.ProvinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressDistrictId.HasValue &&
                 scope.DistrictIds.Contains(x.AddressDistrictId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 scope.CommuneIds.Contains(x.AddressCommuneId.Value)) ||
                links.Any(link =>
                    link.BusinessId == x.Id &&
                    productGroupIds.Contains(link.ProductGroupId)))
            .Select(x => x.Id);
    }
}
