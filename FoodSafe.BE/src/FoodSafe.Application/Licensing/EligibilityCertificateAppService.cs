using FoodSafe.BusinessManagement;
using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Licensing;

[Authorize(FoodSafePermissions.Licensing.EligibilityCertificates.View)]
public class EligibilityCertificateAppService :
    ApplicationService,
    IEligibilityCertificateAppService
{
    private readonly IRepository<EligibilityCertificate, Guid> _certificates;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public EligibilityCertificateAppService(
        IRepository<EligibilityCertificate, Guid> certificates,
        IRepository<Business, Guid> businesses,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<DocumentOwner, Guid> documentOwners,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _certificates = certificates;
        _businesses = businesses;
        _businessProductGroups = businessProductGroups;
        _documentOwners = documentOwners;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<EligibilityCertificateDto>>
        GetListAsync(EligibilityCertificateListInput input)
    {
        var today = Clock.Now.Date;
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.CertificateNumber.Contains(filter) ||
                (x.CertifyingAuthority != null &&
                 x.CertifyingAuthority.Contains(filter)) ||
                (x.CertificationScope != null &&
                 x.CertificationScope.Contains(filter)));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId);
        if (input.Status.HasValue)
            query = ApplyStatusFilter(query, input.Status.Value, today);
        if (input.ExpiringWithinDays.HasValue)
        {
            var through = today.AddDays(input.ExpiringWithinDays.Value);
            query = query.Where(x =>
                x.Status != LicenseStatus.Revoked &&
                x.ExpiryDate.HasValue &&
                x.ExpiryDate.Value >= today &&
                x.ExpiryDate.Value <= through);
        }

        var total = await AsyncExecuter.LongCountAsync(
            query,
            _cancellationTokens.Token);
        var rows = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            _cancellationTokens.Token);
        return new(total, await ToDtosAsync(rows, today));
    }

    public async Task<EligibilityCertificateDto> GetAsync(Guid id)
    {
        var certificate = await GetScopedAsync(
            id,
            DataScopeOperation.View);
        return (await ToDtosAsync([certificate], Clock.Now.Date))[0];
    }

    public async Task<IReadOnlyList<ProductBusinessOptionDto>>
        GetBusinessOptionsAsync()
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View,
            _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();
        query = query.Where(x => x.Status == BusinessStatus.Active);
        if (!scope.HasGlobalAccess)
        {
            var allowed = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowed.Contains(x.Id));
        }
        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name)
                .Take(500)
                .Select(x => new ProductBusinessOptionDto
                {
                    Id = x.Id,
                    Code = x.Code,
                    Name = x.Name
                }),
            _cancellationTokens.Token);
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Create)]
    public async Task<EligibilityCertificateDto> CreateAsync(
        UpsertEligibilityCertificateDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId,
            DataScopeOperation.Create);
        await EnsureUniqueNumberAsync(input.CertificateNumber, null);
        var id = GuidGenerator.Create();
        var certificate = EligibilityCertificate.Create(
            id,
            business.Id,
            business.OrganizationId,
            input.CertificateNumber,
            input.IssueDate,
            input.ExpiryDate,
            input.CertifyingAuthority,
            input.CertificationScope,
            input.Notes,
            Clock.Now.Date);
        await _documentOwners.InsertAsync(
            DocumentOwner.Create(
                id,
                business.OrganizationId,
                "eligibility-certificate",
                Clock.Now),
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await _certificates.InsertAsync(
            certificate,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await SynchronizeBusinessFlagAsync(business);
        return (await ToDtosAsync([certificate], Clock.Now.Date))[0];
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    public async Task<EligibilityCertificateDto> UpdateAsync(
        Guid id,
        UpdateEligibilityCertificateDto input)
    {
        var certificate = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        if (input.BusinessId != certificate.BusinessId)
            throw new UserFriendlyException(
                "Không thể chuyển giấy chứng nhận sang cơ sở khác.");
        var business = await GetScopedBusinessAsync(
            certificate.BusinessId,
            DataScopeOperation.Edit);
        await EnsureUniqueNumberAsync(input.CertificateNumber, id);
        certificate.Update(
            input.CertificateNumber,
            input.IssueDate,
            input.ExpiryDate,
            input.CertifyingAuthority,
            input.CertificationScope,
            input.Notes,
            Clock.Now.Date);
        await _certificates.UpdateAsync(
            certificate,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await SynchronizeBusinessFlagAsync(business);
        return (await ToDtosAsync([certificate], Clock.Now.Date))[0];
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var certificate = await GetScopedAsync(
            id,
            DataScopeOperation.Delete);
        var business = await GetScopedBusinessAsync(
            certificate.BusinessId,
            DataScopeOperation.Delete);
        await _certificates.DeleteAsync(
            certificate,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await SynchronizeBusinessFlagAsync(business);
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    public async Task<EligibilityCertificateDto> RevokeAsync(
        Guid id,
        RevokeEligibilityCertificateDto input)
    {
        var certificate = await GetScopedAsync(
            id,
            DataScopeOperation.Edit);
        var business = await GetScopedBusinessAsync(
            certificate.BusinessId,
            DataScopeOperation.Edit);
        certificate.Revoke(input.Reason, Clock.Now, CurrentUser.GetId());
        await _certificates.UpdateAsync(
            certificate,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        await SynchronizeBusinessFlagAsync(business);
        return (await ToDtosAsync([certificate], Clock.Now.Date))[0];
    }

    private async Task<IQueryable<EligibilityCertificate>>
        ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _certificates.GetQueryableAsync();
        if (scope.HasGlobalAccess)
            return query;
        var allowed = await AllowedBusinessIdsAsync(scope);
        return query.Where(x => allowed.Contains(x.BusinessId));
    }

    private async Task<EligibilityCertificate> GetScopedAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The eligibility certificate is outside the current user's data scope.");
    }

    private async Task<Business> GetScopedBusinessAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation,
            _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
        {
            var allowed = await AllowedBusinessIdsAsync(scope);
            query = query.Where(x => allowed.Contains(x.Id));
        }
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The business is outside the current user's data scope.");
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businesses = await _businesses.GetQueryableAsync();
        var links = await _businessProductGroups.GetQueryableAsync();
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();
        return businesses.Where(x =>
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

    private async Task EnsureUniqueNumberAsync(
        string number,
        Guid? excludedId)
    {
        var normalized = number.Trim().ToUpperInvariant();
        using (_certificates.DisableTracking())
        using (DataFilter.Disable<ISoftDelete>())
        {
            var query = await _certificates.GetQueryableAsync();
            if (await AsyncExecuter.AnyAsync(
                    query.Where(x =>
                        x.CertificateNumber == normalized &&
                        (!excludedId.HasValue || x.Id != excludedId.Value)),
                    _cancellationTokens.Token))
                throw new BusinessException(
                        FoodSafeDomainErrorCodes.EligibilityCertificate
                            .DuplicateNumber)
                    .WithData("CertificateNumber", normalized);
        }
    }

    private async Task SynchronizeBusinessFlagAsync(Business business)
    {
        var today = Clock.Now.Date;
        var query = await _certificates.GetQueryableAsync();
        var hasActive = await AsyncExecuter.AnyAsync(
            query.Where(x =>
                x.BusinessId == business.Id &&
                x.Status != LicenseStatus.Revoked &&
                (!x.ExpiryDate.HasValue || x.ExpiryDate.Value >= today)),
            _cancellationTokens.Token);
        if (business.HasEligibilityCertificate == hasActive)
            return;
        business.SetCertificateFlags(
            hasActive,
            business.HasVsattpCommitment);
        await _businesses.UpdateAsync(
            business,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    private async Task<List<EligibilityCertificateDto>> ToDtosAsync(
        IReadOnlyCollection<EligibilityCertificate> certificates,
        DateTime today)
    {
        var businessIds = certificates.Select(x => x.BusinessId)
            .Distinct().ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);
        return certificates.Select(x =>
        {
            var dto = ObjectMapper.Map<EligibilityCertificate,
                EligibilityCertificateDto>(x);
            dto.Status = x.EffectiveStatus(today);
            dto.DaysUntilExpiry = x.ExpiryDate.HasValue
                ? (x.ExpiryDate.Value.Date - today).Days
                : null;
            dto.BusinessName =
                businesses.GetValueOrDefault(x.BusinessId) ?? string.Empty;
            return dto;
        }).ToList();
    }

    // Honours the client's Sorting request against a whitelist; falls back to
    // CreationTime descending (newest first).
    private static IOrderedQueryable<EligibilityCertificate> ApplySorting(
        IQueryable<EligibilityCertificate> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("issuedate", true)    => query.OrderByDescending(x => x.IssueDate),
            ("issuedate", false)   => query.OrderBy(x => x.IssueDate),
            ("creationtime", true) => query.OrderByDescending(x => x.CreationTime),
            ("creationtime", false)=> query.OrderBy(x => x.CreationTime),
            _                      => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private static IQueryable<EligibilityCertificate> ApplyStatusFilter(
        IQueryable<EligibilityCertificate> query,
        LicenseStatus status,
        DateTime today) =>
        status switch
        {
            LicenseStatus.Revoked => query.Where(
                x => x.Status == LicenseStatus.Revoked),
            LicenseStatus.Expired => query.Where(
                x => x.Status != LicenseStatus.Revoked &&
                     x.ExpiryDate.HasValue &&
                     x.ExpiryDate.Value < today),
            LicenseStatus.Active => query.Where(
                x => x.Status != LicenseStatus.Revoked &&
                     (!x.ExpiryDate.HasValue ||
                      x.ExpiryDate.Value >= today)),
            _ => throw new UserFriendlyException(
                "Trạng thái giấy chứng nhận không hợp lệ.")
        };
}
