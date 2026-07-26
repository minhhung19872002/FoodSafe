using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.AlertsAndTesting;

[Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.View)]
public class AtpAlertAppService : ApplicationService
{
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AtpAlertAppService(
        IRepository<AtpAlert, Guid> alerts,
        IRepository<Business, Guid> businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _alerts = alerts;
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<AtpAlertDto>> GetListAsync(AtpAlertFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Title.Contains(filter) ||
                (x.AlertNumber != null && x.AlertNumber.Contains(filter)));
        }
        if (input.Category.HasValue)
            query = query.Where(x => x.Category == input.Category.Value);
        if (input.Severity.HasValue)
            query = query.Where(x => x.Severity == input.Severity.Value);
        if (input.Source.HasValue)
            query = query.Where(x => x.Source == input.Source.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.CreationTime);
        query = query.PageBy(input);

        var alerts = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = await ToDtosAsync(alerts);

        return new PagedResultDto<AtpAlertDto>(totalCount, dtos);
    }

    public async Task<AtpAlertDto> GetAsync(Guid id)
    {
        var alert = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([alert]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.Create)]
    public async Task<AtpAlertDto> CreateAsync(CreateUpdateAtpAlertDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var alert = AtpAlert.Create(
            GuidGenerator.Create(),
            orgId,
            input.Title,
            input.Content,
            input.Category,
            input.Severity,
            input.Source,
            input.AlertNumber,
            input.AffectedArea,
            input.AffectedProducts,
            input.BusinessId,
            input.ReporterName,
            input.ReporterPhone,
            input.ReporterEmail);

        await _alerts.InsertAsync(alert, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([alert]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.Edit)]
    public async Task<AtpAlertDto> UpdateAsync(Guid id, CreateUpdateAtpAlertDto input)
    {
        var alert = await GetScopedAsync(id, DataScopeOperation.Edit);

        alert.Update(
            input.Title,
            input.Content,
            input.Category,
            input.Severity,
            input.AlertNumber,
            input.AffectedArea,
            input.AffectedProducts,
            input.BusinessId,
            input.ReporterName,
            input.ReporterPhone,
            input.ReporterEmail);

        await _alerts.UpdateAsync(alert, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([alert]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var alert = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (alert.Status != AlertStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Alert.CannotModifyNonDraft);
        await _alerts.DeleteAsync(alert, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.Publish)]
    public async Task<AtpAlertDto> PublishAsync(Guid id, PublishAlertDto input)
    {
        var alert = await GetScopedAsync(id, DataScopeOperation.Edit);
        alert.Publish(CurrentUser.GetId(), Clock.Now, input.IsPublic);
        await _alerts.UpdateAsync(alert, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([alert]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Alerts.Publish)]
    public async Task<AtpAlertDto> RecallAsync(Guid id, RecallAlertDto input)
    {
        var alert = await GetScopedAsync(id, DataScopeOperation.Edit);
        alert.Recall(CurrentUser.GetId(), Clock.Now, input.Reason);
        await _alerts.UpdateAsync(alert, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([alert]))[0];
    }

    private async Task<IQueryable<AtpAlert>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _alerts.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<AtpAlert> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Alert.NotFound);
    }

    private async Task<List<AtpAlertDto>> ToDtosAsync(IReadOnlyCollection<AtpAlert> alerts)
    {
        var businessIds = alerts.Where(a => a.BusinessId.HasValue)
            .Select(a => a.BusinessId!.Value).Distinct().ToArray();

        Dictionary<Guid, string> businesses = new();
        if (businessIds.Length > 0)
        {
            var bQuery = await _businesses.GetQueryableAsync();
            var rows = await AsyncExecuter.ToListAsync(
                bQuery.Where(x => businessIds.Contains(x.Id)),
                _cancellationTokens.Token);
            businesses = rows.ToDictionary(x => x.Id, x => x.Name);
        }

        return alerts.Select(a => new AtpAlertDto
        {
            Id = a.Id,
            OrganizationId = a.OrganizationId,
            AlertNumber = a.AlertNumber,
            Title = a.Title,
            Content = a.Content,
            Category = a.Category,
            Severity = a.Severity,
            AffectedArea = a.AffectedArea,
            AffectedProducts = a.AffectedProducts,
            BusinessId = a.BusinessId,
            BusinessName = a.BusinessId.HasValue && businesses.TryGetValue(a.BusinessId.Value, out var name) ? name : null,
            Source = a.Source,
            ReporterName = a.ReporterName,
            ReporterPhone = a.ReporterPhone,
            ReporterEmail = a.ReporterEmail,
            Status = a.Status,
            PublishedById = a.PublishedById,
            PublishedAt = a.PublishedAt,
            RecalledById = a.RecalledById,
            RecalledAt = a.RecalledAt,
            RecallReason = a.RecallReason,
            IsPublic = a.IsPublic,
            CreationTime = a.CreationTime,
        }).ToList();
    }
}
