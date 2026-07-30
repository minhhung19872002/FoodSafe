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

[Authorize(FoodSafePermissions.Inspection.Results.View)]
public class InspectionResultAppService : ApplicationService
{
    private readonly IRepository<InspectionResult, Guid> _results;
    private readonly IRepository<InspectionPlan, Guid> _plans;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public InspectionResultAppService(
        IRepository<InspectionResult, Guid> results,
        IRepository<InspectionPlan, Guid> plans,
        IRepository<Business, Guid> businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _results = results;
        _plans = plans;
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<InspectionResultDto>> GetListAsync(
        InspectionResultFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View, withDetails: true);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            var businessQuery = await _businesses.GetQueryableAsync();
            var matchingBusinessIds = await AsyncExecuter.ToListAsync(
                businessQuery
                    .Where(b => b.Name.ToUpper().Contains(filter))
                    .Select(b => b.Id),
                _cancellationTokens.Token);
            query = query.Where(x =>
                (x.TeamLeader != null && x.TeamLeader.ToUpper().Contains(filter)) ||
                (x.AdminDecisionNumber != null && x.AdminDecisionNumber.ToUpper().Contains(filter)) ||
                matchingBusinessIds.Contains(x.BusinessId));
        }
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId.Value);
        if (input.PlanId.HasValue)
            query = query.Where(x => x.PlanId == input.PlanId.Value);
        if (input.InspectionType.HasValue)
            query = query.Where(x => x.InspectionType == input.InspectionType.Value);
        if (input.OverallResult.HasValue)
            query = query.Where(x => x.OverallResult == input.OverallResult.Value);
        if (input.HasViolation.HasValue)
            query = query.Where(x => x.HasViolation == input.HasViolation.Value);
        if (input.FromDate.HasValue)
            query = query.Where(x => x.InspectionDate >= input.FromDate.Value.Date);
        if (input.ToDate.HasValue)
            query = query.Where(x => x.InspectionDate <= input.ToDate.Value.Date);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = ApplySorting(query, input.Sorting);
        query = query.PageBy(input);

        var results = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);

        var dtos = await ToDtosAsync(results);

        return new PagedResultDto<InspectionResultDto>(totalCount, dtos);
    }

    public async Task<InspectionResultDto> GetAsync(Guid id)
    {
        var result = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([result]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Create)]
    public async Task<InspectionResultDto> CreateAsync(
        CreateUpdateInspectionResultDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound));

        await EnsureBusinessInScopeAsync(input.BusinessId, scope);
        EnsureInspectionDateNotInFuture(input.InspectionDate);

        var plan = await GetValidatedLinkedPlanAsync(input, scope);

        var result = InspectionResult.Create(
            GuidGenerator.Create(),
            input.BusinessId,
            orgId,
            input.PlanId,
            input.PlanItemId,
            input.InspectionDate,
            input.InspectionType,
            input.TeamLeader,
            input.TeamMembersText,
            input.OverallResult,
            input.HasViolation,
            input.ViolationDescription,
            input.FineAmount,
            input.AdminDecisionNumber,
            input.AdminDecisionDate,
            input.FollowUpRequired,
            input.FollowUpDate,
            input.Recommendations,
            input.Notes);

        foreach (var v in input.Violations)
        {
            result.AddViolation(
                GuidGenerator.Create(),
                v.ViolationCode,
                v.Description,
                v.RegulationReference,
                v.FineAmount,
                v.RemedyRequired,
                v.RemedyDeadline);
        }

        if (input.Inspectors.Count > 0)
        {
            result.SetInspectors(
                input.Inspectors.Select(i => (i.UserId, i.IsTeamLeader)));
        }

        await _results.InsertAsync(result, autoSave: true, cancellationToken: _cancellationTokens.Token);

        if (plan is not null)
        {
            if (plan.Status == InspectionPlanStatus.Approved)
                plan.MarkInProgress();
            if (input.PlanItemId.HasValue)
                plan.Items.First(i => i.Id == input.PlanItemId.Value).MarkCompleted();
            await _plans.UpdateAsync(plan, autoSave: true, cancellationToken: _cancellationTokens.Token);
        }

        return (await ToDtosAsync([result]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task<InspectionResultDto> UpdateAsync(
        Guid id,
        CreateUpdateInspectionResultDto input)
    {
        var result = await GetScopedAsync(id, DataScopeOperation.Edit);
        EnsureInspectionDateNotInFuture(input.InspectionDate);

        result.ClearViolations();
        result.Update(
            input.InspectionDate,
            input.InspectionType,
            input.TeamLeader,
            input.TeamMembersText,
            input.OverallResult,
            input.HasViolation,
            input.ViolationDescription,
            input.FineAmount,
            input.AdminDecisionNumber,
            input.AdminDecisionDate,
            input.FollowUpRequired,
            input.FollowUpDate,
            input.Recommendations,
            input.Notes);

        foreach (var v in input.Violations)
        {
            result.AddViolation(
                GuidGenerator.Create(),
                v.ViolationCode,
                v.Description,
                v.RegulationReference,
                v.FineAmount,
                v.RemedyRequired,
                v.RemedyDeadline);
        }

        if (input.Inspectors.Count > 0)
        {
            result.SetInspectors(
                input.Inspectors.Select(i => (i.UserId, i.IsTeamLeader)));
        }

        await _results.UpdateAsync(result, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([result]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var result = await GetScopedAsync(id, DataScopeOperation.Edit);
        result.EnsureMutable();
        await _results.DeleteAsync(result, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task<InspectionResultDto> FinalizeAsync(Guid id)
    {
        var result = await GetScopedAsync(id, DataScopeOperation.Edit);
        result.Finalize(CurrentUser.GetId(), Clock.Now);
        await _results.UpdateAsync(
            result, autoSave: true,
            cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([result]))[0];
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task MarkViolationRemediedAsync(
        Guid resultId,
        Guid violationId,
        MarkViolationRemediedDto input)
    {
        var result = await GetScopedAsync(resultId, DataScopeOperation.Edit);
        result.MarkViolationRemedied(violationId, Clock.Now, input.Notes);
        await _results.UpdateAsync(result, autoSave: true, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task SetFollowUpResultAsync(
        Guid id,
        SetFollowUpResultDto input)
    {
        var result = await GetScopedAsync(id, DataScopeOperation.Edit);
        result.SetFollowUpResult(input.Result);
        await _results.UpdateAsync(result, autoSave: true, cancellationToken: _cancellationTokens.Token);
    }

    private static IOrderedQueryable<InspectionResult> ApplySorting(
        IQueryable<InspectionResult> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("inspectiondate", true) => query.OrderByDescending(x => x.InspectionDate)
                .ThenByDescending(x => x.CreationTime).ThenBy(x => x.Id),
            ("inspectiondate", false) => query.OrderBy(x => x.InspectionDate)
                .ThenByDescending(x => x.CreationTime).ThenBy(x => x.Id),
            ("creationtime", true) => query.OrderByDescending(x => x.CreationTime).ThenBy(x => x.Id),
            ("creationtime", false) => query.OrderBy(x => x.CreationTime).ThenBy(x => x.Id),
            _ => query.OrderByDescending(x => x.CreationTime).ThenBy(x => x.Id)
        };
    }

    private async Task<IQueryable<InspectionResult>> ScopedQueryAsync(
        DataScopeOperation operation, bool withDetails = false)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = withDetails
            ? await _results.WithDetailsAsync(x => x.Violations, x => x.Inspectors)
            : await _results.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<InspectionResult> GetScopedAsync(
        Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation, withDetails: true);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.ResultNotFound);
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

    private void EnsureInspectionDateNotInFuture(DateTime inspectionDate)
    {
        if (inspectionDate.Date > Clock.Now.Date)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.FutureInspectionDate);
    }

    /// <summary>
    /// Validates the plan/plan-item link of a result being created: the plan must be
    /// in scope and approved, the item must belong to the plan, and the item's
    /// business must match the result's business. Returns the tracked plan (with
    /// items) so the caller can advance its workflow state, or null when unlinked.
    /// </summary>
    private async Task<InspectionPlan?> GetValidatedLinkedPlanAsync(
        CreateUpdateInspectionResultDto input, CurrentDataScope scope)
    {
        if (input.PlanId.HasValue != input.PlanItemId.HasValue)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Inspection.PlanItemWithoutPlan);
        if (!input.PlanId.HasValue)
            return null;

        var planQuery = await _plans.WithDetailsAsync(x => x.Items);
        if (!scope.HasGlobalAccess)
            planQuery = planQuery.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        var plan = await AsyncExecuter.FirstOrDefaultAsync(
                       planQuery.Where(x => x.Id == input.PlanId.Value),
                       _cancellationTokens.Token)
                   ?? throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.PlanNotFound);

        if (plan.Status is not (InspectionPlanStatus.Approved or InspectionPlanStatus.InProgress))
            throw new BusinessException(FoodSafeDomainErrorCodes.Inspection.PlanNotApproved);

        if (input.PlanItemId.HasValue)
        {
            var item = plan.Items.FirstOrDefault(i => i.Id == input.PlanItemId.Value)
                ?? throw new BusinessException(
                    FoodSafeDomainErrorCodes.Inspection.BusinessNotInPlan);
            if (item.BusinessId != input.BusinessId)
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.Inspection.ResultBusinessMismatch);
        }

        return plan;
    }

    private async Task<List<InspectionResultDto>> ToDtosAsync(
        IReadOnlyCollection<InspectionResult> results)
    {
        var businessIds = results.Select(x => x.BusinessId).Distinct().ToArray();
        var businessQuery = await _businesses.GetQueryableAsync();
        var businessRows = await AsyncExecuter.ToListAsync(
            businessQuery.Where(x => businessIds.Contains(x.Id)),
            _cancellationTokens.Token);
        var businesses = businessRows.ToDictionary(x => x.Id, x => x.Name);

        return results.Select(r => new InspectionResultDto
        {
            Id = r.Id,
            PlanId = r.PlanId,
            PlanItemId = r.PlanItemId,
            BusinessId = r.BusinessId,
            BusinessName = businesses.GetValueOrDefault(r.BusinessId),
            OrganizationId = r.OrganizationId,
            InspectionDate = r.InspectionDate,
            InspectionType = r.InspectionType,
            TeamLeader = r.TeamLeader,
            TeamMembersText = r.TeamMembersText,
            OverallResult = r.OverallResult,
            HasViolation = r.HasViolation,
            ViolationDescription = r.ViolationDescription,
            FineAmount = r.FineAmount,
            FineCurrency = r.FineCurrency,
            AdminDecisionNumber = r.AdminDecisionNumber,
            AdminDecisionDate = r.AdminDecisionDate,
            FollowUpRequired = r.FollowUpRequired,
            FollowUpDate = r.FollowUpDate,
            FollowUpResultValue = r.FollowUpResultValue,
            Recommendations = r.Recommendations,
            Notes = r.Notes,
            IsFinalized = r.IsFinalized,
            FinalizedAt = r.FinalizedAt,
            CreationTime = r.CreationTime,
            Violations = r.Violations.Select(v => new InspectionViolationDto
            {
                Id = v.Id,
                InspectionResultId = v.InspectionResultId,
                ViolationCode = v.ViolationCode,
                Description = v.Description,
                RegulationReference = v.RegulationReference,
                FineAmount = v.FineAmount,
                RemedyRequired = v.RemedyRequired,
                RemedyDeadline = v.RemedyDeadline,
                IsRemedied = v.IsRemedied,
                RemediedAt = v.RemediedAt,
                RemediedNotes = v.RemediedNotes
            }).ToList(),
            Inspectors = r.Inspectors.Select(i => new InspectionResultInspectorDto
            {
                UserId = i.UserId,
                IsTeamLeader = i.IsTeamLeader
            }).ToList()
        }).ToList();
    }
}
