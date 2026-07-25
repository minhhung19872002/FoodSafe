using FoodSafe.Security;
using Volo.Abp.Authorization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

public interface IProductDataScopeChecker
{
    Task EnsureAccessAsync(Guid productId, DataScopeOperation operation);
}

public sealed class ProductDataScopeChecker(
    IRepository<Product, Guid> products,
    IRepository<Business, Guid> businesses,
    ICurrentDataScopeProvider dataScopeProvider,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter) :
    IProductDataScopeChecker,
    ITransientDependency
{
    public async Task EnsureAccessAsync(
        Guid productId,
        DataScopeOperation operation)
    {
        var scope = await dataScopeProvider.GetAsync(
            operation,
            cancellationTokens.Token);
        var query = await products.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var allowedBusinessIds = await AllowedBusinessIdsAsync(scope);
            var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
            query = query.Where(x =>
                allowedBusinessIds.Contains(x.BusinessId) ||
                (x.ProductGroupId.HasValue &&
                 productGroupIds.Contains(x.ProductGroupId.Value)));
        }
        if (!await asyncExecuter.AnyAsync(
                query.Where(x => x.Id == productId),
                cancellationTokens.Token))
            throw new AbpAuthorizationException(
                "The product is outside the current user's data scope.");
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businessQuery = await businesses.GetQueryableAsync();
        var organizationIds = scope.OrganizationIds;
        var provinceIds = scope.ProvinceIds;
        var districtIds = scope.DistrictIds;
        var communeIds = scope.CommuneIds;
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        return businessQuery.Where(x =>
                organizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 provinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressDistrictId.HasValue &&
                 districtIds.Contains(x.AddressDistrictId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 communeIds.Contains(x.AddressCommuneId.Value)))
            .Select(x => x.Id);
    }
}
