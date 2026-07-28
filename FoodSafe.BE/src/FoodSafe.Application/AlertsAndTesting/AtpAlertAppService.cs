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

        query = ApplySorting(query, input.Sorting).PageBy(input);

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

        await EnsureBusinessAccessibleAsync(input.BusinessId);

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

        await EnsureBusinessAccessibleAsync(input.BusinessId);

        alert.Update(
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

    // Chỉ cho phép gắn cơ sở tồn tại và thuộc phạm vi đơn vị của người dùng —
    // chặn cả lỗi FK 500 lẫn việc dò/gắn cơ sở của đơn vị khác qua API.
    private async Task EnsureBusinessAccessibleAsync(Guid? businessId)
    {
        if (!businessId.HasValue)
            return;

        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var query = (await _businesses.GetQueryableAsync())
            .Where(x => x.Id == businessId.Value);
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!await AsyncExecuter.AnyAsync(query, _cancellationTokens.Token))
            throw new BusinessException(FoodSafeDomainErrorCodes.Alert.BusinessNotAccessible);
    }

    // Sắp xếp theo yêu cầu của client trong danh sách cột cho phép; mặc định
    // mới nhất lên đầu.
    private static IOrderedQueryable<AtpAlert> ApplySorting(
        IQueryable<AtpAlert> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("title", true) => query.OrderByDescending(x => x.Title),
            ("title", false) => query.OrderBy(x => x.Title),
            ("severity", true) => query.OrderByDescending(x => x.Severity),
            ("severity", false) => query.OrderBy(x => x.Severity),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private async Task<List<AtpAlertDto>> ToDtosAsync(IReadOnlyCollection<AtpAlert> alerts)
    {
        var businessIds = alerts.Where(a => a.BusinessId.HasValue)
            .Select(a => a.BusinessId!.Value).Distinct().ToArray();

        Dictionary<Guid, string> businesses = new();
        if (businessIds.Length > 0)
        {
            var scope = await _dataScopeProvider.GetAsync(
                DataScopeOperation.View, _cancellationTokens.Token);
            var bQuery = (await _businesses.GetQueryableAsync())
                .Where(x => businessIds.Contains(x.Id));
            if (!scope.HasGlobalAccess)
                bQuery = bQuery.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
            var rows = await AsyncExecuter.ToListAsync(bQuery, _cancellationTokens.Token);
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
