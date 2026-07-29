using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Threading;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.AlertsAndTesting.News.View)]
public class AtpNewsThumbnailAppService :
    ApplicationService,
    IAtpNewsThumbnailAppService
{
    private const int MaximumThumbnailBytes = 5 * 1024 * 1024;

    // Maps MIME type → file extension
    private static readonly Dictionary<string, string> AllowedImageTypes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["image/jpeg"] = ".jpg",
            ["image/png"] = ".png",
            ["image/gif"] = ".gif",
            ["image/webp"] = ".webp",
        };

    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public AtpNewsThumbnailAppService(
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner,
        ICancellationTokenProvider cancellationTokens)
    {
        _blobs = blobs;
        _malwareScanner = malwareScanner;
        _cancellationTokens = cancellationTokens;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.News.Create)]
    public async Task<NewsThumbnailUploadResultDto> UploadAsync(
        byte[] content, string originalName, string contentType)
    {
        if (content.Length == 0)
            throw new UserFriendlyException("File ảnh rỗng.");
        if (content.Length > MaximumThumbnailBytes)
            throw new UserFriendlyException(
                "Ảnh đại diện không được vượt quá 5MB.");
        if (!AllowedImageTypes.TryGetValue(contentType, out var extension))
            throw new UserFriendlyException(
                "Chỉ chấp nhận ảnh JPEG, PNG, GIF hoặc WEBP.");

        await using var scanStream = new MemoryStream(content, writable: false);
        if (!await _malwareScanner.IsCleanAsync(
                scanStream, _cancellationTokens.Token))
            throw new BusinessException("FoodSafe:Attachment:Infected");

        var id = GuidGenerator.Create();
        var storagePath = $"news-thumbnails/{id:N}{extension}";

        await _blobs.SaveAsync(
            storagePath,
            content,
            overrideExisting: false,
            cancellationToken: _cancellationTokens.Token);

        return new NewsThumbnailUploadResultDto { StoragePath = storagePath };
    }

    public async Task<NewsThumbnailDto?> GetAsync(string storagePath)
    {
        // Restrict to the news-thumbnails folder to prevent arbitrary blob reads.
        if (string.IsNullOrWhiteSpace(storagePath) ||
            !storagePath.StartsWith(
                "news-thumbnails/", StringComparison.OrdinalIgnoreCase))
            return null;

        var content = await _blobs.GetAllBytesOrNullAsync(
            storagePath, _cancellationTokens.Token);
        if (content is null)
            return null;

        var ext = Path.GetExtension(storagePath).ToLowerInvariant();
        var mimeType = ext switch
        {
            ".jpg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            _ => "application/octet-stream"
        };

        return new NewsThumbnailDto { Content = content, ContentType = mimeType };
    }
}
