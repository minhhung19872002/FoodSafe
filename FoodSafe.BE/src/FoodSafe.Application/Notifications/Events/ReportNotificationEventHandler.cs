using Microsoft.Extensions.Logging;
using Volo.Abp.DependencyInjection;
using Volo.Abp.EventBus;
using Volo.Abp.Uow;

namespace FoodSafe.Notifications;

public class ReportNotificationEventHandler(
    INotificationRecipientResolver recipients,
    NotificationCreator creator,
    IUnitOfWorkManager unitOfWorkManager,
    ILogger<ReportNotificationEventHandler> logger) :
    ILocalEventHandler<ReportSubmittedEto>,
    ILocalEventHandler<ReportVerifiedEto>,
    ILocalEventHandler<ReportReturnedEto>,
    ILocalEventHandler<ReportErrorNotificationSentEto>,
    ILocalEventHandler<ReportErrorNotificationRespondedEto>,
    ITransientDependency
{
    public Task HandleEventAsync(ReportSubmittedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            var superiors = await recipients.GetUsersInParentOrganizationAsync(eto.OrganizationId);
            await creator.CreateForRecipientsAsync(
                superiors,
                NotificationType.ReportSubmitted,
                "Báo cáo mới chờ xét duyệt",
                $"{eto.ReportDisplayName} vừa được gửi lên, đang chờ xét duyệt.",
                eto.ReportEntityType,
                eto.ReportId);
        });

    public Task HandleEventAsync(ReportVerifiedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            if (eto.SubmittedById is null) return;
            var submitter = await recipients.GetSingleUserAsync(eto.SubmittedById.Value);
            if (submitter is null) return;
            await creator.CreateForUserAsync(
                submitter,
                NotificationType.ReportVerified,
                "Báo cáo đã được xét duyệt",
                $"{eto.ReportDisplayName} đã được xét duyệt thành công.",
                eto.ReportEntityType,
                eto.ReportId);
        });

    public Task HandleEventAsync(ReportReturnedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            if (eto.SubmittedById is null) return;
            var submitter = await recipients.GetSingleUserAsync(eto.SubmittedById.Value);
            if (submitter is null) return;
            var reason = eto.ReturnReason?.Length > 500
                ? eto.ReturnReason[..500] + "..."
                : eto.ReturnReason;
            await creator.CreateForUserAsync(
                submitter,
                NotificationType.ReportReturned,
                "Báo cáo bị trả lại",
                $"{eto.ReportDisplayName} đã bị trả lại. Lý do: {reason}",
                eto.ReportEntityType,
                eto.ReportId);
        });

    public Task HandleEventAsync(ReportErrorNotificationSentEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            var orgUsers = await recipients.GetUsersInOrganizationAsync(eto.OrganizationId);
            await creator.CreateForRecipientsAsync(
                orgUsers,
                NotificationType.ReportErrorNotificationSent,
                "Thông báo lỗi báo cáo",
                $"{eto.ReportDisplayName} đã nhận được thông báo lỗi từ đơn vị cấp trên. Vui lòng kiểm tra và phản hồi.",
                eto.ReportEntityType,
                eto.ReportId);
        });

    public Task HandleEventAsync(ReportErrorNotificationRespondedEto eto) =>
        SafeExecuteAsync(eto, async () =>
        {
            var superiorUsers = await recipients.GetUsersInOrganizationAsync(eto.SentByOrganizationId);
            await creator.CreateForRecipientsAsync(
                superiorUsers,
                NotificationType.ReportErrorNotificationResponded,
                "Đơn vị đã phản hồi thông báo lỗi",
                $"{eto.ReportDisplayName} đã được đơn vị cấp dưới phản hồi thông báo lỗi.",
                eto.ReportEntityType,
                eto.ReportId);
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
