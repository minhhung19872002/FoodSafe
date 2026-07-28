using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Reporting;

[Authorize(FoodSafePermissions.Reporting.ActionMonthReports.View)]
public class ActionMonthReportAppService : ApplicationService
{
    private readonly IRepository<ActionMonthReport, Guid> _reports;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ReportNameEnricher _nameEnricher;

    public ActionMonthReportAppService(
        IRepository<ActionMonthReport, Guid> reports,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        ReportNameEnricher nameEnricher)
    {
        _reports = reports;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _nameEnricher = nameEnricher;
    }

    public async Task<PagedResultDto<ActionMonthReportDto>> GetListAsync(ActionMonthReportFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.PeriodYear.HasValue)
            query = query.Where(x => x.PeriodYear == input.PeriodYear.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = ApplySorting(query, input.Sorting).PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = items.Select(ToDto).ToList();
        await _nameEnricher.EnrichAsync(dtos, _cancellationTokens.Token);
        return new PagedResultDto<ActionMonthReportDto>(totalCount, dtos);
    }

    public async Task<ActionMonthReportDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return await ToEnrichedDtoAsync(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Create)]
    public async Task<ActionMonthReportDto> CreateAsync(CreateActionMonthReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.HomeOrganizationId
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);

        await EnsurePeriodIsFreeAsync(orgId, input.PeriodYear);

        var entity = ActionMonthReport.Create(
            GuidGenerator.Create(), orgId, input.PeriodYear);
        entity.UpdateHeader(input.ActionMonthTheme, input.ActionMonthDates);
        entity.SetNotes(input.Notes);

        await _reports.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    private async Task EnsurePeriodIsFreeAsync(Guid organizationId, int periodYear)
    {
        var query = await _reports.GetQueryableAsync();
        var exists = await AsyncExecuter.AnyAsync(
            query.Where(x =>
                x.OrganizationId == organizationId &&
                x.PeriodYear == periodYear),
            _cancellationTokens.Token);
        if (exists)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.DuplicatePeriod);
    }

    private async Task<ActionMonthReportDto> ToEnrichedDtoAsync(ActionMonthReport entity)
    {
        var dto = ToDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        return dto;
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
    public async Task<ActionMonthReportDto> UpdateStatsAsync(Guid id, UpdateActionMonthReportStatsDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateCommunicationStats(
            input.MediaArticles, input.BroadcastPrograms, input.PropagandaSessions,
            input.Participants, input.PostersDistributed, input.LeafletsDistributed);
        entity.UpdateInspectionStats(
            input.BusinessesInspected, input.ViolationsFound,
            input.FinesIssued, input.FineAmount);
        entity.UpdateOtherStats(input.NewSelfDeclarations);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
    public async Task<ActionMonthReportDto> UpdateNarrativeAsync(Guid id, UpdateActionMonthReportNarrativeDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateHeader(input.ActionMonthTheme, input.ActionMonthDates);
        entity.UpdateNarrative(
            input.Achievements, input.Limitations,
            input.LessonsLearned, input.NextSteps);
        entity.SetNotes(input.Notes);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotModifyNonDraft);
        await _reports.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Submit)]
    public async Task<ActionMonthReportDto> SubmitAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Submit(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Verify)]
    public async Task<ActionMonthReportDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Return)]
    public async Task<ActionMonthReportDto> ReturnAsync(Guid id, ReturnReportDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Return(CurrentUser.GetId(), Clock.Now, input.ReturnReason);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Complete)]
    public async Task<ActionMonthReportDto> CompleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Complete(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Edit)]
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

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Submit)]
    public async Task<ReportErrorNotificationDto> AddErrorNotificationAsync(
        Guid id, CreateReportErrorNotificationDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit, _cancellationTokens.Token);
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.Edit);

        var notificationId = GuidGenerator.Create();
        entity.AddErrorNotification(
            notificationId,
            scope.HomeOrganizationId ?? entity.OrganizationId,
            input.ErrorFields,
            input.CorrectionDetails,
            CurrentUser.GetId());

        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToNotificationDto(
            entity.ErrorNotifications.First(n => n.Id == notificationId));
    }

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Verify)]
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

    [Authorize(FoodSafePermissions.Reporting.ActionMonthReports.Verify)]
    public async Task<ReportErrorNotificationDto> RespondErrorNotificationAsync(
        Guid id, Guid notificationId, RespondReportErrorNotificationDto input)
    {
        var entity = await GetScopedWithNotificationsAsync(id, DataScopeOperation.Edit);
        var notification = entity.ErrorNotifications.FirstOrDefault(n => n.Id == notificationId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
        notification.MarkCorrected(CurrentUser.GetId(), input.Response);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToNotificationDto(notification);
    }

    private async Task<ActionMonthReport> GetScopedWithNotificationsAsync(
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
        ActionMonthReportErrorNotification n) => new()
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

    private async Task<IQueryable<ActionMonthReport>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _reports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    // Honours the client's Sorting request (e.g. "periodYear desc", "creationTime asc")
    // against a whitelist. Falls back to CreationTime descending.
    private static IOrderedQueryable<ActionMonthReport> ApplySorting(
        IQueryable<ActionMonthReport> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        var ordered = (field, descending) switch
        {
            ("periodyear", true) => query.OrderByDescending(x => x.PeriodYear),
            ("periodyear", false) => query.OrderBy(x => x.PeriodYear),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
        return ordered.ThenBy(x => x.Id);
    }

    private async Task<ActionMonthReport> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private static ActionMonthReportDto ToDto(ActionMonthReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodYear = e.PeriodYear,
        ActionMonthTheme = e.ActionMonthTheme,
        ActionMonthDates = e.ActionMonthDates,
        MediaArticles = e.MediaArticles,
        BroadcastPrograms = e.BroadcastPrograms,
        PropagandaSessions = e.PropagandaSessions,
        Participants = e.Participants,
        PostersDistributed = e.PostersDistributed,
        LeafletsDistributed = e.LeafletsDistributed,
        BusinessesInspected = e.BusinessesInspected,
        ViolationsFound = e.ViolationsFound,
        FinesIssued = e.FinesIssued,
        FineAmount = e.FineAmount,
        NewSelfDeclarations = e.NewSelfDeclarations,
        Achievements = e.Achievements,
        Limitations = e.Limitations,
        LessonsLearned = e.LessonsLearned,
        NextSteps = e.NextSteps,
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
