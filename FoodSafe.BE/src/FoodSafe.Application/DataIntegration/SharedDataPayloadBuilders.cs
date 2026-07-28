using FoodSafe.AlertsAndTesting;
using FoodSafe.BusinessManagement;
using FoodSafe.FoodPoisoning;
using FoodSafe.Inspection;
using FoodSafe.Licensing;
using FoodSafe.Security;
using Volo.Abp;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Entities;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Linq;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Builds the typed record set for one <see cref="SharedDataType"/> so an
/// outbound share (STT 51-57) carries the actual business data instead of a
/// bare envelope. One strategy per data type (CLAUDE.md §15.6); the exact
/// TT 31/2026 partner field mapping is layered on these records once the
/// official partner schema is published.
/// </summary>
public interface ISharedDataPayloadBuilder : ITransientDependency
{
    SharedDataType DataType { get; }

    /// <summary>
    /// Loads the records to share, restricted to the caller's data scope.
    /// When <paramref name="entityId"/> is set, exactly that record is shared;
    /// otherwise the most recent records (bounded) of the type are included.
    /// </summary>
    Task<IReadOnlyList<object>> BuildRecordsAsync(
        Guid? entityId, CurrentDataScope scope, CancellationToken cancellationToken);
}

public abstract class SharedDataPayloadBuilderBase<TEntity>
    : ISharedDataPayloadBuilder
    where TEntity : class, IEntity<Guid>
{
    /// <summary>Upper bound for "share the latest data" (no explicit record).</summary>
    protected const int MaxRecords = 50;

    private readonly IRepository<TEntity, Guid> _repository;
    protected readonly IAsyncQueryableExecuter AsyncExecuter;

    protected SharedDataPayloadBuilderBase(
        IRepository<TEntity, Guid> repository,
        IAsyncQueryableExecuter asyncExecuter)
    {
        _repository = repository;
        AsyncExecuter = asyncExecuter;
    }

    public abstract SharedDataType DataType { get; }

    public async Task<IReadOnlyList<object>> BuildRecordsAsync(
        Guid? entityId, CurrentDataScope scope, CancellationToken cancellationToken)
    {
        var query = ApplyScope(await _repository.GetQueryableAsync(), scope);
        query = entityId.HasValue
            ? query.Where(x => x.Id == entityId.Value)
            : Order(query).Take(MaxRecords);

        var records = await ProjectAsync(query, cancellationToken);
        if (entityId.HasValue && records.Count == 0)
        {
            throw new UserFriendlyException(
                "Không tìm thấy bản ghi dữ liệu để chia sẻ trong phạm vi đơn vị của bạn.");
        }
        return records;
    }

    protected abstract IQueryable<TEntity> ApplyScope(
        IQueryable<TEntity> query, CurrentDataScope scope);

    protected abstract IQueryable<TEntity> Order(IQueryable<TEntity> query);

    protected abstract Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<TEntity> query, CancellationToken cancellationToken);

    protected async Task<IReadOnlyList<object>> MaterializeAsync<TRecord>(
        IQueryable<TRecord> projection, CancellationToken cancellationToken) =>
        (await AsyncExecuter.ToListAsync(projection, cancellationToken))
        .Cast<object>().ToList();
}

public class AlertSharedDataPayloadBuilder(
    IRepository<AtpAlert, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<AtpAlert>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.Alert;

    protected override IQueryable<AtpAlert> ApplyScope(
        IQueryable<AtpAlert> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<AtpAlert> Order(IQueryable<AtpAlert> query) =>
        query.OrderByDescending(x => x.CreationTime);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<AtpAlert> query, CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.AlertNumber,
            x.Title,
            x.Category,
            x.Severity,
            x.Source,
            x.Status,
            x.PublishedAt,
            x.IsPublic,
            x.OrganizationId,
            x.BusinessId,
        }), cancellationToken);
}

public class NewsSharedDataPayloadBuilder(
    IRepository<AtpNews, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<AtpNews>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.News;

    protected override IQueryable<AtpNews> ApplyScope(
        IQueryable<AtpNews> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<AtpNews> Order(IQueryable<AtpNews> query) =>
        query.OrderByDescending(x => x.CreationTime);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<AtpNews> query, CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.Title,
            x.Summary,
            x.Category,
            x.Status,
            x.PublishedAt,
            x.IsPublic,
            x.OrganizationId,
        }), cancellationToken);
}

public class InspectionResultSharedDataPayloadBuilder(
    IRepository<InspectionResult, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<InspectionResult>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.InspectionResult;

    protected override IQueryable<InspectionResult> ApplyScope(
        IQueryable<InspectionResult> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<InspectionResult> Order(
        IQueryable<InspectionResult> query) =>
        query.OrderByDescending(x => x.InspectionDate);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<InspectionResult> query, CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.BusinessId,
            x.InspectionDate,
            x.InspectionType,
            x.OverallResult,
            x.HasViolation,
            x.FineAmount,
            x.AdminDecisionNumber,
            x.IsFinalized,
            x.OrganizationId,
        }), cancellationToken);
}

public class FoodPoisoningSharedDataPayloadBuilder(
    IRepository<FoodPoisoningIncident, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<FoodPoisoningIncident>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.FoodPoisoning;

    protected override IQueryable<FoodPoisoningIncident> ApplyScope(
        IQueryable<FoodPoisoningIncident> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<FoodPoisoningIncident> Order(
        IQueryable<FoodPoisoningIncident> query) =>
        query.OrderByDescending(x => x.CreationTime);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<FoodPoisoningIncident> query,
        CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.IncidentCode,
            x.OccurrenceDate,
            x.Status,
            x.ExposedCount,
            x.AffectedCount,
            x.HospitalizedCount,
            x.DeathCount,
            x.ConcludedAt,
            x.OrganizationId,
        }), cancellationToken);
}

public class ProductSharedDataPayloadBuilder(
    IRepository<Product, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<Product>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.Product;

    protected override IQueryable<Product> ApplyScope(
        IQueryable<Product> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<Product> Order(IQueryable<Product> query) =>
        query.OrderByDescending(x => x.CreationTime);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<Product> query, CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.Code,
            x.Name,
            x.BrandName,
            x.Manufacturer,
            x.Status,
            x.BusinessId,
            x.OrganizationId,
        }), cancellationToken);
}

public class BusinessSharedDataPayloadBuilder(
    IRepository<Business, Guid> repository,
    IAsyncQueryableExecuter asyncExecuter)
    : SharedDataPayloadBuilderBase<Business>(repository, asyncExecuter)
{
    public override SharedDataType DataType => SharedDataType.Business;

    protected override IQueryable<Business> ApplyScope(
        IQueryable<Business> query, CurrentDataScope scope) =>
        scope.HasGlobalAccess
            ? query
            : query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));

    protected override IQueryable<Business> Order(IQueryable<Business> query) =>
        query.OrderByDescending(x => x.CreationTime);

    protected override Task<IReadOnlyList<object>> ProjectAsync(
        IQueryable<Business> query, CancellationToken cancellationToken) =>
        MaterializeAsync(query.Select(x => new
        {
            x.Id,
            x.Code,
            x.Name,
            x.TaxCode,
            x.RepresentativeName,
            x.ContactPhone,
            x.Status,
            x.OrganizationId,
        }), cancellationToken);
}

/// <summary>
/// License data (STT 54) spans the four license kinds the customer names —
/// ĐKCB (product registration), CFS, GCN đủ điều kiện (eligibility) and GCN
/// xuất khẩu — merged into one record shape with a <c>kind</c> discriminator.
/// </summary>
public class LicenseSharedDataPayloadBuilder(
    IRepository<EligibilityCertificate, Guid> eligibilityRepository,
    IRepository<CfsCertificate, Guid> cfsRepository,
    IRepository<ExportFoodCertificate, Guid> exportRepository,
    IRepository<ProductRegistration, Guid> registrationRepository,
    IAsyncQueryableExecuter asyncExecuter)
    : ISharedDataPayloadBuilder
{
    private const int MaxRecordsPerKind = 20;

    public SharedDataType DataType => SharedDataType.License;

    public async Task<IReadOnlyList<object>> BuildRecordsAsync(
        Guid? entityId, CurrentDataScope scope, CancellationToken cancellationToken)
    {
        var records = new List<object>();

        var eligibility = (await eligibilityRepository.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
        eligibility = entityId.HasValue
            ? eligibility.Where(x => x.Id == entityId.Value)
            : eligibility.OrderByDescending(x => x.IssueDate).Take(MaxRecordsPerKind);
        records.AddRange(await MaterializeAsync(eligibility.Select(x =>
            new LicenseRecord(
                "eligibility", x.Id, x.CertificateNumber, x.BusinessId,
                x.IssueDate, x.ExpiryDate, x.Status.ToString(), x.OrganizationId)),
            cancellationToken));

        var cfs = (await cfsRepository.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
        cfs = entityId.HasValue
            ? cfs.Where(x => x.Id == entityId.Value)
            : cfs.OrderByDescending(x => x.IssueDate).Take(MaxRecordsPerKind);
        records.AddRange(await MaterializeAsync(cfs.Select(x =>
            new LicenseRecord(
                "cfs", x.Id, x.CertificateNumber, x.BusinessId,
                x.IssueDate, x.ExpiryDate, x.Status.ToString(), x.OrganizationId)),
            cancellationToken));

        var export = (await exportRepository.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
        export = entityId.HasValue
            ? export.Where(x => x.Id == entityId.Value)
            : export.OrderByDescending(x => x.IssueDate).Take(MaxRecordsPerKind);
        records.AddRange(await MaterializeAsync(export.Select(x =>
            new LicenseRecord(
                "export-food", x.Id, x.CertificateNumber, x.BusinessId,
                x.IssueDate, x.ExpiryDate, x.Status.ToString(), x.OrganizationId)),
            cancellationToken));

        var registration = (await registrationRepository.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
        registration = entityId.HasValue
            ? registration.Where(x => x.Id == entityId.Value)
            : registration.OrderByDescending(x => x.RegistrationDate)
                .Take(MaxRecordsPerKind);
        records.AddRange(await MaterializeAsync(registration.Select(x =>
            new LicenseRecord(
                "product-registration", x.Id, x.RegistrationNumber, x.BusinessId,
                x.RegistrationDate, x.ExpiryDate, x.Status.ToString(),
                x.OrganizationId)),
            cancellationToken));

        if (entityId.HasValue && records.Count == 0)
        {
            throw new UserFriendlyException(
                "Không tìm thấy bản ghi giấy phép để chia sẻ trong phạm vi đơn vị của bạn.");
        }
        return records;
    }

    private async Task<IReadOnlyList<object>> MaterializeAsync<TRecord>(
        IQueryable<TRecord> projection, CancellationToken cancellationToken) =>
        (await asyncExecuter.ToListAsync(projection, cancellationToken))
        .Cast<object>().ToList();

    private sealed record LicenseRecord(
        string Kind,
        Guid Id,
        string Number,
        Guid BusinessId,
        DateTime IssueDate,
        DateTime? ExpiryDate,
        string Status,
        Guid OrganizationId);
}
