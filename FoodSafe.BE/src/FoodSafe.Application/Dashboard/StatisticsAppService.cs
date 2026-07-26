using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Timing;

namespace FoodSafe.Dashboard;

[Authorize]
public class StatisticsAppService : ApplicationService
{
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IClock _clock;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<MasterCatalog, Guid> _catalogs;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly IRepository<FoodPoisoningCase, Guid> _poisoningCases;

    public StatisticsAppService(
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IClock clock,
        IRepository<Business, Guid> businesses,
        IRepository<MasterCatalog, Guid> catalogs,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<InspectionResult, Guid> inspectionResults,
        IRepository<FoodPoisoningCase, Guid> poisoningCases)
    {
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _clock = clock;
        _businesses = businesses;
        _catalogs = catalogs;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _eligibilityCertificates = eligibilityCertificates;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _adRegistrations = adRegistrations;
        _inspectionResults = inspectionResults;
        _poisoningCases = poisoningCases;
    }

    public async Task<StatisticsDto> GetAsync(StatisticsFilterDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var ct = _cancellationTokens.Token;
        var orgIds = scope.OrganizationIds;
        var global = scope.HasGlobalAccess;
        var year = input.Year ?? _clock.Now.Year;

        var dto = new StatisticsDto();

        await AddBusinessStatsAsync(dto, global, orgIds, ct);
        await AddLicenseStatsAsync(dto, global, orgIds, ct);
        await AddInspectionStatsAsync(dto, global, orgIds, year, ct);
        await AddPoisoningStatsAsync(dto, global, orgIds, year, ct);

        return dto;
    }

    private async Task AddBusinessStatsAsync(
        StatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        CancellationToken ct)
    {
        var businessQ = (await _businesses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));

        var businessByStatus = await AsyncExecuter.ToListAsync(
            businessQ.GroupBy(b => b.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() }), ct);

        var businessByType = await AsyncExecuter.ToListAsync(
            businessQ.Where(b => b.BusinessTypeId != null)
                .GroupBy(b => b.BusinessTypeId!.Value)
                .Select(g => new { TypeId = g.Key, Count = g.Count() }), ct);

        var typeIds = businessByType.Select(b => b.TypeId).ToList();
        var catalogQ = await _catalogs.GetQueryableAsync();
        var businessTypeNames = await AsyncExecuter.ToListAsync(
            catalogQ.Where(c => typeIds.Contains(c.Id))
                .Select(c => new { c.Id, c.Name }), ct);

        var statusLabels = new Dictionary<BusinessStatus, string>
        {
            [BusinessStatus.Active] = "Hoạt động",
            [BusinessStatus.Inactive] = "Ngừng hoạt động",
            [BusinessStatus.Suspended] = "Tạm dừng"
        };

        dto.BusinessByStatus = businessByStatus
            .Select(x => new CategoryCount
            {
                Name = statusLabels.GetValueOrDefault(x.Status, x.Status.ToString()),
                Count = x.Count
            }).ToList();

        dto.BusinessByType = businessByType
            .Select(x => new CategoryCount
            {
                Name = businessTypeNames.FirstOrDefault(t => t.Id == x.TypeId)?.Name ?? "Khác",
                Count = x.Count
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();
    }

    private async Task AddLicenseStatsAsync(
        StatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        CancellationToken ct)
    {
        var selfDeclQ = (await _selfDeclarations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var selfDeclCount = await AsyncExecuter.CountAsync(selfDeclQ, ct);

        var prodRegQ = (await _productRegistrations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var prodActive = await AsyncExecuter.CountAsync(prodRegQ.Where(x => x.Status == LicenseStatus.Active), ct);
        var prodExpired = await AsyncExecuter.CountAsync(prodRegQ.Where(x => x.Status == LicenseStatus.Expired), ct);
        var prodRevoked = await AsyncExecuter.CountAsync(prodRegQ.Where(x => x.Status == LicenseStatus.Revoked), ct);

        var eligQ = (await _eligibilityCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var eligActive = await AsyncExecuter.CountAsync(eligQ.Where(x => x.Status == LicenseStatus.Active), ct);
        var eligExpired = await AsyncExecuter.CountAsync(eligQ.Where(x => x.Status == LicenseStatus.Expired), ct);
        var eligRevoked = await AsyncExecuter.CountAsync(eligQ.Where(x => x.Status == LicenseStatus.Revoked), ct);

        var cfsQ = (await _cfsCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var cfsActive = await AsyncExecuter.CountAsync(cfsQ.Where(x => x.Status == LicenseStatus.Active), ct);
        var cfsExpired = await AsyncExecuter.CountAsync(cfsQ.Where(x => x.Status == LicenseStatus.Expired), ct);
        var cfsRevoked = await AsyncExecuter.CountAsync(cfsQ.Where(x => x.Status == LicenseStatus.Revoked), ct);

        var exportQ = (await _exportCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var expActive = await AsyncExecuter.CountAsync(exportQ.Where(x => x.Status == LicenseStatus.Active), ct);
        var expExpired = await AsyncExecuter.CountAsync(exportQ.Where(x => x.Status == LicenseStatus.Expired), ct);
        var expRevoked = await AsyncExecuter.CountAsync(exportQ.Where(x => x.Status == LicenseStatus.Revoked), ct);

        var adRegQ = (await _adRegistrations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var adActive = await AsyncExecuter.CountAsync(adRegQ.Where(x => x.Status == LicenseStatus.Active), ct);
        var adExpired = await AsyncExecuter.CountAsync(adRegQ.Where(x => x.Status == LicenseStatus.Expired), ct);
        var adRevoked = await AsyncExecuter.CountAsync(adRegQ.Where(x => x.Status == LicenseStatus.Revoked), ct);

        dto.LicenseByCategory =
        [
            new() { Name = "Tự công bố", Count = selfDeclCount },
            new() { Name = "Đăng ký công bố", Count = prodActive + prodExpired + prodRevoked },
            new() { Name = "Giấy ĐĐK ATTP", Count = eligActive + eligExpired + eligRevoked },
            new() { Name = "Chứng nhận CFS", Count = cfsActive + cfsExpired + cfsRevoked },
            new() { Name = "GCN Xuất khẩu", Count = expActive + expExpired + expRevoked },
            new() { Name = "Quảng cáo", Count = adActive + adExpired + adRevoked },
        ];

        dto.LicenseByStatus =
        [
            new() { Name = "Còn hiệu lực", Count = prodActive + eligActive + cfsActive + expActive + adActive },
            new() { Name = "Hết hạn", Count = prodExpired + eligExpired + cfsExpired + expExpired + adExpired },
            new() { Name = "Thu hồi", Count = prodRevoked + eligRevoked + cfsRevoked + expRevoked + adRevoked },
        ];
    }

    private async Task AddInspectionStatsAsync(
        StatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        int year, CancellationToken ct)
    {
        var resultQ = (await _inspectionResults.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.InspectionDate.Year == year);

        var monthly = await AsyncExecuter.ToListAsync(
            resultQ.GroupBy(x => x.InspectionDate.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() }), ct);

        var violations = await AsyncExecuter.ToListAsync(
            resultQ.Where(x => x.HasViolation)
                .GroupBy(x => x.InspectionDate.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() }), ct);

        var outcomeGroups = await AsyncExecuter.ToListAsync(
            resultQ.GroupBy(x => x.OverallResult)
                .Select(g => new { Result = g.Key, Count = g.Count() }), ct);

        var outcomeLabels = new Dictionary<InspectionOverallResult, string>
        {
            [InspectionOverallResult.Pass] = "Đạt",
            [InspectionOverallResult.Fail] = "Không đạt",
            [InspectionOverallResult.ConditionalPass] = "Đạt có điều kiện"
        };

        var monthNames = new[] { "", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };

        dto.InspectionsByMonth = Enumerable.Range(1, 12)
            .Select(m => new MonthlyCount
            {
                Year = year, Month = m, Label = monthNames[m],
                Count = monthly.FirstOrDefault(x => x.Month == m)?.Count ?? 0,
            }).ToList();

        dto.ViolationsByMonth = Enumerable.Range(1, 12)
            .Select(m => new MonthlyCount
            {
                Year = year, Month = m, Label = monthNames[m],
                Count = violations.FirstOrDefault(x => x.Month == m)?.Count ?? 0,
            }).ToList();

        dto.InspectionOutcome = outcomeGroups
            .Select(x => new CategoryCount
            {
                Name = outcomeLabels.GetValueOrDefault(x.Result, x.Result.ToString()),
                Count = x.Count
            }).ToList();
    }

    private async Task AddPoisoningStatsAsync(
        StatisticsDto dto, bool global, IReadOnlySet<Guid> orgIds,
        int year, CancellationToken ct)
    {
        var caseQ = (await _poisoningCases.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.ReportDate.Year == year);

        var monthly = await AsyncExecuter.ToListAsync(
            caseQ.GroupBy(x => x.ReportDate.Month)
                .Select(g => new { Month = g.Key, Count = g.Count() }), ct);

        var monthNames = new[] { "", "T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12" };

        dto.PoisoningCasesByMonth = Enumerable.Range(1, 12)
            .Select(m => new MonthlyCount
            {
                Year = year, Month = m, Label = monthNames[m],
                Count = monthly.FirstOrDefault(x => x.Month == m)?.Count ?? 0,
            }).ToList();
    }
}
