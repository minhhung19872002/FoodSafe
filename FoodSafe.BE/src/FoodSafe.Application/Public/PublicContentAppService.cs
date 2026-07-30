using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.Catalogs;
using FoodSafe.Inspection;
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
    private readonly IRepository<TestingResult, Guid> _testingResults;
    private readonly IRepository<TestingCenter, Guid> _testingCenters;
    private readonly IRepository<InspectionResult, Guid> _inspectionResults;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PublicContentAppService(
        IRepository<AtpNews, Guid> news,
        IRepository<AtpAlert, Guid> alerts,
        IRepository<AdministrativeDocument, Guid> documents,
        IRepository<DocumentType, Guid> documentTypes,
        IRepository<RiskAnalysis, Guid> riskAnalyses,
        IRepository<Business, Guid> businesses,
        IRepository<TestingResult, Guid> testingResults,
        IRepository<TestingCenter, Guid> testingCenters,
        IRepository<InspectionResult, Guid> inspectionResults,
        ICancellationTokenProvider cancellationTokens)
    {
        _news = news;
        _alerts = alerts;
        _documents = documents;
        _documentTypes = documentTypes;
        _riskAnalyses = riskAnalyses;
        _businesses = businesses;
        _testingResults = testingResults;
        _testingCenters = testingCenters;
        _inspectionResults = inspectionResults;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<PublicNewsListItemDto>> GetNewsAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _news.GetQueryableAsync())
            .Where(n => n.Status == NewsStatus.Published && n.IsPublic);
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(n =>
                n.Title.ToUpper().Contains(keyword)
                || (n.Summary != null && n.Summary.ToUpper().Contains(keyword)));
        }

        if (input.Categories is { Count: > 0 })
            query = query.Where(n => n.Category != null && input.Categories.Contains(n.Category));

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
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(a =>
                a.Title.ToUpper().Contains(keyword)
                || (a.AffectedProducts != null && a.AffectedProducts.ToUpper().Contains(keyword))
                || (a.AffectedArea != null && a.AffectedArea.ToUpper().Contains(keyword)));
        }

        if (input.Categories is { Count: > 0 })
        {
            var cats = input.Categories
                .Select(c => int.TryParse(c, out var n) ? (AlertCategory?)n : null)
                .Where(c => c.HasValue).Select(c => c!.Value).ToList();
            if (cats.Count > 0)
                query = query.Where(a => cats.Contains(a.Category));
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
        var keyword = input.Keyword?.Trim();
        var baseQuery = (await _alerts.GetQueryableAsync())
            .Where(a => a.Status == AlertStatus.Published && a.IsPublic && a.BusinessId != null)
            .OrderByDescending(a => a.PublishedAt);

        List<AtpAlert> pageAlerts;
        Dictionary<Guid, Business> businessesById;
        long totalCount;

        if (string.IsNullOrWhiteSpace(keyword))
        {
            // No keyword: paginate at DB level for efficiency and accurate totalCount
            totalCount = await AsyncExecuter.CountAsync(baseQuery, _cancellationTokens.Token);
            pageAlerts = await AsyncExecuter.ToListAsync(
                baseQuery.Skip(input.SkipCount).Take(input.MaxResultCount),
                _cancellationTokens.Token);

            var pageIds = pageAlerts.Select(a => a.BusinessId!.Value).Distinct().ToList();
            businessesById = pageIds.Count == 0
                ? []
                : (await _businesses.GetListAsync(
                        b => pageIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
                    .ToDictionary(b => b.Id);
        }
        else
        {
            // Keyword on business name/code requires in-memory filtering after joining
            var allAlerts = await AsyncExecuter.ToListAsync(baseQuery, _cancellationTokens.Token);
            var allIds = allAlerts.Select(a => a.BusinessId!.Value).Distinct().ToList();
            businessesById = allIds.Count == 0
                ? []
                : (await _businesses.GetListAsync(
                        b => allIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
                    .ToDictionary(b => b.Id);

            var filtered = allAlerts.Where(a =>
            {
                businessesById.TryGetValue(a.BusinessId!.Value, out var biz);
                return (biz?.Name?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false)
                    || (biz?.Code?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false);
            }).ToList();

            totalCount = filtered.Count;
            pageAlerts = filtered.Skip(input.SkipCount).Take(input.MaxResultCount).ToList();
        }

        var items = pageAlerts.Select(a =>
        {
            businessesById.TryGetValue(a.BusinessId!.Value, out var business);
            return new PublicWarnedBusinessDto
            {
                BusinessName = business?.Name ?? string.Empty,
                BusinessCode = business?.Code,
                AddressText = business?.AddressStreet,
                AlertTitle = a.Title,
                AlertNumber = a.AlertNumber,
                Severity = a.Severity,
                PublishedAt = a.PublishedAt,
                Content = a.Content,
            };
        }).ToList();

        return new PagedResultDto<PublicWarnedBusinessDto>(totalCount, items);
    }

    public async Task<List<CatalogOptionDto>> GetDocumentTypeOptionsAsync()
    {
        var items = await _documentTypes.GetListAsync(
            t => t.IsActive, cancellationToken: _cancellationTokens.Token);
        return items.OrderBy(t => t.SortOrder).ThenBy(t => t.Name)
            .Select(t => new CatalogOptionDto { Id = t.Id, Name = t.Name })
            .ToList();
    }

    public async Task<PagedResultDto<PublicDocumentDto>> GetDocumentsAsync(
        PublicDocumentSearchRequestDto input)
    {
        var query = (await _documents.GetQueryableAsync())
            .Where(d => d.IsPublic && d.Status == DocumentStatus.Active);
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(d =>
                d.Title.ToUpper().Contains(keyword) || d.DocumentNumber.ToUpper().Contains(keyword));
        }

        if (input.DocumentTypeId.HasValue)
        {
            query = query.Where(d => d.DocumentTypeId == input.DocumentTypeId.Value);
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
                Id = d.Id,
                DocumentNumber = d.DocumentNumber,
                Title = d.Title,
                DocumentTypeName = typeNames.GetValueOrDefault(d.DocumentTypeId),
                IssuingAuthority = d.IssuingAuthority,
                IssuedDate = d.IssuedDate,
                EffectiveDate = d.EffectiveDate,
                Summary = d.Summary,
            }).ToList());
    }

    public async Task<PublicDocumentDetailDto> GetDocumentDetailAsync(Guid id)
    {
        var doc = await _documents.GetAsync(id, cancellationToken: _cancellationTokens.Token);

        if (!doc.IsPublic || doc.Status != DocumentStatus.Active)
        {
            throw new Volo.Abp.UserFriendlyException("Văn bản không tồn tại hoặc không công khai.");
        }

        var typeName = (await _documentTypes.FindAsync(doc.DocumentTypeId,
            cancellationToken: _cancellationTokens.Token))?.Name;

        return new PublicDocumentDetailDto
        {
            Id = doc.Id,
            DocumentNumber = doc.DocumentNumber,
            Title = doc.Title,
            DocumentTypeName = typeName,
            IssuingAuthority = doc.IssuingAuthority,
            IssuedDate = doc.IssuedDate,
            EffectiveDate = doc.EffectiveDate,
            ExpiryDate = doc.ExpiryDate,
            Summary = doc.Summary,
        };
    }

    public async Task<PagedResultDto<PublicRiskAnalysisDto>> GetRiskAnalysesAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _riskAnalyses.GetQueryableAsync())
            .Where(r => r.Status == RiskAnalysisStatus.Published && r.IsPublic);
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(r =>
                r.Title.ToUpper().Contains(keyword)
                || (r.RelatedProducts != null && r.RelatedProducts.ToUpper().Contains(keyword)));
        }

        if (input.Categories is { Count: > 0 })
        {
            var cats = input.Categories
                .Select(c => int.TryParse(c, out var n) ? (AlertCategory?)n : null)
                .Where(c => c.HasValue).Select(c => c!.Value).ToList();
            if (cats.Count > 0)
                query = query.Where(r => cats.Contains(r.Category));
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

    public async Task<PagedResultDto<PublicTestingResultDto>> GetTestingResultsAsync(
        PublicTestingResultSearchRequestDto input)
    {
        var query = (await _testingResults.GetQueryableAsync())
            .Where(t => t.IsPublic && t.BusinessId != null);
        var keyword = input.Keyword?.Trim().ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            query = query.Where(t =>
                t.SampleCode.ToUpper().Contains(keyword)
                || t.SampleName.ToUpper().Contains(keyword));
        }

        if (input.Outcome.HasValue)
        {
            query = query.Where(t => t.Outcome == input.Outcome.Value);
        }

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var items = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(t => t.SampleDate)
                .ThenByDescending(t => t.CreationTime)
                .Skip(input.SkipCount).Take(input.MaxResultCount),
            _cancellationTokens.Token);

        var businessIds = items
            .Where(t => t.BusinessId.HasValue)
            .Select(t => t.BusinessId!.Value).Distinct().ToList();
        var businessNames = businessIds.Count == 0
            ? new Dictionary<Guid, string>()
            : (await _businesses.GetListAsync(
                    b => businessIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
                .ToDictionary(b => b.Id, b => b.Name);

        var centerIds = items.Select(t => t.TestingCenterId).Distinct().ToList();
        var centerNames = centerIds.Count == 0
            ? new Dictionary<Guid, string>()
            : (await _testingCenters.GetListAsync(
                    c => centerIds.Contains(c.Id), cancellationToken: _cancellationTokens.Token))
                .ToDictionary(c => c.Id, c => c.Name);

        return new PagedResultDto<PublicTestingResultDto>(
            totalCount,
            items.Select(t => new PublicTestingResultDto
            {
                Id = t.Id,
                SampleCode = t.SampleCode,
                SampleName = t.SampleName,
                BusinessName = t.BusinessId.HasValue
                    ? businessNames.GetValueOrDefault(t.BusinessId.Value)
                    : null,
                TestingCenterName = centerNames.GetValueOrDefault(t.TestingCenterId),
                SampleDate = t.SampleDate,
                ResultDate = t.ResultDate,
                Outcome = t.Outcome,
                HasFailedIndicators = !string.IsNullOrWhiteSpace(t.FailedCriteria),
            }).ToList());
    }

    public async Task<PagedResultDto<PublicInspectionResultDto>> GetInspectionResultsAsync(
        PublicSearchRequestDto input)
    {
        var query = (await _inspectionResults.GetQueryableAsync())
            .Where(r => r.IsFinalized);
        var keyword = input.Keyword?.Trim();

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        var allItems = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(r => r.InspectionDate),
            _cancellationTokens.Token);

        var businessIds = allItems.Select(r => r.BusinessId).Distinct().ToList();
        var businessesById = businessIds.Count == 0
            ? new Dictionary<Guid, Business>()
            : (await _businesses.GetListAsync(
                    b => businessIds.Contains(b.Id), cancellationToken: _cancellationTokens.Token))
                .ToDictionary(b => b.Id);

        var rows = allItems
            .Select(r =>
            {
                var business = businessesById.GetValueOrDefault(r.BusinessId);
                return new PublicInspectionResultDto
                {
                    Id = r.Id,
                    BusinessName = business?.Name ?? string.Empty,
                    BusinessAddress = business?.AddressStreet,
                    InspectionDate = r.InspectionDate,
                    InspectionType = r.InspectionType,
                    OverallResult = r.OverallResult,
                    HasViolation = r.HasViolation,
                };
            })
            .ToList();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            rows = rows.Where(r =>
                r.BusinessName.Contains(keyword, StringComparison.OrdinalIgnoreCase)
                || (r.BusinessAddress?.Contains(keyword, StringComparison.OrdinalIgnoreCase) ?? false))
                .ToList();
        }

        return new PagedResultDto<PublicInspectionResultDto>(
            string.IsNullOrWhiteSpace(keyword) ? totalCount : rows.Count,
            rows.Skip(input.SkipCount).Take(input.MaxResultCount).ToList());
    }

    /// <summary>
    /// Status lookup by tracking code for anonymous citizens.
    /// The query always runs to completion before returning null — no early-exit
    /// short-circuit — so response time is constant regardless of whether the
    /// code exists, which prevents timing-based enumeration of valid codes.
    /// No reporter PII is included in the response.
    /// </summary>
    public async Task<CitizenReportStatusDto?> GetCitizenReportStatusAsync(
        string trackingCode)
    {
        if (string.IsNullOrWhiteSpace(trackingCode))
            return null;

        var normalised = trackingCode.Trim().ToUpperInvariant();

        var alert = (await _alerts.GetListAsync(
                a => a.TrackingCode == normalised && a.Source == AlertSource.PublicReport,
                cancellationToken: _cancellationTokens.Token))
            .FirstOrDefault();

        if (alert is null)
            return null;

        return new CitizenReportStatusDto
        {
            TrackingCode = alert.TrackingCode!,
            SubmittedAt = alert.CreationTime,
            Status = MapTrackingStatus(alert),
            UpdatedAt = alert.LastModificationTime ?? alert.CreationTime,
        };
    }

    private static string MapTrackingStatus(AtpAlert alert) => alert.Status switch
    {
        AlertStatus.Draft when alert.AssigneeId is not null => "UnderReview",
        AlertStatus.Draft => "Submitted",
        AlertStatus.Published => "Resolved",
        AlertStatus.Recalled => "Resolved",
        AlertStatus.Rejected => "Rejected",
        _ => "Submitted",
    };

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
