using FoodSafe.Organizations;
using FoodSafe.Permissions;
using Volo.Abp;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Domain.Services;
using Volo.Abp.Threading;
using Volo.Abp.Timing;
using Volo.Abp.Users;

namespace FoodSafe.Security;

public sealed record CurrentDataScope(
    Guid UserId,
    Guid? HomeOrganizationId,
    bool HasGlobalAccess,
    IReadOnlySet<Guid> OrganizationIds,
    IReadOnlySet<Guid> ProvinceIds,
    IReadOnlySet<Guid> DistrictIds,
    IReadOnlySet<Guid> CommuneIds)
{
    public bool IncludesOrganization(Guid organizationId) =>
        HasGlobalAccess || OrganizationIds.Contains(organizationId);
}

public interface ICurrentDataScopeProvider
{
    Task<CurrentDataScope> GetAsync(
        DataScopeOperation operation,
        CancellationToken cancellationToken = default);

    Task EnsureOrganizationAccessAsync(
        Guid organizationId,
        DataScopeOperation operation,
        CancellationToken cancellationToken = default);
}

public class CurrentDataScopeProvider : DomainService, ICurrentDataScopeProvider
{
    private readonly ICurrentUser _currentUser;
    private readonly IPermissionChecker _permissionChecker;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IRepository<ManagementScopeAssignment, Guid> _assignments;
    private readonly IClock _clock;
    private readonly ICancellationTokenProvider _cancellationTokens;

    public CurrentDataScopeProvider(
        ICurrentUser currentUser,
        IPermissionChecker permissionChecker,
        IRepository<AppUserProfile, Guid> profiles,
        IRepository<Organization, Guid> organizations,
        IRepository<ManagementScopeAssignment, Guid> assignments,
        IClock clock,
        ICancellationTokenProvider cancellationTokens)
    {
        _currentUser = currentUser;
        _permissionChecker = permissionChecker;
        _profiles = profiles;
        _organizations = organizations;
        _assignments = assignments;
        _clock = clock;
        _cancellationTokens = cancellationTokens;
    }

    public async Task<CurrentDataScope> GetAsync(
        DataScopeOperation operation,
        CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.Id.HasValue)
        {
            throw new AbpAuthorizationException("Authenticated user is required.");
        }

        cancellationToken = ResolveToken(cancellationToken);
        var userId = _currentUser.Id.Value;
        if (await _permissionChecker.IsGrantedAsync(FoodSafePermissions.DataScope.All))
        {
            return new(
                userId, null, true,
                new HashSet<Guid>(), new HashSet<Guid>(),
                new HashSet<Guid>(), new HashSet<Guid>());
        }

        var profileQuery = await _profiles.GetQueryableAsync();
        var profile = await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(x => x.UserId == userId),
            cancellationToken);
        if (profile is null)
        {
            throw new AbpAuthorizationException("User has no FoodSafe organization assignment.");
        }

        var organizationQuery = await _organizations.GetQueryableAsync();
        var organizations = await AsyncExecuter.ToListAsync(
            organizationQuery.Select(x => new OrganizationScopeNode(
                x.Id, x.ParentId, x.ProvinceId, x.DistrictId, x.CommuneId)),
            cancellationToken);
        var allowedOrganizationIds = OrganizationHierarchyScope.Expand(
            profile.OrganizationId,
            organizations);
        var home = organizations.SingleOrDefault(x => x.Id == profile.OrganizationId)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);

        var provinces = new HashSet<Guid>();
        var districts = new HashSet<Guid>();
        var communes = new HashSet<Guid>();
        AddGeography(home, provinces, districts, communes);

        var assignmentQuery = await _assignments.GetQueryableAsync();
        var now = _clock.Now;
        var assignments = await AsyncExecuter.ToListAsync(
            assignmentQuery.Where(x =>
                x.GranteeOrganizationId == profile.OrganizationId &&
                (!x.GranteeUserId.HasValue || x.GranteeUserId == userId) &&
                x.ValidFrom <= now &&
                (!x.ValidTo.HasValue || now < x.ValidTo.Value)),
            cancellationToken);

        foreach (var assignment in assignments.Where(x =>
                     x.ScopeType == ManagementScopeType.Geography && x.Allows(operation)))
        {
            if (assignment.ProvinceId.HasValue) provinces.Add(assignment.ProvinceId.Value);
            if (assignment.DistrictId.HasValue) districts.Add(assignment.DistrictId.Value);
            if (assignment.CommuneId.HasValue) communes.Add(assignment.CommuneId.Value);
        }

        return new(
            userId,
            profile.OrganizationId,
            false,
            allowedOrganizationIds,
            provinces,
            districts,
            communes);
    }

    public async Task EnsureOrganizationAccessAsync(
        Guid organizationId,
        DataScopeOperation operation,
        CancellationToken cancellationToken = default)
    {
        var scope = await GetAsync(operation, cancellationToken);
        if (!scope.IncludesOrganization(organizationId))
        {
            throw new AbpAuthorizationException("The resource is outside the current user's data scope.");
        }
    }

    private CancellationToken ResolveToken(CancellationToken supplied) =>
        supplied == default ? _cancellationTokens.Token : supplied;

    private static void AddGeography(
        OrganizationScopeNode organization,
        ISet<Guid> provinces,
        ISet<Guid> districts,
        ISet<Guid> communes)
    {
        if (organization.ProvinceId.HasValue) provinces.Add(organization.ProvinceId.Value);
        if (organization.DistrictId.HasValue) districts.Add(organization.DistrictId.Value);
        if (organization.CommuneId.HasValue) communes.Add(organization.CommuneId.Value);
    }
}
