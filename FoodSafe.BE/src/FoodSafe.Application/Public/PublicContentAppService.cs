using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.PublicPortal;

[RemoteService(false)]
[AllowAnonymous]
public class PublicContentAppService : ApplicationService, IPublicContentAppService
{
    private readonly IRepository<AtpNews, Guid> _news;
    private readonly IRepository<AtpAlert, Guid> _alerts;
    private readonly IRepository<AdministrativeDocument, Guid> _documents;
    private readonly IRepository<DocumentType, Guid> _documentTypes;
    private readonly IRepository<RiskAnalysis, Guid> _riskAnalyses;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicContentAppService(
        IRepository<AtpNews, Guid> news,
        IRepository<AtpAlert, Guid> alerts,
        IRepository<AdministrativeDocument, Guid> documents,
        IRepository<DocumentType, Guid> documentTypes,
        IRepository<RiskAnalysis, Guid> riskAnalyses,
        IRepository<Business, Guid> businesses,
        ICancellationTokenProvider cancellationTokens)
    {
        _news = news;
        _alerts = alerts;
        _documents = documents;
        _documentTypes = documentTypes;
        _riskAnalyses = riskAnalyses;
        _businesses = businesses;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<PublicNewsListItemDto>> GetNewsAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _news.GetQueryableAsync())
            .Where(n => n.Status == NewsStatus.Published && n.IsPublic);
        var keyword = input.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(n =>
                n.Title.Contains(keyword)
                || (n.Summary != null && n.Summary.Contains(keyword)));
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(n => n.IsFeatured)
                .ThenByDescending(n => n.PublishedAt)
                .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        return new PagedResultDto<PublicNewsListItemDto>(
            totalCount, items.Select(ToNewsListItem).ToList());
    }

    public async Task<PublicNewsDetailDto> GetNewsDetailAsync(Guid id)
    {
        var query = (await _news.WithDetailsAsync(n => n.LinkedAlerts))
            .Where(n => n.Id == id && n.Status == NewsStatus.Published && n.IsPublic);
        var article = await AsyncExecuter.FirstOrDefaultAsync(query, _cancellationTokens.Token)
            ?? throw new UserFriendlyException("Không tìm thấy tin tức.");

        article.IncrementViewCount();
        await _news.UpdateAsync(article, autoSave: true, cancellationToken: _cancellationTokens.Token);

        var alertIds = article.LinkedAlerts.Select(la => la.AlertId).ToList();
        var linkedAlerts = alertIds.Count == 0
            ? []
            : (await _alerts.GetListAsync(
                    a => alertIds.Contains(a.Id) && a.Status == AlertStatus.Published && a.IsPublic,
                    cancellationToken: _cancellationTokens.Token))
                .Select(ToAlertDto).ToList();

        var dto = new PublicNewsDetailDto
        {
            Content = article.Content,
            LinkedAlerts = linkedAlerts,
        };
        FillNewsListItem(dto, article);
        return dto;
    }

    public async Task<PagedResultDto<PublicAlertDto>> GetAlertsAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _alerts.GetQueryableAsync())
            .Where(a => a.Status == AlertStatus.Published && a.IsPublic);
        var keyword = input.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(a =>
                a.Title.Contains(keyword)
                || (a.AffectedProducts != null && a.AffectedProducts.Contains(keyword))
                || (a.AffectedArea != null && a.AffectedArea.Contains(keyword)));
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(a => a.PublishedAt)
                .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        return new PagedResultDto<PublicAlertDto>(
            totalCount, items.Select(ToAlertDto).ToList());
    }

    public async Task<PagedResultDto<PublicWarnedBusinessDto>> GetWarnedBusinessesAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _alerts.GetQueryableAsync())
            .Where(a => a.Status == AlertStatus.Published && a.IsPublic && a.BusinessId != null);
        var keyword = input.Keyword?.Trim();

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var alerts = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(a => a.PublishedAt),
            _cancellationTokens.Token);

        var businessIds = alerts.Select(a => a.BusinessId!.Value).Distinct().ToList();
        var businessesById = (await _businesses.GetListAsync(
                b => businessIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(b => b.Id);

        var rows = alerts
            .Where(a => businessesById.ContainsKey(a.BusinessId!.Value))
            .Select(a =>
            {
                var business = businessesById[a.BusinessId!.Value];
                return new PublicWarnedBusinessDto
                {
                    BusinessName = business.Name,
                    BusinessCode = business.Code,
                    AddressText = business.AddressStreet,
                    AlertTitle = a.Title,
                    AlertNumber = a.AlertNumber,
                    Severity = a.Severity,
                    PublishedAt = a.PublishedAt,
                    Content = a.Content,
                };
            });

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            rows = rows.Where(r =>
                r.BusinessName.Contains(keyword, StringComparison.OrdinalIgnoreCase)
                || (r.BusinessCode?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false));
        }

        var list = rows.ToList();
        return new PagedResultDto<PublicWarnedBusinessDto>(
            string.IsNullOrWhiteSpace(keyword) ? totalCount : list.Count,
            list.Skip(input.SkipCount).Take(input.MaxResultCount).ToList());
    }

    public async Task<PagedResultDto<PublicDocumentDto>> GetDocumentsAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _documents.GetQueryableAsync())
            .Where(d => d.IsPublic && d.Status == DocumentStatus.Active);
        var keyword = input.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(d =>
                d.Title.Contains(keyword) || d.DocumentNumber.Contains(keyword));
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(d => d.IssuedDate)
                .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        var typeIds = items.Select(d => d.DocumentTypeId).Distinct().ToList();
        var typeNames = (await _documentTypes.GetListAsync(
                t => typeIds.Contains(t.Id), cancellationToken: _cancellationTokens.Token))
            .ToDictionary(t => t.Id, t => t.Name);

        return new PagedResultDto<PublicDocumentDto>(
            totalCount,
            items.Select(d => new PublicDocumentDto
            {
                DocumentNumber = d.DocumentNumber,
                Title = d.Title,
                DocumentTypeName = typeNames.GetValueOrDefault(d.DocumentTypeId),
                IssuingAuthority = d.IssuingAuthority,
                IssuedDate = d.IssuedDate,
                EffectiveDate = d.EffectiveDate,
                Summary = d.Summary,
            }).ToList());
    }

    public async Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _riskAnalyses.GetQueryableAsync())
            .Where(r => r.Status == RiskAnalysisStatus.Published && r.IsPublic);
        var keyword = input.Keyword?.Trim();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(r =>
                r.Title.Contains(keyword)
                || (r.RelatedProducts != null && r.RelatedProducts.Contains(keyword)));
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(r => r.PublishedAt)
                .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        return new PagedResultDto<PublicRiskAnalysisDto>(
            totalCount,
            items.Select(r => new PublicRiskAnalysisDto
            {
                Id = r.Id,
                Title = r.Title,
                Category = r.Category,
                RiskLevel = r.RiskLevel,
                RelatedProducts = r.RelatedProducts,
                Recommendations = r.Recommendations,
                PublishedAt = r.PublishedAt,
                Content = r.Content,
            }).ToList());
    }

    private static PublicNewsListItemDto ToNewsListItem(AtpNews article)
    {
        var dto = new PublicNewsListItemDto();
        FillNewsListItem(dto, article);
        return dto;
    }

    private static void FillNewsListItem(PublicNewsListItemDto dto, AtpNews article)
    {
        dto.Id = article.Id;
        dto.Title = article.Title;
        dto.Summary = article.Summary;
        dto.Category = article.Category;
        dto.IsFeatured = article.IsFeatured;
        dto.ViewCount = article.ViewCount;
        dto.PublishedAt = article.PublishedAt;
    }

    private static PublicAlertDto ToAlertDto(AtpAlert alert) => new()
    {
        Id = alert.Id,
        Title = alert.Title,
        AlertNumber = alert.AlertNumber,
        Category = alert.Category,
        Severity = alert.Severity,
        AffectedArea = alert.AffectedArea,
        AffectedProducts = alert.AffectedProducts,
        PublishedAt = alert.PublishedAt,
        Content = alert.Content,
    };
}
