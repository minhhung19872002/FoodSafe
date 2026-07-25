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
[Authorize(FoodSafePermissions.Licensing.AdRegistrations.View)]
public class AdvertisementRegistrationAttachmentAppService :
    ApplicationService,
    IAdvertisementRegistrationAttachmentAppService
{
    private readonly IAdvertisementRegistrationDataScopeChecker _scope;
    private readonly IDocumentAttachmentStore _store;
    private readonly IRepository<AdvertisementRegistration, Guid>
        _registrations;

    public AdvertisementRegistrationAttachmentAppService(
        IAdvertisementRegistrationDataScopeChecker scope,
        IDocumentAttachmentStore store,
        IRepository<AdvertisementRegistration, Guid> registrations)
    {
        _scope = scope;
        _store = store;
        _registrations = registrations;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid id)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.View);
        return await _store.GetListAsync(id);
    }

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Edit)]
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
            "advertisement-registrations",
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

    [Authorize(FoodSafePermissions.Licensing.AdRegistrations.Edit)]
    public async Task DeleteAsync(Guid id, Guid attachmentId)
    {
        await _scope.EnsureAccessAsync(id, DataScopeOperation.Edit);
        await EnsureMutableAsync(id);
        await _store.DeleteAsync(id, attachmentId);
    }

    private async Task EnsureMutableAsync(Guid id)
    {
        var registration = await _registrations.GetAsync(id);
        if (registration.Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.AdvertisementRegistration
                    .CannotModifyRevoked);
    }
}
