using FoodSafe.Application.Contracts.AlertsAndTesting;
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

[Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.View)]
public class RiskAnalysisAppService : ApplicationService
{
    private readonly IRepository<RiskAnalysis, Guid> _repo;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public RiskAnalysisAppService(
        IRepository<RiskAnalysis, Guid> repo,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _repo = repo;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<RiskAnalysisDto>> GetListAsync(RiskAnalysisFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x => x.Title.Contains(filter));
        }
        if (input.Category.HasValue)
            query = query.Where(x => x.Category == input.Category.Value);
        if (input.RiskLevel.HasValue)
            query = query.Where(x => x.RiskLevel == input.RiskLevel.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        query = query.OrderByDescending(x => x.CreationTime).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);

        return new PagedResultDto<RiskAnalysisDto>(totalCount, items.Select(ToDto).ToList());
    }

    public async Task<RiskAnalysisDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Create)]
    public async Task<RiskAnalysisDto> CreateAsync(CreateUpdateRiskAnalysisDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var entity = RiskAnalysis.Create(
            GuidGenerator.Create(),
            orgId,
            input.Title,
            input.Content,
            input.Category,
            input.RiskLevel,
            input.RelatedProducts,
            input.Evidence,
            input.Recommendations);

        await _repo.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Edit)]
    public async Task<RiskAnalysisDto> UpdateAsync(Guid id, CreateUpdateRiskAnalysisDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(
            input.Title,
            input.Content,
            input.Category,
            input.RiskLevel,
            input.RelatedProducts,
            input.Evidence,
            input.Recommendations);

        await _repo.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Delete);
        if (entity.Status != RiskAnalysisStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.RiskAnalysis.CannotModifyNonDraft);
        await _repo.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.RiskAnalyses.Publish)]
    public async Task<RiskAnalysisDto> PublishAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Publish(CurrentUser.GetId(), Clock.Now);
        await _repo.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    private async Task<IQueryable<RiskAnalysis>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _repo.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<RiskAnalysis> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.RiskAnalysis.NotFound);
    }

    private static RiskAnalysisDto ToDto(RiskAnalysis e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        Title = e.Title,
        Content = e.Content,
        Category = e.Category,
        RiskLevel = e.RiskLevel,
        RelatedProducts = e.RelatedProducts,
        Evidence = e.Evidence,
        Recommendations = e.Recommendations,
        Status = e.Status,
        IsPublic = e.IsPublic,
        PublishedById = e.PublishedById,
        PublishedAt = e.PublishedAt,
        CreationTime = e.CreationTime,
    };
}
