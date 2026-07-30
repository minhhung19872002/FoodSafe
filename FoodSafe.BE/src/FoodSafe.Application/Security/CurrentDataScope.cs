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
    bool HasRestrictedScope,
    IReadOnlySet<Guid> OrganizationIds,
    IReadOnlySet<Guid> ProvinceIds,
    IReadOnlySet<Guid> CommuneIds,
    IReadOnlySet<Guid>? BusinessIds = null,
    IReadOnlySet<Guid>? BusinessTypeIds = null,
    IReadOnlySet<Guid>? ProductGroupIds = null)
{
    public bool IncludesOrganization(Guid organizationId) =>
        HasGlobalAccess || OrganizationIds.Contains(organizationId);

    public bool IncludesBusiness(Guid businessId) =>
        HasGlobalAccess || (BusinessIds?.Contains(businessId) ?? false);

    public bool IncludesBusinessType(Guid? businessTypeId) =>
        HasGlobalAccess ||
        (businessTypeId.HasValue &&
         (BusinessTypeIds?.Contains(businessTypeId.Value) ?? false));

    public bool IncludesProductGroup(Guid productGroupId) =>
        HasGlobalAccess || (ProductGroupIds?.Contains(productGroupId) ?? false);
}

public sealed record DataScopeBundle(
    CurrentDataScope View,
    CurrentDataScope Edit,
    CurrentDataScope Delete);

public interface ICurrentDataScopeProvider
{
    Task<CurrentDataScope> GetAsync(
        DataScopeOperation operation,
        CancellationToken cancellationToken = default);

    Task<DataScopeBundle> GetBundleAsync(
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
        var ctx = await LoadContextAsync(cancellationToken);
        return ctx is null
            ? throw new AbpAuthorizationException("Authenticated user is required.")
            : BuildScope(ctx.Value, operation);
    }

    public async Task<DataScopeBundle> GetBundleAsync(
        CancellationToken cancellationToken = default)
    {
        var loaded = await LoadContextAsync(cancellationToken);
        if (loaded is null)
            throw new AbpAuthorizationException("Authenticated user is required.");
        var ctx = loaded.Value;
        return new DataScopeBundle(
            BuildScope(ctx, DataScopeOperation.View),
            BuildScope(ctx, DataScopeOperation.Edit),
            BuildScope(ctx, DataScopeOperation.Delete));
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

    private readonly record struct ScopeContext(
        Guid UserId,
        Guid? HomeOrganizationId,
        bool IsGlobal,
        HashSet<Guid> AllowedOrganizationIds,
        OrganizationScopeNode? Home,
        bool HasUserSpecificAssignments,
        IReadOnlyList<ManagementScopeAssignment> Assignments);

    private async Task<ScopeContext?> LoadContextAsync(CancellationToken cancellationToken)
    {
        if (!_currentUser.IsAuthenticated || !_currentUser.Id.HasValue)
            return null;

        cancellationToken = ResolveToken(cancellationToken);
        var userId = _currentUser.Id.Value;

        var profileQuery = await _profiles.GetQueryableAsync();
        var profile = await AsyncExecuter.FirstOrDefaultAsync(
            profileQuery.Where(x => x.UserId == userId),
            cancellationToken);

        if (await _permissionChecker.IsGrantedAsync(FoodSafePermissions.DataScope.All))
        {
            var homeOrgId = profile?.OrganizationId;
            var orgIds = homeOrgId.HasValue
                ? new HashSet<Guid> { homeOrgId.Value }
                : new HashSet<Guid>();

            return new ScopeContext(userId, homeOrgId, true, orgIds, null, false, []);
        }

        if (profile is null)
            throw new AbpAuthorizationException("User has no FoodSafe organization assignment.");

        var organizationQuery = await _organizations.GetQueryableAsync();
        var organizations = await AsyncExecuter.ToListAsync(
            organizationQuery.Select(x => new OrganizationScopeNode(
                x.Id, x.ParentId, x.ProvinceId, x.CommuneId)),
            cancellationToken);
        var home = organizations.SingleOrDefault(x => x.Id == profile.OrganizationId)
            ?? throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.OrganizationNotFound);

        var assignmentQuery = await _assignments.GetQueryableAsync();
        var now = _clock.Now;
        var assignments = await AsyncExecuter.ToListAsync(
            assignmentQuery.Where(x =>
                x.GranteeOrganizationId == profile.OrganizationId &&
                (!x.GranteeUserId.HasValue || x.GranteeUserId == userId) &&
                x.ValidFrom <= now &&
                (!x.ValidTo.HasValue || now < x.ValidTo.Value)),
            cancellationToken);

        var hasUserSpecific = assignments.Any(x => x.GranteeUserId == userId);

        var allowedOrganizationIds = hasUserSpecific
            ? new HashSet<Guid>()
            : OrganizationHierarchyScope.Expand(profile.OrganizationId, organizations);

        return new ScopeContext(
            userId, profile.OrganizationId, false,
            allowedOrganizationIds, home, hasUserSpecific, assignments);
    }

    private static CurrentDataScope BuildScope(ScopeContext ctx, DataScopeOperation operation)
    {
        if (ctx.IsGlobal)
        {
            return new(
                ctx.UserId, ctx.HomeOrganizationId, true, false,
                ctx.AllowedOrganizationIds, new HashSet<Guid>(),
                new HashSet<Guid>(),
                new HashSet<Guid>(), new HashSet<Guid>(),
                new HashSet<Guid>());
        }

        var provinces = new HashSet<Guid>();
        var communes = new HashSet<Guid>();
        var businesses = new HashSet<Guid>();
        var businessTypes = new HashSet<Guid>();
        var productGroups = new HashSet<Guid>();

        if (!ctx.HasUserSpecificAssignments && ctx.Home is not null)
            AddGeography(ctx.Home, provinces, communes);

        var effectiveAssignments = ctx.HasUserSpecificAssignments
            ? ctx.Assignments.Where(x => x.GranteeUserId == ctx.UserId)
            : ctx.Assignments;

        foreach (var assignment in effectiveAssignments.Where(x => x.Allows(operation)))
        {
            switch (assignment.ScopeType)
            {
                case ManagementScopeType.Geography:
                    // Chọn kèm phường/xã nghĩa là giới hạn đúng phường/xã đó,
                    // không phải toàn bộ tỉnh chứa nó.
                    if (assignment.CommuneId.HasValue)
                        communes.Add(assignment.CommuneId.Value);
                    else if (assignment.ProvinceId.HasValue)
                        provinces.Add(assignment.ProvinceId.Value);
                    break;
                case ManagementScopeType.Business when assignment.BusinessId.HasValue:
                    businesses.Add(assignment.BusinessId.Value);
                    break;
                case ManagementScopeType.BusinessType when assignment.BusinessTypeId.HasValue:
                    businessTypes.Add(assignment.BusinessTypeId.Value);
                    break;
                case ManagementScopeType.ProductGroup when assignment.ProductGroupId.HasValue:
                    productGroups.Add(assignment.ProductGroupId.Value);
                    break;
            }
        }

        return new(
            ctx.UserId,
            ctx.HomeOrganizationId,
            false,
            ctx.HasUserSpecificAssignments,
            ctx.AllowedOrganizationIds,
            provinces,
            communes,
            businesses,
            businessTypes,
            productGroups);
    }

    private CancellationToken ResolveToken(CancellationToken supplied) =>
        supplied == default ? _cancellationTokens.Token : supplied;

    // Đơn vị cấp xã/phường luôn có cả ProvinceId lẫn CommuneId. Nếu đưa cả
    // ProvinceId vào phạm vi thì nhân viên cấp xã sẽ thấy mọi cơ sở trong tỉnh
    // — kể cả cơ sở do đơn vị cấp trên quản lý. Chỉ đơn vị cấp tỉnh mới được
    // phạm vi toàn tỉnh.
    private static void AddGeography(
        OrganizationScopeNode organization,
        ISet<Guid> provinces,
        ISet<Guid> communes)
    {
        if (organization.IsCommuneScoped)
        {
            communes.Add(organization.CommuneId!.Value);
            return;
        }
        if (organization.ProvinceId.HasValue) provinces.Add(organization.ProvinceId.Value);
    }
}
