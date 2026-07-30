using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.DataIntegration;

/// <summary>
/// Administration of inbound partner accounts, their API keys and the
/// submissions they delivered (INT-03). Raw API keys are returned exactly once
/// at issuance; afterwards only prefix + metadata are visible. All reads and
/// writes are organization-data-scoped like the rest of the module.
/// </summary>
[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.DataIntegration.Partners.View)]
public class PartnerAccountAppService :
    ApplicationService,
    IPartnerAccountAppService
{
    private readonly IRepository<PartnerAccount, Guid> _partners;
    private readonly IRepository<PartnerApiKey, Guid> _keys;
    private readonly IRepository<InboundSubmission, Guid> _submissions;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public PartnerAccountAppService(
        IRepository<PartnerAccount, Guid> partners,
        IRepository<PartnerApiKey, Guid> keys,
        IRepository<InboundSubmission, Guid> submissions,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens)
    {
        _partners = partners;
        _keys = keys;
        _submissions = submissions;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<PagedResultDto<PartnerAccountDto>> GetListAsync(
        PartnerAccountFilterDto input)
    {
        var ct = _cancellationTokens.Token;
        var query = await ScopedQueryAsync(ct);

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            query = query.Where(x =>
                x.Code.ToUpper().Contains(filter) ||
                x.Name.ToUpper().Contains(filter) ||
                x.ExternalSystem.ToUpper().Contains(filter));
        }
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var totalCount = await AsyncExecuter.CountAsync(query, ct);
        query = ApplySorting(query, input.Sorting).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, ct);

        var partnerIds = items.Select(x => x.Id).ToList();
        var keysQuery = (await _keys.GetQueryableAsync())
            .Where(k => partnerIds.Contains(k.PartnerAccountId) &&
                        k.RevokedAt == null);
        var activeKeys = await AsyncExecuter.ToListAsync(
            keysQuery.Select(k => k.PartnerAccountId), ct);
        var counts = activeKeys
            .GroupBy(id => id)
            .ToDictionary(g => g.Key, g => g.Count());

        return new PagedResultDto<PartnerAccountDto>(
            totalCount,
            items.Select(x => ToDto(x, counts.GetValueOrDefault(x.Id))).ToList());
    }

    public async Task<PartnerAccountDto> GetAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var partner = await GetScopedAsync(id, ct);
        var activeKeys = await _keys.CountAsync(
            k => k.PartnerAccountId == id && k.RevokedAt == null, ct);
        return ToDto(partner, activeKeys);
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.Create)]
    public async Task<PartnerAccountDto> CreateAsync(CreatePartnerAccountDto input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create, ct);
        var orgId = scope.HomeOrganizationId
            ?? (scope.OrganizationIds.Count > 0
                ? scope.OrganizationIds.First()
                : throw new BusinessException(
                    FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound));

        if (await _partners.AnyAsync(x => x.Code == input.Code, ct))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.PartnerCodeAlreadyExists)
                .WithData("code", input.Code);
        }

        var partner = PartnerAccount.Create(
            GuidGenerator.Create(),
            orgId,
            input.Code,
            input.Name,
            input.ExternalSystem,
            input.AllowedDataTypes,
            input.Description);
        await _partners.InsertAsync(partner, autoSave: true, cancellationToken: ct);
        return ToDto(partner, activeKeyCount: 0);
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.Edit)]
    public async Task<PartnerAccountDto> UpdateAsync(
        Guid id, UpdatePartnerAccountDto input)
    {
        var ct = _cancellationTokens.Token;
        var partner = await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        partner.Update(
            input.Name, input.ExternalSystem,
            input.AllowedDataTypes, input.Description);
        await _partners.UpdateAsync(partner, autoSave: true, cancellationToken: ct);
        var activeKeys = await _keys.CountAsync(
            k => k.PartnerAccountId == id && k.RevokedAt == null, ct);
        return ToDto(partner, activeKeys);
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.Edit)]
    public async Task ToggleStatusAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var partner = await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        if (partner.Status == PartnerAccountStatus.Active)
            partner.Suspend();
        else
            partner.Activate();
        await _partners.UpdateAsync(partner, autoSave: true, cancellationToken: ct);
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        var partner = await GetScopedAsync(id, ct, DataScopeOperation.Delete);

        // Keys stop authenticating with the partner gone; revoke for the audit trail.
        var keys = await _keys.GetListAsync(
            k => k.PartnerAccountId == id && k.RevokedAt == null, cancellationToken: ct);
        foreach (var key in keys)
        {
            key.Revoke(Clock.Now);
            await _keys.UpdateAsync(key, cancellationToken: ct);
        }

        await _partners.DeleteAsync(partner, autoSave: true, cancellationToken: ct);
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    public async Task<List<PartnerApiKeyDto>> GetKeysAsync(Guid id)
    {
        var ct = _cancellationTokens.Token;
        await GetScopedAsync(id, ct);
        var keys = await _keys.GetListAsync(
            k => k.PartnerAccountId == id, cancellationToken: ct);
        return keys
            .OrderByDescending(k => k.CreationTime)
            .Select(ToKeyDto)
            .ToList();
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    public async Task<IssuedPartnerApiKeyDto> IssueKeyAsync(
        Guid id, IssuePartnerApiKeyDto input)
    {
        var ct = _cancellationTokens.Token;
        await GetScopedAsync(id, ct, DataScopeOperation.Edit);

        var (rawKey, keyPrefix, keyHash) = PartnerKeyMaterial.Generate();
        var key = PartnerApiKey.Create(
            GuidGenerator.Create(), id, keyPrefix, keyHash,
            input.ExpiresAt, input.Description);
        await _keys.InsertAsync(key, autoSave: true, cancellationToken: ct);

        var dto = new IssuedPartnerApiKeyDto { RawKey = rawKey };
        FillKeyDto(dto, key);
        return dto;
    }

    [Authorize(FoodSafePermissions.DataIntegration.Partners.ManageKeys)]
    public async Task RevokeKeyAsync(Guid id, Guid keyId)
    {
        var ct = _cancellationTokens.Token;
        await GetScopedAsync(id, ct, DataScopeOperation.Edit);
        var key = await _keys.FindAsync(
            k => k.Id == keyId && k.PartnerAccountId == id, cancellationToken: ct)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.PartnerKeyNotFound);
        key.Revoke(Clock.Now);
        await _keys.UpdateAsync(key, autoSave: true, cancellationToken: ct);
    }

    public async Task<PagedResultDto<InboundSubmissionDto>> GetSubmissionsAsync(
        InboundSubmissionFilterDto input)
    {
        var ct = _cancellationTokens.Token;
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, ct);
        var query = (await _submissions.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));

        if (!input.Filter.IsNullOrWhiteSpace())
        {
            var filter = input.Filter!.Trim().ToUpperInvariant();
            var matchingPartnerIds = (await _partners.GetQueryableAsync())
                .Where(x =>
                    x.Name.ToUpper().Contains(filter) ||
                    x.ExternalSystem.ToUpper().Contains(filter))
                .Select(x => x.Id);
            query = query.Where(x =>
                x.RequestId.ToUpper().Contains(filter) ||
                (x.CorrelationId != null &&
                 x.CorrelationId.ToUpper().Contains(filter)) ||
                x.Payload.ToUpper().Contains(filter) ||
                matchingPartnerIds.Contains(x.PartnerAccountId));
        }
        if (input.PartnerAccountId.HasValue)
            query = query.Where(x => x.PartnerAccountId == input.PartnerAccountId);
        if (input.DataType.HasValue)
            query = query.Where(x => x.DataType == input.DataType.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);
        if (input.FromDate.HasValue)
            query = query.Where(x => x.ReceivedAt >= input.FromDate.Value.Date);
        if (input.ToDate.HasValue)
            query = query.Where(x => x.ReceivedAt <= input.ToDate.Value.Date.AddDays(1));

        var totalCount = await AsyncExecuter.CountAsync(query, ct);
        query = query.OrderByDescending(x => x.ReceivedAt).PageBy(input);
        var items = await AsyncExecuter.ToListAsync(query, ct);
        var names = await PartnerNamesAsync(
            items.Select(x => x.PartnerAccountId).Distinct().ToList(), ct);

        return new PagedResultDto<InboundSubmissionDto>(
            totalCount,
            items.Select(x => ToSubmissionDto(
                new InboundSubmissionDto(), x, names)).ToList());
    }

    public async Task<InboundSubmissionDetailDto> GetSubmissionAsync(Guid submissionId)
    {
        var ct = _cancellationTokens.Token;
        var entity = await GetScopedSubmissionAsync(
            submissionId, DataScopeOperation.View, ct);
        var names = await PartnerNamesAsync([entity.PartnerAccountId], ct);

        var dto = (InboundSubmissionDetailDto)ToSubmissionDto(
            new InboundSubmissionDetailDto(), entity, names);
        dto.Payload = entity.Payload;
        return dto;
    }

    /// <summary>
    /// Approves a submission received from a partner (Received → Processed).
    /// The domain refuses a second disposition, so a retried request cannot
    /// overwrite who decided what and when.
    /// </summary>
    [Authorize(FoodSafePermissions.DataIntegration.Partners.Moderate)]
    public async Task<InboundSubmissionDto> ProcessSubmissionAsync(Guid submissionId)
    {
        var ct = _cancellationTokens.Token;
        var submission = await GetScopedSubmissionAsync(
            submissionId, DataScopeOperation.Edit, ct);

        submission.MarkProcessed(CurrentUser.GetId(), Clock.Now);
        await _submissions.UpdateAsync(submission, autoSave: true, cancellationToken: ct);

        return await ToDispositionResultAsync(submission, ct);
    }

    /// <summary>Rejects a submission with a mandatory reason (Received → Rejected).</summary>
    [Authorize(FoodSafePermissions.DataIntegration.Partners.Moderate)]
    public async Task<InboundSubmissionDto> RejectSubmissionAsync(
        Guid submissionId, RejectInboundSubmissionDto input)
    {
        var ct = _cancellationTokens.Token;
        var submission = await GetScopedSubmissionAsync(
            submissionId, DataScopeOperation.Edit, ct);

        submission.Reject(CurrentUser.GetId(), Clock.Now, input.Reason);
        await _submissions.UpdateAsync(submission, autoSave: true, cancellationToken: ct);

        return await ToDispositionResultAsync(submission, ct);
    }

    private async Task<InboundSubmissionDto> ToDispositionResultAsync(
        InboundSubmission submission, CancellationToken ct)
    {
        var names = await PartnerNamesAsync([submission.PartnerAccountId], ct);
        return ToSubmissionDto(new InboundSubmissionDto(), submission, names);
    }

    private async Task<InboundSubmission> GetScopedSubmissionAsync(
        Guid submissionId, DataScopeOperation operation, CancellationToken ct)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, ct);
        var query = (await _submissions.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId))
            .Where(x => x.Id == submissionId);
        return await AsyncExecuter.FirstOrDefaultAsync(query, ct)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.SubmissionNotFound);
    }

    private async Task<Dictionary<Guid, string>> PartnerNamesAsync(
        List<Guid> partnerIds, CancellationToken ct)
    {
        var query = (await _partners.GetQueryableAsync())
            .Where(p => partnerIds.Contains(p.Id))
            .Select(p => new { p.Id, p.Name });
        var pairs = await AsyncExecuter.ToListAsync(query, ct);
        return pairs.ToDictionary(p => p.Id, p => p.Name);
    }

    // Honours the client's Sorting request (e.g. "name", "creationTime desc")
    // against a whitelist. Falls back to CreationTime descending (newest first).
    private static IOrderedQueryable<PartnerAccount> ApplySorting(
        IQueryable<PartnerAccount> query,
        string? sorting)
    {
        var descending = sorting?.Contains("desc", StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?.Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()
            ?.ToLowerInvariant();

        return (field, descending) switch
        {
            ("name", true) => query.OrderByDescending(x => x.Name),
            ("name", false) => query.OrderBy(x => x.Name),
            _ => query.OrderByDescending(x => x.CreationTime)
        };
    }

    private async Task<IQueryable<PartnerAccount>> ScopedQueryAsync(
        CancellationToken ct)
    {
        var scope = await _dataScopeProvider.GetAsync(DataScopeOperation.View, ct);
        return (await _partners.GetQueryableAsync())
            .WhereIf(!scope.HasGlobalAccess,
                x => scope.OrganizationIds.Contains(x.OrganizationId));
    }

    private async Task<PartnerAccount> GetScopedAsync(
        Guid id,
        CancellationToken ct,
        DataScopeOperation operation = DataScopeOperation.View)
    {
        var partner = await _partners.FindAsync(id, cancellationToken: ct)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataIntegration.PartnerNotFound);
        var scope = await _dataScopeProvider.GetAsync(operation, ct);
        if (!scope.IncludesOrganization(partner.OrganizationId))
        {
            throw new Volo.Abp.Authorization.AbpAuthorizationException(
                "The partner account is outside the current user's data scope.");
        }
        return partner;
    }

    private static PartnerAccountDto ToDto(PartnerAccount x, int activeKeyCount) =>
        new()
        {
            Id = x.Id,
            OrganizationId = x.OrganizationId,
            Code = x.Code,
            Name = x.Name,
            ExternalSystem = x.ExternalSystem,
            Description = x.Description,
            Status = x.Status,
            AllowedDataTypes = x.GetAllowedDataTypes().ToList(),
            ActiveKeyCount = activeKeyCount,
            CreationTime = x.CreationTime,
        };

    private static PartnerApiKeyDto ToKeyDto(PartnerApiKey key)
    {
        var dto = new PartnerApiKeyDto();
        FillKeyDto(dto, key);
        return dto;
    }

    private static void FillKeyDto(PartnerApiKeyDto dto, PartnerApiKey key)
    {
        dto.Id = key.Id;
        dto.PartnerAccountId = key.PartnerAccountId;
        dto.KeyPrefix = key.KeyPrefix;
        dto.Description = key.Description;
        dto.ExpiresAt = key.ExpiresAt;
        dto.RevokedAt = key.RevokedAt;
        dto.LastUsedAt = key.LastUsedAt;
        dto.CreationTime = key.CreationTime;
    }

    private static InboundSubmissionDto ToSubmissionDto<TDto>(
        TDto dto, InboundSubmission x, Dictionary<Guid, string> partnerNames)
        where TDto : InboundSubmissionDto
    {
        dto.Id = x.Id;
        dto.PartnerAccountId = x.PartnerAccountId;
        dto.PartnerName = partnerNames.GetValueOrDefault(x.PartnerAccountId, "—");
        dto.OrganizationId = x.OrganizationId;
        dto.DataType = x.DataType;
        dto.SchemaVersion = x.SchemaVersion;
        dto.RequestId = x.RequestId;
        dto.CorrelationId = x.CorrelationId;
        dto.RecordCount = x.RecordCount;
        dto.ReceivedAt = x.ReceivedAt;
        dto.Status = x.Status;
        dto.RejectReason = x.RejectReason;
        dto.ProcessedById = x.ProcessedById;
        dto.ProcessedAt = x.ProcessedAt;
        return dto;
    }
}
