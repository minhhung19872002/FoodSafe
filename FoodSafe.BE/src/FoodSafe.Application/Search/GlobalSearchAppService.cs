using FoodSafe.BusinessManagement;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Search;

[Authorize]
public class GlobalSearchAppService : ApplicationService, IGlobalSearchAppService
{
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessProductGroup> _businessProductGroups;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<InspectionPlan, Guid> _inspectionPlans;
    private readonly IRepository<FoodPoisoningCase, Guid> _foodPoisoningCases;
    private readonly IRepository<AlertsAndTesting.AtpAlert, Guid> _atpAlerts;
    private readonly IRepository<AlertsAndTesting.TestingResult, Guid> _testingResults;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly IPermissionChecker _permissionChecker;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public GlobalSearchAppService(
        IRepository<Business, Guid> businesses,
        IRepository<BusinessProductGroup> businessProductGroups,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<InspectionPlan, Guid> inspectionPlans,
        IRepository<FoodPoisoningCase, Guid> foodPoisoningCases,
        IRepository<AlertsAndTesting.AtpAlert, Guid> atpAlerts,
        IRepository<AlertsAndTesting.TestingResult, Guid> testingResults,
        ICurrentDataScopeProvider dataScopeProvider,
        IPermissionChecker permissionChecker,
        ICancellationTokenProvider cancellationTokens)
    {
        _businesses = businesses;
        _businessProductGroups = businessProductGroups;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _eligibilityCertificates = eligibilityCertificates;
        _inspectionPlans = inspectionPlans;
        _foodPoisoningCases = foodPoisoningCases;
        _atpAlerts = atpAlerts;
        _testingResults = testingResults;
        _dataScopeProvider = dataScopeProvider;
        _permissionChecker = permissionChecker;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<GlobalSearchResultDto> GetAsync(GlobalSearchInput input)
    {
        var q = input.Q.Trim();
        var max = Math.Clamp(input.MaxPerGroup, 1, 10);
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var groups = new List<SearchGroupDto>();

        IQueryable<Guid>? allowedBusinessIds = null;
        if (!scope.HasGlobalAccess)
            allowedBusinessIds = await AllowedBusinessIdsAsync(scope);

        if (await IsGranted(FoodSafePermissions.BusinessManagement.Businesses.View))
        {
            var items = await SearchBusinessesAsync(scope, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("business", "Cơ sở", items));
        }

        if (await IsGranted(FoodSafePermissions.BusinessManagement.SelfDeclarations.View))
        {
            var items = await SearchSelfDeclarationsAsync(
                allowedBusinessIds, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("self-declaration", "Tự công bố", items));
        }

        if (await IsGranted(FoodSafePermissions.Licensing.ProductRegistrations.View))
        {
            var items = await SearchProductRegistrationsAsync(
                allowedBusinessIds, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("product-registration", "Đăng ký công bố SP", items));
        }

        if (await IsGranted(FoodSafePermissions.Licensing.EligibilityCertificates.View))
        {
            var items = await SearchEligibilityCertificatesAsync(
                allowedBusinessIds, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("eligibility-certificate", "Giấy đủ ĐK ATTP", items));
        }

        if (await IsGranted(FoodSafePermissions.Inspection.Plans.View))
        {
            var items = await SearchInspectionPlansAsync(scope, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("inspection-plan", "Kế hoạch thanh tra", items));
        }

        if (await IsGranted(FoodSafePermissions.FoodPoisoning.Cases.View))
        {
            var items = await SearchFoodPoisoningCasesAsync(scope, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("food-poisoning-case", "Ca ngộ độc", items));
        }

        if (await IsGranted(FoodSafePermissions.AlertsAndTesting.Alerts.View))
        {
            var items = await SearchAtpAlertsAsync(scope, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("atp-alert", "Cảnh báo", items));
        }

        if (await IsGranted(FoodSafePermissions.AlertsAndTesting.TestingResults.View))
        {
            var items = await SearchTestingResultsAsync(scope, q, max, ct);
            if (items.Count > 0)
                groups.Add(Group("testing-result", "Kết quả kiểm nghiệm", items));
        }

        return new GlobalSearchResultDto { Groups = groups };
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchBusinessesAsync(
        CurrentDataScope scope, string q, int max, CancellationToken ct)
    {
        var query = await ScopedBusinessQueryAsync(scope);
        query = query.Where(x =>
            x.Name.Contains(q) ||
            (x.Code != null && x.Code.Contains(q)) ||
            (x.TaxCode != null && x.TaxCode.Contains(q)) ||
            (x.AddressStreet != null && x.AddressStreet.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.Name,
                    Subtitle = x.Code ?? x.TaxCode,
                    Route = "/businesses"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchSelfDeclarationsAsync(
        IQueryable<Guid>? allowedBusinessIds, string q, int max,
        CancellationToken ct)
    {
        var query = await _selfDeclarations.GetQueryableAsync();
        if (allowedBusinessIds != null)
            query = query.Where(x => allowedBusinessIds.Contains(x.BusinessId));
        query = query.Where(x =>
            x.DeclarationNumber.Contains(q) ||
            x.ProductName.Contains(q) ||
            (x.Manufacturer != null && x.Manufacturer.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.ProductName,
                    Subtitle = x.DeclarationNumber,
                    Route = "/self-declarations"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchProductRegistrationsAsync(
        IQueryable<Guid>? allowedBusinessIds, string q, int max,
        CancellationToken ct)
    {
        var query = await _productRegistrations.GetQueryableAsync();
        if (allowedBusinessIds != null)
            query = query.Where(x => allowedBusinessIds.Contains(x.BusinessId));
        query = query.Where(x =>
            x.RegistrationNumber.Contains(q) ||
            x.ProductName.Contains(q) ||
            (x.Manufacturer != null && x.Manufacturer.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.ProductName,
                    Subtitle = x.RegistrationNumber,
                    Route = "/product-registrations"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchEligibilityCertificatesAsync(
        IQueryable<Guid>? allowedBusinessIds, string q, int max,
        CancellationToken ct)
    {
        var query = await _eligibilityCertificates.GetQueryableAsync();
        if (allowedBusinessIds != null)
            query = query.Where(x => allowedBusinessIds.Contains(x.BusinessId));
        query = query.Where(x =>
            x.CertificateNumber.Contains(q) ||
            (x.CertifyingAuthority != null && x.CertifyingAuthority.Contains(q)) ||
            (x.CertificationScope != null && x.CertificationScope.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.CertificateNumber,
                    Subtitle = x.CertifyingAuthority,
                    Route = "/eligibility-certificates"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchInspectionPlansAsync(
        CurrentDataScope scope, string q, int max, CancellationToken ct)
    {
        var query = await _inspectionPlans.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        query = query.Where(x =>
            x.PlanCode.Contains(q) ||
            x.Title.Contains(q));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Subtitle = x.PlanCode,
                    Route = "/inspection"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchFoodPoisoningCasesAsync(
        CurrentDataScope scope, string q, int max, CancellationToken ct)
    {
        var query = await _foodPoisoningCases.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        query = query.Where(x =>
            x.CaseCode.Contains(q) ||
            (x.VictimName != null && x.VictimName.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.CaseCode,
                    Subtitle = x.VictimName,
                    Route = "/food-poisoning"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchAtpAlertsAsync(
        CurrentDataScope scope, string q, int max, CancellationToken ct)
    {
        var query = await _atpAlerts.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        query = query.Where(x =>
            x.Title.Contains(q) ||
            (x.AlertNumber != null && x.AlertNumber.Contains(q)));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    Subtitle = x.AlertNumber,
                    Route = "/alerts-news"
                }), ct);
    }

    private async Task<IReadOnlyList<SearchHitDto>> SearchTestingResultsAsync(
        CurrentDataScope scope, string q, int max, CancellationToken ct)
    {
        var query = await _testingResults.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        query = query.Where(x =>
            x.SampleCode.Contains(q) ||
            x.SampleName.Contains(q));

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(max)
                .Select(x => new SearchHitDto
                {
                    Id = x.Id,
                    Title = x.SampleName,
                    Subtitle = x.SampleCode,
                    Route = "/testing-results"
                }), ct);
    }

    private async Task<IQueryable<Business>> ScopedBusinessQueryAsync(
        CurrentDataScope scope)
    {
        var query = await _businesses.GetQueryableAsync();
        if (scope.HasGlobalAccess) return query;

        var productGroupQuery =
            await _businessProductGroups.GetQueryableAsync();
        var organizationIds = scope.OrganizationIds;
        var provinceIds = scope.ProvinceIds;
        var communeIds = scope.CommuneIds;
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();
        var productGroupIds = scope.ProductGroupIds ?? new HashSet<Guid>();

        return query.Where(x =>
            organizationIds.Contains(x.OrganizationId) ||
            businessIds.Contains(x.Id) ||
            (x.BusinessTypeId.HasValue &&
             businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
            (x.AddressProvinceId.HasValue &&
             provinceIds.Contains(x.AddressProvinceId.Value)) ||
            (x.AddressCommuneId.HasValue &&
             communeIds.Contains(x.AddressCommuneId.Value)) ||
            productGroupQuery.Any(link =>
                link.BusinessId == x.Id &&
                productGroupIds.Contains(link.ProductGroupId)));
    }

    private async Task<IQueryable<Guid>> AllowedBusinessIdsAsync(
        CurrentDataScope scope)
    {
        var businesses = await _businesses.GetQueryableAsync();
        var organizationIds = scope.OrganizationIds;
        var provinceIds = scope.ProvinceIds;
        var communeIds = scope.CommuneIds;
        var businessIds = scope.BusinessIds ?? new HashSet<Guid>();
        var businessTypeIds = scope.BusinessTypeIds ?? new HashSet<Guid>();

        return businesses.Where(x =>
                organizationIds.Contains(x.OrganizationId) ||
                businessIds.Contains(x.Id) ||
                (x.BusinessTypeId.HasValue &&
                 businessTypeIds.Contains(x.BusinessTypeId.Value)) ||
                (x.AddressProvinceId.HasValue &&
                 provinceIds.Contains(x.AddressProvinceId.Value)) ||
                (x.AddressCommuneId.HasValue &&
                 communeIds.Contains(x.AddressCommuneId.Value)))
            .Select(x => x.Id);
    }

    private Task<bool> IsGranted(string permission) =>
        _permissionChecker.IsGrantedAsync(permission);

    private static SearchGroupDto Group(
        string entityType,
        string label,
        IReadOnlyList<SearchHitDto> items) =>
        new() { EntityType = entityType, Label = label, Items = items };
}
