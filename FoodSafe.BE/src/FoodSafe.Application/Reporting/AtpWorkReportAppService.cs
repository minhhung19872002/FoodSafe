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

[Authorize(FoodSafePermissions.Reporting.AtpWorkReports.View)]
public class AtpWorkReportAppService : ApplicationService
{
    private readonly IRepository<AtpWorkReport, Guid> _reports;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ReportNameEnricher _nameEnricher;

    public AtpWorkReportAppService(
        IRepository<AtpWorkReport, Guid> reports,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        ReportNameEnricher nameEnricher)
    {
        _reports = reports;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _nameEnricher = nameEnricher;
    }

    public async Task<PagedResultDto<AtpWorkReportDto>> GetListAsync(AtpWorkReportFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.PeriodType.HasValue)
            query = query.Where(x => x.PeriodType == input.PeriodType.Value);
        if (input.PeriodYear.HasValue)
            query = query.Where(x => x.PeriodYear == input.PeriodYear.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = ApplySorting(query, input.Sorting).PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = items.Select(ToDto).ToList();
        await _nameEnricher.EnrichAsync(dtos, _cancellationTokens.Token);
        return new PagedResultDto<AtpWorkReportDto>(totalCount, dtos);
    }

    public async Task<AtpWorkReportDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return await ToEnrichedDtoAsync(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Create)]
    public async Task<AtpWorkReportDto> CreateAsync(CreateAtpWorkReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.HomeOrganizationId
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);

        await EnsurePeriodIsFreeAsync(orgId, input.PeriodType, input.PeriodYear, input.PeriodHalf);

        var entity = AtpWorkReport.Create(
            GuidGenerator.Create(), orgId, input.PeriodType, input.PeriodYear, input.PeriodHalf);
        entity.SetNotes(input.Notes);

        await _reports.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    private async Task EnsurePeriodIsFreeAsync(
        Guid organizationId, ReportPeriodType periodType, int periodYear, int? periodHalf)
    {
        var query = await _reports.GetQueryableAsync();
        var exists = await AsyncExecuter.AnyAsync(
            query.Where(x =>
                x.OrganizationId == organizationId &&
                x.PeriodType == periodType &&
                x.PeriodYear == periodYear &&
                x.PeriodHalf == periodHalf),
            _cancellationTokens.Token);
        if (exists)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.DuplicatePeriod);
    }

    private async Task<AtpWorkReportDto> ToEnrichedDtoAsync(AtpWorkReport entity)
    {
        var dto = ToDto(entity);
        await _nameEnricher.EnrichAsync([dto], _cancellationTokens.Token);
        return dto;
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
    public async Task<AtpWorkReportDto> UpdateStatsAsync(Guid id, UpdateAtpWorkReportStatsDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateBusinessStats(
            input.TotalBusinesses, input.NewBusinesses,
            input.InactiveBusinesses, input.BusinessesWithCertificate);
        entity.UpdateLicensingStats(
            input.DkcbIssued, input.SelfDeclarationsReceived, input.AdRegistrationsIssued,
            input.EligibilityCertificatesIssued, input.CfsIssued, input.ExportCertificatesIssued);
        entity.UpdateInspectionStats(
            input.TotalInspectionPlans, input.BusinessesInspected,
            input.ViolationsFound, input.FinesIssued, input.FineTotalAmount);
        entity.UpdatePoisoningStats(
            input.PoisoningCaseCount, input.PoisoningIncidentCount,
            input.TotalAffected, input.TotalDeaths);
        entity.UpdateCommunicationStats(
            input.TrainingSessions, input.TrainingParticipants,
            input.MediaAppearances, input.DocumentsIssued);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
    public async Task<AtpWorkReportDto> UpdateNarrativeAsync(Guid id, UpdateAtpWorkReportNarrativeDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.UpdateNarrative(
            input.Overview, input.Achievements, input.Limitations,
            input.Solutions, input.NextPeriodPlan);
        entity.SetNotes(input.Notes);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != ReportStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Report.CannotModifyNonDraft);
        await _reports.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.InternallyApprove)]
    public async Task<AtpWorkReportDto> InternallyApproveAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.InternallyApprove();
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Submit)]
    public async Task<AtpWorkReportDto> SubmitAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Submit(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Verify)]
    public async Task<AtpWorkReportDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Return)]
    public async Task<AtpWorkReportDto> ReturnAsync(Guid id, ReturnReportDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Return(CurrentUser.GetId(), Clock.Now, input.ReturnReason);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Complete)]
    public async Task<AtpWorkReportDto> CompleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Complete(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Edit)]
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

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Submit)]
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

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Verify)]
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

    [Authorize(FoodSafePermissions.Reporting.AtpWorkReports.Verify)]
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

    private async Task<AtpWorkReport> GetScopedWithNotificationsAsync(
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
        AtpWorkReportErrorNotification n) => new()
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
    private static IOrderedQueryable<AtpWorkReport> ApplySorting(
        IQueryable<AtpWorkReport> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        var ordered = (field, descending) switch
        {
            ("periodyear", true) => query.OrderByDescending(x => x.PeriodYear)
                .ThenByDescending(x => x.PeriodHalf),
            ("periodyear", false) => query.OrderBy(x => x.PeriodYear)
                .ThenBy(x => x.PeriodHalf),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
        return ordered.ThenBy(x => x.Id);
    }

    private async Task<IQueryable<AtpWorkReport>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _reports.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<AtpWorkReport> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Report.NotFound);
    }

    private static AtpWorkReportDto ToDto(AtpWorkReport e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        PeriodType = e.PeriodType,
        PeriodYear = e.PeriodYear,
        PeriodHalf = e.PeriodHalf,
        TotalBusinesses = e.TotalBusinesses,
        NewBusinesses = e.NewBusinesses,
        InactiveBusinesses = e.InactiveBusinesses,
        BusinessesWithCertificate = e.BusinessesWithCertificate,
        DkcbIssued = e.DkcbIssued,
        SelfDeclarationsReceived = e.SelfDeclarationsReceived,
        AdRegistrationsIssued = e.AdRegistrationsIssued,
        EligibilityCertificatesIssued = e.EligibilityCertificatesIssued,
        CfsIssued = e.CfsIssued,
        ExportCertificatesIssued = e.ExportCertificatesIssued,
        TotalInspectionPlans = e.TotalInspectionPlans,
        BusinessesInspected = e.BusinessesInspected,
        ViolationsFound = e.ViolationsFound,
        FinesIssued = e.FinesIssued,
        FineTotalAmount = e.FineTotalAmount,
        PoisoningCaseCount = e.PoisoningCaseCount,
        PoisoningIncidentCount = e.PoisoningIncidentCount,
        TotalAffected = e.TotalAffected,
        TotalDeaths = e.TotalDeaths,
        TrainingSessions = e.TrainingSessions,
        TrainingParticipants = e.TrainingParticipants,
        MediaAppearances = e.MediaAppearances,
        DocumentsIssued = e.DocumentsIssued,
        Overview = e.Overview,
        Achievements = e.Achievements,
        Limitations = e.Limitations,
        Solutions = e.Solutions,
        NextPeriodPlan = e.NextPeriodPlan,
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
