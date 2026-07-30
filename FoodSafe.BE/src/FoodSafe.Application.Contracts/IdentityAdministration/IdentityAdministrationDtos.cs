using System.ComponentModel.DataAnnotations;
using FoodSafe.Organizations;
using Volo.Abp.Application.Dtos;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.IdentityAdministration;

public sealed class GetAdminUserListInput : PagedAndSortedResultRequestDto
{
    [StringLength(200)]
    public string? Filter { get; set; }

    public Guid? RoleId { get; set; }
    public Guid? OrganizationId { get; set; }
    public bool? IsActive { get; set; }
    public bool? IsLocked { get; set; }

    [StringLength(200)]
    public string? PermissionName { get; set; }
}

public sealed class AdminUserDto : EntityDto<Guid>, IHasConcurrencyStamp
{
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public OrganizationLevel? OrganizationLevel { get; set; }
    public string? Position { get; set; }
    public string? Department { get; set; }
    public IReadOnlyList<string> RoleNames { get; set; } = [];
    public bool IsActive { get; set; }
    public bool IsLocked { get; set; }
    public DateTimeOffset? LockoutEnd { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? PasswordExpiresAt { get; set; }
    public DateTime CreationTime { get; set; }
    public string ConcurrencyStamp { get; set; } = string.Empty;
    public IReadOnlyList<GeographyScopeAssignmentDto> GeographyScopes { get; set; } = [];
}

/// <summary>
/// Result of creating a user. Carries the one-time temporary password so the
/// administrator can hand it over directly (FR STT 2 — "mật khẩu tạm thời"),
/// which is what keeps account creation working when the mail server does not.
/// </summary>
public sealed class CreatedAdminUserDto
{
    public AdminUserDto User { get; set; } = new();

    /// <summary>
    /// Shown to the creating administrator once and never stored or returned
    /// again. The account is flagged to force a change on first login.
    /// </summary>
    public string TemporaryPassword { get; set; } = string.Empty;

    /// <summary>
    /// False when the notification email could not be delivered. The account
    /// still exists and works — the administrator just has to pass the
    /// temporary password on by another channel.
    /// </summary>
    public bool NotificationEmailSent { get; set; }
}

public sealed class CreateAdminUserDto
{
    /// <summary>
    /// Login name, chosen by the administrator. Kept separate from
    /// <see cref="Email"/> so staff without a work mailbox of their own can
    /// still get an account. The allowed characters are a subset of ABP's
    /// default <c>AllowedUserNameCharacters</c>.
    /// </summary>
    [Required]
    [StringLength(50, MinimumLength = 3)]
    [RegularExpression(
        "^[A-Za-z0-9_]+$",
        ErrorMessage =
            "Tên đăng nhập chỉ gồm chữ không dấu, số và dấu gạch dưới _")]
    public string UserName { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [StringLength(32)]
    public string? PhoneNumber { get; set; }

    public Guid OrganizationId { get; set; }

    [StringLength(200)]
    public string? Position { get; set; }

    [StringLength(200)]
    public string? Department { get; set; }

    [MinLength(1)]
    public List<string> RoleNames { get; set; } = [];

    public List<GeographyScopeAssignmentInput> GeographyScopes { get; set; } = [];
}

public sealed class UpdateAdminUserDto : IHasConcurrencyStamp
{
    [Required]
    [StringLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;

    [Phone]
    [StringLength(32)]
    public string? PhoneNumber { get; set; }

    public Guid OrganizationId { get; set; }

    [StringLength(200)]
    public string? Position { get; set; }

    [StringLength(200)]
    public string? Department { get; set; }

    [MinLength(1)]
    public List<string> RoleNames { get; set; } = [];

    public List<GeographyScopeAssignmentInput> GeographyScopes { get; set; } = [];

    [Required]
    public string ConcurrencyStamp { get; set; } = string.Empty;
}

public sealed class GeographyScopeAssignmentInput
{
    public Guid? ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
    public bool CanView { get; set; } = true;
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

public sealed class GeographyScopeAssignmentDto : EntityDto<Guid>
{
    public Guid? ProvinceId { get; set; }
    public Guid? CommuneId { get; set; }
    public bool CanView { get; set; }
    public bool CanCreate { get; set; }
    public bool CanEdit { get; set; }
    public bool CanDelete { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
}

public sealed class GeneratedPasswordDto
{
    public string Password { get; set; } = string.Empty;
}

/// <summary>
/// Lets an administrator set a specific password for another account, as an
/// alternative to <see cref="GeneratedPasswordDto"/>'s random generation.
/// Compliance with the password policy (length, character classes) is
/// enforced by ASP.NET Core Identity's configured validators, not here.
/// </summary>
public sealed class SetUserPasswordDto
{
    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class PermissionOptionDto
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ParentName { get; set; }
}

public sealed class SetUserActivationDto
{
    public bool IsActive { get; set; }
}

public sealed class SetUserLockDto
{
    public bool IsLocked { get; set; }
}

public sealed class UserActivityDto : EntityDto<Guid>
{
    public DateTime ExecutionTime { get; set; }
    public string? HttpMethod { get; set; }
    public string? Url { get; set; }
    public int? HttpStatusCode { get; set; }
    public int ExecutionDuration { get; set; }
    public string? ClientIpAddress { get; set; }
    public string? CorrelationId { get; set; }
    public bool HasException { get; set; }
}

public sealed class GetAdminRoleListInput : PagedAndSortedResultRequestDto
{
    [StringLength(200)]
    public string? Filter { get; set; }

    public bool? IsActive { get; set; }
}

public sealed class AdminRoleDto : EntityDto<Guid>, IHasConcurrencyStamp
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsStatic { get; set; }
    public long UserCount { get; set; }
    public DateTime CreationTime { get; set; }
    public string ConcurrencyStamp { get; set; } = string.Empty;
}

public sealed class CreateAdminRoleDto
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }
}

public sealed class UpdateAdminRoleDto : IHasConcurrencyStamp
{
    [Required]
    [StringLength(64)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    public string ConcurrencyStamp { get; set; } = string.Empty;
}

public sealed class RolePermissionGroupDto
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public IReadOnlyList<RolePermissionDto> Permissions { get; set; } = [];
}

public sealed class RolePermissionDto
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ParentName { get; set; }
    public bool IsGranted { get; set; }
}

public sealed class UpdateRolePermissionsDto
{
    public List<RolePermissionUpdateDto> Permissions { get; set; } = [];
}

public sealed class RolePermissionUpdateDto
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public bool IsGranted { get; set; }
}

public sealed class AllRolesPermissionMatrixDto
{
    public IReadOnlyList<PermissionOptionDto> Permissions { get; set; } = [];
    public IReadOnlyList<RolePermissionRowDto> Roles { get; set; } = [];
}

public sealed class RolePermissionRowDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Dictionary<string, bool> Grants { get; set; } = [];
}
