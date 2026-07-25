using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace FoodSafe.FileManagement;

[RemoteService(false)]
[Authorize(
    FoodSafePermissions.BusinessManagement.SelfDeclarations.View)]
public class SelfDeclarationAttachmentAppService :
    ApplicationService,
    ISelfDeclarationAttachmentAppService
{
    private readonly ISelfDeclarationDataScopeChecker _scopeChecker;
    private readonly IDocumentAttachmentStore _store;
    private readonly IRepository<SelfDeclaration, Guid> _declarations;

    public SelfDeclarationAttachmentAppService(
        ISelfDeclarationDataScopeChecker scopeChecker,
        IDocumentAttachmentStore store,
        IRepository<SelfDeclaration, Guid> declarations)
    {
        _scopeChecker = scopeChecker;
        _store = store;
        _declarations = declarations;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid declarationId)
    {
        await _scopeChecker.EnsureAccessAsync(
            declarationId,
            DataScopeOperation.View);
        return await _store.GetListAsync(declarationId);
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid declarationId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        await _scopeChecker.EnsureAccessAsync(
            declarationId,
            DataScopeOperation.Edit);
        await EnsureMutableAsync(declarationId);
        return await _store.UploadAsync(
            declarationId,
            "self-declarations",
            content,
            originalName,
            contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid declarationId,
        Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            declarationId,
            DataScopeOperation.View);
        return await _store.DownloadAsync(declarationId, attachmentId);
    }

    [Authorize(
        FoodSafePermissions.BusinessManagement.SelfDeclarations.Edit)]
    public async Task DeleteAsync(
        Guid declarationId,
        Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            declarationId,
            DataScopeOperation.Edit);
        await EnsureMutableAsync(declarationId);
        await _store.DeleteAsync(declarationId, attachmentId);
    }

    private async Task EnsureMutableAsync(Guid declarationId)
    {
        var declaration = await _declarations.GetAsync(declarationId);
        if (declaration.Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.SelfDeclaration
                    .CannotModifyRevoked);
    }
}
