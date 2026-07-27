using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.FoodPoisoning;

[Authorize(FoodSafePermissions.FoodPoisoning.Incidents.View)]
public class FoodPoisoningIncidentAppService : ApplicationService
{
    private readonly IRepository<FoodPoisoningIncident, Guid> _incidents;
    private readonly IRepository<FoodPoisoningCase, Guid> _cases;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public FoodPoisoningIncidentAppService(
        IRepository<FoodPoisoningIncident, Guid> incidents,
        IRepository<FoodPoisoningCase, Guid> cases,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _incidents = incidents;
        _cases = cases;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<FoodPoisoningIncidentDto>> GetListAsync(
        FoodPoisoningIncidentFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.IncidentCode.Contains(filter) ||
                (x.LocationDescription != null && x.LocationDescription.Contains(filter)));
        }
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.OccurrenceDateFrom.HasValue)
            query = query.Where(x => x.OccurrenceDate >= input.OccurrenceDateFrom.Value);
        if (input.OccurrenceDateTo.HasValue)
            query = query.Where(x => x.OccurrenceDate <= input.OccurrenceDateTo.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.CreationTime);
        query = query.PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        var dtos = await ToDtosAsync(items);
        return new PagedResultDto<FoodPoisoningIncidentDto>(totalCount, dtos);
    }

    public async Task<FoodPoisoningIncidentDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Create)]
    public async Task<FoodPoisoningIncidentDto> CreateAsync(
        CreateUpdateFoodPoisoningIncidentDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var code = await GenerateIncidentCodeAsync(orgId);

        var entity = FoodPoisoningIncident.Create(
            GuidGenerator.Create(), orgId, code,
            input.OccurrenceDate, input.EndDate, input.Notes);

        ApplyDetails(entity, input);

        await _incidents.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    public async Task<FoodPoisoningIncidentDto> UpdateAsync(
        Guid id, CreateUpdateFoodPoisoningIncidentDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(input.OccurrenceDate, input.EndDate, input.Notes);
        ApplyDetails(entity, input);

        await _incidents.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != PoisoningIncidentStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CannotModifyNonDraft);
        await _incidents.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    public async Task<FoodPoisoningIncidentDto> SubmitAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Submit(CurrentUser.GetId(), Clock.Now);
        await _incidents.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Verify)]
    public async Task<FoodPoisoningIncidentDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _incidents.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Conclude)]
    public async Task<FoodPoisoningIncidentDto> ConcludeAsync(Guid id, ConcludeIncidentDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Conclude(CurrentUser.GetId(), Clock.Now, input.Conclusion);
        await _incidents.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return (await ToDtosAsync([entity]))[0];
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.View)]
    public async Task<List<PoisoningErrorReportDto>> GetErrorReportsAsync(Guid id)
    {
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.View);
        return entity.ErrorReports.Select(ToErrorReportDto).ToList();
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Incidents.Edit)]
    public async Task<PoisoningErrorReportDto> AddErrorReportAsync(
        Guid id, CreatePoisoningErrorReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit, _cancellationTokens.Token);
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.Edit);
        var report = entity.AddErrorReport(
            GuidGenerator.Create(), scope.OrganizationIds.First(),
            input.ErrorDescription, input.CorrectionRequest, CurrentUser.Id);
        await _incidents.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    private async Task<IQueryable<FoodPoisoningIncident>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _incidents.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<FoodPoisoningIncident> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.IncidentNotFound);
    }

    private async Task<FoodPoisoningIncident> GetScopedWithDetailsAsync(
        Guid id, DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _incidents.WithDetailsAsync(x => x.ErrorReports);
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.IncidentNotFound);
    }

    private async Task<string> GenerateIncidentCodeAsync(Guid orgId)
    {
        var year = Clock.Now.Year;
        var prefix = $"VND-{year}";
        var query = await _incidents.GetQueryableAsync();
        var count = await AsyncExecuter.CountAsync(
            query.Where(x => x.OrganizationId == orgId && x.IncidentCode.StartsWith(prefix)),
            _cancellationTokens.Token);
        return $"{prefix}-{(count + 1):D4}";
    }

    private async Task<List<FoodPoisoningIncidentDto>> ToDtosAsync(
        IReadOnlyCollection<FoodPoisoningIncident> incidents)
    {
        var incidentIds = incidents.Select(x => x.Id).ToArray();
        var caseQuery = await _cases.GetQueryableAsync();
        var caseCounts = await AsyncExecuter.ToListAsync(
            caseQuery.Where(c => c.IncidentId != null && incidentIds.Contains(c.IncidentId.Value))
                .GroupBy(c => c.IncidentId!.Value)
                .Select(g => new { IncidentId = g.Key, Count = g.Count() }),
            _cancellationTokens.Token);
        var countMap = caseCounts.ToDictionary(x => x.IncidentId, x => x.Count);

        return incidents.Select(e =>
        {
            var dto = ToDto(e);
            dto.CaseCount = countMap.GetValueOrDefault(e.Id);
            return dto;
        }).ToList();
    }

    private static void ApplyDetails(
        FoodPoisoningIncident entity, CreateUpdateFoodPoisoningIncidentDto input)
    {
        entity.SetLocation(
            input.LocationDescription, input.LocationCommuneId,
            input.LocationDistrictId, input.LocationProvinceId,
            input.LocationLatitude, input.LocationLongitude);

        entity.SetStatistics(
            input.ExposedCount, input.AffectedCount,
            input.HospitalizedCount, input.DeathCount);

        entity.SetFoodInfo(
            input.SuspectedFood, input.FoodSource, input.FoodServiceType);

        entity.SetCauseInfo(
            input.CauseAssessmentValue, input.CausativeAgent, input.Pathogen);

        entity.SetInvestigationInfo(
            input.InvestigationTeam, input.ControlMeasures, input.PreventionMeasures);
    }

    private static FoodPoisoningIncidentDto ToDto(FoodPoisoningIncident e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        IncidentCode = e.IncidentCode,
        OccurrenceDate = e.OccurrenceDate,
        EndDate = e.EndDate,
        LocationDescription = e.LocationDescription,
        LocationCommuneId = e.LocationCommuneId,
        LocationDistrictId = e.LocationDistrictId,
        LocationProvinceId = e.LocationProvinceId,
        LocationLatitude = e.LocationLatitude,
        LocationLongitude = e.LocationLongitude,
        ExposedCount = e.ExposedCount,
        AffectedCount = e.AffectedCount,
        HospitalizedCount = e.HospitalizedCount,
        DeathCount = e.DeathCount,
        SuspectedFood = e.SuspectedFood,
        FoodSource = e.FoodSource,
        FoodServiceType = e.FoodServiceType,
        CauseAssessmentValue = e.CauseAssessmentValue,
        CausativeAgent = e.CausativeAgent,
        Pathogen = e.Pathogen,
        InvestigationTeam = e.InvestigationTeam,
        ControlMeasures = e.ControlMeasures,
        PreventionMeasures = e.PreventionMeasures,
        Conclusion = e.Conclusion,
        Status = e.Status,
        ReportedById = e.ReportedById,
        ReportedAt = e.ReportedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        ConcludedById = e.ConcludedById,
        ConcludedAt = e.ConcludedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime
    };

    private static PoisoningErrorReportDto ToErrorReportDto(PoisoningIncidentErrorReport e) => new()
    {
        Id = e.Id,
        FromOrganizationId = e.FromOrganizationId,
        ErrorDescription = e.ErrorDescription,
        CorrectionRequest = e.CorrectionRequest,
        Status = e.Status,
        Response = e.Response,
        RespondedAt = e.RespondedAt,
        RespondedById = e.RespondedById,
        CreationTime = e.CreationTime
    };
}
