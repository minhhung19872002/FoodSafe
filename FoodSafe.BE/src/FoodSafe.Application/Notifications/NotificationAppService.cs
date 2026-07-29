using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Notifications;

[Authorize]
public class NotificationAppService(
    IRepository<AppNotification, Guid> notifications,
    ICancellationTokenProvider cancellationTokens) :
    ApplicationService, INotificationAppService
{
    public async Task<PagedResultDto<NotificationDto>> GetListAsync(NotificationFilterDto input)
    {
        var userId = CurrentUser.GetId();
        var query = await notifications.GetQueryableAsync();
        query = query.Where(n => n.RecipientUserId == userId);

        if (input.IsRead.HasValue)
            query = query.Where(n => n.IsRead == input.IsRead.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, cancellationTokens.Token);

        query = query
            .OrderByDescending(n => n.CreationTime)
            .ThenBy(n => n.Id)
            .PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, cancellationTokens.Token);
        return new PagedResultDto<NotificationDto>(totalCount, items.Select(ToDto).ToList());
    }

    public async Task<UnreadCountDto> GetUnreadCountAsync()
    {
        var userId = CurrentUser.GetId();
        var query = await notifications.GetQueryableAsync();
        var count = await AsyncExecuter.CountAsync(
            query.Where(n => n.RecipientUserId == userId && !n.IsRead),
            cancellationTokens.Token);
        return new UnreadCountDto { Count = count };
    }

    public async Task MarkReadAsync(Guid id)
    {
        var notification = await GetForCurrentUserAsync(id);
        notification.MarkRead(Clock.Now);
        await notifications.UpdateAsync(notification, autoSave: true,
            cancellationToken: cancellationTokens.Token);
    }

    public async Task MarkAllReadAsync()
    {
        var userId = CurrentUser.GetId();
        const int batchSize = 200;

        while (true)
        {
            var query = await notifications.GetQueryableAsync();
            var batch = await AsyncExecuter.ToListAsync(
                query.Where(n => n.RecipientUserId == userId && !n.IsRead)
                     .OrderBy(n => n.CreationTime)
                     .Take(batchSize),
                cancellationTokens.Token);

            if (batch.Count == 0) break;

            foreach (var n in batch) n.MarkRead(Clock.Now);
            await notifications.UpdateManyAsync(batch, autoSave: true,
                cancellationToken: cancellationTokens.Token);

            if (batch.Count < batchSize) break;
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        var notification = await GetForCurrentUserAsync(id);
        await notifications.DeleteAsync(notification, autoSave: true,
            cancellationToken: cancellationTokens.Token);
    }

    private async Task<AppNotification> GetForCurrentUserAsync(Guid id)
    {
        var userId = CurrentUser.GetId();
        var query = await notifications.GetQueryableAsync();
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(n => n.Id == id && n.RecipientUserId == userId),
                   cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Notification.NotFound);
    }

    private static NotificationDto ToDto(AppNotification n) => new()
    {
        Id = n.Id,
        Type = n.Type,
        Title = n.Title,
        Message = n.Message,
        EntityType = n.EntityType,
        EntityId = n.EntityId,
        IsRead = n.IsRead,
        ReadAt = n.ReadAt,
        CreationTime = n.CreationTime,
    };
}
