using System.ComponentModel.DataAnnotations;
using Volo.Abp.Application.Services;

namespace FoodSafe.FileManagement;

public sealed class FileAttachmentDto
{
    public Guid Id { get; set; }
    public Guid DocumentOwnerId { get; set; }
    public string OriginalName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public string Checksum { get; set; } = string.Empty;
    public VirusScanStatus VirusScanStatus { get; set; }
    public DateTime UploadTime { get; set; }
    public string? Description { get; set; }
}

public sealed class UploadAttachmentInput
{
    [StringLength(500)]
    public string? Description { get; set; }
}

public sealed class FileAttachmentDownloadDto
{
    public byte[] Content { get; set; } = [];
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
}

public interface IProductAttachmentAppService : IApplicationService
{
    Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid productId);
    Task<FileAttachmentDto> UploadAsync(
        Guid productId,
        byte[] content,
        string originalName,
        string contentType,
        string? description);
    Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid productId,
        Guid attachmentId);
    Task DeleteAsync(Guid productId, Guid attachmentId);
}
