using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.Inspection;

[Authorize(FoodSafePermissions.Inspection.Plans.View)]
public class InspectionPlanAppService : ApplicationService
{
    private readonly IRepository<InspectionPlan, Guid> _plans;
    private readonly IRepository<InspectionResult, Guid> _results;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public InspectionPlanAppService(
        IRepository<InspectionPlan, Guid> plans,
        IRepository<InspectionResult, Guid> results,
        IRepository<Business, Guid> businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _plans = plans;
        _results = results;
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<InspectionPlanDto>> GetListAsync(
        InspectionPlanFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View, withDetails: true);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.PlanCode.Contains(filter) || x.Title.Contains(filter));
        }
        if (input.PlanType.HasValue)
            query = query.Where(x => x.PlanType == input.PlanType.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.Year.HasValue)
            query = query.Where(x => x.Year == input.Year.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.Year)
            .ThenByDescending(x => x.CreationTime);
        query = query.PageBy(input);

        var plans = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);

        var dtos = await ToDtosAsync(plans);

        return new PagedResultDto<InspectionPlanDto>(totalCount, dtos);
    }

    public async Task<InspectionPlanDto> GetAsync(Guid id)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Create)]
    public async Task<InspectionPlanDto> CreateAsync(
        CreateUpdateInspectionPlanDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        await EnsureUniquePlanCodeAsync(input.PlanCode, orgId, null);

        var plan = InspectionPlan.Create(
            GuidGenerator.Create(),
            orgId,
            input.PlanCode,
            input.Title,
            input.PlanType,
            input.Year,
            input.StartDate,
            input.EndDate,
            input.Description,
            input.Objectives);

        foreach (var item in input.Items)
        {
            await EnsureBusinessInScopeAsync(item.BusinessId, scope);
            plan.AddBusiness(
                GuidGenerator.Create(),
                item.BusinessId,
                item.SequenceNumber,
                item.PlannedDate,
                item.AssignedInspectorId,
                item.Notes);
        }

        await _plans.InsertAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<InspectionPlanDto> UpdateAsync(
        Guid id,
        CreateUpdateInspectionPlanDto input)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit, _cancellationTokens.Token);

        await EnsureUniquePlanCodeAsync(input.PlanCode, plan.OrganizationId, id);

        plan.Update(
            input.PlanCode,
            input.Title,
            input.PlanType,
            input.Year,
            input.StartDate,
            input.EndDate,
            input.Description,
            input.Objectives);

        var existingBusinessIds = plan.Items.Select(i => i.BusinessId).ToHashSet();
        var inputBusinessIds = input.Items.Select(i => i.BusinessId).ToHashSet();

        foreach (var businessId in existingBusinessIds.Except(inputBusinessIds))
            plan.RemoveBusiness(businessId);

        foreach (var item in input.Items.Where(i => !existingBusinessIds.Contains(i.BusinessId)))
        {
            await EnsureBusinessInScopeAsync(item.BusinessId, scope);
            plan.AddBusiness(
                GuidGenerator.Create(),
                item.BusinessId,
                item.SequenceNumber,
                item.PlannedDate,
                item.AssignedInspectorId,
                item.Notes);
        }

        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (plan.Status != InspectionPlanStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.CannotModifyNonDraft);
        await _plans.DeleteAsync(plan, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<InspectionPlanDto> SubmitAsync(Guid id)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.Submit(CurrentUser.GetId(), Clock.Now);
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Approve)]
    public async Task<InspectionPlanDto> ApproveAsync(Guid id)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.Approve(CurrentUser.GetId(), Clock.Now);
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Approve)]
    public async Task<InspectionPlanDto> RejectAsync(Guid id, RejectPlanDto input)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.Reject(CurrentUser.GetId(), Clock.Now, input.Reason);
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<InspectionPlanDto> CompleteAsync(Guid id)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.Complete();
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<InspectionPlanDto> CancelAsync(Guid id, CancelPlanDto input)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.Cancel(CurrentUser.GetId(), Clock.Now, input.Reason);
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<InspectionPlanDto> UpdateItemStatusAsync(
        Guid id, Guid itemId, UpdateInspectionPlanItemStatusDto input)
    {
        var plan = await GetScopedAsync(id, DataScopeOperation.Edit);
        plan.UpdateItemStatus(itemId, input.Status);
        await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([plan]))[0];
    }

    public async Task<List<BusinessOption>> GetBusinessOptionsAsync(string? filter)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View, _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();

        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!filter.IsNullOrWhiteSpace())
        {
            var f = filter!.Trim();
            query = query.Where(x => x.Name.Contains(f) ||
                (x.TaxCode != null && x.TaxCode.Contains(f)));
        }

        return await AsyncExecuter.ToListAsync(
            query.OrderBy(x => x.Name)
                .Take(50)
                .Select(x => new BusinessOption
                {
                    Id = x.Id,
                    Name = x.Name,
                    Code = x.TaxCode
                }),
            _cancellationTokens.Token);
    }

    private async Task<IQueryable<InspectionPlan>> ScopedQueryAsync(
        DataScopeOperation operation, bool withDetails = false)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = withDetails
            ? await _plans.WithDetailsAsync(x => x.Items)
            : await _plans.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<InspectionPlan> GetScopedAsync(
        Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation, withDetails: true);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.PlanNotFound);
    }

    private async Task EnsureBusinessInScopeAsync(
        Guid businessId, CurrentDataScope scope)
    {
        var query = await _businesses.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!await AsyncExecuter.AnyAsync(
                query.Where(x => x.Id == businessId),
                _cancellationTokens.Token))
            throw new AbpAuthorizationException("Business is outside the current user's data scope.");
    }

    private async Task EnsureUniquePlanCodeAsync(
        string planCode, Guid organizationId, Guid? excludeId)
    {
        var normalized = planCode.Trim().ToUpperInvariant();
        using (_plans.DisableTracking())
        using (DataFilter.Disable<ISoftDelete>())
        {
            var query = await _plans.GetQueryableAsync();
            if (await AsyncExecuter.AnyAsync(
                    query.Where(x =>
                        x.PlanCode == normalized &&
                        x.OrganizationId == organizationId &&
                        (!excludeId.HasValue || x.Id != excludeId.Value)),
                    _cancellationTokens.Token))
                throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.DuplicatePlanCode);
        }
    }

    private async Task<List<InspectionPlanDto>> ToDtosAsync(
        IReadOnlyCollection<InspectionPlan> plans)
    {
        var businessIds = plans.SelectMany(p => p.Items.Select(i => i.BusinessId))
            .Distinct().ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);

        return plans.Select(plan =>
        {
            var dto = new InspectionPlanDto
            {
                Id = plan.Id,
                OrganizationId = plan.OrganizationId,
                PlanCode = plan.PlanCode,
                Title = plan.Title,
                PlanType = plan.PlanType,
                Year = plan.Year,
                StartDate = plan.StartDate,
                EndDate = plan.EndDate,
                Description = plan.Description,
                Objectives = plan.Objectives,
                Status = plan.Status,
                SubmittedById = plan.SubmittedById,
                SubmittedAt = plan.SubmittedAt,
                ApprovedById = plan.ApprovedById,
                ApprovedAt = plan.ApprovedAt,
                RejectedReason = plan.RejectedReason,
                CancelledReason = plan.CancelledReason,
                CreationTime = plan.CreationTime,
                TotalItems = plan.Items.Count,
                CompletedItems = plan.Items.Count(i =>
                    i.Status == InspectionPlanItemStatus.Completed),
                Items = plan.Items.Select(i => new InspectionPlanItemDto
                {
                    Id = i.Id,
                    PlanId = i.PlanId,
                    BusinessId = i.BusinessId,
                    BusinessName = businesses.GetValueOrDefault(i.BusinessId),
                    SequenceNumber = i.SequenceNumber,
                    PlannedDate = i.PlannedDate,
                    AssignedInspectorId = i.AssignedInspectorId,
                    Status = i.Status,
                    Notes = i.Notes
                }).OrderBy(i => i.SequenceNumber).ToList()
            };
            return dto;
        }).ToList();
    }
}

public class BusinessOption
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
}
