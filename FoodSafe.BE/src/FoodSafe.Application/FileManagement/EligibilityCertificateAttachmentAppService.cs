using FoodSafe.BusinessManagement;
using FoodSafe.Licensing;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;

namespace FoodSafe.FileManagement;

[RemoteService(false)]
[Authorize(
    FoodSafePermissions.Licensing.EligibilityCertificates.View)]
public class EligibilityCertificateAttachmentAppService :
    ApplicationService,
    IEligibilityCertificateAttachmentAppService
{
    private readonly IEligibilityCertificateDataScopeChecker _scope;
    private readonly IDocumentAttachmentStore _store;
    private readonly IRepository<EligibilityCertificate, Guid> _certificates;

    public EligibilityCertificateAttachmentAppService(
        IEligibilityCertificateDataScopeChecker scope,
        IDocumentAttachmentStore store,
        IRepository<EligibilityCertificate, Guid> certificates)
    {
        _scope = scope;
        _store = store;
        _certificates = certificates;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid id)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.View);
        return await _store.GetListAsync(id);
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid id,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.Edit);
        await EnsureMutableAsync(id);
        return await _store.UploadAsync(
            id,
            "eligibility-certificates",
            content,
            originalName,
            contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid id,
        Guid attachmentId)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.View);
        return await _store.DownloadAsync(id, attachmentId);
    }

    [Authorize(
        FoodSafePermissions.Licensing.EligibilityCertificates.Edit)]
    public async Task DeleteAsync(Guid id, Guid attachmentId)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.Edit);
        await EnsureMutableAsync(id);
        await _store.DeleteAsync(id, attachmentId);
    }

    private async Task EnsureMutableAsync(Guid id)
    {
        var certificate = await _certificates.GetAsync(id);
        if (certificate.Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.EligibilityCertificate
                    .CannotModifyRevoked);
    }
}
