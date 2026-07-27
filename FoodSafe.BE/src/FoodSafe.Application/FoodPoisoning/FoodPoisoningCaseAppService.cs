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

[Authorize(FoodSafePermissions.FoodPoisoning.Cases.View)]
public class FoodPoisoningCaseAppService : ApplicationService
{
    private readonly IRepository<FoodPoisoningCase, Guid> _cases;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public FoodPoisoningCaseAppService(
        IRepository<FoodPoisoningCase, Guid> cases,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _cases = cases;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<FoodPoisoningCaseDto>> GetListAsync(FoodPoisoningCaseFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.CaseCode.Contains(filter) ||
                (x.VictimName != null && x.VictimName.Contains(filter)));
        }
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.ReportDateFrom.HasValue)
            query = query.Where(x => x.ReportDate >= input.ReportDateFrom.Value);
        if (input.ReportDateTo.HasValue)
            query = query.Where(x => x.ReportDate <= input.ReportDateTo.Value);
        if (input.IncidentId.HasValue)
            query = query.Where(x => x.IncidentId == input.IncidentId.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, _cancellationTokens.Token);

        query = query.OrderByDescending(x => x.CreationTime);
        query = query.PageBy(input);

        var items = await AsyncExecuter.ToListAsync(query, _cancellationTokens.Token);
        return new PagedResultDto<FoodPoisoningCaseDto>(totalCount, items.Select(ToDto).ToList());
    }

    public async Task<FoodPoisoningCaseDto> GetAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.View);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Create)]
    public async Task<FoodPoisoningCaseDto> CreateAsync(CreateUpdateFoodPoisoningCaseDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, _cancellationTokens.Token);
        var orgId = scope.OrganizationIds.First();

        var caseCode = await GenerateCaseCodeAsync(orgId);

        var entity = FoodPoisoningCase.Create(
            GuidGenerator.Create(), orgId, caseCode, input.ReportDate,
            input.OccurrenceDate, input.IncidentId, input.Notes);

        ApplyDetails(entity, input);

        await _cases.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    public async Task<FoodPoisoningCaseDto> UpdateAsync(Guid id, CreateUpdateFoodPoisoningCaseDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(input.ReportDate, input.OccurrenceDate, input.IncidentId, input.Notes);
        ApplyDetails(entity, input);

        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != PoisoningCaseStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CannotModifyNonDraft);
        await _cases.DeleteAsync(entity, cancellationToken: _cancellationTokens.Token);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    public async Task<FoodPoisoningCaseDto> SubmitAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Submit(CurrentUser.GetId(), Clock.Now);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Verify)]
    public async Task<FoodPoisoningCaseDto> VerifyAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        entity.Verify(CurrentUser.GetId(), Clock.Now);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.View)]
    public async Task<List<PoisoningErrorReportDto>> GetErrorReportsAsync(Guid id)
    {
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.View);
        return entity.ErrorReports.Select(ToErrorReportDto).ToList();
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    public async Task<PoisoningErrorReportDto> AddErrorReportAsync(
        Guid id, CreatePoisoningErrorReportDto input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit, _cancellationTokens.Token);
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.Edit);
        var report = entity.AddErrorReport(
            GuidGenerator.Create(), scope.OrganizationIds.First(),
            input.ErrorDescription, input.CorrectionRequest, CurrentUser.Id);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Verify)]
    public async Task<PoisoningErrorReportDto> AcknowledgeErrorReportAsync(Guid id, Guid reportId)
    {
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.Edit);
        var report = entity.ErrorReports.FirstOrDefault(r => r.Id == reportId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CaseNotFound);
        report.Acknowledge();
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Verify)]
    public async Task<PoisoningErrorReportDto> RespondErrorReportAsync(
        Guid id, Guid reportId, RespondPoisoningErrorReportDto input)
    {
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.Edit);
        var report = entity.ErrorReports.FirstOrDefault(r => r.Id == reportId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CaseNotFound);
        report.MarkCorrected(CurrentUser.GetId(), input.Response);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    private async Task<IQueryable<FoodPoisoningCase>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _cases.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return query;
    }

    private async Task<FoodPoisoningCase> GetScopedAsync(Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CaseNotFound);
    }

    private async Task<FoodPoisoningCase> GetScopedWithDetailsAsync(Guid id, DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _cases.WithDetailsAsync(x => x.ErrorReports);
        if (!scope.HasGlobalAccess)
            query = query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CaseNotFound);
    }

    private async Task<string> GenerateCaseCodeAsync(Guid orgId)
    {
        var year = Clock.Now.Year;
        var prefix = $"NDTP-{year}";
        var query = await _cases.GetQueryableAsync();
        var count = await AsyncExecuter.CountAsync(
            query.Where(x => x.OrganizationId == orgId && x.CaseCode.StartsWith(prefix)),
            _cancellationTokens.Token);
        return $"{prefix}-{(count + 1):D4}";
    }

    private static void ApplyDetails(FoodPoisoningCase entity, CreateUpdateFoodPoisoningCaseDto input)
    {
        entity.SetLocation(
            input.LocationDescription, input.LocationCommuneId,
            input.LocationDistrictId, input.LocationProvinceId,
            input.LocationLatitude, input.LocationLongitude);

        entity.SetVictimInfo(
            input.VictimName, input.VictimAge, input.VictimGender,
            input.VictimPhone, input.VictimAddress);

        entity.SetFoodInfo(
            input.SuspectedFood, input.FoodSource,
            input.FoodPreparationDate, input.Symptoms, input.OnsetTime);

        entity.SetMedicalInfo(
            input.MedicalFacility, input.TreatmentStartDate, input.TreatmentResult);

        entity.SetReporterInfo(
            input.ReporterName, input.ReporterPhone,
            input.ReporterOrganization, input.ReporterRelation);
    }

    private static FoodPoisoningCaseDto ToDto(FoodPoisoningCase e) => new()
    {
        Id = e.Id,
        OrganizationId = e.OrganizationId,
        IncidentId = e.IncidentId,
        CaseCode = e.CaseCode,
        ReportDate = e.ReportDate,
        OccurrenceDate = e.OccurrenceDate,
        LocationDescription = e.LocationDescription,
        LocationCommuneId = e.LocationCommuneId,
        LocationDistrictId = e.LocationDistrictId,
        LocationProvinceId = e.LocationProvinceId,
        LocationLatitude = e.LocationLatitude,
        LocationLongitude = e.LocationLongitude,
        VictimName = e.VictimName,
        VictimAge = e.VictimAge,
        VictimGender = e.VictimGender,
        VictimPhone = e.VictimPhone,
        VictimAddress = e.VictimAddress,
        SuspectedFood = e.SuspectedFood,
        FoodSource = e.FoodSource,
        FoodPreparationDate = e.FoodPreparationDate,
        Symptoms = e.Symptoms,
        OnsetTime = e.OnsetTime,
        MedicalFacility = e.MedicalFacility,
        TreatmentStartDate = e.TreatmentStartDate,
        TreatmentResult = e.TreatmentResult,
        ReporterName = e.ReporterName,
        ReporterPhone = e.ReporterPhone,
        ReporterOrganization = e.ReporterOrganization,
        ReporterRelation = e.ReporterRelation,
        Status = e.Status,
        ReportedById = e.ReportedById,
        ReportedAt = e.ReportedAt,
        VerifiedById = e.VerifiedById,
        VerifiedAt = e.VerifiedAt,
        Notes = e.Notes,
        CreationTime = e.CreationTime
    };

    private static PoisoningErrorReportDto ToErrorReportDto(PoisoningCaseErrorReport e) => new()
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
