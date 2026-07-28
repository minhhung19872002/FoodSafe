using FoodSafe.BusinessManagement;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Reporting;

/// <summary>
/// Computes ATP work-report statistics from live system data
/// (FR-34-10 "Tự tính số liệu") and aggregates lower-level NDTP
/// reports for city/province consolidation (FR-33-02).
/// </summary>
[Authorize]
public class ReportCalculationAppService : ApplicationService
{
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<SelfDeclaration, Guid> _selfDeclarations;
    private readonly IRepository<ProductRegistration, Guid> _productRegistrations;
    private readonly IRepository<AdvertisementRegistration, Guid> _adRegistrations;
    private readonly IRepository<EligibilityCertificate, Guid> _eligibilityCertificates;
    private readonly IRepository<CfsCertificate, Guid> _cfsCertificates;
    private readonly IRepository<ExportFoodCertificate, Guid> _exportCertificates;
    private readonly IRepository<InspectionPlan, Guid> _inspectionPlans;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly IRepository<FoodPoisoningCase, Guid> _poisoningCases;
    private readonly IRepository<FoodPoisoningIncident, Guid> _poisoningIncidents;
    private readonly IRepository<NdtpReport, Guid> _ndtpReports;

    public ReportCalculationAppService(
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IRepository<Business, Guid> businesses,
        IRepository<SelfDeclaration, Guid> selfDeclarations,
        IRepository<ProductRegistration, Guid> productRegistrations,
        IRepository<AdvertisementRegistration, Guid> adRegistrations,
        IRepository<EligibilityCertificate, Guid> eligibilityCertificates,
        IRepository<CfsCertificate, Guid> cfsCertificates,
        IRepository<ExportFoodCertificate, Guid> exportCertificates,
        IRepository<InspectionPlan, Guid> inspectionPlans,
        IRepository<InspectionResult, Guid> inspectionResults,
        IRepository<FoodPoisoningCase, Guid> poisoningCases,
        IRepository<FoodPoisoningIncident, Guid> poisoningIncidents,
        IRepository<NdtpReport, Guid> ndtpReports)
    {
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _businesses = businesses;
        _selfDeclarations = selfDeclarations;
        _productRegistrations = productRegistrations;
        _adRegistrations = adRegistrations;
        _eligibilityCertificates = eligibilityCertificates;
        _cfsCertificates = cfsCertificates;
        _exportCertificates = exportCertificates;
        _inspectionPlans = inspectionPlans;
        _inspectionResults = inspectionResults;
        _poisoningCases = poisoningCases;
        _poisoningIncidents = poisoningIncidents;
        _ndtpReports = ndtpReports;
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.View)]
    public async Task<AtpWorkReportCalculatedStatsDto> GetAtpWorkStatsAsync(
        CalculateAtpWorkStatsInput input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);
        var orgIds = scope.OrganizationIds;
        var global = scope.HasGlobalAccess;

        var (start, endExclusive) = ResolvePeriod(input);
        var startDate = DateOnly.FromDateTime(start);
        var endDateExclusive = DateOnly.FromDateTime(endExclusive);

        var dto = new AtpWorkReportCalculatedStatsDto();

        var bizQ = (await _businesses.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId));
        dto.TotalBusinesses = await AsyncExecuter.CountAsync(
            bizQ.Where(b => b.CreationTime < endExclusive), ct);
        dto.NewBusinesses = await AsyncExecuter.CountAsync(
            bizQ.Where(b =>
                b.CreationTime >= start && b.CreationTime < endExclusive), ct);
        dto.InactiveBusinesses = await AsyncExecuter.CountAsync(
            bizQ.Where(b => b.Status == BusinessStatus.Inactive), ct);
        dto.BusinessesWithCertificate = await AsyncExecuter.CountAsync(
            bizQ.Where(b => b.HasEligibilityCertificate), ct);

        async Task<int> CountCreatedInPeriodAsync<TEntity>(
            IRepository<TEntity, Guid> repository,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> scopeFilter)
            where TEntity : class,
            Volo.Abp.Auditing.IHasCreationTime,
            Volo.Abp.Domain.Entities.IEntity<Guid>
        {
            var query = scopeFilter(await repository.GetQueryableAsync());
            return await AsyncExecuter.CountAsync(
                query.Where(x =>
                    x.CreationTime >= start && x.CreationTime < endExclusive),
                ct);
        }

        dto.DkcbIssued = await CountCreatedInPeriodAsync(
            _productRegistrations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));
        dto.SelfDeclarationsReceived = await CountCreatedInPeriodAsync(
            _selfDeclarations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));
        dto.AdRegistrationsIssued = await CountCreatedInPeriodAsync(
            _adRegistrations,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));
        dto.EligibilityCertificatesIssued = await CountCreatedInPeriodAsync(
            _eligibilityCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));
        dto.CfsIssued = await CountCreatedInPeriodAsync(
            _cfsCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));
        dto.ExportCertificatesIssued = await CountCreatedInPeriodAsync(
            _exportCertificates,
            q => q.WhereIf(!global, x => orgIds.Contains(x.OrganizationId)));

        var planQ = (await _inspectionPlans.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x => x.Year == input.PeriodYear);
        dto.TotalInspectionPlans = await AsyncExecuter.CountAsync(planQ, ct);

        var resultQ = (await _inspectionResults.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x =>
                x.InspectionDate >= start && x.InspectionDate < endExclusive);
        dto.BusinessesInspected = await AsyncExecuter.CountAsync(resultQ, ct);
        dto.ViolationsFound = await AsyncExecuter.CountAsync(
            resultQ.Where(r => r.HasViolation), ct);
        dto.FinesIssued = await AsyncExecuter.CountAsync(
            resultQ.Where(r => r.FineAmount != null && r.FineAmount > 0), ct);
        dto.FineTotalAmount = await AsyncExecuter.SumAsync(
            resultQ.Select(r => r.FineAmount), ct) ?? 0;

        var caseQ = (await _poisoningCases.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x =>
                x.ReportDate >= startDate && x.ReportDate < endDateExclusive);
        dto.PoisoningCaseCount = await AsyncExecuter.CountAsync(caseQ, ct);
        var caseDeaths = await AsyncExecuter.CountAsync(
            caseQ.Where(c => c.TreatmentResult == TreatmentResult.Deceased),
            ct);

        var incidentQ = (await _poisoningIncidents.GetQueryableAsync())
            .WhereIf(!global, x => orgIds.Contains(x.OrganizationId))
            .Where(x =>
                x.CreationTime >= start && x.CreationTime < endExclusive);
        dto.PoisoningIncidentCount = await AsyncExecuter.CountAsync(
            incidentQ, ct);
        var incidentAffected = await AsyncExecuter.SumAsync(
            incidentQ.Select(i => (int?)i.AffectedCount), ct) ?? 0;
        var incidentDeaths = await AsyncExecuter.SumAsync(
            incidentQ.Select(i => (int?)i.DeathCount), ct) ?? 0;

        // Ca nhỏ lẻ = 1 người mắc; vụ ngộ độc đóng góp theo AffectedCount/DeathCount.
        dto.TotalAffected = dto.PoisoningCaseCount + incidentAffected;
        dto.TotalDeaths = caseDeaths + incidentDeaths;

        return dto;
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.View)]
    public async Task<NdtpAggregatedStatsDto> GetNdtpAggregationAsync(
        NdtpAggregationInput input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, ct);

        var reportQ = (await _ndtpReports.GetQueryableAsync())
            .WhereIf(
                !scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId))
            .Where(x =>
                x.PeriodYear == input.PeriodYear &&
                x.PeriodMonth == input.PeriodMonth &&
                x.Status != ReportStatus.Draft &&
                x.Status != ReportStatus.Returned);

        var reports = await AsyncExecuter.ToListAsync(reportQ, ct);
        return new NdtpAggregatedStatsDto
        {
            ReportCount = reports.Count,
            CaseCount = reports.Sum(r => r.CaseCount),
            CaseAffected = reports.Sum(r => r.CaseAffected),
            CaseHospitalized = reports.Sum(r => r.CaseHospitalized),
            CaseDeaths = reports.Sum(r => r.CaseDeaths),
            IncidentCount = reports.Sum(r => r.IncidentCount),
            IncidentAffected = reports.Sum(r => r.IncidentAffected),
            IncidentHospitalized = reports.Sum(r => r.IncidentHospitalized),
            IncidentDeaths = reports.Sum(r => r.IncidentDeaths)
        };
    }

    private static (DateTime Start, DateTime EndExclusive) ResolvePeriod(
        CalculateAtpWorkStatsInput input)
    {
        if (input.PeriodType == ReportPeriodType.HalfYear)
        {
            return input.PeriodHalf == 2
                ? (new DateTime(input.PeriodYear, 7, 1),
                    new DateTime(input.PeriodYear + 1, 1, 1))
                : (new DateTime(input.PeriodYear, 1, 1),
                    new DateTime(input.PeriodYear, 7, 1));
        }
        return (new DateTime(input.PeriodYear, 1, 1),
            new DateTime(input.PeriodYear + 1, 1, 1));
    }
}
