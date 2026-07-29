using Microsoft.Extensions.Logging;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EventBus;
using Volo.Abp.Uow;

namespace FoodSafe.Notifications;

public class CitizenSubmissionNotificationHandler(
    INotificationRecipientResolver recipients,
    NotificationCreator creator,
    IUnitOfWorkManager unitOfWorkManager,
    ILogger<CitizenSubmissionNotificationHandler> logger) :
    ILocalEventHandler<CitizenAlertSubmittedEto>,
    ILocalEventHandler<CitizenNewsSubmittedEto>,
    ITransientDependency
{
    public Task HandleEventAsync(CitizenAlertSubmittedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            var orgUsers = await recipients.GetUsersInOrganizationAsync(eto.OrganizationId);
            var codeInfo = string.IsNullOrEmpty(eto.TrackingCode)
                ? string.Empty
                : $" (mã: {eto.TrackingCode})";
            await creator.CreateForRecipientsAsync(
                orgUsers,
                NotificationType.CitizenAlertSubmitted,
                "Phản ánh mới từ người dân",
                $"Có phản ánh mới từ người dân{codeInfo}. Vui lòng kiểm tra và xử lý.",
                NotificationEntityTypes.AtpAlert,
                eto.AlertId);
        });

    public Task HandleEventAsync(CitizenNewsSubmittedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            var orgUsers = await recipients.GetUsersInOrganizationAsync(eto.OrganizationId);
            var titleInfo = string.IsNullOrEmpty(eto.Title)
                ? string.Empty
                : $": {(eto.Title.Length > 100 ? eto.Title[..100] + "..." : eto.Title)}";
            await creator.CreateForRecipientsAsync(
                orgUsers,
                NotificationType.CitizenNewsSubmitted,
                "Tin tức mới từ người dân",
                $"Có tin tức mới từ người dân{titleInfo}. Vui lòng kiểm tra và duyệt đăng.",
                NotificationEntityTypes.AtpNews,
                eto.NewsId);
        });

    private async Task SafeExecuteAsync<T>(T eto, Func<Task> action)
    {
        using var uow = unitOfWorkManager.Begin(requiresNew: true, isTransactional: true);
        try
        {
            await action();
            await uow.CompleteAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to create notifications for {EventType}", typeof(T).Name);
        }
    }
}
