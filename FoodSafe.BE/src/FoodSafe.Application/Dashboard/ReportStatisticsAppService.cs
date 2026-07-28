using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Organizations;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Timing;

namespace FoodSafe.Dashboard;

[Authorize]
public class ReportStatisticsAppService : ApplicationService
{
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IClock _clock;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<BusinessType, Guid> _businessTypes;
    private readonly IRepository<Region, Guid> _regions;
    private readonly IRepository<Province, Guid> _provinces;
    private readonly IRepository<District, Guid> _districts;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<InspectionPlan, Guid> _inspectionPlans;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly IRepository<FoodPoisoningCase, Guid> _poisoningCases;

    public ReportStatisticsAppService(
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IClock clock,
        IRepository<Business, Guid> businesses,
        IRepository<BusinessType, Guid> businessTypes,
        IRepository<Region, Guid> regions,
        IRepository<Province, Guid> provinces,
        IRepository<District, Guid> districts,
        IRepository<Organization, Guid> organizations,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<InspectionPlan, Guid> inspectionPlans,
        IRepository<InspectionResult, Guid> inspectionResults,
        IRepository<FoodPoisoningCase, Guid> poisoningCases)
    {
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _clock = clock;
        _businesses = businesses;
        _businessTypes = businessTypes;
        _regions = regions;
        _provinces = provinces;
        _districts = districts;
        _organizations = organizations;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _eligibilityCertificates = eligibilityCertificates;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _adRegistrations = adRegistrations;
        _inspectionPlans = inspectionPlans;
        _inspectionResults = inspectionResults;
        _poisoningCases = poisoningCases;
    }

    public async Task<ReportStatisticsDto> GetAsync(ReportStatisticsFilterDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var ct = _cancellationTokens.Token;
        var orgIds = scope.OrganizationIds;
        var global = scope.HasGlobalAccess;
        var year = input.Year ?? _clock.Now.Year;

        var dto = new ReportStatisticsDto();
        await AddLicensesByBusinessTypeAsync(dto, global, orgIds, ct);
        await AddPoisoningByAreaAsync(dto, global, orgIds, year, ct);
        await AddInspectionSummaryAsync(dto, global, orgIds, year, ct);
        await AddBusinessBreakdownAsync(dto, global, orgIds, ct);
        return dto;
    }

    private async Task AddLicensesByBusinessTypeAsync(
        ReportStatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        CancellationToken ct)
    {
        var bizQ = (await _businesses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));

        var rows = new Dictionary<Guid, LicensesByBusinessTypeRow>();

        async Task CollectAsync<TLicense>(
            IRepository<TLicense, Guid> repository,
            Func<IQueryable<TLicense>, IQueryable<TLicense>> scopeFilter,
            Action<LicensesByBusinessTypeRow, int> assign)
            where TLicense : class, Volo.Abp.Domain.Entities.IEntity<Guid>
        {
            var licenseQ = scopeFilter(await repository.GetQueryableAsync());
            var grouped = await AsyncExecuter.ToListAsync(
                licenseQ.Join(bizQ,
                        BuildBusinessIdExpression<TLicense>(),
                        b => b.Id,
                        (l, b) => new { b.BusinessTypeId })
                    .GroupBy(x => x.BusinessTypeId)
                    .Select(g => new { TypeId = g.Key, Count = g.Count() }),
                ct);
            foreach (var group in grouped)
            {
                var key = group.TypeId ?? Guid.Empty;
                if (!rows.TryGetValue(key, out var row))
                {
                    row = new LicensesByBusinessTypeRow();
                    rows[key] = row;
                }

                assign(row, group.Count);
            }
        }

        await CollectAsync(_selfDeclarations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.SelfDeclarations += count);
        await CollectAsync(_productRegistrations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.ProductRegistrations += count);
        await CollectAsync(_eligibilityCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.EligibilityCertificates += count);
        await CollectAsync(_cfsCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.CfsCertificates += count);
        await CollectAsync(_exportCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.ExportCertificates += count);
        await CollectAsync(_adRegistrations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)),
            (row, count) => row.AdRegistrations += count);

        var typeIds = rows.Keys.Where(k => k != Guid.Empty).ToList();
        var typeQ = await _businessTypes.GetQueryableAsync();
        var typeNames = await AsyncExecuter.ToListAsync(
            typeQ.Where(t => typeIds.Contains(t.Id))
                .Select(t => new { t.Id, t.Name }), ct);

        dto.LicensesByBusinessType = rows
            .Select(pair =>
            {
                var row = pair.Value;
                row.BusinessTypeName = pair.Key != Guid.Empty
                    ? typeNames.FirstOrDefault(t => t.Id == pair.Key)?.Name ?? "Khác"
                    : "Chưa phân loại";
                row.Total = row.SelfDeclarations + row.ProductRegistrations +
                            row.EligibilityCertificates + row.CfsCertificates +
                            row.ExportCertificates + row.AdRegistrations;
                return row;
            })
            .OrderByDescending(r => r.Total)
            .ToList();
    }

    private static System.Linq.Expressions.Expression<Func<TLicense, Guid>>
        BuildBusinessIdExpression<TLicense>()
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(typeof(TLicense), "l");
        var property = System.Linq.Expressions.Expression.Property(parameter, "BusinessId");
        return System.Linq.Expressions.Expression
            .Lambda<Func<TLicense, Guid>>(property, parameter);
    }

    private async Task AddPoisoningByAreaAsync(
        ReportStatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        int year, CancellationToken ct)
    {
        var caseQ = (await _poisoningCases.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.ReportDate.Year == year);

        var grouped = await AsyncExecuter.ToListAsync(
            caseQ.GroupBy(x => x.LocationDistrictId)
                .Select(g => new
                {
                    DistrictId = g.Key,
                    CaseCount = g.Count(),
                    HospitalizedCount = g.Count(x =>
                        x.TreatmentResult == TreatmentResult.Hospitalized),
                    DeceasedCount = g.Count(x =>
                        x.TreatmentResult == TreatmentResult.Deceased)
                }), ct);

        var districtIds = grouped.Where(g => g.DistrictId.HasValue)
            .Select(g => g.DistrictId!.Value).ToList();
        var districtQ = await _districts.GetQueryableAsync();
        var districtNames = await AsyncExecuter.ToListAsync(
            districtQ.Where(d => districtIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Name }), ct);

        dto.PoisoningByArea = grouped
            .Select(g => new PoisoningByAreaRow
            {
                AreaName = g.DistrictId.HasValue
                    ? districtNames.FirstOrDefault(d => d.Id == g.DistrictId.Value)?.Name
                      ?? "Không xác định"
                    : "Không xác định",
                CaseCount = g.CaseCount,
                HospitalizedCount = g.HospitalizedCount,
                DeceasedCount = g.DeceasedCount
            })
            .OrderByDescending(r => r.CaseCount)
            .ToList();
    }

    private async Task AddInspectionSummaryAsync(
        ReportStatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        int year, CancellationToken ct)
    {
        var planQ = (await _inspectionPlans.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.Year == year);
        var plans = await AsyncExecuter.ToListAsync(
            planQ.GroupBy(x => x.OrganizationId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() }), ct);

        var resultQ = (await _inspectionResults.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.InspectionDate.Year == year);
        var results = await AsyncExecuter.ToListAsync(
            resultQ.GroupBy(x => x.OrganizationId)
                .Select(g => new
                {
                    OrganizationId = g.Key,
                    InspectionCount = g.Count(),
                    ViolationCount = g.Count(x => x.HasViolation),
                    SanctionCount = g.Count(x => x.AdminDecisionNumber != null)
                }), ct);

        var organizationIds = plans.Select(p => p.OrganizationId)
            .Union(results.Select(r => r.OrganizationId))
            .ToList();
        var orgQ = await _organizations.GetQueryableAsync();
        var orgNames = await AsyncExecuter.ToListAsync(
            orgQ.Where(o => organizationIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name }), ct);

        dto.InspectionByOrganization = organizationIds
            .Select(id => new InspectionSummaryRow
            {
                OrganizationName =
                    orgNames.FirstOrDefault(o => o.Id == id)?.Name ?? "Không xác định",
                PlanCount = plans.FirstOrDefault(p => p.OrganizationId == id)?.Count ?? 0,
                InspectionCount =
                    results.FirstOrDefault(r => r.OrganizationId == id)?.InspectionCount ?? 0,
                ViolationCount =
                    results.FirstOrDefault(r => r.OrganizationId == id)?.ViolationCount ?? 0,
                SanctionCount =
                    results.FirstOrDefault(r => r.OrganizationId == id)?.SanctionCount ?? 0
            })
            .OrderByDescending(r => r.InspectionCount)
            .ToList();
    }

    private async Task AddBusinessBreakdownAsync(
        ReportStatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        CancellationToken ct)
    {
        var bizQ = (await _businesses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));

        var byType = await AsyncExecuter.ToListAsync(
            bizQ.GroupBy(b => b.BusinessTypeId)
                .Select(g => new { Key = g.Key, Count = g.Count() }), ct);
        var byProvince = await AsyncExecuter.ToListAsync(
            bizQ.GroupBy(b => b.AddressProvinceId)
                .Select(g => new { Key = g.Key, Count = g.Count() }), ct);
        var byDistrict = await AsyncExecuter.ToListAsync(
            bizQ.GroupBy(b => b.AddressDistrictId)
                .Select(g => new { Key = g.Key, Count = g.Count() }), ct);
        var byOrganization = await AsyncExecuter.ToListAsync(
            bizQ.GroupBy(b => b.OrganizationId)
                .Select(g => new { Key = (Guid?)g.Key, Count = g.Count() }), ct);

        var typeIds = byType.Where(x => x.Key.HasValue).Select(x => x.Key!.Value).ToList();
        var typeQ = await _businessTypes.GetQueryableAsync();
        var typeNames = await AsyncExecuter.ToListAsync(
            typeQ.Where(t => typeIds.Contains(t.Id)).Select(t => new { t.Id, t.Name }), ct);

        var provinceIds = byProvince.Where(x => x.Key.HasValue)
            .Select(x => x.Key!.Value).ToList();
        var provinceQ = await _provinces.GetQueryableAsync();
        var provinces = await AsyncExecuter.ToListAsync(
            provinceQ.Where(p => provinceIds.Contains(p.Id))
                .Select(p => new { p.Id, p.Name, p.RegionId }), ct);

        var regionQ = await _regions.GetQueryableAsync();
        var regionNames = await AsyncExecuter.ToListAsync(
            regionQ.Select(r => new { r.Id, r.Name }), ct);

        var districtIds = byDistrict.Where(x => x.Key.HasValue)
            .Select(x => x.Key!.Value).ToList();
        var districtQ = await _districts.GetQueryableAsync();
        var districtNames = await AsyncExecuter.ToListAsync(
            districtQ.Where(d => districtIds.Contains(d.Id))
                .Select(d => new { d.Id, d.Name }), ct);

        var organizationIds = byOrganization.Where(x => x.Key.HasValue)
            .Select(x => x.Key!.Value).ToList();
        var orgQ = await _organizations.GetQueryableAsync();
        var orgNames = await AsyncExecuter.ToListAsync(
            orgQ.Where(o => organizationIds.Contains(o.Id))
                .Select(o => new { o.Id, o.Name }), ct);

        static List<BusinessBreakdownRow> Build<TKey>(
            IEnumerable<(TKey? Key, int Count)> source,
            Func<TKey, string?> resolveName)
            where TKey : struct
            => source
                .Select(x => new BusinessBreakdownRow
                {
                    GroupName = x.Key.HasValue
                        ? resolveName(x.Key.Value) ?? "Không xác định"
                        : "Chưa phân loại",
                    Count = x.Count
                })
                .GroupBy(r => r.GroupName)
                .Select(g => new BusinessBreakdownRow
                {
                    GroupName = g.Key,
                    Count = g.Sum(r => r.Count)
                })
                .OrderByDescending(r => r.Count)
                .ToList();

        dto.BusinessesByType = Build(
            byType.Select(x => (x.Key, x.Count)),
            id => typeNames.FirstOrDefault(t => t.Id == id)?.Name);
        dto.BusinessesByProvince = Build(
            byProvince.Select(x => (x.Key, x.Count)),
            id => provinces.FirstOrDefault(p => p.Id == id)?.Name);
        dto.BusinessesByRegion = Build(
            byProvince.Select(x => (x.Key, x.Count)),
            id =>
            {
                var regionId = provinces.FirstOrDefault(p => p.Id == id)?.RegionId;
                return regionId.HasValue
                    ? regionNames.FirstOrDefault(r => r.Id == regionId.Value)?.Name
                    : null;
            });
        dto.BusinessesByDistrict = Build(
            byDistrict.Select(x => (x.Key, x.Count)),
            id => districtNames.FirstOrDefault(d => d.Id == id)?.Name);
        dto.BusinessesByOrganization = Build(
            byOrganization.Select(x => (x.Key, x.Count)),
            id => orgNames.FirstOrDefault(o => o.Id == id)?.Name);
    }
}
