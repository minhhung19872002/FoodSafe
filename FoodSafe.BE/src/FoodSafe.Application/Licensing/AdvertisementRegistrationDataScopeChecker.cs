using FoodSafe.BusinessManagement;
using FoodSafe.Security;
using Volo.Abp.Authorization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;

namespace FoodSafe.Licensing;

public interface IAdvertisementRegistrationDataScopeChecker
{
    Task EnsureAccessAsync(Guid id, DataScopeOperation operation);
}

public sealed class AdvertisementRegistrationDataScopeChecker(
    IRepository<AdvertisementRegistration, Guid> registrations,
    IRepository<Business, Guid> businesses,
    IRepository<Product, Guid> products,
    ICurrentDataScopeProvider dataScopeProvider,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter) :
    IAdvertisementRegistrationDataScopeChecker,
    ITransientDependency
{
    public async Task EnsureAccessAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await dataScopeProvider.GetAsync(
            operation,
            cancellationTokens.Token);
        var query = await registrations.WithDetailsAsync(x => x.Products);
        if (!scope.HasGlobalAccess)
        {
            var allowed = await AllowedBusinessIdsAsync(scope);
            var groupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
            var productQuery = await products.GetQueryableAsync();
            query = query.Where(x =>
                allowed.Contains(x.BusinessId) ||
                x.Products.Any(link =>
                    productQuery.Any(product =>
                        product.Id == link.ProductId &&
                        product.ProductGroupId.HasValue &&
                        groupIds.Contains(product.ProductGroupId.Value))));
        }
        if (!await asyncExecuter.AnyAsync(
                query.Where(x => x.Id == id),
                cancellationTokens.Token))
            throw new AbpAuthorizationException(
                "The advertisement registration is outside the current user's data scope.");
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businessQuery = await businesses.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
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
                 scope.CommuneIds.Contains(x.AddressCommuneId.Value)))
            .Select(x => x.Id);
    }
}
