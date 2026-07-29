using FoodSafe.FoodPoisoning;
using FoodSafe.Notifications;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.EventBus.Local;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Reporting;

[Authorize(FoodSafePermissions.Reporting.NdtpReports.View)]
public class NdtpReportAppService : ApplicationService
{
    private readonly IRepository<NdtpReport, Guid> _reports;
    private readonly IRepository<FoodPoisoningCase, Guid> _poisoningCases;
    private readonly IRepository<FoodPoisoningIncident, Guid> _poisoningIncidents;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ReportNameEnricher _nameEnricher;
    private readonly ILocalEventBus _localEventBus;

    public NdtpReportAppService(
        IRepository<NdtpReport, Guid> reports,
        IRepository<FoodPoisoningCase, Guid> poisoningCases,
        IRepository<FoodPoisoningIncident, Guid> poisoningIncidents,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        ReportNameEnricher nameEnricher,
        ILocalEventBus localEventBus)
    {
        _reports = reports;
        _poisoningCases = poisoningCases;
        _poisoningIncidents = poisoningIncidents;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _nameEnricher = nameEnricher;
        _localEventBus = localEventBus;
    }

    public async Task<PagedResultDto<NdtpReportDto>> GetListAsync(NdtpReportFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.PeriodYear.HasValue)
            query = query.Where(x => x.PeriodYear == input.PeriodYear.Value);
        if (input.PeriodMonth.HasValue)
            query = query.Where(x => x.PeriodMonth == input.PeriodMonth.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = ApplySorting(query, input.Sorting).PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = items.Select(ToDto).ToList();
        await _nameEnricher.EnrichAsync(dtos, _cancellationTokens.Token);
        return new PagedResultDto<NdtpReportDto>(totalCount, dtos);
    }

    public async Task<NdtpReportDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return await ToEnrichedDtoAsync(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Create)]
    public async Task<NdtpReportDto> CreateAsync(CreateNdtpReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.HomeOrganizationId
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);

        await EnsurePeriodIsFreeAsync(orgId, input.PeriodYear, input.PeriodMonth);

        var entity = NdtpReport.Create(
            GuidGenerator.Create(), orgId, input.PeriodYear, input.PeriodMonth);
        entity.SetNotes(input.Notes);

        await _reports.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    private async Task EnsurePeriodIsFreeAsync(Guid organizationId, int periodYear, int periodMonth)
    {
        var query = await _reports.GetQueryableAsync();
        var exists = await AsyncExecuter.AnyAsync(
            query.Where(x =>
                x.OrganizationId == organizationId &&
                x.PeriodYear == periodYear &&
                x.PeriodMonth == periodMonth),
            _cancellationTokens.Token);
        if (exists)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.DuplicatePeriod);
    }

    private async Task<NdtpReportDto> ToEnrichedDtoAsync(NdtpReport entity)
    {
        var dto = ToDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        return dto;
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Edit)]
    public async Task<NdtpReportDto> UpdateStatsAsync(Guid id, UpdateNdtpReportStatsDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateStats(
            input.CaseCount, input.CaseAffected, input.CaseHospitalized, input.CaseDeaths,
            input.IncidentCount, input.IncidentAffected, input.IncidentHospitalized, input.IncidentDeaths);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Edit)]
    public async Task<NdtpReportDto> PopulateFromPoisoningDataAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, _cancellationTokens.Token);

        // Period window: [first moment of the month, first moment of next month)
        var periodStart = new DateTime(entity.PeriodYear, entity.PeriodMonth, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var periodEnd = periodStart.AddMonths(1);

        // Aggregate FoodPoisoningCase records for the period
        var caseQuery = await _poisoningCases.GetQueryableAsync();
        caseQuery = caseQuery.Where(c =>
            c.OccurrenceDate.HasValue &&
            c.OccurrenceDate >= periodStart &&
            c.OccurrenceDate < periodEnd);
        if (!scope.HasGlobalAccess)
            caseQuery = caseQuery.Where(c => scope.OrganizationIds.Contains(c.OrganizationId));

        var caseTreatments = await AsyncExecuter.ToListAsync(
            caseQuery.Select(c => c.TreatmentResult),
            _cancellationTokens.Token);

        var caseCount = caseTreatments.Count;
        var caseAffected = caseCount; // each case record represents one affected person
        var caseHospitalized = caseTreatments.Count(r => r == TreatmentResult.Hospitalized);
        var caseDeaths = caseTreatments.Count(r => r == TreatmentResult.Deceased);

        // Aggregate FoodPoisoningIncident records for the period
        var incidentQuery = await _poisoningIncidents.GetQueryableAsync();
        incidentQuery = incidentQuery.Where(i =>
            i.OccurrenceDate.HasValue &&
            i.OccurrenceDate >= periodStart &&
            i.OccurrenceDate < periodEnd);
        if (!scope.HasGlobalAccess)
            incidentQuery = incidentQuery.Where(i => scope.OrganizationIds.Contains(i.OrganizationId));

        var incidentStats = await AsyncExecuter.ToListAsync(
            incidentQuery.Select(i => new { i.AffectedCount, i.HospitalizedCount, i.DeathCount }),
            _cancellationTokens.Token);

        var incidentCount = incidentStats.Count;
        var incidentAffected = incidentStats.Sum(i => i.AffectedCount);
        var incidentHospitalized = incidentStats.Sum(i => i.HospitalizedCount);
        var incidentDeaths = incidentStats.Sum(i => i.DeathCount);

        entity.UpdateStats(
            caseCount, caseAffected, caseHospitalized, caseDeaths,
            incidentCount, incidentAffected, incidentHospitalized, incidentDeaths);

        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return await ToEnrichedDtoAsync(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Edit)]
    public async Task<NdtpReportDto> UpdateNarrativeAsync(Guid id, UpdateNdtpReportNarrativeDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateNarrative(input.PreventionActivities, input.RiskFactors, input.Recommendations);
        entity.SetNotes(input.Notes);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotModifyNonDraft);
        await _reports.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Submit)]
    public async Task<NdtpReportDto> SubmitAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Submit(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        await _localEventBus.PublishAsync(new ReportSubmittedEto
        {
            ReportId = entity.Id,
            ReportEntityType = NotificationEntityTypes.NdtpReport,
            ReportDisplayName = $"Báo cáo NDTP tháng {entity.PeriodMonth}/{entity.PeriodYear}",
            OrganizationId = entity.OrganizationId,
            SubmittedById = entity.SubmittedById!.Value,
        });
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Verify)]
    public async Task<NdtpReportDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        await _localEventBus.PublishAsync(new ReportVerifiedEto
        {
            ReportId = entity.Id,
            ReportEntityType = NotificationEntityTypes.NdtpReport,
            ReportDisplayName = $"Báo cáo NDTP tháng {entity.PeriodMonth}/{entity.PeriodYear}",
            OrganizationId = entity.OrganizationId,
            SubmittedById = entity.SubmittedById,
        });
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Return)]
    public async Task<NdtpReportDto> ReturnAsync(Guid id, ReturnReportDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Return(CurrentUser.GetId(), Clock.Now, input.ReturnReason);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        await _localEventBus.PublishAsync(new ReportReturnedEto
        {
            ReportId = entity.Id,
            ReportEntityType = NotificationEntityTypes.NdtpReport,
            ReportDisplayName = $"Báo cáo NDTP tháng {entity.PeriodMonth}/{entity.PeriodYear}",
            OrganizationId = entity.OrganizationId,
            SubmittedById = entity.SubmittedById,
            ReturnReason = input.ReturnReason,
        });
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Complete)]
    public async Task<NdtpReportDto> CompleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Complete(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Edit)]
    public async Task ReturnToDraftAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.ReturnToDraft();
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
    }

    public async Task<List<ReportErrorNotificationDto>> GetErrorNotificationsAsync(Guid id)
    {
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.View);
        return entity.ErrorNotifications
            .OrderByDescending(n => n.CreationTime)
            .Select(ToNotificationDto)
            .ToList();
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Submit)]
    public async Task<ReportErrorNotificationDto> AddErrorNotificationAsync(
        Guid id, CreateReportErrorNotificationDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit, _cancellationTokens.Token);
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.Edit);

        var notificationId = GuidGenerator.Create();
        var fromOrgId = scope.HomeOrganizationId ?? entity.OrganizationId;
        entity.AddErrorNotification(
            notificationId,
            fromOrgId,
            input.ErrorFields,
            input.CorrectionDetails,
            CurrentUser.GetId());

        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        await _localEventBus.PublishAsync(new ReportErrorNotificationSentEto
        {
            ReportId = entity.Id,
            ReportEntityType = NotificationEntityTypes.NdtpReport,
            ReportDisplayName = $"Báo cáo NDTP tháng {entity.PeriodMonth}/{entity.PeriodYear}",
            OrganizationId = entity.OrganizationId,
        });
        return ToNotificationDto(
            entity.ErrorNotifications.First(n => n.Id == notificationId));
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Verify)]
    public async Task<ReportErrorNotificationDto> AcknowledgeErrorNotificationAsync(
        Guid id, Guid notificationId)
    {
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.Edit);
        var notification = entity.ErrorNotifications.FirstOrDefault(n => n.Id == notificationId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
        notification.Acknowledge();
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToNotificationDto(notification);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Verify)]
    public async Task<ReportErrorNotificationDto> RespondErrorNotificationAsync(
        Guid id, Guid notificationId, RespondReportErrorNotificationDto input)
    {
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.Edit);
        var notification = entity.ErrorNotifications.FirstOrDefault(n => n.Id == notificationId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
        notification.MarkCorrected(CurrentUser.GetId(), input.Response);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        await _localEventBus.PublishAsync(new ReportErrorNotificationRespondedEto
        {
            ReportId = entity.Id,
            ReportEntityType = NotificationEntityTypes.NdtpReport,
            ReportDisplayName = $"Báo cáo NDTP tháng {entity.PeriodMonth}/{entity.PeriodYear}",
            SentByOrganizationId = notification.FromOrganizationId,
        });
        return ToNotificationDto(notification);
    }

    private async Task<NdtpReport> GetScopedWithNotificationsAsync(
        Guid id, DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = (await _reports.WithDetailsAsync(x => x.ErrorNotifications))
            .Where(x => x.Id == id);
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(query, _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private static ReportErrorNotificationDto ToNotificationDto(
        NdtpReportErrorNotification n) => new()
        {
            Id = n.Id,
            FromOrganizationId = n.FromOrganizationId,
            ErrorFields = n.ErrorFields,
            CorrectionDetails = n.CorrectionDetails,
            Status = n.Status,
            Response = n.Response,
            RespondedAt = n.RespondedAt,
            RespondedById = n.RespondedById,
            CreationTime = n.CreationTime
        };

    // Honours the client's Sorting request (e.g. "periodYear desc", "creationTime asc")
    // against a whitelist. Falls back to CreationTime descending.
    private static IOrderedQueryable<NdtpReport> ApplySorting(
        IQueryable<NdtpReport> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        var ordered = (field, descending) switch
        {
            ("periodyear", true) => query.OrderByDescending(x => x.PeriodYear)
                .ThenByDescending(x => x.PeriodMonth),
            ("periodyear", false) => query.OrderBy(x => x.PeriodYear)
                .ThenBy(x => x.PeriodMonth),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
        return ordered.ThenBy(x => x.Id);
    }

    private async Task<IQueryable<NdtpReport>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _reports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<NdtpReport> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private static NdtpReportDto ToDto(NdtpReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodYear = e.PeriodYear,
        PeriodMonth = e.PeriodMonth,
        CaseCount = e.CaseCount,
        CaseAffected = e.CaseAffected,
        CaseHospitalized = e.CaseHospitalized,
        CaseDeaths = e.CaseDeaths,
        IncidentCount = e.IncidentCount,
        IncidentAffected = e.IncidentAffected,
        IncidentHospitalized = e.IncidentHospitalized,
        IncidentDeaths = e.IncidentDeaths,
        PreventionActivities = e.PreventionActivities,
        RiskFactors = e.RiskFactors,
        Recommendations = e.Recommendations,
        Status = e.Status,
        SubmissionVersion = e.SubmissionVersion,
        SubmittedById = e.SubmittedById,
        SubmittedAt = e.SubmittedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        ReturnedById = e.ReturnedById,
        ReturnedAt = e.ReturnedAt,
        ReturnReason = e.ReturnReason,
        CompletedById = e.CompletedById,
        CompletedAt = e.CompletedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime
    };
}
