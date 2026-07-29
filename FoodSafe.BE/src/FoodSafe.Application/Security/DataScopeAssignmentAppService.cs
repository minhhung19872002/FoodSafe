using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Volo.Abp;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Threading;
using Volo.Abp.Timing;

namespace FoodSafe.Security;

[RemoteService(IsEnabled = false)]
[Authorize(FoodSafePermissions.SystemAdministration.Users.ManageScope)]
public class DataScopeAssignmentAppService :
    ApplicationService,
    IDataScopeAssignmentAppService
{
    private readonly IRepository<ManagementScopeAssignment, Guid> _assignments;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IRepository<IdentityUser, Guid> _users;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IClock _clock;

    public DataScopeAssignmentAppService(
        IRepository<ManagementScopeAssignment, Guid> assignments,
        IRepository<AppUserProfile, Guid> profiles,
        IRepository<IdentityUser, Guid> users,
        ICancellationTokenProvider cancellationTokens,
        IClock clock)
    {
        _assignments = assignments;
        _profiles = profiles;
        _users = users;
        _cancellationTokens = cancellationTokens;
        _clock = clock;
    }

    private CancellationToken Token => _cancellationTokens.Token;

    public async Task<PagedResultDto<DataScopeAssignmentDto>> GetAssignmentsAsync(
        DataScopeAssignmentListInput input)
    {
        var query = await _assignments.GetQueryableAsync();

        query = input.ScopeType switch
        {
            ManagementScopeType.Business => input.BusinessId.HasValue
                ? query.Where(a =>
                    a.ScopeType == ManagementScopeType.Business &&
                    a.BusinessId == input.BusinessId)
                : query.Where(a => a.ScopeType == ManagementScopeType.Business),
            ManagementScopeType.BusinessType => input.BusinessTypeId.HasValue
                ? query.Where(a =>
                    a.ScopeType == ManagementScopeType.BusinessType &&
                    a.BusinessTypeId == input.BusinessTypeId)
                : query.Where(a => a.ScopeType == ManagementScopeType.BusinessType),
            ManagementScopeType.ProductGroup => input.ProductGroupId.HasValue
                ? query.Where(a =>
                    a.ScopeType == ManagementScopeType.ProductGroup &&
                    a.ProductGroupId == input.ProductGroupId)
                : query.Where(a => a.ScopeType == ManagementScopeType.ProductGroup),
            _ => throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope)
        };

        var total = await AsyncExecuter.CountAsync(query, Token);
        var rows = await AsyncExecuter.ToListAsync(
            query.OrderByDescending(a => a.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            Token);

        var userIds = rows
            .Where(r => r.GranteeUserId.HasValue)
            .Select(r => r.GranteeUserId!.Value)
            .Distinct()
            .ToArray();

        var userQuery = await _users.GetQueryableAsync();
        var resolvedUsers = await AsyncExecuter.ToListAsync(
            userQuery
                .Where(u => userIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name, u.UserName }),
            Token);
        var userNames = resolvedUsers.ToDictionary(
            u => u.Id,
            u => u.Name ?? u.UserName ?? u.Id.ToString());

        var dtos = rows.Select(r => MapToDto(r, userNames)).ToList();
        return new PagedResultDto<DataScopeAssignmentDto>(total, dtos);
    }

    public async Task<DataScopeAssignmentDto> CreateAssignmentAsync(
        CreateDataScopeAssignmentInput input)
    {
        var now = _clock.Now;
        var validFrom = input.ValidFrom ?? now;

        if (!input.GranteeUserId.HasValue)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope);
        }

        var profileQuery = await _profiles.GetQueryableAsync();
        var profile = await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(p => p.UserId == input.GranteeUserId.Value),
            Token);
        if (profile is null)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);
        }

        var organizationId = profile.OrganizationId;

        ManagementScopeAssignment assignment = input.ScopeType switch
        {
            ManagementScopeType.Business when input.BusinessId.HasValue =>
                ManagementScopeAssignment.CreateBusiness(
                    GuidGenerator.Create(),
                    organizationId,
                    input.GranteeUserId,
                    input.BusinessId.Value,
                    input.CanView,
                    input.CanCreate,
                    input.CanEdit,
                    input.CanDelete,
                    validFrom,
                    input.ValidTo,
                    now,
                    CurrentUser.Id),

            ManagementScopeType.BusinessType when input.BusinessTypeId.HasValue =>
                ManagementScopeAssignment.CreateBusinessType(
                    GuidGenerator.Create(),
                    organizationId,
                    input.GranteeUserId,
                    input.BusinessTypeId.Value,
                    input.CanView,
                    input.CanCreate,
                    input.CanEdit,
                    input.CanDelete,
                    validFrom,
                    input.ValidTo,
                    now,
                    CurrentUser.Id),

            ManagementScopeType.ProductGroup when input.ProductGroupId.HasValue =>
                ManagementScopeAssignment.CreateProductGroup(
                    GuidGenerator.Create(),
                    organizationId,
                    input.GranteeUserId,
                    input.ProductGroupId.Value,
                    input.CanView,
                    input.CanCreate,
                    input.CanEdit,
                    input.CanDelete,
                    validFrom,
                    input.ValidTo,
                    now,
                    CurrentUser.Id),

            _ => throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope)
        };

        await _assignments.InsertAsync(assignment, true, Token);

        var userQuery = await _users.GetQueryableAsync();
        var user = await AsyncExecuter.FirstOrDefaultAsync(
            userQuery
                .Where(u => u.Id == input.GranteeUserId.Value)
                .Select(u => new { u.Name, u.UserName }),
            Token);

        return MapToDto(assignment, new Dictionary<Guid, string>
        {
            [input.GranteeUserId.Value] = user?.Name ?? user?.UserName ?? string.Empty
        });
    }

    public Task DeleteAssignmentAsync(Guid id) =>
        _assignments.DeleteAsync(id, true, Token);

    private static DataScopeAssignmentDto MapToDto(
        ManagementScopeAssignment r,
        IReadOnlyDictionary<Guid, string> userNames) =>
        new()
        {
            Id = r.Id,
            ScopeType = r.ScopeType,
            GranteeUserId = r.GranteeUserId,
            GranteeUserName = r.GranteeUserId.HasValue
                ? userNames.GetValueOrDefault(r.GranteeUserId.Value)
                : null,
            BusinessId = r.BusinessId,
            BusinessTypeId = r.BusinessTypeId,
            ProductGroupId = r.ProductGroupId,
            CanView = r.CanView,
            CanCreate = r.CanCreate,
            CanEdit = r.CanEdit,
            CanDelete = r.CanDelete,
            ValidFrom = r.ValidFrom,
            ValidTo = r.ValidTo
        };
}
