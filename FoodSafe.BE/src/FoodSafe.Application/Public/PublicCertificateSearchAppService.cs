using FoodSafe.BusinessManagement;
using FoodSafe.Licensing;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

[RemoteService(false)]
[AllowAnonymous]
public class PublicCertificateSearchAppService :
    ApplicationService,
    IPublicCertificateSearchAppService
{
    private readonly IRepository<EligibilityCertificate, Guid> _eligibility;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicCertificateSearchAppService(
        IRepository<EligibilityCertificate, Guid> eligibility,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        ICancellationTokenProvider cancellationTokens)
    {
        _eligibility = eligibility;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _adRegistrations = adRegistrations;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _businesses = businesses;
        _products = products;
        _cancellationTokens = cancellationTokens;
    }

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchEligibilityCertificatesAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _eligibility, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = c.CertificationScope,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _selfDeclarations, input,
            (q, kw) => q.Where(c =>
                c.DeclarationNumber.Contains(kw) || c.ProductName.Contains(kw)),
            q => q.OrderByDescending(c => c.DeclarationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Number = c.DeclarationNumber,
                BusinessName = businessName,
                ProductName = c.ProductName,
                IssueDate = c.DeclarationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _productRegistrations, input,
            (q, kw) => q.Where(c =>
                c.RegistrationNumber.Contains(kw) || c.ProductName.Contains(kw)),
            q => q.OrderByDescending(c => c.RegistrationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Number = c.RegistrationNumber,
                BusinessName = businessName,
                ProductName = c.ProductName,
                IssueDate = c.RegistrationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _adRegistrations, input,
            (q, kw) => q.Where(c => c.RegistrationNumber.Contains(kw)),
            q => q.OrderByDescending(c => c.RegistrationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Number = c.RegistrationNumber,
                BusinessName = businessName,
                ProductName = c.ContentDescription,
                IssueDate = c.RegistrationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _cfsCertificates, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            c => c.ProductId,
            (c, businessName, productName) => new PublicCertificateSummaryDto
            {
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = productName,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(
        PublicSearchRequestDto input) =>
        SearchAsync(
            _exportCertificates, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            c => c.ProductId,
            (c, businessName, productName) => new PublicCertificateSummaryDto
            {
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = productName,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    private async Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAsync<TEntity>(
        IRepository<TEntity, Guid> repository,
        PublicSearchRequestDto input,
        Func<IQueryable<TEntity>, string, IQueryable<TEntity>> applyKeyword,
        Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>> order,
        Func<TEntity, Guid> businessIdSelector,
        Func<TEntity, Guid?> productIdSelector,
        Func<TEntity, string, string?, PublicCertificateSummaryDto> map)
        where TEntity : class, IEntity<Guid>
    {
        var query = await repository.GetQueryableAsync();
        var keyword = input.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = applyKeyword(query, keyword);
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            order(query).Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        var businessIds = items.Select(businessIdSelector).Distinct().ToList();
        var businessNames = (await _businesses.GetListAsync(
                b => businessIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(b => b.Id, b => b.Name);

        var productIds = items.Select(productIdSelector)
            .Where(id => id.HasValue).Select(id => id!.Value).Distinct().ToList();
        var productNames = productIds.Count == 0
            ? new Dictionary<Guid, string>()
            : (await _products.GetListAsync(
                    p => productIds.Contains(p.Id), cancellationToken: _cancellationTokens.Token))
                .ToDictionary(p => p.Id, p => p.Name);

        return new PagedResultDto<PublicCertificateSummaryDto>(
            totalCount,
            items.Select(item => map(
                item,
                businessNames.GetValueOrDefault(businessIdSelector(item)) ?? string.Empty,
                productIdSelector(item) is { } pid
                    ? productNames.GetValueOrDefault(pid)
                    : null)).ToList());
    }

    private static string StatusLabel(LicenseStatus status) => status switch
    {
        LicenseStatus.Active => "Còn hiệu lực",
        LicenseStatus.Expired => "Hết hiệu lực",
        LicenseStatus.Revoked => "Đã thu hồi",
        _ => "Không xác định",
    };
}
