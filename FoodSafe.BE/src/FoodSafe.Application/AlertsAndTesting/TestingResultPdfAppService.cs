using FoodSafe.Application.Contracts.AlertsAndTesting;
using FoodSafe.FileManagement;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Services;
using Volo.Abp.BlobStoring;
using Volo.Abp.Threading;

namespace FoodSafe.AlertsAndTesting;

[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.View)]
public class TestingResultPdfAppService :
    ApplicationService,
    ITestingResultPdfAppService
{
    private const int MaximumPdfBytes = 10 * 1024 * 1024;
    private const string StorageFolder = "testing-result-pdfs";

    private readonly IBlobContainer _blobs;
    private readonly IFileMalwareScanner _malwareScanner;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public TestingResultPdfAppService(
        IBlobContainer blobs,
        IFileMalwareScanner malwareScanner,
        ICancellationTokenProvider cancellationTokens)
    {
        _blobs = blobs;
        _malwareScanner = malwareScanner;
        _cancellationTokens = cancellationTokens;
    }

    [Authorize(FoodSafePermissions.AlertsAndTesting.TestingResults.Create)]
    public async Task<TestingResultPdfUploadResultDto> UploadAsync(
        byte[] content, string originalName, string contentType)
    {
        if (content.Length == 0)
            throw new UserFriendlyException("File PDF rỗng.");
        if (content.Length > MaximumPdfBytes)
            throw new UserFriendlyException("Phiếu kiểm nghiệm không được vượt quá 10MB.");
        if (!contentType.Equals("application/pdf", StringComparison.OrdinalIgnoreCase))
            throw new UserFriendlyException("Chỉ chấp nhận file PDF.");
        if (!content.AsSpan().StartsWith("%PDF"u8))
            throw new UserFriendlyException("Nội dung file không phải PDF hợp lệ.");

        await using var scanStream = new MemoryStream(content, writable: false);
        if (!await _malwareScanner.IsCleanAsync(scanStream, _cancellationTokens.Token))
            throw new BusinessException("FoodSafe:Attachment:Infected");

        var id = GuidGenerator.Create();
        var storagePath = $"{StorageFolder}/{id:N}.pdf";

        await _blobs.SaveAsync(
            storagePath,
            content,
            overrideExisting: false,
            cancellationToken: _cancellationTokens.Token);

        return new TestingResultPdfUploadResultDto { StoragePath = storagePath };
    }

    public async Task<TestingResultPdfDto?> GetAsync(string storagePath)
    {
        // Restrict to the testing-result-pdfs folder to prevent arbitrary blob reads.
        if (string.IsNullOrWhiteSpace(storagePath) ||
            !storagePath.StartsWith(
                StorageFolder + "/", StringComparison.OrdinalIgnoreCase))
            return null;

        var content = await _blobs.GetAllBytesOrNullAsync(
            storagePath, _cancellationTokens.Token);
        if (content is null)
            return null;

        return new TestingResultPdfDto { Content = content, ContentType = "application/pdf" };
    }
}
