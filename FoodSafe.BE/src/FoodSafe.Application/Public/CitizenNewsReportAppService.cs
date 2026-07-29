using FoodSafe.AlertsAndTesting;
using FoodSafe.Notifications;
using FoodSafe.Organizations;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.EventBus.Local;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

/// <summary>
/// Anonymous citizen news/tip submission (FR-30-07). Submissions land as
/// Draft news with Source = PublicReport for officer moderation before
/// publication.
/// </summary>
[RemoteService(false)]
[AllowAnonymous]
public class CitizenNewsReportAppService :
    ApplicationService,
    ICitizenNewsReportAppService
{
    private readonly IRepository<AtpNews, Guid> _news;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ILocalEventBus _localEventBus;

    public CitizenNewsReportAppService(
        IRepository<AtpNews, Guid> news,
        IRepository<Organization, Guid> organizations,
        ICancellationTokenProvider cancellationTokens,
        ILocalEventBus localEventBus)
    {
        _news = news;
        _organizations = organizations;
        _cancellationTokens = cancellationTokens;
        _localEventBus = localEventBus;
    }

    public async Task<CitizenAlertReportResultDto> CreateAsync(
        CreateCitizenNewsReportDto input)
    {
        var rootOrganizations = await _organizations.GetListAsync(
            o => o.ParentId == null && o.IsActive,
            cancellationToken: _cancellationTokens.Token);
        var rootOrganization = rootOrganizations
            .OrderBy(o => o.Level).ThenBy(o => o.Name).FirstOrDefault()
            ?? throw new UserFriendlyException(
                "Hệ thống chưa sẵn sàng tiếp nhận tin. Vui lòng thử lại sau.");

        var news = AtpNews.CreateCitizenSubmission(
            GuidGenerator.Create(),
            rootOrganization.Id,
            input.Title,
            input.Content,
            input.ReporterName,
            input.ReporterContact);

        await _news.InsertAsync(
            news, autoSave: true, cancellationToken: _cancellationTokens.Token);

        await _localEventBus.PublishAsync(new CitizenNewsSubmittedEto
        {
            NewsId = news.Id,
            Title = news.Title,
            OrganizationId = rootOrganization.Id,
        });

        return new CitizenAlertReportResultDto
        {
            Id = news.Id,
            Message =
                "Đã tiếp nhận tin. Cơ quan chức năng sẽ xem xét trước khi đăng tải.",
        };
    }
}
