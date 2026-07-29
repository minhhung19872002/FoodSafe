using Volo.Abp;
using Volo.Abp.Domain.Entities;

namespace FoodSafe.Security;

public sealed class AppUserProfile : Entity<Guid>, IAggregateRoot<Guid>
{
    public Guid UserId { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string FullName { get; private set; } = string.Empty;
    public string? Position { get; private set; }
    public string? Department { get; private set; }
    public DateTime? PasswordExpiresAt { get; private set; }
    public bool MustChangePassword { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public short FailedLoginCount { get; private set; }
    public DateTime? LockedUntil { get; private set; }
    public DateTime CreationTime { get; private set; }
    public DateTime? LastModificationTime { get; private set; }

    private AppUserProfile() { }

    public static AppUserProfile Create(
        Guid id,
        Guid userId,
        Guid organizationId,
        string fullName,
        DateTime now)
    {
        return new AppUserProfile
        {
            Id = id,
            UserId = userId,
            OrganizationId = organizationId,
            FullName = Check.NotNullOrWhiteSpace(fullName, nameof(fullName), 200).Trim(),
            MustChangePassword = true,
            CreationTime = now
        };
    }

    public bool IsPasswordExpired(DateTime now) =>
        PasswordExpiresAt.HasValue && PasswordExpiresAt.Value <= now;

    public void ChangeDetails(
        Guid organizationId,
        string fullName,
        string? position,
        string? department,
        DateTime now)
    {
        OrganizationId = organizationId;
        FullName = Check.NotNullOrWhiteSpace(
            fullName,
            nameof(fullName),
            200).Trim();
        Position = NormalizeOptional(position, 200, nameof(position));
        Department = NormalizeOptional(department, 200, nameof(department));
        LastModificationTime = now;
    }

    public void RecordPasswordChanged(DateTime now, TimeSpan validityPeriod)
    {
        if (validityPeriod <= TimeSpan.Zero)
        {
            throw new ArgumentOutOfRangeException(nameof(validityPeriod));
        }

        PasswordExpiresAt = now.Add(validityPeriod);
        MustChangePassword = false;
        LastModificationTime = now;
    }

    private static string? NormalizeOptional(
        string? value,
        int maxLength,
        string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : Check.NotNullOrWhiteSpace(value, parameterName, maxLength).Trim();
}

public sealed class PasswordHistory : Entity<Guid>, IAggregateRoot<Guid>
{
    public Guid UserId { get; private set; }
    public string PasswordHash { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }

    private PasswordHistory() { }

    public static PasswordHistory Create(
        Guid id,
        Guid userId,
        string passwordHash,
        DateTime createdAt)
    {
        return new PasswordHistory
        {
            Id = id,
            UserId = userId,
            PasswordHash = Check.NotNullOrWhiteSpace(
                passwordHash,
                nameof(passwordHash),
                500),
            CreatedAt = createdAt
        };
    }
}

public sealed class ManagementScopeAssignment : Entity<Guid>, IAggregateRoot<Guid>
{
    public Guid GranteeOrganizationId { get; private set; }
    public Guid? GranteeUserId { get; private set; }
    public ManagementScopeType ScopeType { get; private set; }
    public Guid? ProvinceId { get; private set; }
    public Guid? CommuneId { get; private set; }
    public Guid? BusinessId { get; private set; }
    public Guid? BusinessTypeId { get; private set; }
    public Guid? ProductGroupId { get; private set; }
    public bool CanView { get; private set; }
    public bool CanCreate { get; private set; }
    public bool CanEdit { get; private set; }
    public bool CanDelete { get; private set; }
    public DateTime ValidFrom { get; private set; }
    public DateTime? ValidTo { get; private set; }
    public DateTime CreationTime { get; private set; }
    public Guid? CreatorId { get; private set; }

    private ManagementScopeAssignment() { }

    public static ManagementScopeAssignment CreateGeography(
        Guid id,
        Guid granteeOrganizationId,
        Guid? granteeUserId,
        Guid? provinceId,
        Guid? communeId,
        bool canView,
        bool canCreate,
        bool canEdit,
        bool canDelete,
        DateTime validFrom,
        DateTime? validTo,
        DateTime now,
        Guid? creatorId)
    {
        if (new[] { provinceId, communeId }.Count(x => x.HasValue) != 1)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.ExactlyOneGeographyRequired);
        }

        if (validTo.HasValue && validFrom >= validTo.Value)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.InvalidValidityPeriod);
        }

        return new ManagementScopeAssignment
        {
            Id = id,
            GranteeOrganizationId = granteeOrganizationId,
            GranteeUserId = granteeUserId,
            ScopeType = ManagementScopeType.Geography,
            ProvinceId = provinceId,
            CommuneId = communeId,
            CanView = canView,
            CanCreate = canCreate,
            CanEdit = canEdit,
            CanDelete = canDelete,
            ValidFrom = validFrom,
            ValidTo = validTo,
            CreationTime = now,
            CreatorId = creatorId
        };
    }

    public static ManagementScopeAssignment CreateBusiness(
        Guid id,
        Guid granteeOrganizationId,
        Guid? granteeUserId,
        Guid businessId,
        bool canView,
        bool canCreate,
        bool canEdit,
        bool canDelete,
        DateTime validFrom,
        DateTime? validTo,
        DateTime now,
        Guid? creatorId)
    {
        if (validTo.HasValue && validFrom >= validTo.Value)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.InvalidValidityPeriod);
        }

        return new ManagementScopeAssignment
        {
            Id = id,
            GranteeOrganizationId = granteeOrganizationId,
            GranteeUserId = granteeUserId,
            ScopeType = ManagementScopeType.Business,
            BusinessId = businessId,
            CanView = canView,
            CanCreate = canCreate,
            CanEdit = canEdit,
            CanDelete = canDelete,
            ValidFrom = validFrom,
            ValidTo = validTo,
            CreationTime = now,
            CreatorId = creatorId
        };
    }

    public static ManagementScopeAssignment CreateBusinessType(
        Guid id,
        Guid granteeOrganizationId,
        Guid? granteeUserId,
        Guid businessTypeId,
        bool canView,
        bool canCreate,
        bool canEdit,
        bool canDelete,
        DateTime validFrom,
        DateTime? validTo,
        DateTime now,
        Guid? creatorId)
    {
        if (validTo.HasValue && validFrom >= validTo.Value)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.InvalidValidityPeriod);
        }

        return new ManagementScopeAssignment
        {
            Id = id,
            GranteeOrganizationId = granteeOrganizationId,
            GranteeUserId = granteeUserId,
            ScopeType = ManagementScopeType.BusinessType,
            BusinessTypeId = businessTypeId,
            CanView = canView,
            CanCreate = canCreate,
            CanEdit = canEdit,
            CanDelete = canDelete,
            ValidFrom = validFrom,
            ValidTo = validTo,
            CreationTime = now,
            CreatorId = creatorId
        };
    }

    public static ManagementScopeAssignment CreateProductGroup(
        Guid id,
        Guid granteeOrganizationId,
        Guid? granteeUserId,
        Guid productGroupId,
        bool canView,
        bool canCreate,
        bool canEdit,
        bool canDelete,
        DateTime validFrom,
        DateTime? validTo,
        DateTime now,
        Guid? creatorId)
    {
        if (validTo.HasValue && validFrom >= validTo.Value)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.DataScope.InvalidValidityPeriod);
        }

        return new ManagementScopeAssignment
        {
            Id = id,
            GranteeOrganizationId = granteeOrganizationId,
            GranteeUserId = granteeUserId,
            ScopeType = ManagementScopeType.ProductGroup,
            ProductGroupId = productGroupId,
            CanView = canView,
            CanCreate = canCreate,
            CanEdit = canEdit,
            CanDelete = canDelete,
            ValidFrom = validFrom,
            ValidTo = validTo,
            CreationTime = now,
            CreatorId = creatorId
        };
    }

    public bool Allows(DataScopeOperation operation) => operation switch
    {
        DataScopeOperation.View => CanView,
        DataScopeOperation.Create => CanCreate,
        DataScopeOperation.Edit => CanEdit,
        DataScopeOperation.Delete => CanDelete,
        _ => false
    };

    public bool IsEffective(DateTime now) =>
        ValidFrom <= now && (!ValidTo.HasValue || now < ValidTo.Value);
}
