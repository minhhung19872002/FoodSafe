using FoodSafe.Inspection;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.FileManagement;

public abstract class InspectionAttachmentAppServiceBase<TEntity> :
    ApplicationService
    where TEntity : class, Volo.Abp.Domain.Entities.IEntity<Guid>
{
    protected readonly IRepository<TEntity, Guid> Entities;
    protected readonly IRepository<DocumentOwner, Guid> DocumentOwners;
    protected readonly IDocumentAttachmentStore Store;
    protected readonly ICurrentDataScopeProvider DataScopeProvider;
    protected readonly ICancellationTokenProvider CancellationTokens;

    protected InspectionAttachmentAppServiceBase(
        IRepository<TEntity, Guid> entities,
        IRepository<DocumentOwner, Guid> documentOwners,
        IDocumentAttachmentStore store,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        Entities = entities;
        DocumentOwners = documentOwners;
        Store = store;
        DataScopeProvider = dataScopeProvider;
        CancellationTokens = cancellationTokens;
    }

    protected abstract Guid GetOrganizationId(TEntity entity);
    protected abstract string OwnerFolder { get; }

    protected async Task<TEntity> GetScopedAsync(
        Guid id, DataScopeOperation operation)
    {
        var entity = await Entities.GetAsync(
            id, cancellationToken: CancellationTokens.Token);
        var scope = await DataScopeProvider.GetAsync(
            operation, CancellationTokens.Token);
        if (!scope.HasGlobalAccess &&
            !scope.OrganizationIds.Contains(GetOrganizationId(entity)))
        {
            throw new AbpAuthorizationException(
                "The record is outside the current user's data scope.");
        }
        return entity;
    }

    protected async Task EnsureDocumentOwnerAsync(
        Guid ownerId, Guid organizationId)
    {
        var exists = await DocumentOwners.AnyAsync(
            x => x.Id == ownerId, CancellationTokens.Token);
        if (!exists)
        {
            await DocumentOwners.InsertAsync(
                DocumentOwner.Create(
                    ownerId, organizationId, OwnerFolder, Clock.Now),
                autoSave: true,
                cancellationToken: CancellationTokens.Token);
        }
    }
}

[RemoteService(false)]
[Authorize(FoodSafePermissions.Inspection.Plans.View)]
public class InspectionPlanAttachmentAppService :
    InspectionAttachmentAppServiceBase<InspectionPlan>,
    IInspectionPlanAttachmentAppService
{
    public InspectionPlanAttachmentAppService(
        IRepository<InspectionPlan, Guid> entities,
        IRepository<DocumentOwner, Guid> documentOwners,
        IDocumentAttachmentStore store,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
        : base(entities, documentOwners, store, dataScopeProvider,
            cancellationTokens)
    {
    }

    protected override string OwnerFolder => "inspection-plans";

    protected override Guid GetOrganizationId(InspectionPlan entity) =>
        entity.OrganizationId;

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid planId)
    {
        await GetScopedAsync(planId, DataScopeOperation.View);
        return await Store.GetListAsync(planId);
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid planId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        var plan = await GetScopedAsync(planId, DataScopeOperation.Edit);
        await EnsureDocumentOwnerAsync(planId, plan.OrganizationId);
        return await Store.UploadAsync(
            planId, OwnerFolder, content, originalName, contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid planId, Guid attachmentId)
    {
        await GetScopedAsync(planId, DataScopeOperation.View);
        return await Store.DownloadAsync(planId, attachmentId);
    }

    [Authorize(FoodSafePermissions.Inspection.Plans.Edit)]
    public async Task DeleteAsync(Guid planId, Guid attachmentId)
    {
        await GetScopedAsync(planId, DataScopeOperation.Edit);
        await Store.DeleteAsync(planId, attachmentId);
    }
}

[RemoteService(false)]
[Authorize(FoodSafePermissions.AlertsAndTesting.Documents.View)]
public class AdministrativeDocumentAttachmentAppService :
    InspectionAttachmentAppServiceBase<FoodSafe.AlertsAndTesting.AdministrativeDocument>,
    IAdministrativeDocumentAttachmentAppService
{
    public AdministrativeDocumentAttachmentAppService(
        IRepository<FoodSafe.AlertsAndTesting.AdministrativeDocument, Guid> entities,
        IRepository<DocumentOwner, Guid> documentOwners,
        IDocumentAttachmentStore store,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
        : base(entities, documentOwners, store, dataScopeProvider,
            cancellationTokens)
    {
    }

    protected override string OwnerFolder => "administrative-documents";

    protected override Guid GetOrganizationId(
        FoodSafe.AlertsAndTesting.AdministrativeDocument entity) =>
        entity.OrganizationId;

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid documentId)
    {
        await GetScopedAsync(documentId, DataScopeOperation.View);
        return await Store.GetListAsync(documentId);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid documentId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        var document = await GetScopedAsync(
            documentId, DataScopeOperation.Edit);
        await EnsureDocumentOwnerAsync(documentId, document.OrganizationId);
        return await Store.UploadAsync(
            documentId, OwnerFolder, content, originalName, contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid documentId, Guid attachmentId)
    {
        await GetScopedAsync(documentId, DataScopeOperation.View);
        return await Store.DownloadAsync(documentId, attachmentId);
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.Documents.Edit)]
    public async Task DeleteAsync(Guid documentId, Guid attachmentId)
    {
        await GetScopedAsync(documentId, DataScopeOperation.Edit);
        await Store.DeleteAsync(documentId, attachmentId);
    }
}

[RemoteService(false)]
[Authorize(FoodSafePermissions.Inspection.Results.View)]
public class InspectionResultAttachmentAppService :
    InspectionAttachmentAppServiceBase<InspectionResult>,
    IInspectionResultAttachmentAppService
{
    public InspectionResultAttachmentAppService(
        IRepository<InspectionResult, Guid> entities,
        IRepository<DocumentOwner, Guid> documentOwners,
        IDocumentAttachmentStore store,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
        : base(entities, documentOwners, store, dataScopeProvider,
            cancellationTokens)
    {
    }

    protected override string OwnerFolder => "inspection-results";

    protected override Guid GetOrganizationId(InspectionResult entity) =>
        entity.OrganizationId;

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid resultId)
    {
        await GetScopedAsync(resultId, DataScopeOperation.View);
        return await Store.GetListAsync(resultId);
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid resultId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        var result = await GetScopedAsync(resultId, DataScopeOperation.Edit);
        await EnsureDocumentOwnerAsync(resultId, result.OrganizationId);
        return await Store.UploadAsync(
            resultId, OwnerFolder, content, originalName, contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid resultId, Guid attachmentId)
    {
        await GetScopedAsync(resultId, DataScopeOperation.View);
        return await Store.DownloadAsync(resultId, attachmentId);
    }

    [Authorize(FoodSafePermissions.Inspection.Results.Edit)]
    public async Task DeleteAsync(Guid resultId, Guid attachmentId)
    {
        await GetScopedAsync(resultId, DataScopeOperation.Edit);
        await Store.DeleteAsync(resultId, attachmentId);
    }
}
