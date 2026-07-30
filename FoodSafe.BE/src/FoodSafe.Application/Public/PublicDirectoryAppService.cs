using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.Licensing;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

[RemoteService(false)]
[AllowAnonymous]
public class PublicDirectoryAppService : ApplicationService, IPublicDirectoryAppService
{
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<ProductGroup, Guid> _productGroups;
    private readonly IRepository<Commune, Guid> _communes;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicDirectoryAppService(
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<ProductGroup, Guid> productGroups,
        IRepository<Commune, Guid> communes,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _products = products;
        _businessTypes = businessTypes;
        _productGroups = productGroups;
        _communes = communes;
        _eligibilityCertificates = eligibilityCertificates;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<PublicBusinessSummaryDto>> SearchBusinessesAsync(
        PublicBusinessSearchRequestDto input)
    {
        var query = await _businesses.GetQueryableAsync();
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(b =>
                b.Name.ToUpper().Contains(keyword)
                || (b.Code != null && b.Code.ToUpper().Contains(keyword)));
        }

        if (input.BusinessTypeIds is { Count: > 0 })
        {
            query = query.Where(b =>
                b.BusinessTypeId.HasValue && input.BusinessTypeIds.Contains(b.BusinessTypeId.Value));
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderBy(b => b.Name).Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        var typeIds = items.Where(b => b.BusinessTypeId.HasValue)
            .Select(b => b.BusinessTypeId!.Value).Distinct().ToList();
        var typeNames = (await _businessTypes.GetListAsync(
                t => typeIds.Contains(t.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(t => t.Id, t => t.Name);

        var communeIds = items.Where(b => b.AddressCommuneId.HasValue)
            .Select(b => b.AddressCommuneId!.Value).Distinct().ToList();
        var communeNames = (await _communes.GetListAsync(
                c => communeIds.Contains(c.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(c => c.Id, c => c.Name);

        var businessIds = items.Select(b => b.Id).ToList();
        var today = Clock.Now.Date;
        var certifiedBusinessIds = (await _eligibilityCertificates.GetListAsync(
                c => businessIds.Contains(c.BusinessId), cancellationToken: _cancellationTokens.Token))
            .Where(c => c.EffectiveStatus(today) == LicenseStatus.Active)
            .Select(c => c.BusinessId)
            .ToHashSet();

        return new PagedResultDto<PublicBusinessSummaryDto>(
            totalCount,
            items.Select(b => new PublicBusinessSummaryDto
            {
                Name = b.Name,
                Code = b.Code,
                BusinessTypeName = b.BusinessTypeId.HasValue
                    ? typeNames.GetValueOrDefault(b.BusinessTypeId.Value)
                    : null,
                AddressText = string.Join(", ", new[]
                {
                    b.AddressStreet,
                    b.AddressCommuneId.HasValue
                        ? communeNames.GetValueOrDefault(b.AddressCommuneId.Value)
                        : null,
                }.Where(s => !string.IsNullOrWhiteSpace(s))),
                Status = b.Status,
                HasVsattpCommitment = b.HasVsattpCommitment,
                HasEligibilityCertificate = certifiedBusinessIds.Contains(b.Id),
            }).ToList());
    }

    public async Task<List<CatalogOptionDto>> GetBusinessTypeOptionsAsync()
    {
        var items = await _businessTypes.GetListAsync(
            t => t.IsActive, cancellationToken: _cancellationTokens.Token);
        return items.OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
            .Select(t => new CatalogOptionDto { Id = t.Id, Name = t.Name })
            .ToList();
    }

    public async Task<List<CatalogOptionDto>> GetProductGroupOptionsAsync()
    {
        var items = await _productGroups.GetListAsync(
            g => g.IsActive, cancellationToken: _cancellationTokens.Token);
        return items.OrderBy(g => g.SortOrder).ThenBy(g => g.Name)
            .Select(g => new CatalogOptionDto { Id = g.Id, Name = g.Name })
            .ToList();
    }

    public async Task<PagedResultDto<PublicProductSummaryDto>> SearchProductsAsync(
        PublicProductSearchRequestDto input)
    {
        var query = await _products.GetQueryableAsync();
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(p =>
                p.Name.ToUpper().Contains(keyword)
                || (p.Code != null && p.Code.ToUpper().Contains(keyword))
                || (p.BrandName != null && p.BrandName.ToUpper().Contains(keyword))
                || (p.Manufacturer != null && p.Manufacturer.ToUpper().Contains(keyword)));
        }

        if (input.ProductGroupId.HasValue)
        {
            query = query.Where(p => p.ProductGroupId == input.ProductGroupId.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderBy(p => p.Name).Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        var businessIds = items.Select(p => p.BusinessId).Distinct().ToList();
        var businessNames = (await _businesses.GetListAsync(
                b => businessIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(b => b.Id, b => b.Name);

        var groupIds = items.Where(p => p.ProductGroupId.HasValue)
            .Select(p => p.ProductGroupId!.Value).Distinct().ToList();
        var groupNames = (await _productGroups.GetListAsync(
                g => groupIds.Contains(g.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(g => g.Id, g => g.Name);

        return new PagedResultDto<PublicProductSummaryDto>(
            totalCount,
            items.Select(p => new PublicProductSummaryDto
            {
                Name = p.Name,
                Code = p.Code,
                BrandName = p.BrandName,
                Manufacturer = p.Manufacturer,
                BusinessName = businessNames.GetValueOrDefault(p.BusinessId) ?? string.Empty,
                ProductGroupName = p.ProductGroupId.HasValue
                    ? groupNames.GetValueOrDefault(p.ProductGroupId.Value)
                    : null,
            }).ToList());
    }
}
