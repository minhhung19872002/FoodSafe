using FoodSafe.AlertsAndTesting;
using FoodSafe.Organizations;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
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
    private readonly ICancellationTokenProvider _cancellationTokens;

    public CitizenAlertReportAppService(
        IRepository<AtpAlert, Guid> alerts,
        IRepository<Organization, Guid> organizations,
        ICancellationTokenProvider cancellationTokens)
    {
        _alerts = alerts;
        _organizations = organizations;
        _cancellationTokens = cancellationTokens;
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

        await _alerts.InsertAsync(
            alert, autoSave: true, cancellationToken: _cancellationTokens.Token);

        return new CitizenAlertReportResultDto
        {
            Id = alert.Id,
            TrackingCode = alert.TrackingCode,
            Message = alert.TrackingCode is not null
                ? $"Đã tiếp nhận phản ánh. Mã theo dõi của bạn: {alert.TrackingCode}. Lưu lại mã này để tra cứu trạng thái xử lý."
                : "Đã tiếp nhận phản ánh. Cơ quan chức năng sẽ xác minh thông tin.",
        };
    }
}
