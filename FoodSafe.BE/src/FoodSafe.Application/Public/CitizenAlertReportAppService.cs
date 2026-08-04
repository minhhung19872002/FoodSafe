using FoodSafe.AlertsAndTesting;
using FoodSafe.FileManagement;
using FoodSafe.Notifications;
using FoodSafe.Organizations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.EventBus.Local;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

/// <summary>
/// Anonymous citizen alert submission (STT 48 — Gửi cảnh báo ATVSTP).
/// The captcha token in the request body is validated by LoginCaptchaMiddleware
/// before this service runs; submissions land as Draft alerts with
/// Source = PublicReport for officer moderation (FR-29-06).
/// </summary>
[RemoteService(false)]
[AllowAnonymous]
public class CitizenAlertReportAppService : ApplicationService, ICitizenAlertReportAppService
{
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<DocumentOwner, Guid> _documentOwners;
    private readonly IDocumentAttachmentStore _attachments;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ILocalEventBus _localEventBus;

    public CitizenAlertReportAppService(
        IRepository<AtpAlert, Guid> alerts,
        IRepository<Organization, Guid> organizations,
        IRepository<DocumentOwner, Guid> documentOwners,
        IDocumentAttachmentStore attachments,
        ICancellationTokenProvider cancellationTokens,
        ILocalEventBus localEventBus)
    {
        _alerts = alerts;
        _organizations = organizations;
        _documentOwners = documentOwners;
        _attachments = attachments;
        _cancellationTokens = cancellationTokens;
        _localEventBus = localEventBus;
    }

    public async Task<CitizenAlertReportResultDto> CreateAsync(
        CreateCitizenAlertReportDto input)
    {
        var rootOrganizations = await _organizations.GetListAsync(
            o => o.ParentId == null && o.IsActive,
            cancellationToken: _cancellationTokens.Token);
        var rootOrganization = rootOrganizations
            .OrderBy(o => o.Level).ThenBy(o => o.Name).FirstOrDefault()
            ?? throw new UserFriendlyException(
                "Hệ thống chưa sẵn sàng tiếp nhận phản ánh. Vui lòng thử lại sau.");

        var alert = AtpAlert.Create(
            GuidGenerator.Create(),
            rootOrganization.Id,
            input.Title,
            input.Content,
            input.Category,
            AlertSeverity.Medium,
            AlertSource.PublicReport,
            affectedArea: input.AffectedArea,
            affectedProducts: input.AffectedProducts,
            reporterName: input.ReporterName,
            reporterPhone: input.ReporterPhone,
            reporterEmail: input.ReporterEmail);

        if (input.Evidence.Count > 0)
        {
            await _documentOwners.InsertAsync(
                DocumentOwner.Create(
                    alert.Id, rootOrganization.Id, "citizen-alert-report", Clock.Now),
                autoSave: false,
                cancellationToken: _cancellationTokens.Token);
        }

        await _alerts.InsertAsync(
            alert, autoSave: true, cancellationToken: _cancellationTokens.Token);

        // After the alert exists: the attachment rows point at it, and a file
        // that fails validation or malware scanning must not take the whole
        // report down with it — the citizen would have no way to retry.
        foreach (var evidence in input.Evidence.Take(
                     CreateCitizenAlertReportDto.MaximumEvidenceFiles))
        {
            await StoreEvidenceAsync(alert.Id, evidence);
        }

        await _localEventBus.PublishAsync(new CitizenAlertSubmittedEto
        {
            AlertId = alert.Id,
            TrackingCode = alert.TrackingCode ?? string.Empty,
            OrganizationId = rootOrganization.Id,
        });

        return new CitizenAlertReportResultDto
        {
            Id = alert.Id,
            TrackingCode = alert.TrackingCode,
            Message = alert.TrackingCode is not null
                ? $"Đã tiếp nhận phản ánh. Mã theo dõi của bạn: {alert.TrackingCode}. Lưu lại mã này để tra cứu trạng thái xử lý."
                : "Đã tiếp nhận phản ánh. Cơ quan chức năng sẽ xác minh thông tin.",
        };
    }

    private async Task StoreEvidenceAsync(
        Guid alertId, CitizenReportEvidenceDto evidence)
    {
        byte[] content;
        try
        {
            content = Convert.FromBase64String(evidence.ContentBase64);
        }
        catch (FormatException)
        {
            Logger.LogWarning(
                "Discarded citizen evidence for alert {AlertId}: content was not base64.",
                alertId);
            return;
        }

        try
        {
            await _attachments.UploadAsync(
                alertId,
                "citizen-alert-reports",
                content,
                evidence.FileName,
                evidence.ContentType,
                description: "Ảnh chứng minh do người dân gửi kèm");
        }
        catch (Exception ex) when (
            ex is UserFriendlyException or BusinessException)
        {
            // A rejected file (wrong type, oversized, infected) must not void
            // the report itself — the text is still worth acting on.
            Logger.LogWarning(
                ex,
                "Discarded citizen evidence {FileName} for alert {AlertId}.",
                evidence.FileName,
                alertId);
        }
    }
}
