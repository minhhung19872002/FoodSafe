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
[Authorize(FoodSafePermissions.Licensing.ProductRegistrations.View)]
public class ProductRegistrationAttachmentAppService :
    ApplicationService,
    IProductRegistrationAttachmentAppService
{
    private readonly IProductRegistrationDataScopeChecker _scopeChecker;
    private readonly IDocumentAttachmentStore _store;
    private readonly IRepository<ProductRegistration, Guid> _registrations;

    public ProductRegistrationAttachmentAppService(
        IProductRegistrationDataScopeChecker scopeChecker,
        IDocumentAttachmentStore store,
        IRepository<ProductRegistration, Guid> registrations)
    {
        _scopeChecker = scopeChecker;
        _store = store;
        _registrations = registrations;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid registrationId)
    {
        await _scopeChecker.EnsureAccessAsync(
            registrationId,
            DataScopeOperation.View);
        return await _store.GetListAsync(registrationId);
    }

    [Authorize(FoodSafePermissions.Licensing.ProductRegistrations.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid registrationId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        await _scopeChecker.EnsureAccessAsync(
            registrationId,
            DataScopeOperation.Edit);
        await EnsureMutableAsync(registrationId);
        return await _store.UploadAsync(
            registrationId,
            "product-registrations",
            content,
            originalName,
            contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid registrationId,
        Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            registrationId,
            DataScopeOperation.View);
        return await _store.DownloadAsync(registrationId, attachmentId);
    }

    [Authorize(FoodSafePermissions.Licensing.ProductRegistrations.Edit)]
    public async Task DeleteAsync(
        Guid registrationId,
        Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            registrationId,
            DataScopeOperation.Edit);
        await EnsureMutableAsync(registrationId);
        await _store.DeleteAsync(registrationId, attachmentId);
    }

    private async Task EnsureMutableAsync(Guid registrationId)
    {
        var registration = await _registrations.GetAsync(registrationId);
        if (registration.Status == LicenseStatus.Revoked)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.ProductRegistration
                    .CannotModifyRevoked);
    }
}
