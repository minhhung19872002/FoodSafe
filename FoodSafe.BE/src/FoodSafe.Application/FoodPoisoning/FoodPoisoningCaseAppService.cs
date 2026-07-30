using FoodSafe.Geocoding;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Data;
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
    private readonly IDataFilter _dataFilter;
    private readonly ILocationResolver _locationResolver;

    public FoodPoisoningCaseAppService(
        IRepository<FoodPoisoningCase, Guid> cases,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        IDataFilter dataFilter,
        ILocationResolver locationResolver)
    {
        _cases = cases;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _dataFilter = dataFilter;
        _locationResolver = locationResolver;
    }

    public async Task<PagedResultDto<FoodPoisoningCaseDto>> GetListAsync(FoodPoisoningCaseFilterDto input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.CaseCode.ToUpper().Contains(filter) ||
                x.Victims.Any(v => v.Name.ToUpper().Contains(filter)));
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
        var orgId = (scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound)));

        var caseCode = await GenerateCaseCodeAsync(orgId);

        var entity = FoodPoisoningCase.Create(
            GuidGenerator.Create(), orgId, caseCode, input.ReportDate,
            input.OccurrenceDate, input.IncidentId, input.Notes);

        await ApplyDetailsAsync(entity, input);

        await _cases.InsertAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Edit)]
    public async Task<FoodPoisoningCaseDto> UpdateAsync(Guid id, CreateUpdateFoodPoisoningCaseDto input)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);

        entity.Update(input.ReportDate, input.OccurrenceDate, input.IncidentId, input.Notes);
        await ApplyDetailsAsync(entity, input);

        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToDto(entity);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var entity = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (entity.Status != PoisoningCaseStatus.Draft)
            throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.CannotModifyNonDraft);
        await _cases.DeleteAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
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
            GuidGenerator.Create(), (scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound))),
            input.ErrorDescription, input.CorrectionRequest, CurrentUser.Id);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    [Authorize(FoodSafePermissions.FoodPoisoning.Cases.Verify)]
    public async Task<PoisoningErrorReportDto> AcknowledgeErrorReportAsync(Guid id, Guid reportId)
    {
        var entity = await GetScopedWithDetailsAsync(id, DataScopeOperation.Edit);
        var report = entity.ErrorReports.FirstOrDefault(r => r.Id == reportId)
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.ErrorReportNotFound);
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
            ?? throw new BusinessException(FoodSafeDomainErrorCodes.FoodPoisoning.ErrorReportNotFound);
        report.MarkCorrected(CurrentUser.GetId(), input.Response);
        await _cases.UpdateAsync(entity, autoSave: true, cancellationToken: _cancellationTokens.Token);
        return ToErrorReportDto(report);
    }

    private async Task<IQueryable<FoodPoisoningCase>> ScopedQueryAsync(DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, _cancellationTokens.Token);
        var query = await _cases.WithDetailsAsync(x => x.Victims);
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
        var query = await _cases.WithDetailsAsync(x => x.Victims, x => x.ErrorReports);
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
        // Đếm cả bản ghi soft-deleted: nếu không, xóa Draft rồi tạo mới sẽ sinh
        // lại mã đã cấp cho bản ghi cũ (unique index uq_fpc_org_code sẽ chặn 500).
        using (_dataFilter.Disable<ISoftDelete>())
        {
            var query = await _cases.GetQueryableAsync();
            var codes = await AsyncExecuter.ToListAsync(
                query.Where(x => x.OrganizationId == orgId && x.CaseCode.StartsWith(prefix))
                    .Select(x => x.CaseCode),
                _cancellationTokens.Token);
            return $"{prefix}-{(MaxSequence(codes, prefix) + 1):D4}";
        }
    }

    internal static int MaxSequence(IEnumerable<string> codes, string prefix)
    {
        var max = 0;
        foreach (var code in codes)
        {
            var suffix = code.Length > prefix.Length + 1
                ? code[(prefix.Length + 1)..]
                : string.Empty;
            if (int.TryParse(suffix, out var sequence) && sequence > max)
                max = sequence;
        }
        return max;
    }

    private async Task ApplyDetailsAsync(
        FoodPoisoningCase entity, CreateUpdateFoodPoisoningCaseDto input)
    {
        var lat = input.LocationLatitude;
        var lng = input.LocationLongitude;

        if (!lat.HasValue && !lng.HasValue && HasAddressInfo(input))
        {
            var resolved = await _locationResolver.ResolveAsync(
                new GeocodeAddressInput
                {
                    Street = input.LocationDescription,
                    ProvinceId = input.LocationProvinceId,
                    CommuneId = input.LocationCommuneId,
                },
                _cancellationTokens.Token);

            if (resolved is not null)
            {
                lat = resolved.Latitude;
                lng = resolved.Longitude;
            }
        }

        entity.SetLocation(
            input.LocationDescription, input.LocationCommuneId,
            input.LocationProvinceId,
            lat, lng);

        entity.ClearVictims();
        if (input.Victims.Count > 0)
        {
            foreach (var v in input.Victims)
            {
                if (!string.IsNullOrWhiteSpace(v.Name))
                {
                    entity.AddVictim(
                        GuidGenerator.Create(), v.Name, v.Age, v.Gender, v.Phone, v.Address);
                }
            }
        }
        else if (!string.IsNullOrWhiteSpace(input.VictimName))
        {
            entity.SetVictimInfo(
                input.VictimName, input.VictimAge, input.VictimGender,
                input.VictimPhone, input.VictimAddress);
        }

        entity.SetFoodInfo(
            input.SuspectedFood, input.FoodSource,
            input.FoodPreparationDate, input.Symptoms, input.OnsetTime);

        entity.SetMedicalInfo(
            input.MedicalFacility, input.TreatmentStartDate, input.TreatmentResult);

        entity.SetReporterInfo(
            input.ReporterName, input.ReporterPhone,
            input.ReporterOrganization, input.ReporterRelation);
    }

    private static bool HasAddressInfo(CreateUpdateFoodPoisoningCaseDto input) =>
        input.LocationProvinceId.HasValue
        || input.LocationCommuneId.HasValue
        || !string.IsNullOrWhiteSpace(input.LocationDescription);

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
        LocationProvinceId = e.LocationProvinceId,
        LocationLatitude = e.LocationLatitude,
        LocationLongitude = e.LocationLongitude,
        VictimName = e.VictimName,
        VictimAge = e.VictimAge,
        VictimGender = e.VictimGender,
        VictimPhone = e.VictimPhone,
        VictimAddress = e.VictimAddress,
        Victims = e.Victims.Select(v => new PoisoningCaseVictimDto
        {
            Id = v.Id,
            CaseId = v.CaseId,
            Name = v.Name,
            Age = v.Age,
            Gender = v.Gender,
            Phone = v.Phone,
            Address = v.Address
        }).ToList(),
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
