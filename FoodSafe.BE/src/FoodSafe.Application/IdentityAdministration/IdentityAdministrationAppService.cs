using System.Security.Cryptography;
using FoodSafe.Organizations;
using FoodSafe.Permissions;
using FoodSafe.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Volo.Abp;
using Volo.Abp.Account;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Application.Services;
using Volo.Abp.AuditLogging;
using Volo.Abp.Authorization;
using Volo.Abp.Authorization.Permissions;
using Volo.Abp.Data;
using Volo.Abp.Domain.Repositories;
using Volo.Abp.Identity;
using Volo.Abp.Localization;
using Volo.Abp.PermissionManagement;
using Volo.Abp.Threading;
using Volo.Abp.Timing;
using Volo.Abp.Users;
using IdentityRole = Volo.Abp.Identity.IdentityRole;
using IdentityOptions = Microsoft.AspNetCore.Identity.IdentityOptions;
using IdentityUser = Volo.Abp.Identity.IdentityUser;

namespace FoodSafe.IdentityAdministration;

[RemoteService(IsEnabled = false)]
public class IdentityAdministrationAppService :
    ApplicationService,
    IIdentityAdministrationAppService
{
    private const string RoleProviderName = "R";
    private const string RoleDescriptionProperty = "Description";
    private const string RoleActiveProperty = "IsActive";
    private const int MaximumRoleCount = 500;

    // Mirrors AccountSecurityAppService's SEC-04 default so an admin-set
    // password expires on the same schedule as a self-service change.
    private const int DefaultPasswordValidityDays = 90;

    private readonly TimeSpan _passwordValidity;
    private readonly IRepository<IdentityUser, Guid> _users;
    private readonly IIdentityUserRepository _identityUsers;
    private readonly IdentityUserManager _userManager;
    private readonly IRepository<AppUserProfile, Guid> _profiles;
    private readonly IRepository<ManagementScopeAssignment, Guid> _scopeAssignments;
    private readonly IRepository<Organization, Guid> _organizations;
    private readonly IIdentityRoleRepository _roles;
    private readonly IdentityRoleManager _roleManager;
    private readonly ICurrentDataScopeProvider _dataScopeProvider;
    private readonly IAuditLogRepository _auditLogs;
    private readonly IPermissionDefinitionManager _permissionDefinitions;
    private readonly IPermissionManager _permissionManager;
    private readonly IPermissionChecker _permissionChecker;
    private readonly IAccountAppService _accountAppService;
    private readonly IOptions<IdentityOptions> _identityOptions;
    private readonly ICancellationTokenProvider _cancellationTokens;
    private readonly IClock _clock;

    public IdentityAdministrationAppService(
        IRepository<IdentityUser, Guid> users,
        IIdentityUserRepository identityUsers,
        IdentityUserManager userManager,
        IRepository<AppUserProfile, Guid> profiles,
        IRepository<ManagementScopeAssignment, Guid> scopeAssignments,
        IRepository<Organization, Guid> organizations,
        IIdentityRoleRepository roles,
        IdentityRoleManager roleManager,
        ICurrentDataScopeProvider dataScopeProvider,
        IAuditLogRepository auditLogs,
        IPermissionDefinitionManager permissionDefinitions,
        IPermissionManager permissionManager,
        IPermissionChecker permissionChecker,
        IAccountAppService accountAppService,
        IOptions<IdentityOptions> identityOptions,
        ICancellationTokenProvider cancellationTokens,
        IClock clock,
        IConfiguration configuration)
    {
        var validityDays = configuration.GetValue(
            "Security:PasswordValidityDays",
            DefaultPasswordValidityDays);
        _passwordValidity = TimeSpan.FromDays(
            validityDays > 0 ? validityDays : DefaultPasswordValidityDays);
        _users = users;
        _identityUsers = identityUsers;
        _userManager = userManager;
        _profiles = profiles;
        _scopeAssignments = scopeAssignments;
        _organizations = organizations;
        _roles = roles;
        _roleManager = roleManager;
        _dataScopeProvider = dataScopeProvider;
        _auditLogs = auditLogs;
        _permissionDefinitions = permissionDefinitions;
        _permissionManager = permissionManager;
        _permissionChecker = permissionChecker;
        _accountAppService = accountAppService;
        _identityOptions = identityOptions;
        _cancellationTokens = cancellationTokens;
        _clock = clock;
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Default)]
    public async Task<PagedResultDto<AdminUserDto>> GetUsersAsync(
        GetAdminUserListInput input)
    {
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.View,
            Token);
        var query = await CreateUserQueryAsync(scope, input);
        var totalCount = await AsyncExecuter.CountAsync(query, Token);
        var rows = await AsyncExecuter.ToListAsync(
            ApplyUserSorting(query, input.Sorting)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount),
            Token);

        var roleNames = await GetRoleNamesAsync(rows.Select(row => row.Id));
        var items = rows.Select(row => MapUser(row, roleNames, [])).ToList();
        return new PagedResultDto<AdminUserDto>(totalCount, items);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Default)]
    public async Task<AdminUserDto> GetUserAsync(Guid id)
    {
        var row = await GetScopedUserAsync(id, DataScopeOperation.View);
        var roleNames = await GetRoleNamesAsync([id]);
        var assignments = await GetScopeAssignmentsAsync(id);
        return MapUser(row, roleNames, assignments);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Create)]
    public async Task<CreatedAdminUserDto> CreateUserAsync(CreateAdminUserDto input)
    {
        await AuthorizationService.CheckAsync(
            FoodSafePermissions.SystemAdministration.Users.ManageRoles);
        await AuthorizationService.CheckAsync(
            FoodSafePermissions.SystemAdministration.Users.ManageScope);

        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Create,
            Token);
        var organization = await GetAllowedOrganizationAsync(
            input.OrganizationId,
            scope);
        var roleNames = NormalizeRoleNames(input.RoleNames);
        await EnsureRolesCanBeAssignedAsync(roleNames, scope, organization.Level);
        await EnsureGeographyScopesAllowedAsync(input.GeographyScopes, scope);
        await _identityOptions.SetAsync();

        var email = input.Email.Trim();
        var user = new IdentityUser(
            GuidGenerator.Create(),
            input.UserName.Trim(),
            email,
            CurrentTenant.Id)
        {
            Name = input.FullName.Trim()
        };
        user.SetShouldChangePasswordOnNextLogin(true);

        // Handed back to the administrator so the account is usable even when
        // the notification email cannot be delivered (FR STT 2). Same generator
        // as the "cấp lại mật khẩu" action, which already returns its result.
        var temporaryPassword = GenerateCompliantPassword();
        (await _userManager.CreateAsync(user, temporaryPassword)).CheckErrors();
        (await _userManager.SetPhoneNumberAsync(
            user,
            NormalizeOptional(input.PhoneNumber))).CheckErrors();
        (await _userManager.SetRolesAsync(user, roleNames)).CheckErrors();

        var profile = AppUserProfile.Create(
            GuidGenerator.Create(),
            user.Id,
            organization.Id,
            input.FullName,
            _clock.Now);
        profile.ChangeDetails(
            organization.Id,
            input.FullName,
            input.Position,
            input.Department,
            _clock.Now);
        await _profiles.InsertAsync(profile, cancellationToken: Token);
        await ReplaceScopeAssignmentsAsync(
            user.Id,
            organization.Id,
            input.GeographyScopes);
        await CurrentUnitOfWork!.SaveChangesAsync(Token);

        // Best-effort: a mail-server outage must not roll back the account the
        // administrator just filled in. They still hold the temporary password.
        var notificationSent = await TrySendPasswordResetEmailAsync(email);

        return new CreatedAdminUserDto
        {
            User = await GetUserAsync(user.Id),
            TemporaryPassword = temporaryPassword,
            NotificationEmailSent = notificationSent
        };
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Edit)]
    public async Task<AdminUserDto> UpdateUserAsync(
        Guid id,
        UpdateAdminUserDto input)
    {
        await AuthorizationService.CheckAsync(
            FoodSafePermissions.SystemAdministration.Users.ManageRoles);
        await AuthorizationService.CheckAsync(
            FoodSafePermissions.SystemAdministration.Users.ManageScope);

        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);
        var scope = await _dataScopeProvider.GetAsync(
            DataScopeOperation.Edit,
            Token);
        var organization = await GetAllowedOrganizationAsync(
            input.OrganizationId,
            scope);
        var roleNames = NormalizeRoleNames(input.RoleNames);
        await EnsureRolesCanBeAssignedAsync(roleNames, scope, organization.Level);
        await EnsureGeographyScopesAllowedAsync(input.GeographyScopes, scope);

        var currentRoleNames = (await _identityUsers.GetRoleNamesAsync(id, Token))
            .ToArray();
        IdentityAdministrationRules.EnsureSelfAdministratorRoleRemains(
            CurrentUser.GetId(),
            id,
            currentRoleNames,
            roleNames);
        IdentityAdministrationRules.EnsureAdministratorRemains(
            currentRoleNames,
            roleNames,
            await GetAdministratorCountAsync());

        await _identityOptions.SetAsync();
        var user = await _userManager.GetByIdAsync(id);
        user.SetConcurrencyStampIfNotNull(input.ConcurrencyStamp);
        var email = input.Email.Trim();
        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            // The login name is set once at creation and stays put. Renaming it
            // alongside the email — as this used to — would silently change how
            // the person signs in and break the audit trail's user references.
            (await _userManager.SetEmailAsync(user, email)).CheckErrors();
        }
        (await _userManager.SetPhoneNumberAsync(
            user,
            NormalizeOptional(input.PhoneNumber))).CheckErrors();
        user.Name = input.FullName.Trim();
        (await _userManager.SetRolesAsync(user, roleNames)).CheckErrors();
        (await _userManager.UpdateSecurityStampAsync(user)).CheckErrors();
        (await _userManager.UpdateAsync(user)).CheckErrors();

        if (existing.Profile is null)
        {
            var profile = AppUserProfile.Create(
                GuidGenerator.Create(),
                id,
                organization.Id,
                input.FullName,
                _clock.Now);
            profile.ChangeDetails(
                organization.Id,
                input.FullName,
                input.Position,
                input.Department,
                _clock.Now);
            await _profiles.InsertAsync(profile, cancellationToken: Token);
        }
        else
        {
            existing.Profile.ChangeDetails(
                organization.Id,
                input.FullName,
                input.Position,
                input.Department,
                _clock.Now);
            await _profiles.UpdateAsync(existing.Profile, cancellationToken: Token);
        }
        await ReplaceScopeAssignmentsAsync(
            id,
            organization.Id,
            input.GeographyScopes);
        await CurrentUnitOfWork!.SaveChangesAsync(Token);
        return await GetUserAsync(id);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Delete)]
    public async Task DeleteUserAsync(Guid id)
    {
        IdentityAdministrationRules.EnsureNotSelf(CurrentUser.GetId(), id);
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Delete);
        var roles = (await _identityUsers.GetRoleNamesAsync(id, Token)).ToArray();
        IdentityAdministrationRules.EnsureAdministratorRemains(
            roles,
            [],
            await GetAdministratorCountAsync());

        var assignmentQuery = await _scopeAssignments.GetQueryableAsync();
        var assignments = await AsyncExecuter.ToListAsync(
            assignmentQuery.Where(assignment => assignment.GranteeUserId == id),
            Token);
        if (assignments.Count > 0)
        {
            await _scopeAssignments.DeleteManyAsync(
                assignments,
                cancellationToken: Token);
        }
        if (existing.Profile is not null)
        {
            await _profiles.DeleteAsync(
                existing.Profile,
                cancellationToken: Token);
        }
        // Re-fetch a fully-loaded, tracked user: the scoped projection above does
        // not include the navigation collections (Roles, Claims, Logins, Tokens,
        // OrganizationUnits) that IdentityUserManager.DeleteAsync dereferences, so
        // deleting the projected instance throws NullReferenceException.
        var user = await _userManager.GetByIdAsync(existing.Id);
        (await _userManager.DeleteAsync(user)).CheckErrors();
        await CurrentUnitOfWork!.SaveChangesAsync(Token);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.ResetPassword)]
    public async Task<GeneratedPasswordDto> GenerateRandomPasswordAsync(Guid id)
    {
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);
        await _identityOptions.SetAsync();
        var user = await _userManager.GetByIdAsync(existing.Id);

        var password = GenerateCompliantPassword();
        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        (await _userManager.ResetPasswordAsync(user, resetToken, password))
            .CheckErrors();
        user.SetShouldChangePasswordOnNextLogin(true);
        (await _userManager.UpdateSecurityStampAsync(user)).CheckErrors();
        (await _userManager.UpdateAsync(user)).CheckErrors();
        await CurrentUnitOfWork!.SaveChangesAsync(Token);

        return new GeneratedPasswordDto { Password = password };
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.ResetPassword)]
    public async Task SetUserPasswordAsync(Guid id, SetUserPasswordDto input)
    {
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);
        await _identityOptions.SetAsync();
        var user = await _userManager.GetByIdAsync(existing.Id);

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        (await _userManager.ResetPasswordAsync(user, resetToken, input.NewPassword))
            .CheckErrors();
        // The administrator chose this password deliberately, so it takes
        // effect immediately — unlike the random/temporary password flow,
        // the user must NOT be forced through the initial-password-change
        // screen on their next login.
        user.SetShouldChangePasswordOnNextLogin(false);
        (await _userManager.UpdateSecurityStampAsync(user)).CheckErrors();
        (await _userManager.UpdateAsync(user)).CheckErrors();
        existing.Profile?.RecordPasswordChanged(_clock.Now, _passwordValidity);
        if (existing.Profile is not null)
        {
            await _profiles.UpdateAsync(existing.Profile, cancellationToken: Token);
        }
        await CurrentUnitOfWork!.SaveChangesAsync(Token);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Default)]
    public async Task<ListResultDto<PermissionOptionDto>>
        GetPermissionOptionsAsync()
    {
        var options = (await _permissionDefinitions.GetGroupsAsync())
            .Where(group => group.Name == FoodSafePermissions.GroupName)
            .SelectMany(group => group.GetPermissionsWithChildren())
            .Where(permission => permission.IsEnabled)
            .Select(permission => new PermissionOptionDto
            {
                Name = permission.Name,
                DisplayName = permission.DisplayName?.Localize(
                    StringLocalizerFactory) ?? permission.Name,
                ParentName = permission.Parent?.Name
            })
            .ToList();
        return new ListResultDto<PermissionOptionDto>(options);
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Activate)]
    public async Task SetUserActivationAsync(
        Guid id,
        SetUserActivationDto input)
    {
        IdentityAdministrationRules.EnsureNotSelf(CurrentUser.GetId(), id);
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);
        var roles = (await _identityUsers.GetRoleNamesAsync(id, Token)).ToArray();
        if (!input.IsActive)
        {
            IdentityAdministrationRules.EnsureAdministratorRemains(
                roles,
                [],
                await GetAdministratorCountAsync());
        }

        existing.User.SetIsActive(input.IsActive);
        if (input.IsActive)
        {
            (await _userManager.ResetAccessFailedCountAsync(existing.User))
                .CheckErrors();
        }
        (await _userManager.UpdateSecurityStampAsync(existing.User)).CheckErrors();
        (await _userManager.UpdateAsync(existing.User)).CheckErrors();
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.Lock)]
    public async Task SetUserLockAsync(Guid id, SetUserLockDto input)
    {
        IdentityAdministrationRules.EnsureNotSelf(CurrentUser.GetId(), id);
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);
        if (input.IsLocked)
        {
            var roles = (await _identityUsers.GetRoleNamesAsync(id, Token)).ToArray();
            IdentityAdministrationRules.EnsureAdministratorRemains(
                roles,
                [],
                await GetAdministratorCountAsync());
        }

        (await _userManager.SetLockoutEnabledAsync(existing.User, true)).CheckErrors();
        (await _userManager.SetLockoutEndDateAsync(
            existing.User,
            input.IsLocked ? DateTimeOffset.MaxValue : null)).CheckErrors();
        if (!input.IsLocked)
        {
            (await _userManager.ResetAccessFailedCountAsync(existing.User)).CheckErrors();
        }
        (await _userManager.UpdateSecurityStampAsync(existing.User)).CheckErrors();
        (await _userManager.UpdateAsync(existing.User)).CheckErrors();
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.ResetPassword)]
    public async Task SendPasswordResetAsync(Guid id)
    {
        var existing = await GetScopedUserAsync(id, DataScopeOperation.Edit);

        // This action exists only to send mail, so a failure is a real failure —
        // but the administrator deserves to know why instead of a bare 500.
        if (!await TrySendPasswordResetEmailAsync(existing.User.Email))
        {
            throw new UserFriendlyException(
                "Không gửi được email đặt lại mật khẩu. "
                + "Vui lòng kiểm tra cấu hình máy chủ thư (SMTP) rồi thử lại.");
        }
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Users.ViewActivity)]
    public async Task<PagedResultDto<UserActivityDto>> GetUserActivityAsync(
        Guid id,
        PagedAndSortedResultRequestDto input)
    {
        await GetScopedUserAsync(id, DataScopeOperation.View);
        var totalCount = await _auditLogs.GetCountAsync(
            userId: id,
            cancellationToken: Token);
        var logs = await _auditLogs.GetListAsync(
            sorting: NormalizeAuditSorting(input.Sorting),
            maxResultCount: input.MaxResultCount,
            skipCount: input.SkipCount,
            userId: id,
            includeDetails: false,
            cancellationToken: Token);

        return new PagedResultDto<UserActivityDto>(
            totalCount,
            logs.Select(log => new UserActivityDto
            {
                Id = log.Id,
                ExecutionTime = log.ExecutionTime,
                HttpMethod = log.HttpMethod,
                Url = log.Url,
                HttpStatusCode = log.HttpStatusCode,
                ExecutionDuration = log.ExecutionDuration,
                ClientIpAddress = log.ClientIpAddress,
                CorrelationId = log.CorrelationId,
                HasException = !string.IsNullOrWhiteSpace(log.Exceptions)
            }).ToList());
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Default)]
    public async Task<PagedResultDto<AdminRoleDto>> GetRolesAsync(
        GetAdminRoleListInput input)
    {
        var roles = await _roles.GetListWithUserCountAsync(
            sorting: NormalizeRoleSorting(input.Sorting),
            maxResultCount: MaximumRoleCount,
            filter: null,
            includeDetails: true,
            cancellationToken: Token);
        var normalizedFilter = input.Filter?.Trim();
        var filtered = roles
            .WhereIf(
                input.IsActive.HasValue,
                role => IsRoleActive(role.Role) == input.IsActive)
            .WhereIf(
                !string.IsNullOrWhiteSpace(normalizedFilter),
                role => MatchesRoleFilter(role, normalizedFilter!))
            .ToList();
        var page = filtered
            .Skip(input.SkipCount)
            .Take(input.MaxResultCount)
            .Select(MapRole)
            .ToList();
        return new PagedResultDto<AdminRoleDto>(filtered.Count, page);
    }

    private static bool MatchesRoleFilter(
        IdentityRoleWithUserCount item,
        string filter)
    {
        var description = GetExtraProperty<string>(
            item.Role,
            RoleDescriptionProperty);
        return ContainsIgnoreCase(item.Role.Name, filter) ||
            ContainsIgnoreCase(description, filter);
    }

    private static bool ContainsIgnoreCase(string? value, string filter) =>
        !string.IsNullOrEmpty(value) &&
        value.Contains(filter, StringComparison.OrdinalIgnoreCase);

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Default)]
    public async Task<AdminRoleDto> GetRoleAsync(Guid id)
    {
        var role = await _roleManager.GetByIdAsync(id);
        var userCount = (await _identityUsers.GetUserIdListByRoleIdAsync(id, Token))
            .Count;
        return MapRole(new IdentityRoleWithUserCount(role, userCount));
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Create)]
    public async Task<AdminRoleDto> CreateRoleAsync(CreateAdminRoleDto input)
    {
        var role = new IdentityRole(
            GuidGenerator.Create(),
            input.Name.Trim(),
            CurrentTenant.Id);
        role.SetProperty(
            RoleDescriptionProperty,
            NormalizeOptional(input.Description));
        role.SetProperty(RoleActiveProperty, true);
        (await _roleManager.CreateAsync(role)).CheckErrors();
        await CurrentUnitOfWork!.SaveChangesAsync(Token);
        return MapRole(new IdentityRoleWithUserCount(role, 0));
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Edit)]
    public async Task<AdminRoleDto> UpdateRoleAsync(
        Guid id,
        UpdateAdminRoleDto input)
    {
        var role = await _roleManager.GetByIdAsync(id);
        role.SetConcurrencyStampIfNotNull(input.ConcurrencyStamp);
        var userCount = (await _identityUsers.GetUserIdListByRoleIdAsync(id, Token))
            .Count;
        if (!input.IsActive && userCount > 0)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.RoleInUse);
        }
        if (role.IsStatic &&
            !string.Equals(role.Name, input.Name.Trim(), StringComparison.Ordinal))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
        }
        if (role.IsStatic &&
            role.Name.Equals("SystemAdmin", StringComparison.OrdinalIgnoreCase) &&
            !input.IsActive)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
        }
        if (!string.Equals(role.Name, input.Name.Trim(), StringComparison.Ordinal))
        {
            (await _roleManager.SetRoleNameAsync(role, input.Name.Trim())).CheckErrors();
        }
        role.SetProperty(
            RoleDescriptionProperty,
            NormalizeOptional(input.Description));
        role.SetProperty(RoleActiveProperty, input.IsActive);
        (await _roleManager.UpdateAsync(role)).CheckErrors();
        await CurrentUnitOfWork!.SaveChangesAsync(Token);
        return MapRole(new IdentityRoleWithUserCount(role, userCount));
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Delete)]
    public async Task DeleteRoleAsync(Guid id)
    {
        var role = await _roleManager.GetByIdAsync(id);
        if (role.IsStatic)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
        }
        var userIds = await _identityUsers.GetUserIdListByRoleIdAsync(id, Token);
        if (userIds.Count > 0)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.RoleInUse);
        }
        (await _roleManager.DeleteAsync(role)).CheckErrors();
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Default)]
    public async Task<ListResultDto<RolePermissionGroupDto>>
        GetRolePermissionsAsync(Guid id)
    {
        var role = await _roleManager.GetByIdAsync(id);
        var groups = (await _permissionDefinitions.GetGroupsAsync())
            .Where(group => group.Name == FoodSafePermissions.GroupName)
            .ToList();
        var definitions = groups
            .SelectMany(group => group.GetPermissionsWithChildren())
            .Where(permission => permission.IsEnabled)
            .ToList();
        var grants = await _permissionManager.GetAsync(
            definitions.Select(permission => permission.Name).ToArray(),
            RoleProviderName,
            role.Name);
        var grantMap = grants.Result.ToDictionary(
            grant => grant.Name,
            grant => grant.IsGranted,
            StringComparer.Ordinal);

        var results = groups.Select(group => new RolePermissionGroupDto
        {
            Name = group.Name,
            DisplayName = group.DisplayName?.Localize(StringLocalizerFactory)
                ?? group.Name,
            Permissions = group.GetPermissionsWithChildren()
                .Where(permission => permission.IsEnabled)
                .Select(permission => new RolePermissionDto
                {
                    Name = permission.Name,
                    DisplayName = permission.DisplayName?.Localize(
                        StringLocalizerFactory) ?? permission.Name,
                    ParentName = permission.Parent?.Name,
                    IsGranted = grantMap.GetValueOrDefault(permission.Name)
                })
                .ToList()
        }).ToList();
        return new ListResultDto<RolePermissionGroupDto>(results);
    }

    [Authorize(
        FoodSafePermissions.SystemAdministration.Roles.ManagePermissions)]
    public async Task UpdateRolePermissionsAsync(
        Guid id,
        UpdateRolePermissionsDto input)
    {
        var role = await _roleManager.GetByIdAsync(id);
        var currentUserRoles = await _identityUsers.GetRoleNamesAsync(
            CurrentUser.GetId(),
            Token);
        if (currentUserRoles.Contains(role.Name, StringComparer.OrdinalIgnoreCase))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.SelfPermissionChange);
        }

        var definitions = (await _permissionDefinitions.GetGroupsAsync())
            .Where(group => group.Name == FoodSafePermissions.GroupName)
            .SelectMany(group => group.GetPermissionsWithChildren())
            .Where(permission => permission.IsEnabled)
            .ToDictionary(permission => permission.Name, StringComparer.Ordinal);
        var updates = input.Permissions
            .GroupBy(permission => permission.Name, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.Last().IsGranted);

        if (updates.Keys.Any(name => !definitions.ContainsKey(name)))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
        }
        foreach (var (name, isGranted) in updates.Where(update => update.Value))
        {
            if (!await _permissionChecker.IsGrantedAsync(name))
            {
                throw new AbpAuthorizationException(
                    "A role cannot be granted permissions the current user does not hold.");
            }
            var parent = definitions[name].Parent;
            if (parent is not null &&
                (!updates.TryGetValue(parent.Name, out var parentGranted) ||
                 !parentGranted))
            {
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
            }
        }

        foreach (var definition in definitions.Values)
        {
            await _permissionManager.SetAsync(
                definition.Name,
                RoleProviderName,
                role.Name,
                updates.GetValueOrDefault(definition.Name));
        }
    }

    [Authorize(FoodSafePermissions.SystemAdministration.Roles.Default)]
    public async Task<AllRolesPermissionMatrixDto> GetAllRolesPermissionsAsync()
    {
        var groups = (await _permissionDefinitions.GetGroupsAsync())
            .Where(group => group.Name == FoodSafePermissions.GroupName)
            .ToList();
        var definitions = groups
            .SelectMany(group => group.GetPermissionsWithChildren())
            .Where(permission => permission.IsEnabled)
            .ToList();
        var permissionNames = definitions
            .Select(permission => permission.Name)
            .ToArray();
        var permissionOptions = definitions
            .Select(permission => new PermissionOptionDto
            {
                Name = permission.Name,
                DisplayName = permission.DisplayName?.Localize(
                    StringLocalizerFactory) ?? permission.Name,
                ParentName = permission.Parent?.Name
            })
            .ToList();

        var roles = await _roles.GetListAsync(
            maxResultCount: MaximumRoleCount,
            cancellationToken: Token);
        var roleRows = new List<RolePermissionRowDto>();
        foreach (var role in roles.Where(IsRoleActive))
        {
            var grants = await _permissionManager.GetAsync(
                permissionNames,
                RoleProviderName,
                role.Name);
            var grantMap = grants.Result.ToDictionary(
                grant => grant.Name,
                grant => grant.IsGranted,
                StringComparer.Ordinal);
            roleRows.Add(new RolePermissionRowDto
            {
                Id = role.Id,
                Name = role.Name,
                Grants = grantMap
            });
        }

        return new AllRolesPermissionMatrixDto
        {
            Permissions = permissionOptions,
            Roles = roleRows
        };
    }

    private CancellationToken Token => _cancellationTokens.Token;

    private async Task<IQueryable<AdminUserQueryRow>> CreateUserQueryAsync(
        CurrentDataScope scope,
        GetAdminUserListInput input)
    {
        var userQuery = await _users.GetQueryableAsync();
        var profileQuery = await _profiles.GetQueryableAsync();
        var organizationQuery = await _organizations.GetQueryableAsync();
        var now = _clock.Now;

        var query =
            from user in userQuery
            join profile in profileQuery on user.Id equals profile.UserId
                into userProfiles
            from profile in userProfiles.DefaultIfEmpty()
            join organization in organizationQuery
                on profile.OrganizationId equals organization.Id
                into profileOrganizations
            from organization in profileOrganizations.DefaultIfEmpty()
            select new AdminUserQueryRow
            {
                Id = user.Id,
                User = user,
                Profile = profile,
                OrganizationName = organization == null ? null : organization.Name,
                OrganizationLevel = organization == null ? null : organization.Level
            };

        if (!scope.HasGlobalAccess)
        {
            var allowedOrganizationIds = scope.OrganizationIds.ToArray();
            query = query.Where(
                row => row.Profile != null &&
                       allowedOrganizationIds.Contains(row.Profile.OrganizationId));
        }
        if (input.OrganizationId.HasValue)
        {
            if (!scope.IncludesOrganization(input.OrganizationId.Value))
            {
                throw new AbpAuthorizationException(
                    "The organization filter is outside the current user's scope.");
            }
            query = query.Where(
                row => row.Profile != null &&
                       row.Profile.OrganizationId == input.OrganizationId.Value);
        }
        if (input.RoleId.HasValue)
        {
            query = query.Where(
                row => row.User.Roles.Any(role => role.RoleId == input.RoleId));
        }
        if (input.IsActive.HasValue)
        {
            query = query.Where(row => row.User.IsActive == input.IsActive.Value);
        }
        if (input.IsLocked.HasValue)
        {
            query = input.IsLocked.Value
                ? query.Where(row =>
                    row.User.LockoutEnd.HasValue && row.User.LockoutEnd > now)
                : query.Where(row =>
                    !row.User.LockoutEnd.HasValue || row.User.LockoutEnd <= now);
        }
        if (!string.IsNullOrWhiteSpace(input.Filter))
        {
            var filter = input.Filter.Trim().ToUpperInvariant();
            query = query.Where(row =>
                row.User.NormalizedUserName.Contains(filter) ||
                row.User.NormalizedEmail.Contains(filter) ||
                (row.Profile != null &&
                 row.Profile.FullName.ToUpper().Contains(filter)) ||
                (row.OrganizationName != null &&
                 row.OrganizationName.ToUpper().Contains(filter)));
        }
        if (!string.IsNullOrWhiteSpace(input.PermissionName))
        {
            var roleIds = await GetRoleIdsGrantedAsync(
                input.PermissionName.Trim());
            query = query.Where(row =>
                row.User.Roles.Any(role => roleIds.Contains(role.RoleId)));
        }

        return query;
    }

    private async Task<List<Guid>> GetRoleIdsGrantedAsync(string permissionName)
    {
        var granted = new List<Guid>();
        var definition = await _permissionDefinitions.GetOrNullAsync(
            permissionName);
        if (definition is null)
        {
            return granted;
        }

        var roles = await _roles.GetListAsync(
            maxResultCount: MaximumRoleCount,
            cancellationToken: Token);
        foreach (var role in roles)
        {
            var grant = await _permissionManager.GetAsync(
                permissionName,
                RoleProviderName,
                role.Name);
            if (grant.IsGranted)
            {
                granted.Add(role.Id);
            }
        }
        return granted;
    }

    private static string GenerateCompliantPassword()
    {
        const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lower = "abcdefghijkmnpqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%^&*";
        const string all = upper + lower + digits + special;

        var chars = new List<char>
        {
            upper[RandomNumberGenerator.GetInt32(upper.Length)],
            lower[RandomNumberGenerator.GetInt32(lower.Length)],
            digits[RandomNumberGenerator.GetInt32(digits.Length)],
            special[RandomNumberGenerator.GetInt32(special.Length)]
        };
        while (chars.Count < 12)
        {
            chars.Add(all[RandomNumberGenerator.GetInt32(all.Length)]);
        }
        for (var index = chars.Count - 1; index > 0; index--)
        {
            var swap = RandomNumberGenerator.GetInt32(index + 1);
            (chars[index], chars[swap]) = (chars[swap], chars[index]);
        }
        return new string([.. chars]);
    }

    private async Task<AdminUserQueryRow> GetScopedUserAsync(
        Guid id,
        DataScopeOperation operation)
    {
        var scope = await _dataScopeProvider.GetAsync(operation, Token);
        var query = await CreateUserQueryAsync(
            scope,
            new GetAdminUserListInput());
        var row = await AsyncExecuter.FirstOrDefaultAsync(
            query.Where(user => user.Id == id),
            Token);
        if (row is null)
        {
            throw new AbpAuthorizationException(
                "The user does not exist or is outside the current user's scope.");
        }
        return row;
    }

    private async Task<Organization> GetAllowedOrganizationAsync(
        Guid organizationId,
        CurrentDataScope scope)
    {
        if (!scope.IncludesOrganization(organizationId))
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope);
        }
        var organization = await _organizations.GetAsync(
            organizationId,
            cancellationToken: Token);
        if (!organization.IsActive)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope);
        }
        return organization;
    }

    private async Task EnsureRolesCanBeAssignedAsync(
        IReadOnlyCollection<string> roleNames,
        CurrentDataScope scope,
        OrganizationLevel targetLevel)
    {
        var roles = await _roles.GetListAsync(
            maxResultCount: MaximumRoleCount,
            includeDetails: true,
            cancellationToken: Token);
        var roleMap = roles.ToDictionary(
            role => role.Name,
            StringComparer.OrdinalIgnoreCase);
        foreach (var roleName in roleNames)
        {
            if (!roleMap.TryGetValue(roleName, out var role))
            {
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
            }
            IdentityAdministrationRules.EnsureRoleCanBeAssigned(
                role.Name,
                scope.HasGlobalAccess,
                targetLevel,
                IsRoleActive(role));
        }
    }

    private async Task EnsureGeographyScopesAllowedAsync(
        IReadOnlyCollection<GeographyScopeAssignmentInput> assignments,
        CurrentDataScope scope)
    {
        if (assignments.Count == 0 || scope.HasGlobalAccess)
        {
            return;
        }

        var organizationQuery = await _organizations.GetQueryableAsync();
        var allowedOrganizationIds = scope.OrganizationIds.ToArray();
        var organizations = await AsyncExecuter.ToListAsync(
            organizationQuery.Where(
                organization => allowedOrganizationIds.Contains(organization.Id)),
            Token);
        var provinceIds = organizations
            .Where(organization => organization.ProvinceId.HasValue)
            .Select(organization => organization.ProvinceId!.Value)
            .Concat(scope.ProvinceIds)
            .ToHashSet();
        var communeIds = organizations
            .Where(organization => organization.CommuneId.HasValue)
            .Select(organization => organization.CommuneId!.Value)
            .Concat(scope.CommuneIds)
            .ToHashSet();

        foreach (var assignment in assignments)
        {
            var isAllowed =
                (assignment.ProvinceId.HasValue &&
                 provinceIds.Contains(assignment.ProvinceId.Value)) ||
                (assignment.CommuneId.HasValue &&
                 communeIds.Contains(assignment.CommuneId.Value));
            if (!isAllowed)
            {
                throw new BusinessException(
                    FoodSafeDomainErrorCodes.IdentityAdministration.InvalidScope);
            }
        }
    }

    private async Task ReplaceScopeAssignmentsAsync(
        Guid userId,
        Guid organizationId,
        IReadOnlyCollection<GeographyScopeAssignmentInput> inputs)
    {
        var query = await _scopeAssignments.GetQueryableAsync();
        var existing = await AsyncExecuter.ToListAsync(
            query.Where(assignment => assignment.GranteeUserId == userId),
            Token);
        if (existing.Count > 0)
        {
            await _scopeAssignments.DeleteManyAsync(
                existing,
                cancellationToken: Token);
        }

        var now = _clock.Now;
        foreach (var input in inputs)
        {
            var assignment = ManagementScopeAssignment.CreateGeography(
                GuidGenerator.Create(),
                organizationId,
                userId,
                input.ProvinceId,
                input.CommuneId,
                input.CanView,
                input.CanCreate,
                input.CanEdit,
                input.CanDelete,
                input.ValidFrom ?? now,
                input.ValidTo,
                now,
                CurrentUser.Id);
            await _scopeAssignments.InsertAsync(
                assignment,
                cancellationToken: Token);
        }
    }

    private async Task<Dictionary<Guid, string[]>> GetRoleNamesAsync(
        IEnumerable<Guid> userIds)
    {
        var ids = userIds.Distinct().ToArray();
        if (ids.Length == 0)
        {
            return [];
        }
        return (await _identityUsers.GetRoleNamesAsync(ids, Token))
            .ToDictionary(item => item.Id, item => item.RoleNames);
    }

    private async Task<List<GeographyScopeAssignmentDto>>
        GetScopeAssignmentsAsync(Guid userId)
    {
        var query = await _scopeAssignments.GetQueryableAsync();
        return (await AsyncExecuter.ToListAsync(
                query.Where(assignment => assignment.GranteeUserId == userId)
                    .OrderBy(assignment => assignment.ValidFrom),
                Token))
            .Select(assignment => new GeographyScopeAssignmentDto
            {
                Id = assignment.Id,
                ProvinceId = assignment.ProvinceId,
                CommuneId = assignment.CommuneId,
                CanView = assignment.CanView,
                CanCreate = assignment.CanCreate,
                CanEdit = assignment.CanEdit,
                CanDelete = assignment.CanDelete,
                ValidFrom = assignment.ValidFrom,
                ValidTo = assignment.ValidTo
            }).ToList();
    }

    private async Task<int> GetAdministratorCountAsync()
    {
        var roles = await _roles.GetListAsync(
            maxResultCount: MaximumRoleCount,
            cancellationToken: Token);
        var administratorIds = new HashSet<Guid>();
        foreach (var role in roles.Where(
                     role => IdentityAdministrationRules.IsAdministratorRole(
                         role.Name)))
        {
            administratorIds.UnionWith(
                await _identityUsers.GetUserIdListByRoleIdAsync(role.Id, Token));
        }
        if (administratorIds.Count == 0)
        {
            return 0;
        }

        var now = _clock.Now;
        var userQuery = await _users.GetQueryableAsync();
        return await AsyncExecuter.CountAsync(
            userQuery.Where(user =>
                administratorIds.Contains(user.Id) &&
                user.IsActive &&
                (!user.LockoutEnd.HasValue || user.LockoutEnd <= now)),
            Token);
    }

    private async Task SendPasswordResetEmailAsync(string email)
    {
        // Recipients are Vietnamese staff. Without pinning the culture the
        // subject line follows whoever happened to click the button — which is
        // how it ended up in English on a request with no Accept-Language.
        using (CultureHelper.Use("vi"))
        {
            await _accountAppService.SendPasswordResetCodeAsync(
                new SendPasswordResetCodeDto
                {
                    Email = email,
                    AppName = "Angular"
                });
        }
    }

    /// <summary>
    /// Sends the account notification without letting a mail failure abort the
    /// caller. Returns whether the message actually went out.
    /// </summary>
    private async Task<bool> TrySendPasswordResetEmailAsync(string email)
    {
        try
        {
            await SendPasswordResetEmailAsync(email);
            return true;
        }
        catch (Exception exception)
        {
            Logger.LogWarning(
                exception,
                "Account notification email could not be delivered. "
                + "The account was still created and the administrator holds "
                + "the temporary password.");
            return false;
        }
    }

    private static AdminUserDto MapUser(
        AdminUserQueryRow row,
        IReadOnlyDictionary<Guid, string[]> roleNames,
        IReadOnlyList<GeographyScopeAssignmentDto> assignments)
    {
        var now = DateTimeOffset.UtcNow;
        return new AdminUserDto
        {
            Id = row.Id,
            UserName = row.User.UserName,
            FullName = row.Profile?.FullName ??
                       row.User.Name ??
                       row.User.UserName,
            Email = row.User.Email,
            PhoneNumber = row.User.PhoneNumber,
            OrganizationId = row.Profile?.OrganizationId,
            OrganizationName = row.OrganizationName,
            OrganizationLevel = row.OrganizationLevel,
            Position = row.Profile?.Position,
            Department = row.Profile?.Department,
            RoleNames = roleNames.GetValueOrDefault(row.Id, []),
            IsActive = row.User.IsActive,
            IsLocked = row.User.LockoutEnd.HasValue &&
                       row.User.LockoutEnd.Value > now,
            LockoutEnd = row.User.LockoutEnd,
            MustChangePassword =
                row.Profile?.MustChangePassword == true ||
                row.User.ShouldChangePasswordOnNextLogin,
            PasswordExpiresAt = row.Profile?.PasswordExpiresAt,
            CreationTime = row.User.CreationTime,
            ConcurrencyStamp = row.User.ConcurrencyStamp,
            GeographyScopes = assignments
        };
    }

    private static AdminRoleDto MapRole(IdentityRoleWithUserCount item) =>
        new()
        {
            Id = item.Role.Id,
            Name = item.Role.Name,
            Description = GetExtraProperty<string>(
                item.Role,
                RoleDescriptionProperty),
            IsActive = IsRoleActive(item.Role),
            IsStatic = item.Role.IsStatic,
            UserCount = item.UserCount,
            CreationTime = item.Role.CreationTime,
            ConcurrencyStamp = item.Role.ConcurrencyStamp
        };

    private static bool IsRoleActive(IdentityRole role) =>
        GetExtraProperty<bool?>(role, RoleActiveProperty) ?? true;

    private static T? GetExtraProperty<T>(
        IdentityRole role,
        string propertyName)
    {
        if (!role.ExtraProperties.TryGetValue(propertyName, out var value) ||
            value is null)
        {
            return default;
        }
        return value is T typed ? typed : default;
    }

    private static string[] NormalizeRoleNames(IEnumerable<string> roleNames) =>
        roleNames
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static IOrderedQueryable<AdminUserQueryRow> ApplyUserSorting(
        IQueryable<AdminUserQueryRow> query,
        string? sorting)
    {
        var descending = sorting?.Contains(
            "desc",
            StringComparison.OrdinalIgnoreCase) == true;
        var field = sorting?
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .FirstOrDefault()?
            .ToLowerInvariant();
        return (field, descending) switch
        {
            ("fullname", true) => query.OrderByDescending(
                row => row.Profile == null
                    ? row.User.Name
                    : row.Profile.FullName),
            ("fullname", false) => query.OrderBy(
                row => row.Profile == null
                    ? row.User.Name
                    : row.Profile.FullName),
            ("email", true) => query.OrderByDescending(row => row.User.Email),
            ("email", false) => query.OrderBy(row => row.User.Email),
            ("organizationname", true) => query.OrderByDescending(
                row => row.OrganizationName),
            ("organizationname", false) => query.OrderBy(
                row => row.OrganizationName),
            ("creationtime", false) => query.OrderBy(
                row => row.User.CreationTime),
            _ => query.OrderByDescending(row => row.User.CreationTime)
        };
    }

    private static string NormalizeRoleSorting(string? sorting) =>
        sorting?.StartsWith("creationTime", StringComparison.OrdinalIgnoreCase)
            == true
            ? sorting
            : sorting?.StartsWith("name", StringComparison.OrdinalIgnoreCase)
                == true
                ? sorting
                : "Name";

    private static string NormalizeAuditSorting(string? sorting) =>
        sorting?.StartsWith("executionTime", StringComparison.OrdinalIgnoreCase)
            == true
            ? sorting
            : "ExecutionTime DESC";

    private sealed class AdminUserQueryRow
    {
        public Guid Id { get; init; }
        public required IdentityUser User { get; init; }
        public AppUserProfile? Profile { get; init; }
        public string? OrganizationName { get; init; }
        public OrganizationLevel? OrganizationLevel { get; init; }
    }
}
