using System.Globalization;
using FoodSafe.AlertsAndTesting;
using FoodSafe.Application.Contracts.Dashboard;
using FoodSafe.BusinessManagement;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Organizations;
using FoodSafe.Reporting;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Timing;

namespace FoodSafe.Dashboard;

[Authorize]
public class DashboardAppService : ApplicationService
{
    private const int RecentActivityCount = 12;

    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IClock _clock;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<InspectionPlan, Guid> _inspectionPlans;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly IRepository<FoodPoisoningCase, Guid> _poisoningCases;
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly IRepository<RiskAnalysis, Guid> _riskAnalyses;
    private readonly IRepository<TestingResult, Guid> _testingResults;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<NdtpReport, Guid> _ndtpReports;
    private readonly IRepository<AtpWorkReport, Guid> _atpWorkReports;
    private readonly IRepository<ActionMonthReport, Guid> _actionMonthReports;
    private readonly IRepository<AppUserProfile, Guid> _userProfiles;

    public DashboardAppService(
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IClock clock,
        IRepository<Business, Guid> businesses,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<InspectionPlan, Guid> inspectionPlans,
        IRepository<InspectionResult, Guid> inspectionResults,
        IRepository<FoodPoisoningCase, Guid> poisoningCases,
        IRepository<AtpAlert, Guid> alerts,
        IRepository<RiskAnalysis, Guid> riskAnalyses,
        IRepository<TestingResult, Guid> testingResults,
        IRepository<Organization, Guid> organizations,
        IRepository<NdtpReport, Guid> ndtpReports,
        IRepository<AtpWorkReport, Guid> atpWorkReports,
        IRepository<ActionMonthReport, Guid> actionMonthReports,
        IRepository<AppUserProfile, Guid> userProfiles)
    {
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _clock = clock;
        _businesses = businesses;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _eligibilityCertificates = eligibilityCertificates;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _adRegistrations = adRegistrations;
        _inspectionPlans = inspectionPlans;
        _inspectionResults = inspectionResults;
        _poisoningCases = poisoningCases;
        _alerts = alerts;
        _riskAnalyses = riskAnalyses;
        _testingResults = testingResults;
        _organizations = organizations;
        _ndtpReports = ndtpReports;
        _atpWorkReports = atpWorkReports;
        _actionMonthReports = actionMonthReports;
        _userProfiles = userProfiles;
    }

    public async Task<DashboardStatsDto> GetStatsAsync(DashboardFilterDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var ct = _cancellationTokens.Token;
        var now = _clock.Now;
        var expiry30 = now.AddDays(30);
        var orgIds = await ResolveOrganizationIdsAsync(
            scope, input.OrganizationId, ct);
        var global = scope.HasGlobalAccess && !input.OrganizationId.HasValue;
        var year = input.Year;

        var businessQ = (await _businesses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var selfDeclQ = (await _selfDeclarations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var prodRegQ = (await _productRegistrations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var eligQ = (await _eligibilityCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var cfsQ = (await _cfsCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var exportQ = (await _exportCertificates.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var adRegQ = (await _adRegistrations.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        var planQ = (await _inspectionPlans.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.Year == year!.Value);
        var resultQ = (await _inspectionResults.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.InspectionDate.Year == year!.Value);
        var caseQ = (await _poisoningCases.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.ReportDate.Year == year!.Value);
        var alertQ = (await _alerts.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.CreationTime.Year == year!.Value);
        var riskQ = (await _riskAnalyses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.CreationTime.Year == year!.Value);
        var testQ = (await _testingResults.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .WhereIf(year.HasValue, x => x.SampleDate.Year == year!.Value);

        var totalBusinesses = await AsyncExecuter.CountAsync(businessQ, ct);
        var activeBusinesses = await AsyncExecuter.CountAsync(
            businessQ.Where(b => b.Status == BusinessStatus.Active), ct);

        var totalSelfDecl = await AsyncExecuter.CountAsync(
            selfDeclQ.WhereIf(year.HasValue, x => x.DeclarationDate.Year == year!.Value), ct);
        var totalProdReg = await AsyncExecuter.CountAsync(
            prodRegQ.WhereIf(year.HasValue, x => x.RegistrationDate.Year == year!.Value), ct);
        var totalElig = await AsyncExecuter.CountAsync(
            eligQ.WhereIf(year.HasValue, x => x.IssueDate.Year == year!.Value), ct);
        var totalCfs = await AsyncExecuter.CountAsync(
            cfsQ.WhereIf(year.HasValue, x => x.IssueDate.Year == year!.Value), ct);
        var totalExport = await AsyncExecuter.CountAsync(
            exportQ.WhereIf(year.HasValue, x => x.IssueDate.Year == year!.Value), ct);
        var totalAdReg = await AsyncExecuter.CountAsync(
            adRegQ.WhereIf(year.HasValue, x => x.RegistrationDate.Year == year!.Value), ct);

        var expiringElig = await AsyncExecuter.CountAsync(
            eligQ.Where(x => x.ExpiryDate != null && x.ExpiryDate > now && x.ExpiryDate <= expiry30), ct);
        var expiringCfs = await AsyncExecuter.CountAsync(
            cfsQ.Where(x => x.ExpiryDate != null && x.ExpiryDate > now && x.ExpiryDate <= expiry30), ct);
        var expiringExport = await AsyncExecuter.CountAsync(
            exportQ.Where(x => x.ExpiryDate != null && x.ExpiryDate > now && x.ExpiryDate <= expiry30), ct);

        var totalPlans = await AsyncExecuter.CountAsync(planQ, ct);
        var totalResults = await AsyncExecuter.CountAsync(resultQ, ct);
        var violationCount = await AsyncExecuter.CountAsync(
            resultQ.Where(r => r.HasViolation), ct);

        var totalCases = await AsyncExecuter.CountAsync(caseQ, ct);
        var totalAlerts = await AsyncExecuter.CountAsync(alertQ, ct);
        var totalRisk = await AsyncExecuter.CountAsync(riskQ, ct);
        var totalTest = await AsyncExecuter.CountAsync(testQ, ct);

        var recentActivities = await GetRecentActivitiesAsync(
            businessQ, selfDeclQ, resultQ, caseQ, alertQ, testQ, ct);

        return new DashboardStatsDto
        {
            TotalBusinesses = totalBusinesses,
            ActiveBusinesses = activeBusinesses,
            TotalSelfDeclarations = totalSelfDecl,
            TotalProductRegistrations = totalProdReg,
            TotalEligibilityCertificates = totalElig,
            TotalCfsCertificates = totalCfs,
            TotalExportCertificates = totalExport,
            TotalAdRegistrations = totalAdReg,
            ExpiringWithin30Days = expiringElig + expiringCfs + expiringExport,
            TotalInspectionPlans = totalPlans,
            TotalInspectionResults = totalResults,
            InspectionViolationCount = violationCount,
            TotalFoodPoisoningCases = totalCases,
            TotalAlerts = totalAlerts,
            TotalRiskAnalyses = totalRisk,
            TotalTestingResults = totalTest,
            LicenseBreakdown =
            [
                new() { Category = "Tự công bố", Count = totalSelfDecl },
                new() { Category = "Đăng ký công bố", Count = totalProdReg },
                new() { Category = "Giấy ĐĐK ATTP", Count = totalElig },
                new() { Category = "Chứng nhận CFS", Count = totalCfs },
                new() { Category = "GCN Xuất khẩu", Count = totalExport },
                new() { Category = "Quảng cáo", Count = totalAdReg },
            ],
            RecentActivities = recentActivities,
        };
    }

    // Each queryable passed in is already narrowed by the caller's organization
    // scope (and by Year where the surrounding metric applies), so the feed can
    // never surface a record the user is not allowed to count.
    private async Task<List<RecentActivityItem>> GetRecentActivitiesAsync(
        IQueryable<Business> businessQ,
        IQueryable<SelfDeclaration> selfDeclQ,
        IQueryable<InspectionResult> resultQ,
        IQueryable<FoodPoisoningCase> caseQ,
        IQueryable<AtpAlert> alertQ,
        IQueryable<TestingResult> testQ,
        CancellationToken ct)
    {
        // Ordering and Take run in the database, so each source returns at most
        // RecentActivityCount rows.
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new { x.CreationTime, x.CreatorId, x.Name, x.Code }),
            ct);
        var selfDeclRows = await AsyncExecuter.ToListAsync(
            selfDeclQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new
                {
                    x.CreationTime,
                    x.CreatorId,
                    x.DeclarationNumber,
                    x.ProductName
                }),
            ct);
        var resultRows = await AsyncExecuter.ToListAsync(
            resultQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new
                {
                    x.CreationTime,
                    x.CreatorId,
                    x.InspectionDate,
                    x.HasViolation
                }),
            ct);
        var caseRows = await AsyncExecuter.ToListAsync(
            caseQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new
                {
                    x.CreationTime,
                    x.CreatorId,
                    x.CaseCode,
                    x.SuspectedFood
                }),
            ct);
        var alertRows = await AsyncExecuter.ToListAsync(
            alertQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new { x.CreationTime, x.CreatorId, x.Title, x.AlertNumber }),
            ct);
        var testRows = await AsyncExecuter.ToListAsync(
            testQ.OrderByDescending(x => x.CreationTime)
                .Take(RecentActivityCount)
                .Select(x => new
                {
                    x.CreationTime,
                    x.CreatorId,
                    x.SampleCode,
                    x.SampleName
                }),
            ct);

        var rows = new List<RecentActivityRow>(RecentActivityCount * 6);
        rows.AddRange(businessRows.Select(x => new RecentActivityRow(
            "Business", Describe(x.Name, x.Code), x.CreationTime, x.CreatorId)));
        rows.AddRange(selfDeclRows.Select(x => new RecentActivityRow(
            "SelfDeclaration", Describe(x.DeclarationNumber, x.ProductName),
            x.CreationTime, x.CreatorId)));
        rows.AddRange(resultRows.Select(x => new RecentActivityRow(
            "InspectionResult",
            Describe(
                $"Thanh tra ngày {FormatDate(x.InspectionDate)}",
                x.HasViolation ? "có vi phạm" : null),
            x.CreationTime, x.CreatorId)));
        rows.AddRange(caseRows.Select(x => new RecentActivityRow(
            "FoodPoisoningCase", Describe(x.CaseCode, x.SuspectedFood),
            x.CreationTime, x.CreatorId)));
        rows.AddRange(alertRows.Select(x => new RecentActivityRow(
            "AtpAlert", Describe(x.Title, x.AlertNumber),
            x.CreationTime, x.CreatorId)));
        rows.AddRange(testRows.Select(x => new RecentActivityRow(
            "TestingResult", Describe(x.SampleCode, x.SampleName),
            x.CreationTime, x.CreatorId)));

        var recent = rows
            .OrderByDescending(x => x.CreationTime)
            .Take(RecentActivityCount)
            .ToList();
        var creatorNames = await GetCreatorNamesAsync(recent, ct);

        return recent.Select(x => new RecentActivityItem
        {
            EntityType = x.EntityType,
            Description = x.Description,
            CreationTime = x.CreationTime,
            CreatorName = x.CreatorId.HasValue &&
                creatorNames.TryGetValue(x.CreatorId.Value, out var creatorName)
                    ? creatorName
                    : null
        }).ToList();
    }

    private async Task<Dictionary<Guid, string>> GetCreatorNamesAsync(
        IReadOnlyCollection<RecentActivityRow> rows,
        CancellationToken ct)
    {
        var creatorIds = rows
            .Where(x => x.CreatorId.HasValue)
            .Select(x => x.CreatorId!.Value)
            .Distinct()
            .ToList();
        if (creatorIds.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        var profileQ = await _userProfiles.GetQueryableAsync();
        var profiles = await AsyncExecuter.ToListAsync(
            profileQ.Where(p => creatorIds.Contains(p.UserId))
                .Select(p => new { p.UserId, p.FullName }), ct);
        return profiles
            .GroupBy(p => p.UserId)
            .ToDictionary(g => g.Key, g => g.First().FullName);
    }

    private static string Describe(string primary, string? secondary) =>
        string.IsNullOrWhiteSpace(secondary) ? primary : $"{primary} - {secondary}";

    private static string FormatDate(DateTime value) =>
        value.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

    /// <summary>
    /// Licenses expiring within 90 days across all 5 license types,
    /// tiered into 30/60/90-day warning buckets (FR license expiry warnings).
    /// </summary>
    public async Task<ListResultDto<ExpiringLicenseDto>> GetExpiringLicensesAsync(
        DashboardFilterDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var ct = _cancellationTokens.Token;
        var now = _clock.Now.Date;
        var horizon = now.AddDays(90);
        var orgIds = await ResolveOrganizationIdsAsync(scope, input.OrganizationId, ct);
        var global = scope.HasGlobalAccess && !input.OrganizationId.HasValue;

        var businessNames = await AsyncExecuter.ToListAsync(
            (await _businesses.GetQueryableAsync())
                .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
                .Select(b => new { b.Id, b.Name }),
            ct);
        var nameById = businessNames.ToDictionary(b => b.Id, b => b.Name);

        var results = new List<ExpiringLicenseDto>();

        async Task CollectAsync<T>(
            IRepository<T, Guid> repository,
            string licenseType,
            Func<T, (Guid Id, Guid BusinessId, string Number, DateTime? Expiry, LicenseStatus Status)> selector)
            where T : class, Volo.Abp.Domain.Entities.IEntity<Guid>
        {
            var items = await AsyncExecuter.ToListAsync(
                await repository.GetQueryableAsync(), ct);
            foreach (var item in items)
            {
                var (id, businessId, number, expiry, status) = selector(item);
                if (status != LicenseStatus.Active || expiry is null) continue;
                if (expiry.Value.Date <= now || expiry.Value.Date > horizon) continue;
                if (!nameById.TryGetValue(businessId, out var businessName)) continue;

                var daysRemaining = (int)(expiry.Value.Date - now).TotalDays;
                results.Add(new ExpiringLicenseDto
                {
                    Id = id,
                    LicenseType = licenseType,
                    LicenseNumber = number,
                    BusinessId = businessId,
                    BusinessName = businessName,
                    ExpiryDate = expiry.Value,
                    DaysRemaining = daysRemaining,
                    WarningTier = daysRemaining <= 30 ? 30 : daysRemaining <= 60 ? 60 : 90,
                });
            }
        }

        await CollectAsync(_eligibilityCertificates, "Giấy ĐĐK ATTP",
            x => (x.Id, x.BusinessId, x.CertificateNumber, x.ExpiryDate, x.Status));
        await CollectAsync(_cfsCertificates, "Chứng nhận CFS",
            x => (x.Id, x.BusinessId, x.CertificateNumber, x.ExpiryDate, x.Status));
        await CollectAsync(_exportCertificates, "GCN Xuất khẩu",
            x => (x.Id, x.BusinessId, x.CertificateNumber, x.ExpiryDate, x.Status));
        await CollectAsync(_productRegistrations, "Đăng ký công bố",
            x => (x.Id, x.BusinessId, x.RegistrationNumber, x.ExpiryDate, x.Status));
        await CollectAsync(_adRegistrations, "Quảng cáo",
            x => (x.Id, x.BusinessId, x.RegistrationNumber, x.ExpiryDate, x.Status));

        return new ListResultDto<ExpiringLicenseDto>(
            results.OrderBy(x => x.DaysRemaining).ToList());
    }

    public async Task<ListResultDto<ReportComplianceRowDto>>
        GetReportComplianceAsync(DashboardFilterDto input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var year = input.Year ?? _clock.Now.Year;
        var orgIds = await ResolveOrganizationIdsAsync(
            scope, input.OrganizationId, ct);
        var global = scope.HasGlobalAccess && !input.OrganizationId.HasValue;

        var orgQ = (await _organizations.GetQueryableAsync())
            .WhereIf(!global, o => orgIds.Contains(o.Id));
        var organizations = await AsyncExecuter.ToListAsync(
            orgQ.Where(o => o.IsActive)
                .OrderBy(o => o.Code)
                .Select(o => new { o.Id, o.Name }), ct);
        var organizationIds = organizations.Select(o => o.Id).ToList();

        var ndtpQ = (await _ndtpReports.GetQueryableAsync())
            .Where(r => r.PeriodYear == year &&
                        r.Status != ReportStatus.Draft &&
                        organizationIds.Contains(r.OrganizationId));
        var ndtp = await AsyncExecuter.ToListAsync(
            ndtpQ.GroupBy(r => r.OrganizationId)
                .Select(g => new
                {
                    OrganizationId = g.Key,
                    Months = g.Select(r => r.PeriodMonth).Distinct().Count()
                }), ct);

        var atpQ = (await _atpWorkReports.GetQueryableAsync())
            .Where(r => r.PeriodYear == year &&
                        r.Status != ReportStatus.Draft &&
                        organizationIds.Contains(r.OrganizationId));
        var atp = await AsyncExecuter.ToListAsync(
            atpQ.GroupBy(r => r.OrganizationId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() }),
            ct);

        var actionQ = (await _actionMonthReports.GetQueryableAsync())
            .Where(r => r.PeriodYear == year &&
                        r.Status != ReportStatus.Draft &&
                        organizationIds.Contains(r.OrganizationId));
        var action = await AsyncExecuter.ToListAsync(
            actionQ.GroupBy(r => r.OrganizationId)
                .Select(g => new { OrganizationId = g.Key, Count = g.Count() }),
            ct);

        var rows = organizations.Select(o => new ReportComplianceRowDto
        {
            OrganizationId = o.Id,
            OrganizationName = o.Name,
            NdtpSubmittedMonths =
                ndtp.FirstOrDefault(x => x.OrganizationId == o.Id)?.Months ?? 0,
            NdtpExpectedMonths = 12,
            AtpWorkSubmitted =
                atp.FirstOrDefault(x => x.OrganizationId == o.Id)?.Count ?? 0,
            AtpWorkExpected = 2,
            ActionMonthSubmitted =
                action.FirstOrDefault(x => x.OrganizationId == o.Id)?.Count ?? 0,
            ActionMonthExpected = 1
        }).ToList();
        return new ListResultDto<ReportComplianceRowDto>(rows);
    }

    private async Task<IReadOnlySet<Guid>> ResolveOrganizationIdsAsync(
        CurrentDataScope scope,
        Guid? organizationId,
        CancellationToken ct)
    {
        if (!organizationId.HasValue)
        {
            return scope.OrganizationIds;
        }
        if (!scope.HasGlobalAccess &&
            !scope.IncludesOrganization(organizationId.Value))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The organization filter is outside the current user's scope.");
        }

        var orgQ = await _organizations.GetQueryableAsync();
        var all = await AsyncExecuter.ToListAsync(
            orgQ.Select(o => new { o.Id, o.ParentId }), ct);
        var childrenByParent = all
            .Where(o => o.ParentId.HasValue)
            .GroupBy(o => o.ParentId!.Value)
            .ToDictionary(g => g.Key, g => g.Select(o => o.Id).ToList());

        var subtree = new HashSet<Guid>();
        var queue = new Queue<Guid>();
        queue.Enqueue(organizationId.Value);
        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!subtree.Add(current))
            {
                continue;
            }
            if (childrenByParent.TryGetValue(current, out var children))
            {
                foreach (var child in children)
                {
                    queue.Enqueue(child);
                }
            }
        }
        if (!scope.HasGlobalAccess)
        {
            subtree.IntersectWith(scope.OrganizationIds);
        }
        return subtree;
    }

    private sealed record RecentActivityRow(
        string EntityType,
        string Description,
        DateTime CreationTime,
        Guid? CreatorId);
}
