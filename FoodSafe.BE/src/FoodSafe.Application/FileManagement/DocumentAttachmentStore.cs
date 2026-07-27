using System.IO.Compression;
using System.Security.Cryptography;
using Volo.Abp;
using Volo.Abp.BlobStoring;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.FileManagement;

public interface IDocumentAttachmentStore
{
    Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(Guid ownerId);
    Task<FileAttachmentDto> UploadAsync(
        Guid ownerId,
        string ownerFolder,
        byte[] content,
        string originalName,
        string contentType,
        string? description);
    Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid ownerId,
        Guid attachmentId);
    Task DeleteAsync(Guid ownerId, Guid attachmentId);
}

public sealed class DocumentAttachmentStore :
    IDocumentAttachmentStore,
    ITransientDependency
{
    internal const int MaximumFileBytes = 20 * 1024 * 1024;
    private readonly IRepository<FileAttachment, Guid> _attachments;
    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly Volo.Abp.Linq.IAsyncQueryableExecuter _asyncExecuter;
    private readonly Volo.Abp.Guids.IGuidGenerator _guidGenerator;
    private readonly Volo.Abp.Timing.IClock _clock;

    public DocumentAttachmentStore(
        IRepository<FileAttachment, Guid> attachments,
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner,
        ICancellationTokenProvider cancellationTokens,
        Volo.Abp.Linq.IAsyncQueryableExecuter asyncExecuter,
        Volo.Abp.Guids.IGuidGenerator guidGenerator,
        Volo.Abp.Timing.IClock clock)
    {
        _attachments = attachments;
        _blobs = blobs;
        _malwareScanner = malwareScanner;
        _cancellationTokens = cancellationTokens;
        _asyncExecuter = asyncExecuter;
        _guidGenerator = guidGenerator;
        _clock = clock;
    }

    public async Task<IReadOnlyList<FileAttachmentDto>> GetListAsync(
        Guid ownerId)
    {
        var query = await _attachments.GetQueryableAsync();
        var rows = await _asyncExecuter.ToListAsync(
            query.Where(x => x.DocumentOwnerId == ownerId)
                .OrderByDescending(x => x.CreationTime),
            _cancellationTokens.Token);
        return rows.Select(ToDto).ToList();
    }

    public async Task<FileAttachmentDto> UploadAsync(
        Guid ownerId,
        string ownerFolder,
        byte[] content,
        string originalName,
        string contentType,
        string? description)
    {
        if (ownerFolder.IsNullOrWhiteSpace() ||
            ownerFolder.Any(x =>
                !(char.IsAsciiLetterOrDigit(x) || x == '-')))
            throw new ArgumentException(
                "The attachment owner folder is invalid.",
                nameof(ownerFolder));
        var validated = Validate(content, originalName, contentType);
        await using var scanStream = new MemoryStream(content, writable: false);
        if (!await _malwareScanner.IsCleanAsync(
                scanStream,
                _cancellationTokens.Token))
            throw new BusinessException("FoodSafe:Attachment:Infected");

        var id = _guidGenerator.Create();
        var storedName = $"{id:N}{validated.Extension}";
        var storagePath = $"{ownerFolder}/{ownerId:N}/{storedName}";
        var checksum = Convert.ToHexString(SHA256.HashData(content))
            .ToLowerInvariant();
        var attachment = FileAttachment.Create(
            id,
            ownerId,
            storedName,
            validated.OriginalName,
            storagePath,
            content.LongLength,
            validated.ContentType,
            checksum,
            description);
        attachment.MarkClean(_clock.Now);

        await _blobs.SaveAsync(
            storagePath,
            content,
            overrideExisting: false,
            cancellationToken: _cancellationTokens.Token);
        try
        {
            await _attachments.InsertAsync(
                attachment,
                autoSave: true,
                cancellationToken: _cancellationTokens.Token);
        }
        catch
        {
            await _blobs.DeleteAsync(
                storagePath,
                cancellationToken: CancellationToken.None);
            throw;
        }
        return ToDto(attachment);
    }

    public async Task<FileAttachmentDownloadDto> DownloadAsync(
        Guid ownerId,
        Guid attachmentId)
    {
        var attachment = await GetOwnedAsync(ownerId, attachmentId);
        if (attachment.VirusScanStatus != VirusScanStatus.Clean)
            throw new BusinessException("FoodSafe:Attachment:NotClean");
        var content = await _blobs.GetAllBytesAsync(
            attachment.StoragePath,
            _cancellationTokens.Token);
        var checksum = Convert.ToHexString(SHA256.HashData(content))
            .ToLowerInvariant();
        if (!checksum.Equals(
                attachment.Checksum,
                StringComparison.OrdinalIgnoreCase))
            throw new BusinessException(
                "FoodSafe:Attachment:ChecksumMismatch");
        return new FileAttachmentDownloadDto
        {
            Content = content,
            FileName = attachment.OriginalName,
            ContentType =
                attachment.MimeType ?? "application/octet-stream"
        };
    }

    public async Task DeleteAsync(Guid ownerId, Guid attachmentId)
    {
        var attachment = await GetOwnedAsync(ownerId, attachmentId);
        await _attachments.DeleteAsync(
            attachment,
            autoSave: true,
            cancellationToken: _cancellationTokens.Token);
    }

    internal static ValidatedFile Validate(
        byte[] content,
        string originalName,
        string contentType)
    {
        if (content.Length == 0)
            throw new UserFriendlyException("File đính kèm rỗng.");
        if (content.Length > MaximumFileBytes)
            throw new UserFriendlyException(
                "File đính kèm không được vượt quá 20 MB.");
        var safeName = Path.GetFileName(originalName);
        if (safeName != originalName ||
            safeName.IsNullOrWhiteSpace() ||
            safeName.Any(char.IsControl) ||
            safeName.Length > 500)
            throw new UserFriendlyException("Tên file không hợp lệ.");
        var extension = Path.GetExtension(safeName).ToLowerInvariant();
        var expectedType = extension switch
        {
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".docx" =>
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx" =>
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => throw new UserFriendlyException(
                "Chỉ chấp nhận PDF, PNG, JPEG, DOCX hoặc XLSX.")
        };
        if (!contentType.Equals(
                expectedType,
                StringComparison.OrdinalIgnoreCase))
            throw new UserFriendlyException(
                "MIME type không khớp với phần mở rộng file.");
        var signatureValid = extension switch
        {
            ".pdf" => content.AsSpan().StartsWith("%PDF"u8),
            ".png" => content.AsSpan().StartsWith(
                new byte[]
                {
                    0x89, 0x50, 0x4E, 0x47,
                    0x0D, 0x0A, 0x1A, 0x0A
                }),
            ".jpg" or ".jpeg" => content.AsSpan().StartsWith(
                new byte[] { 0xFF, 0xD8, 0xFF }),
            ".docx" => IsOpenXml(content, "word/"),
            ".xlsx" => IsOpenXml(content, "xl/"),
            _ => false
        };
        if (!signatureValid)
            throw new UserFriendlyException(
                "Chữ ký nội dung file không hợp lệ.");
        return new ValidatedFile(safeName, extension, expectedType);
    }

    private static bool IsOpenXml(byte[] content, string requiredPrefix)
    {
        if (content.Length < 4 ||
            content[0] != (byte)'P' ||
            content[1] != (byte)'K')
            return false;
        try
        {
            using var stream = new MemoryStream(content, writable: false);
            using var archive = new ZipArchive(stream, ZipArchiveMode.Read);
            return archive.Entries.Count <= 5000 &&
                   archive.Entries.Sum(x => x.Length) <=
                   200L * 1024 * 1024 &&
                   archive.Entries.Any(x =>
                       x.FullName.Equals(
                           "[Content_Types].xml",
                           StringComparison.OrdinalIgnoreCase)) &&
                   archive.Entries.Any(x =>
                       x.FullName.StartsWith(
                           requiredPrefix,
                           StringComparison.OrdinalIgnoreCase));
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private async Task<FileAttachment> GetOwnedAsync(
        Guid ownerId,
        Guid attachmentId)
    {
        var query = await _attachments.GetQueryableAsync();
        return await _asyncExecuter.FirstOrDefaultAsync(
                   query.Where(x =>
                       x.Id == attachmentId &&
                       x.DocumentOwnerId == ownerId),
                   _cancellationTokens.Token)
               ?? throw new Volo.Abp.Authorization
                   .AbpAuthorizationException(
                       "The attachment is outside the requested owner.");
    }

    private static FileAttachmentDto ToDto(FileAttachment attachment) =>
        new()
        {
            Id = attachment.Id,
            DocumentOwnerId = attachment.DocumentOwnerId,
            OriginalName = attachment.OriginalName,
            FileSize = attachment.FileSize,
            MimeType =
                attachment.MimeType ?? "application/octet-stream",
            Checksum = attachment.Checksum,
            VirusScanStatus = attachment.VirusScanStatus,
            UploadTime = attachment.CreationTime,
            Description = attachment.Description
        };
}

internal sealed record ValidatedFile(
    string OriginalName,
    string Extension,
    string ContentType);
