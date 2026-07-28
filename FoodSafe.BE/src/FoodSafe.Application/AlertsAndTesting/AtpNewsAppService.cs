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

[Authorize(FoodSafePermissions.AlertsAndTesting.News.View)]
public class AtpNewsAppService : ApplicationService
{
    private readonly IRepository<AtpNews, Guid> _news;
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AtpNewsAppService(
        IRepository<AtpNews, Guid> news,
        IRepository<AtpAlert, Guid> alerts,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _news = news;
        _alerts = alerts;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<AtpNewsDto>> GetListAsync(AtpNewsFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View, withDetails: true);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x => x.Title.Contains(filter));
        }
        if (!input.Category.IsNullOrWhiteSpace())
            query = query.Where(x => x.Category == input.Category);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.Source.HasValue)
            query = query.Where(x => x.Source == input.Source.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = ApplySorting(query, input.Sorting).PageBy(input);

        var articles = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = await ToDtosAsync(articles);

        return new PagedResultDto<AtpNewsDto>(totalCount, dtos);
    }

    public async Task<AtpNewsDto> GetAsync(Guid id)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([article]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Create)]
    public async Task<AtpNewsDto> CreateAsync(CreateUpdateAtpNewsDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        await EnsureAlertsAccessibleAsync(input.LinkedAlertIds);

        var article = AtpNews.Create(
            GuidGenerator.Create(),
            orgId,
            input.Title,
            input.Content,
            input.Summary,
            input.ThumbnailStoragePath,
            input.Category,
            input.Tags,
            input.IsFeatured);

        foreach (var alertId in input.LinkedAlertIds)
            article.LinkAlert(GuidGenerator.Create(), alertId);

        await _news.InsertAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([article]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Edit)]
    public async Task<AtpNewsDto> UpdateAsync(Guid id, CreateUpdateAtpNewsDto input)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.Edit);

        await EnsureAlertsAccessibleAsync(input.LinkedAlertIds);

        article.Update(
            input.Title,
            input.Content,
            input.Summary,
            input.ThumbnailStoragePath,
            input.Category,
            input.Tags,
            input.IsFeatured);

        var existingAlertIds = article.LinkedAlerts.Select(la => la.AlertId).ToHashSet();
        var inputAlertIds = input.LinkedAlertIds.ToHashSet();

        foreach (var alertId in existingAlertIds.Except(inputAlertIds))
            article.UnlinkAlert(alertId);

        foreach (var alertId in inputAlertIds.Except(existingAlertIds))
            article.LinkAlert(GuidGenerator.Create(), alertId);

        await _news.UpdateAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([article]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (article.Status != NewsStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.News.CannotModifyNonDraft);
        await _news.DeleteAsync(article, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Publish)]
    public async Task<AtpNewsDto> PublishAsync(Guid id, PublishNewsDto input)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.Edit);
        article.Publish(CurrentUser.GetId(), Clock.Now, input.IsPublic);
        await _news.UpdateAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([article]))[0];
    }

    /// <summary>
    /// Moderation refusal of a draft news item (STT 30 — "Duyệt tin tức do người dân
    /// gửi lên"). The record and its reason are kept for audit instead of deleted.
    /// </summary>
    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Publish)]
    public async Task<AtpNewsDto> RejectAsync(Guid id, RejectNewsDto input)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.Edit);
        article.Reject(CurrentUser.GetId(), Clock.Now, input.Reason);
        await _news.UpdateAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([article]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Publish)]
    public async Task<AtpNewsDto> RecallAsync(Guid id)
    {
        var article = await GetScopedAsync(id, DataScopeOperation.Edit);
        article.Recall(CurrentUser.GetId(), Clock.Now);
        await _news.UpdateAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([article]))[0];
    }

    public async Task<List<AlertOptionDto>> GetAlertOptionsAsync(string? filter)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _alerts.GetQueryableAsync();

        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!filter.IsNullOrWhiteSpace())
        {
            var f = filter!.Trim();
            query = query.Where(x => x.Title.Contains(f) ||
                (x.AlertNumber != null && x.AlertNumber.Contains(f)));
        }

        return await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                .Take(50)
                .Select(x => new AlertOptionDto
                {
                    Id = x.Id,
                    Title = x.Title,
                    AlertNumber = x.AlertNumber
                }),
            _cancellationTokens.Token);
    }

    private async Task<IQueryable<AtpNews>> ScopedQueryAsync(
        DataScopeOperation operation, bool withDetails = false)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = withDetails
            ? await _news.WithDetailsAsync(x => x.LinkedAlerts)
            : await _news.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<AtpNews> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation, withDetails: true);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.News.NotFound);
    }

    // Chỉ cho phép liên kết cảnh báo tồn tại và thuộc phạm vi đơn vị của người
    // dùng — chặn cả lỗi FK 500 lẫn việc dò/đọc cảnh báo của đơn vị khác qua API.
    private async Task EnsureAlertsAccessibleAsync(IReadOnlyCollection<Guid> alertIds)
    {
        if (alertIds.Count == 0)
            return;

        var distinctIds = alertIds.Distinct().ToArray();
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var query = (await _alerts.GetQueryableAsync())
            .Where(x => distinctIds.Contains(x.Id));
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        var accessibleCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        if (accessibleCount != distinctIds.Length)
            throw new BusinessException(FoodSafeDomainErrorCodes.News.LinkedAlertNotAccessible);
    }

    // Sắp xếp theo yêu cầu của client trong danh sách cột cho phép; mặc định
    // mới nhất lên đầu.
    private static IOrderedQueryable<AtpNews> ApplySorting(
        IQueryable<AtpNews> query,
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
            ("viewcount", true) => query.OrderByDescending(x => x.ViewCount),
            ("viewcount", false) => query.OrderBy(x => x.ViewCount),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private async Task<List<AtpNewsDto>> ToDtosAsync(IReadOnlyCollection<AtpNews> articles)
    {
        var alertIds = articles.SelectMany(a => a.LinkedAlerts.Select(la => la.AlertId))
            .Distinct().ToArray();

        Dictionary<Guid, string> alertTitles = new();
        if (alertIds.Length > 0)
        {
            var scope = await _dataScopeProvider.GetAsync(
                DataScopeOperation.View, _cancellationTokens.Token);
            var aQuery = (await _alerts.GetQueryableAsync())
                .Where(x => alertIds.Contains(x.Id));
            if (!scope.HasGlobalAccess)
                aQuery = aQuery.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
            var rows = await AsyncExecuter.ToListAsync(aQuery, _cancellationTokens.Token);
            alertTitles = rows.ToDictionary(x => x.Id, x => x.Title);
        }

        return articles.Select(a => new AtpNewsDto
        {
            Id = a.Id,
            OrganizationId = a.OrganizationId,
            Title = a.Title,
            Summary = a.Summary,
            Content = a.Content,
            ThumbnailStoragePath = a.ThumbnailStoragePath,
            Category = a.Category,
            Tags = a.Tags,
            ViewCount = a.ViewCount,
            Status = a.Status,
            PublishedAt = a.PublishedAt,
            PublishedById = a.PublishedById,
            RecalledById = a.RecalledById,
            RecalledAt = a.RecalledAt,
            RejectedById = a.RejectedById,
            RejectedAt = a.RejectedAt,
            RejectedReason = a.RejectedReason,
            IsPublic = a.IsPublic,
            IsFeatured = a.IsFeatured,
            Source = a.Source,
            ReporterName = a.ReporterName,
            ReporterContact = a.ReporterContact,
            CreationTime = a.CreationTime,
            LinkedAlerts = a.LinkedAlerts.Select(la => new NewsLinkedAlertDto
            {
                Id = la.Id,
                AlertId = la.AlertId,
                AlertTitle = alertTitles.GetValueOrDefault(la.AlertId),
            }).ToList(),
        }).ToList();
    }
}
