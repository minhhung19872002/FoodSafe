using Volo.Abp;
using Volo.Abp.Domain.Entities.Auditing;

namespace FoodSafe.FileManagement;

public sealed class FileAttachment : FullAuditedEntity<Guid>
{
    public Guid DocumentOwnerId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string OriginalName { get; private set; } = string.Empty;
    public string StoragePath { get; private set; } = string.Empty;
    public long FileSize { get; private set; }
    public string? MimeType { get; private set; }
    public string? Description { get; private set; }
    public bool IsPublic { get; private set; }
    public string Checksum { get; private set; } = string.Empty;
    public VirusScanStatus VirusScanStatus { get; private set; }
    public DateTime? VirusScannedAt { get; private set; }
    public RetentionStatus RetentionStatus { get; private set; }
    public DateTime? RetentionExpiresAt { get; private set; }

    private FileAttachment()
    {
    }

    private FileAttachment(Guid id) : base(id)
    {
    }

    public static FileAttachment Create(
        Guid id,
        Guid documentOwnerId,
        string fileName,
        string originalName,
        string storagePath,
        long fileSize,
        string mimeType,
        string checksum,
        string? description)
    {
        if (fileSize <= 0) throw new ArgumentOutOfRangeException(nameof(fileSize));
        Check.NotNullOrWhiteSpace(fileName, nameof(fileName), 500);
        Check.NotNullOrWhiteSpace(originalName, nameof(originalName), 500);
        Check.NotNullOrWhiteSpace(storagePath, nameof(storagePath), 1000);
        Check.NotNullOrWhiteSpace(mimeType, nameof(mimeType), 100);
        Check.Length(checksum, nameof(checksum), 64, 64);
        if (!description.IsNullOrWhiteSpace())
            Check.Length(description, nameof(description), 500);
        return new FileAttachment(id)
        {
            DocumentOwnerId = documentOwnerId,
            FileName = fileName,
            OriginalName = originalName,
            StoragePath = storagePath,
            FileSize = fileSize,
            MimeType = mimeType,
            Checksum = checksum,
            Description = Normalize(description),
            IsPublic = false,
            VirusScanStatus = VirusScanStatus.Pending,
            RetentionStatus = RetentionStatus.Active
        };
    }

    public void MarkClean(DateTime scannedAt)
    {
        VirusScanStatus = VirusScanStatus.Clean;
        VirusScannedAt = scannedAt;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
