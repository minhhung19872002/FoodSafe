using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.Catalogs;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.AlertsAndTesting;

[Authorize(FoodSafePermissions.AlertsAndTesting.Documents.View)]
public class AdministrativeDocumentAppService : ApplicationService
{
    private readonly IRepository<AdministrativeDocument, Guid> _repo;
    private readonly IRepository<DocumentType, Guid> _documentTypes;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AdministrativeDocumentAppService(
        IRepository<AdministrativeDocument, Guid> repo,
        IRepository<DocumentType, Guid> documentTypes,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _repo = repo;
        _documentTypes = documentTypes;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<AdministrativeDocumentDto>> GetListAsync(
        AdministrativeDocumentFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Title.Contains(filter) ||
                x.DocumentNumber.Contains(filter));
        }
        if (input.DocumentTypeId.HasValue)
            query = query.Where(x => x.DocumentTypeId == input.DocumentTypeId.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        query = ApplySorting(query, input.Sorting).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = await EnrichDtosAsync(items);

        return new PagedResultDto<AdministrativeDocumentDto>(totalCount, dtos);
    }

    public async Task<AdministrativeDocumentDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.Create)]
    public async Task<AdministrativeDocumentDto> CreateAsync(CreateUpdateAdministrativeDocumentDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var entity = AdministrativeDocument.Create(
            GuidGenerator.Create(),
            orgId,
            input.DocumentTypeId,
            input.DocumentNumber,
            input.Title,
            input.IssuedDate,
            input.IssuingAuthority,
            input.EffectiveDate,
            input.ExpiryDate,
            input.Summary);

        entity.SetStatus(input.Status);
        entity.SetPublic(input.IsPublic);

        await _repo.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.Edit)]
    public async Task<AdministrativeDocumentDto> UpdateAsync(
        Guid id, CreateUpdateAdministrativeDocumentDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(
            input.DocumentTypeId,
            input.DocumentNumber,
            input.Title,
            input.IssuedDate,
            input.IssuingAuthority,
            input.EffectiveDate,
            input.ExpiryDate,
            input.Summary);

        entity.SetStatus(input.Status);
        entity.SetPublic(input.IsPublic);

        await _repo.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        await _repo.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    // Honours the client's Sorting request (e.g. "issuedDate desc", "creationTime")
    // against a whitelist so the list supports column sorting without exposing the
    // query to dynamic-LINQ injection. Falls back to CreationTime descending.
    private static IOrderedQueryable<AdministrativeDocument> ApplySorting(
        IQueryable<AdministrativeDocument> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("issueddate", true)    => query.OrderByDescending(x => x.IssuedDate),
            ("issueddate", false)   => query.OrderBy(x => x.IssuedDate),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime),
            _                       => query.OrderByDescending(x => x.CreationTime),
        };
    }

    private async Task<IQueryable<AdministrativeDocument>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _repo.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<AdministrativeDocument> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Document.NotFound);
    }

    private async Task<List<AdministrativeDocumentDto>> EnrichDtosAsync(
        IReadOnlyCollection<AdministrativeDocument> items)
    {
        var typeIds = items.Select(x => x.DocumentTypeId).Distinct().ToArray();
        Dictionary<Guid, string> typeNames = new();

        if (typeIds.Length > 0)
        {
            var tq = await _documentTypes.GetQueryableAsync();
            var rows = await AsyncExecuter.ToListAsync(
                tq.Where(x => typeIds.Contains(x.Id)), _cancellationTokens.Token);
            typeNames = rows.ToDictionary(x => x.Id, x => x.Name);
        }

        return items.Select(e => new AdministrativeDocumentDto
        {
            Id = e.Id,
            OrganizationId = e.OrganizationId,
            DocumentTypeId = e.DocumentTypeId,
            DocumentTypeName = typeNames.GetValueOrDefault(e.DocumentTypeId),
            DocumentNumber = e.DocumentNumber,
            Title = e.Title,
            IssuingAuthority = e.IssuingAuthority,
            IssuedDate = e.IssuedDate,
            EffectiveDate = e.EffectiveDate,
            ExpiryDate = e.ExpiryDate,
            Summary = e.Summary,
            Status = e.Status,
            IsPublic = e.IsPublic,
            CreationTime = e.CreationTime,
        }).ToList();
    }
}
