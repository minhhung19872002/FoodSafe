using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;

namespace FoodSafe.FileManagement;

[RemoteService(false)]
[Authorize(FoodSafePermissions.BusinessManagement.Products.View)]
public class ProductAttachmentAppService :
    ApplicationService,
    IProductAttachmentAppService
{
    internal const int MaximumFileBytes =
        DocumentAttachmentStore.MaximumFileBytes;
    private readonly IProductDataScopeChecker _scopeChecker;
    private readonly IDocumentAttachmentStore _store;

    public ProductAttachmentAppService(
        IProductDataScopeChecker scopeChecker,
        IDocumentAttachmentStore store)
    {
        _scopeChecker = scopeChecker;
        _store = store;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid productId)
    {
        await _scopeChecker.EnsureAccessAsync(
            productId,
            DataScopeOperation.View);
        return await _store.GetListAsync(productId);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Edit)]
    public async Task<FileAttachmentDto> UploadAsync(
        Guid productId,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        await _scopeChecker.EnsureAccessAsync(
            productId,
            DataScopeOperation.Edit);
        return await _store.UploadAsync(
            productId,
            "products",
            content,
            originalName,
            contentType,
            description);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid productId,
        Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            productId,
            DataScopeOperation.View);
        return await _store.DownloadAsync(productId, attachmentId);
    }

    [Authorize(FoodSafePermissions.BusinessManagement.Products.Edit)]
    public async Task DeleteAsync(Guid productId, Guid attachmentId)
    {
        await _scopeChecker.EnsureAccessAsync(
            productId,
            DataScopeOperation.Edit);
        await _store.DeleteAsync(productId, attachmentId);
    }

    internal static ValidatedFile Validate(
        byte[] content,
        string originalName,
        string contentType) =>
        DocumentAttachmentStore.Validate(
            content,
            originalName,
            contentType);
}
