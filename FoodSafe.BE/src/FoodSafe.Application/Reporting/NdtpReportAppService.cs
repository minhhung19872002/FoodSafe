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

[Authorize(FoodSafePermissions.Reporting.NdtpReports.View)]
public class NdtpReportAppService : ApplicationService
{
    private readonly IRepository<NdtpReport, Guid> _reports;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public NdtpReportAppService(
        IRepository<NdtpReport, Guid> reports,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _reports = reports;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
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

        query = query.OrderByDescending(x => x.PeriodYear)
            .ThenByDescending(x => x.PeriodMonth);
        query = query.PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        return new PagedResultDto<NdtpReportDto>(totalCount, items.Select(ToDto).ToList());
    }

    public async Task<NdtpReportDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Create)]
    public async Task<NdtpReportDto> CreateAsync(CreateNdtpReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var entity = NdtpReport.Create(
            GuidGenerator.Create(), orgId, input.PeriodYear, input.PeriodMonth);
        entity.SetNotes(input.Notes);

        await _reports.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
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
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Verify)]
    public async Task<NdtpReportDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.Reporting.NdtpReports.Return)]
    public async Task<NdtpReportDto> ReturnAsync(Guid id, ReturnReportDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Return(CurrentUser.GetId(), Clock.Now, input.ReturnReason);
        await _reports.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
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
