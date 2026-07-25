using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.Organizations;

public sealed class OrganizationAppService :
    ApplicationService,
    IOrganizationAppService
{
    private readonly IRepository<Organization, Guid> _repository;
    private readonly OrganizationManager _manager;
    private readonly ICancellationTokenProvider _cancellationTokenProvider;

    public OrganizationAppService(
        IRepository<Organization, Guid> repository,
        OrganizationManager manager,
        ICancellationTokenProvider cancellationTokenProvider)
    {
        _repository = repository;
        _manager = manager;
        _cancellationTokenProvider = cancellationTokenProvider;
    }

    [Authorize(FoodSafePermissions.Organizations.View)]
    public async Task<PagedResultDto<OrganizationDto>> GetListAsync(
        GetOrganizationListInput input)
    {
        var query = await _repository.GetQueryableAsync();
        query = ApplyFilter(query, input);

        var totalCount = await AsyncExecuter.CountAsync(query);
        var organizations = await AsyncExecuter.ToListAsync(
            ApplySorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount));

        return new PagedResultDto<OrganizationDto>(
            totalCount,
            ObjectMapper.Map<List<Organization>, List<OrganizationDto>>(organizations));
    }

    [Authorize(FoodSafePermissions.Organizations.View)]
    public async Task<ListResultDto<OrganizationTreeNodeDto>> GetTreeAsync()
    {
        var organizations = await _repository.GetListAsync();
        var dtos = ObjectMapper.Map<List<Organization>, List<OrganizationDto>>(organizations);
        return new ListResultDto<OrganizationTreeNodeDto>(
            OrganizationTreeBuilder.Build(dtos));
    }

    [Authorize(FoodSafePermissions.Organizations.View)]
    public async Task<OrganizationDto> GetAsync(Guid id)
    {
        var organization = await _repository.GetAsync(id);
        return ObjectMapper.Map<Organization, OrganizationDto>(organization);
    }

    [Authorize(FoodSafePermissions.Organizations.Create)]
    public async Task<OrganizationDto> CreateAsync(CreateOrganizationDto input)
    {
        var organization = await _manager.CreateAsync(
            GuidGenerator.Create(),
            input.Code,
            input.Name,
            input.Level,
            input.ParentId,
            input.ProvinceId,
            input.DistrictId,
            input.CommuneId,
            input.Address,
            input.Phone,
            input.Email,
            input.LeaderName,
            _cancellationTokenProvider.Token);

        await _repository.InsertAsync(
            organization,
            autoSave: true,
            cancellationToken: _cancellationTokenProvider.Token);

        return ObjectMapper.Map<Organization, OrganizationDto>(organization);
    }

    [Authorize(FoodSafePermissions.Organizations.Edit)]
    public async Task<OrganizationDto> UpdateAsync(
        Guid id,
        UpdateOrganizationDto input)
    {
        var organization = await _repository.GetAsync(
            id,
            cancellationToken: _cancellationTokenProvider.Token);

        await _manager.ChangeAsync(
            organization,
            input.Code,
            input.Name,
            input.Level,
            input.ParentId,
            input.ProvinceId,
            input.DistrictId,
            input.CommuneId,
            input.Address,
            input.Phone,
            input.Email,
            input.LeaderName,
            input.IsActive,
            _cancellationTokenProvider.Token);

        await _repository.UpdateAsync(
            organization,
            autoSave: true,
            cancellationToken: _cancellationTokenProvider.Token);

        return ObjectMapper.Map<Organization, OrganizationDto>(organization);
    }

    [Authorize(FoodSafePermissions.Organizations.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        await _manager.EnsureCanDeleteAsync(id, _cancellationTokenProvider.Token);
        await _repository.DeleteAsync(
            id,
            autoSave: true,
            cancellationToken: _cancellationTokenProvider.Token);
    }

    private static IQueryable<Organization> ApplyFilter(
        IQueryable<Organization> query,
        GetOrganizationListInput input)
    {
        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var filter = input.Filter.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.Code.Contains(filter) ||
                x.Name.ToUpper().Contains(filter));
        }

        if (input.Level.HasValue)
        {
            query = query.Where(x => x.Level == input.Level);
        }

        if (input.ParentId.HasValue)
        {
            query = query.Where(x => x.ParentId == input.ParentId);
        }

        if (input.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == input.IsActive);
        }

        return query;
    }

    private static IOrderedQueryable<Organization> ApplySorting(
        IQueryable<Organization> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("name", true) => query.OrderByDescending(x => x.Name),
            ("name", false) => query.OrderBy(x => x.Name),
            ("level", true) => query.OrderByDescending(x => x.Level).ThenBy(x => x.Code),
            ("level", false) => query.OrderBy(x => x.Level).ThenBy(x => x.Code),
            (_, true) => query.OrderByDescending(x => x.Code),
            _ => query.OrderBy(x => x.Code)
        };
    }
}
