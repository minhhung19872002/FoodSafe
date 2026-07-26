using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.BusinessManagement;
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

[Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.View)]
public class TestingResultAppService : ApplicationService
{
    private readonly IRepository<TestingResult, Guid> _repo;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly IRepository<Product, Guid> _products;
    private readonly IRepository<TestingCenter, Guid> _centers;
    private readonly IRepository<TestingService, Guid> _services;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public TestingResultAppService(
        IRepository<TestingResult, Guid> repo,
        IRepository<Business, Guid> businesses,
        IRepository<Product, Guid> products,
        IRepository<TestingCenter, Guid> centers,
        IRepository<TestingService, Guid> services,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _repo = repo;
        _businesses = businesses;
        _products = products;
        _centers = centers;
        _services = services;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<TestingResultDto>> GetListAsync(TestingResultFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.SampleCode.Contains(filter) ||
                x.SampleName.Contains(filter));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId.Value);
        if (input.TestingCenterId.HasValue)
            query = query.Where(x => x.TestingCenterId == input.TestingCenterId.Value);
        if (input.Outcome.HasValue)
            query = query.Where(x => x.Outcome == input.Outcome.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);
        query = query.OrderByDescending(x => x.SampleDate).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = await EnrichDtosAsync(items);

        return new PagedResultDto<TestingResultDto>(totalCount, dtos);
    }

    public async Task<TestingResultDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.Create)]
    public async Task<TestingResultDto> CreateAsync(CreateUpdateTestingResultDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var entity = TestingResult.Create(
            GuidGenerator.Create(),
            orgId,
            input.SampleCode,
            input.SampleName,
            input.TestingCenterId,
            input.SampleDate,
            input.Outcome,
            input.Description,
            input.TestingServiceId,
            input.BusinessId,
            input.ProductId,
            input.SubmissionDate,
            input.ResultDate,
            input.FailedCriteria,
            input.CertificateNumber,
            input.InspectionResultId);

        if (input.IsPublic) entity.SetPublic(true);

        await _repo.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.Edit)]
    public async Task<TestingResultDto> UpdateAsync(Guid id, CreateUpdateTestingResultDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(
            input.SampleCode,
            input.SampleName,
            input.TestingCenterId,
            input.SampleDate,
            input.Outcome,
            input.Description,
            input.TestingServiceId,
            input.BusinessId,
            input.ProductId,
            input.SubmissionDate,
            input.ResultDate,
            input.FailedCriteria,
            input.CertificateNumber,
            input.InspectionResultId);

        entity.SetPublic(input.IsPublic);

        await _repo.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await EnrichDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        await _repo.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    private async Task<IQueryable<TestingResult>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _repo.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<TestingResult> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id), _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.TestingResult.NotFound);
    }

    private async Task<List<TestingResultDto>> EnrichDtosAsync(IReadOnlyCollection<TestingResult> items)
    {
        var businessIds = items.Where(x => x.BusinessId.HasValue)
            .Select(x => x.BusinessId!.Value).Distinct().ToArray();
        var productIds = items.Where(x => x.ProductId.HasValue)
            .Select(x => x.ProductId!.Value).Distinct().ToArray();
        var centerIds = items.Select(x => x.TestingCenterId).Distinct().ToArray();
        var serviceIds = items.Where(x => x.TestingServiceId.HasValue)
            .Select(x => x.TestingServiceId!.Value).Distinct().ToArray();

        var businesses = await LookupNamesAsync(_businesses, businessIds);
        var products = await LookupNamesAsync(_products, productIds);
        var centers = await LookupNamesAsync(_centers, centerIds);
        var services = await LookupNamesAsync(_services, serviceIds);

        return items.Select(e => new TestingResultDto
        {
            Id = e.Id,
            OrganizationId = e.OrganizationId,
            SampleCode = e.SampleCode,
            SampleName = e.SampleName,
            Description = e.Description,
            TestingCenterId = e.TestingCenterId,
            TestingCenterName = centers.GetValueOrDefault(e.TestingCenterId),
            TestingServiceId = e.TestingServiceId,
            TestingServiceName = e.TestingServiceId.HasValue ? services.GetValueOrDefault(e.TestingServiceId.Value) : null,
            BusinessId = e.BusinessId,
            BusinessName = e.BusinessId.HasValue ? businesses.GetValueOrDefault(e.BusinessId.Value) : null,
            ProductId = e.ProductId,
            ProductName = e.ProductId.HasValue ? products.GetValueOrDefault(e.ProductId.Value) : null,
            SampleDate = e.SampleDate,
            SubmissionDate = e.SubmissionDate,
            ResultDate = e.ResultDate,
            Outcome = e.Outcome,
            FailedCriteria = e.FailedCriteria,
            CertificateNumber = e.CertificateNumber,
            InspectionResultId = e.InspectionResultId,
            IsPublic = e.IsPublic,
            CreationTime = e.CreationTime,
        }).ToList();
    }

    private async Task<Dictionary<Guid, string>> LookupNamesAsync<T>(
        IRepository<T, Guid> repo, Guid[] ids) where T : class, Volo.Abp.Domain.Entities.IEntity<Guid>
    {
        if (ids.Length == 0) return new();
        var q = await repo.GetQueryableAsync();
        var rows = await AsyncExecuter.ToListAsync(
            q.Where(x => ids.Contains(x.Id)), _cancellationTokens.Token);

        return rows.ToDictionary(
            x => x.Id,
            x => x switch
            {
                Business b => b.Name,
                Product p => p.Name,
                TestingCenter tc => tc.Name,
                TestingService ts => ts.Name,
                _ => x.Id.ToString()
            });
    }
}
