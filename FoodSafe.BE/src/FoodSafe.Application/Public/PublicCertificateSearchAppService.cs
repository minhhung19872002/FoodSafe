using System.Linq.Expressions;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
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
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<BusinessClassification, Guid> _businessClassifications;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<Commune, Guid> _communes;
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
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<BusinessClassification, Guid> businessClassifications,
        IRepository<Province, Guid> provinces,
        IRepository<Commune, Guid> communes,
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
        _businessTypes = businessTypes;
        _businessClassifications = businessClassifications;
        _provinces = provinces;
        _communes = communes;
        _cancellationTokens = cancellationTokens;
    }

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchEligibilityCertificatesAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _eligibility, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = c.CertificationScope,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchSelfDeclarationsAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _selfDeclarations, input,
            (q, kw) => q.Where(c =>
                c.DeclarationNumber.Contains(kw) || c.ProductName.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.DeclarationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.DeclarationNumber,
                BusinessName = businessName,
                ProductName = c.ProductName,
                IssueDate = c.DeclarationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchProductRegistrationsAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _productRegistrations, input,
            (q, kw) => q.Where(c =>
                c.RegistrationNumber.Contains(kw) || c.ProductName.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.RegistrationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.RegistrationNumber,
                BusinessName = businessName,
                ProductName = c.ProductName,
                IssueDate = c.RegistrationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAdRegistrationsAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _adRegistrations, input,
            (q, kw) => q.Where(c => c.RegistrationNumber.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.RegistrationDate),
            c => c.BusinessId,
            _ => null,
            (c, businessName, _) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.RegistrationNumber,
                BusinessName = businessName,
                ProductName = c.ContentDescription,
                IssueDate = c.RegistrationDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchCfsCertificatesAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _cfsCertificates, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            c => c.ProductId,
            (c, businessName, productName) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = productName,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = c.CertifyingAuthority,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public Task<PagedResultDto<PublicCertificateSummaryDto>> SearchExportFoodCertificatesAsync(
        PublicCertificateSearchRequestDto input) =>
        SearchAsync(
            _exportCertificates, input,
            (q, kw) => q.Where(c => c.CertificateNumber.Contains(kw)),
            (q, s, today) => ApplyEffectiveStatusFilter(q, s, today, c => c.Status, c => c.ExpiryDate),
            q => q.OrderByDescending(c => c.IssueDate),
            c => c.BusinessId,
            c => c.ProductId,
            (c, businessName, productName) => new PublicCertificateSummaryDto
            {
                Id = c.Id,
                Number = c.CertificateNumber,
                BusinessName = businessName,
                ProductName = productName,
                IssueDate = c.IssueDate,
                ExpiryDate = c.ExpiryDate,
                CertifyingAuthority = null,
                StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date)),
            });

    public async Task<PublicCertificateDetailDto> GetEligibilityCertificateDetailAsync(Guid id)
    {
        var c = await _eligibility.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.CertificateNumber;
        dto.CertificationScope = c.CertificationScope;
        dto.IssueDate = c.IssueDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.CertifyingAuthority = c.CertifyingAuthority;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        return dto;
    }

    public async Task<PublicCertificateDetailDto> GetSelfDeclarationDetailAsync(Guid id)
    {
        var c = await _selfDeclarations.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.DeclarationNumber;
        dto.ProductName = c.ProductName;
        dto.Manufacturer = c.Manufacturer;
        dto.IssueDate = c.DeclarationDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        return dto;
    }

    public async Task<PublicCertificateDetailDto> GetProductRegistrationDetailAsync(Guid id)
    {
        var c = await _productRegistrations.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.RegistrationNumber;
        dto.ProductName = c.ProductName;
        dto.Manufacturer = c.Manufacturer;
        dto.IssueDate = c.RegistrationDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.CertifyingAuthority = c.CertifyingAuthority;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        return dto;
    }

    public async Task<PublicCertificateDetailDto> GetAdRegistrationDetailAsync(Guid id)
    {
        var c = await _adRegistrations.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.RegistrationNumber;
        dto.ProductName = c.ContentDescription;
        dto.IssueDate = c.RegistrationDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        return dto;
    }

    public async Task<PublicCertificateDetailDto> GetCfsCertificateDetailAsync(Guid id)
    {
        var c = await _cfsCertificates.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.CertificateNumber;
        dto.IssueDate = c.IssueDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.CertifyingAuthority = c.CertifyingAuthority;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        if (c.ProductId.HasValue)
        {
            var product = await _products.FindAsync(c.ProductId.Value, cancellationToken: _cancellationTokens.Token);
            dto.ProductName = product?.Name;
        }
        return dto;
    }

    public async Task<PublicCertificateDetailDto> GetExportFoodCertificateDetailAsync(Guid id)
    {
        var c = await _exportCertificates.GetAsync(id, cancellationToken: _cancellationTokens.Token);
        var dto = await BuildDetailAsync(c.BusinessId);
        dto.Id = c.Id;
        dto.Number = c.CertificateNumber;
        dto.IssueDate = c.IssueDate;
        dto.ExpiryDate = c.ExpiryDate;
        dto.StatusLabel = StatusLabel(c.EffectiveStatus(Clock.Now.Date));
        dto.RevokeReason = c.RevokeReason;
        dto.RevokedAt = c.RevokedAt;
        if (c.ProductId.HasValue)
        {
            var product = await _products.FindAsync(c.ProductId.Value, cancellationToken: _cancellationTokens.Token);
            dto.ProductName = product?.Name;
        }
        return dto;
    }

    private async Task<PublicCertificateDetailDto> BuildDetailAsync(Guid businessId)
    {
        var business = await _businesses.GetAsync(businessId, cancellationToken: _cancellationTokens.Token);

        string? businessTypeName = null;
        if (business.BusinessTypeId.HasValue)
        {
            var bt = await _businessTypes.FindAsync(
                business.BusinessTypeId.Value, cancellationToken: _cancellationTokens.Token);
            businessTypeName = bt?.Name;
        }

        string? classificationName = null;
        if (business.BusinessClassificationId.HasValue)
        {
            var bc = await _businessClassifications.FindAsync(
                business.BusinessClassificationId.Value, cancellationToken: _cancellationTokens.Token);
            classificationName = bc?.Name;
        }

        string? provinceName = null;
        if (business.AddressProvinceId.HasValue)
        {
            var province = await _provinces.FindAsync(
                business.AddressProvinceId.Value, cancellationToken: _cancellationTokens.Token);
            provinceName = province?.Name;
        }

        string? communeName = null;
        if (business.AddressCommuneId.HasValue)
        {
            var commune = await _communes.FindAsync(
                business.AddressCommuneId.Value, cancellationToken: _cancellationTokens.Token);
            communeName = commune?.Name;
        }

        return new PublicCertificateDetailDto
        {
            BusinessName = business.Name,
            BusinessCode = business.Code,
            BusinessTypeName = businessTypeName,
            BusinessClassificationName = classificationName,
            BusinessStatus = business.Status,
            TaxCode = business.TaxCode,
            RepresentativeName = business.RepresentativeName,
            ContactPhone = business.ContactPhone,
            ContactEmail = business.ContactEmail,
            AddressStreet = business.AddressStreet,
            CommuneName = communeName,
            ProvinceName = provinceName,
            EstablishedDate = business.EstablishedDate,
            EmployeeCount = business.EmployeeCount,
            HasVsattpCommitment = business.HasVsattpCommitment,
            HasEligibilityCertificate = business.HasEligibilityCertificate,
        };
    }

    private async Task<PagedResultDto<PublicCertificateSummaryDto>> SearchAsync<TEntity>(
        IRepository<TEntity, Guid> repository,
        PublicCertificateSearchRequestDto input,
        Func<IQueryable<TEntity>, string, IQueryable<TEntity>> applyKeyword,
        Func<IQueryable<TEntity>, LicenseStatus?, DateTime, IQueryable<TEntity>> applyStatusFilter,
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

        query = applyStatusFilter(query, input.Status, Clock.Now.Date);

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

    private static IQueryable<TEntity> ApplyEffectiveStatusFilter<TEntity>(
        IQueryable<TEntity> query,
        LicenseStatus? status,
        DateTime today,
        Expression<Func<TEntity, LicenseStatus>> statusSelector,
        Expression<Func<TEntity, DateTime?>> expirySelector)
    {
        if (status is null) return query;

        var param = Expression.Parameter(typeof(TEntity), "e");
        var statusBody = ReplaceLambdaParam(statusSelector, param);
        var expiryBody = ReplaceLambdaParam(expirySelector, param);
        var revokedConst = Expression.Constant(LicenseStatus.Revoked);
        var todayConst = Expression.Constant((DateTime?)today, typeof(DateTime?));
        var nullConst = Expression.Constant(null, typeof(DateTime?));

        Expression predicate = status.Value switch
        {
            LicenseStatus.Active => Expression.AndAlso(
                Expression.NotEqual(statusBody, revokedConst),
                Expression.OrElse(
                    Expression.Equal(expiryBody, nullConst),
                    Expression.GreaterThanOrEqual(expiryBody, todayConst))),
            LicenseStatus.Expired => Expression.AndAlso(
                Expression.NotEqual(statusBody, revokedConst),
                Expression.AndAlso(
                    Expression.NotEqual(expiryBody, nullConst),
                    Expression.LessThan(expiryBody, todayConst))),
            LicenseStatus.Revoked => Expression.Equal(statusBody, revokedConst),
            _ => throw new ArgumentOutOfRangeException(nameof(status)),
        };

        var lambda = Expression.Lambda<Func<TEntity, bool>>(predicate, param);
        return query.Where(lambda);
    }

    private static Expression ReplaceLambdaParam<TIn, TOut>(
        Expression<Func<TIn, TOut>> lambda, ParameterExpression newParam)
    {
        return new ParameterReplacer(lambda.Parameters[0], newParam).Visit(lambda.Body);
    }

    private sealed class ParameterReplacer(ParameterExpression oldParam, ParameterExpression newParam)
        : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node)
            => node == oldParam ? newParam : base.VisitParameter(node);
    }

    private static string StatusLabel(LicenseStatus status) => status switch
    {
        LicenseStatus.Active => "Còn hiệu lực",
        LicenseStatus.Expired => "Hết hiệu lực",
        LicenseStatus.Revoked => "Đã thu hồi",
        _ => "Không xác định",
    };
}
