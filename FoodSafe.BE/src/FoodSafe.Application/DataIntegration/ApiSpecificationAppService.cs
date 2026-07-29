using System.Security.Cryptography;
using System.Text;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Management of versioned partner-facing API specifications (FR-50-05).
/// Every upload is validated as a real OpenAPI 2.0/3.0 document (JSON or YAML)
/// and stored as a new immutable version grouped by <see cref="ApiSpecification.Name"/>.
/// Publishing a version makes it the single downloadable version for that name;
/// partners fetch it anonymously through <see cref="GetPublishedByNameAsync"/>,
/// where publication is the deliberate access gate. All authenticated reads and
/// writes are organization-data-scoped like the rest of the module.
/// </summary>
[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.View)]
public class ApiSpecificationAppService :
    ApplicationService,
    IApiSpecificationAppService
{
    private readonly IRepository<ApiSpecification, Guid> _specs;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public ApiSpecificationAppService(
        IRepository<ApiSpecification, Guid> specs,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _specs = specs;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<ApiSpecificationDto>> GetListAsync(
        ApiSpecificationFilterDto input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, ct);
        var query = (await _specs.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim();
            query = query.Where(x =>
                x.Name.Contains(filter) ||
                x.Title.Contains(filter));
        }
        if (!input.Name.IsNullOrWhiteSpace())
        {
            var name = input.Name!.Trim();
            query = query.Where(x => x.Name == name);
        }
        if (input.IsPublished.HasValue)
            query = query.Where(x => x.IsPublished == input.IsPublished.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, ct);
        query = ApplySorting(query, input.Sorting).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, ct);

        return new PagedResultDto<ApiSpecificationDto>(
            totalCount, items.Select(ToDto).ToList());
    }

    public async Task<ApiSpecificationDto> GetAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        return ToDto(await GetScopedAsync(id, ct));
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.Create)]
    public async Task<ApiSpecificationDto> UploadAsync(UploadApiSpecificationDto input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.Create, ct);
        var orgId = scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound));

        // Validates syntax + required info fields; throws AbpValidationException (400) on failure.
        var parsed = OpenApiSpecValidator.Parse(input.Content);

        var name = input.Name.Trim();
        var nextVersion = await NextVersionNumberAsync(orgId, name, ct);
        var sizeBytes = Encoding.UTF8.GetByteCount(input.Content);
        var checksum = ComputeChecksum(input.Content);

        var spec = ApiSpecification.Create(
            GuidGenerator.Create(),
            orgId,
            name,
            nextVersion,
            parsed.Title,
            parsed.SpecVersion,
            parsed.OpenApiVersion,
            parsed.Format,
            input.Content,
            checksum,
            sizeBytes,
            input.Description ?? parsed.Description);

        await _specs.InsertAsync(spec, autoSave: true, cancellationToken: ct);
        return ToDto(spec);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.Create)]
    public async Task<ApiSpecificationDto> UpdateMetadataAsync(
        Guid id, UpdateApiSpecMetadataDto input)
    {
        var ct = _cancellationTokens.Token;
        var spec = await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        spec.UpdateDescription(input.Description);
        await _specs.UpdateAsync(spec, autoSave: true, cancellationToken: ct);
        return ToDto(spec);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.Publish)]
    public async Task<ApiSpecificationDto> PublishAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var spec = await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        if (spec.IsPublished)
            return ToDto(spec);

        // At most one published version per (org, name): retire the current one first
        // so the filtered unique index is never transiently violated.
        var published = await _specs.GetListAsync(
            x => x.OrganizationId == spec.OrganizationId &&
                 x.Name == spec.Name &&
                 x.IsPublished,
            cancellationToken: ct);
        foreach (var previous in published)
        {
            previous.Unpublish();
            await _specs.UpdateAsync(previous, autoSave: true, cancellationToken: ct);
        }

        spec.Publish(Clock.Now);
        await _specs.UpdateAsync(spec, autoSave: true, cancellationToken: ct);
        return ToDto(spec);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.Publish)]
    public async Task<ApiSpecificationDto> UnpublishAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var spec = await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        spec.Unpublish();
        await _specs.UpdateAsync(spec, autoSave: true, cancellationToken: ct);
        return ToDto(spec);
    }

    [Authorize(FoodSafePermissions.DataIntegration.ApiSpecs.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var spec = await GetScopedAsync(id, ct, DataScopeOperation.Delete);
        await _specs.DeleteAsync(spec, autoSave: true, cancellationToken: ct);
    }

    public async Task<ApiSpecificationDownloadDto> DownloadAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var spec = await GetScopedAsync(id, ct);
        return ToDownloadDto(spec);
    }

    [AllowAnonymous]
    public async Task<ApiSpecificationDownloadDto?> GetPublishedByNameAsync(string name)
    {
        if (name.IsNullOrWhiteSpace())
            return null;

        var ct = _cancellationTokens.Token;
        var trimmed = name.Trim();
        // Partner-facing: no data scope. Publication is the access gate — only the
        // currently published version of a named spec is retrievable, anonymously.
        var query = (await _specs.GetQueryableAsync())
            .Where(x => x.Name == trimmed && x.IsPublished)
            .OrderByDescending(x => x.VersionNumber);
        var spec = await AsyncExecuter.FirstOrDefaultAsync(query, ct);
        return spec is null ? null : ToDownloadDto(spec);
    }

    // Honours the client's Sorting request against a whitelist.
    // The name cases preserve ThenByDescending(VersionNumber) so all versions of a
    // spec group appear newest-first within their name bucket.
    // Falls back to CreationTime descending (newest first).
    private static IOrderedQueryable<ApiSpecification> ApplySorting(
        IQueryable<ApiSpecification> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("name", true) => query.OrderByDescending(x => x.Name).ThenByDescending(x => x.VersionNumber),
            ("name", false) => query.OrderBy(x => x.Name).ThenByDescending(x => x.VersionNumber),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private async Task<int> NextVersionNumberAsync(
        Guid orgId, string name, CancellationToken ct)
    {
        var query = (await _specs.GetQueryableAsync())
            .Where(x => x.OrganizationId == orgId && x.Name == name)
            .Select(x => (int?)x.VersionNumber);
        var max = await AsyncExecuter.MaxAsync(query, ct);
        return (max ?? 0) + 1;
    }

    private async Task<ApiSpecification> GetScopedAsync(
        Guid id,
        CancellationToken ct,
        DataScopeOperation operation = DataScopeOperation.View)
    {
        var spec = await _specs.FindAsync(id, cancellationToken: ct)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.SpecNotFound);
        var scope = await _dataScopeProvider.GetAsync(operation, ct);
        if (!scope.IncludesOrganization(spec.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The API specification is outside the current user's data scope.");
        }
        return spec;
    }

    private static string ComputeChecksum(string content)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(content));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static ApiSpecificationDto ToDto(ApiSpecification x) =>
        new()
        {
            Id = x.Id,
            OrganizationId = x.OrganizationId,
            Name = x.Name,
            VersionNumber = x.VersionNumber,
            Title = x.Title,
            SpecVersion = x.SpecVersion,
            OpenApiVersion = x.OpenApiVersion,
            Format = x.Format,
            SizeBytes = x.SizeBytes,
            Checksum = x.Checksum,
            Description = x.Description,
            IsPublished = x.IsPublished,
            PublishedAt = x.PublishedAt,
            CreationTime = x.CreationTime,
        };

    private static ApiSpecificationDownloadDto ToDownloadDto(ApiSpecification x)
    {
        var (extension, contentType) = x.Format == ApiSpecFormat.Json
            ? (".json", "application/json")
            : (".yaml", "application/yaml");
        return new ApiSpecificationDownloadDto
        {
            Content = x.Content,
            Format = x.Format,
            FileName = $"{x.Name}-v{x.VersionNumber}{extension}",
            ContentType = contentType,
        };
    }
}
