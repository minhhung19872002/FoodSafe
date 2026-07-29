using FoodSafe.Security;
using Volo.Abp.Authorization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;
using Volo.Abp.Threading;

namespace FoodSafe.BusinessManagement;

public interface ISelfDeclarationDataScopeChecker
{
    Task EnsureAccessAsync(
        Guid declarationId,
        DataScopeOperation operation);
}

public sealed class SelfDeclarationDataScopeChecker(
    IRepository<SelfDeclaration, Guid> declarations,
    IRepository<Business, Guid> businesses,
    IRepository<Product, Guid> products,
    ICurrentDataScopeProvider dataScopeProvider,
    ICancellationTokenProvider cancellationTokens,
    IAsyncQueryableExecuter asyncExecuter) :
    ISelfDeclarationDataScopeChecker,
    ITransientDependency
{
    public async Task EnsureAccessAsync(
        Guid declarationId,
        DataScopeOperation operation)
    {
        var scope = await dataScopeProvider.GetAsync(
            operation,
            cancellationTokens.Token);
        var query = await declarations.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var allowedBusinessIds = await AllowedBusinessIdsAsync(scope);
            var productGroupIds =
                scope.ProductGroupIds ?? new HashSet<Guid>();
            var productQuery = await products.GetQueryableAsync();
            query = query.Where(x =>
                allowedBusinessIds.Contains(x.BusinessId) ||
                (x.ProductId.HasValue &&
                 productQuery.Any(product =>
                     product.Id == x.ProductId.Value &&
                     product.ProductGroupId.HasValue &&
                     productGroupIds.Contains(
                         product.ProductGroupId.Value))));
        }
        if (!await asyncExecuter.AnyAsync(
                query.Where(x => x.Id == declarationId),
                cancellationTokens.Token))
            throw new AbpAuthorizationException(
                "The self-declaration is outside the current user's data scope.");
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businessQuery = await businesses.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds =
            scope.BusinessTypeIds ?? new HashSet<Guid>();
        return businessQuery.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 scope.ProvinceIds.Contains(
                     x.AddressProvinceId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 scope.CommuneIds.Contains(
                     x.AddressCommuneId.Value)))
            .Select(x => x.Id);
    }
}
