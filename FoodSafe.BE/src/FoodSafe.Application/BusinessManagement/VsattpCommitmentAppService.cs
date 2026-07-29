using FoodSafe.Application.Contracts.BusinessManagement;
using FoodSafe.BusinessManagement;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Authorization;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Threading;
using Volo.Abp.Users;

namespace FoodSafe.BusinessManagement;

[Authorize(FoodSafePermissions.Licensing.VsattpCommitments.View)]
public class VsattpCommitmentAppService : ApplicationService
{
    private readonly IRepository<VsattpCommitment, Guid> _commitments;
    private readonly IRepository<Business, Guid> _businesses;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly ICurrentUser _currentUser;

    public VsattpCommitmentAppService(
        IRepository<VsattpCommitment, Guid> commitments,
        IRepository<Business, Guid> businesses,
        ICurrentDataScopeProvider dataScopeProvider,
        ICancellationTokenProvider cancellationTokens,
        ICurrentUser currentUser)
    {
        _commitments = commitments;
        _businesses = businesses;
        _dataScopeProvider = dataScopeProvider;
        _cancellationTokens = cancellationTokens;
        _currentUser = currentUser;
    }

    public async Task<PagedResultDto<VsattpCommitmentDto>> GetListAsync(
        VsattpCommitmentListInput input)
    {
        var query = await ScopedQueryAsync(DataScopeOperation.View);
        if (input.BusinessId.HasValue)
            query = query.Where(x => x.BusinessId == input.BusinessId.Value);
        if (input.OrganizationId.HasValue)
            query = query.Where(x => x.OrganizationId == input.OrganizationId.Value);
        if (input.Status.HasValue)
            query = query.Where(x => x.Status == input.Status.Value);

        var total = await AsyncExecuter.LongCountAsync(
            query, _cancellationTokens.Token);
        var rows = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(x => x.CreationTime)
                 .Skip(input.SkipCount)
                 .Take(input.MaxResultCount),
            _cancellationTokens.Token);

        return new PagedResultDto<VsattpCommitmentDto>(
            total, rows.Select(MapToDto).ToList());
    }

    public async Task<VsattpCommitmentDto> GetAsync(Guid id)
    {
        var record = await GetScopedAsync(id, DataScopeOperation.View);
        return MapToDto(record);
    }

    [Authorize(FoodSafePermissions.Licensing.VsattpCommitments.Create)]
    public async Task<VsattpCommitmentDto> CreateAsync(
        CreateVsattpCommitmentDto input)
    {
        var business = await GetScopedBusinessAsync(
            input.BusinessId, DataScopeOperation.Create);

        var record = VsattpCommitment.Create(
            GuidGenerator.Create(),
            input.BusinessId,
            business.OrganizationId,
            input.CommitmentDate,
            input.Notes);

        await _commitments.InsertAsync(record, cancellationToken: _cancellationTokens.Token);
        return MapToDto(record);
    }

    [Authorize(FoodSafePermissions.Licensing.VsattpCommitments.Edit)]
    public async Task<VsattpCommitmentDto> UpdateAsync(
        Guid id, UpdateVsattpCommitmentDto input)
    {
        var record = await GetScopedAsync(id, DataScopeOperation.Edit);
        record.Update(input.CommitmentDate, input.Notes);
        await _commitments.UpdateAsync(record, cancellationToken: _cancellationTokens.Token);
        return MapToDto(record);
    }

    [Authorize(FoodSafePermissions.Licensing.VsattpCommitments.Confirm)]
    public async Task<VsattpCommitmentDto> ConfirmAsync(Guid id)
    {
        var record = await GetScopedAsync(id, DataScopeOperation.Edit);
        record.Confirm(
            _currentUser.Id ?? throw new AbpException("User ID is required."),
            Clock.Now);
        await _commitments.UpdateAsync(record, cancellationToken: _cancellationTokens.Token);

        // Sync HasVsattpCommitment flag on Business
        var business = await AsyncExecuter.FirstOrDefaultAsync(
            (await _businesses.GetQueryableAsync())
                .Where(b => b.Id == record.BusinessId),
            _cancellationTokens.Token);
        if (business is not null)
        {
            business.ConfirmVsattpCommitment();
            await _businesses.UpdateAsync(business, cancellationToken: _cancellationTokens.Token);
        }

        return MapToDto(record);
    }

    [Authorize(FoodSafePermissions.Licensing.VsattpCommitments.Delete)]
    public async Task DeleteAsync(Guid id)
    {
        var record = await GetScopedAsync(id, DataScopeOperation.Edit);
        if (record.Status == VsattpCommitmentStatus.Confirmed)
            throw new BusinessException(
                FoodSafeDomainErrorCodes.Business.CannotModifyConfirmedCommitment);
        await _commitments.DeleteAsync(record, cancellationToken: _cancellationTokens.Token);
    }

    private async Task<IQueryable<VsattpCommitment>> ScopedQueryAsync(
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation, _cancellationTokens.Token);
        var query = await _commitments.GetQueryableAsync();
        if (scope.HasGlobalAccess) return query;
        return query.Where(x => scope.OrganizationIds.Contains(x.OrganizationId));
    }

    private async Task<VsattpCommitment> GetScopedAsync(
        Guid id, DataScopeOperation operation)
    {
        var query = await ScopedQueryAsync(operation);
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The VSATTP commitment is outside the current user's data scope.");
    }

    private async Task<Business> GetScopedBusinessAsync(
        Guid id, DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(
            operation, _cancellationTokens.Token);
        var query = await _businesses.GetQueryableAsync();
        if (!scope.HasGlobalAccess)
            query = query.Where(x =>
                scope.OrganizationIds.Contains(x.OrganizationId));
        return await AsyncExecuter.FirstOrDefaultAsync(
                   query.Where(x => x.Id == id),
                   _cancellationTokens.Token)
               ?? throw new AbpAuthorizationException(
                   "The business is outside the current user's data scope.");
    }

    private static VsattpCommitmentDto MapToDto(VsattpCommitment record) =>
        new()
        {
            Id = record.Id,
            BusinessId = record.BusinessId,
            OrganizationId = record.OrganizationId,
            CommitmentDate = record.CommitmentDate,
            Notes = record.Notes,
            Status = record.Status,
            ConfirmedByUserId = record.ConfirmedByUserId,
            ConfirmedAt = record.ConfirmedAt,
            CreationTime = record.CreationTime
        };
}
