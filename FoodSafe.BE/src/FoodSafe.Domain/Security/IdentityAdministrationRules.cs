using FoodSafe.Organizations;
using Volo.Abp;

namespace FoodSafe.Security;

public static class IdentityAdministrationRules
{
    public static readonly IReadOnlySet<string> AdministratorRoles =
        new HashSet<string>(
            ["admin", "SystemAdmin", "ProvinceAdmin"],
            StringComparer.OrdinalIgnoreCase);

    public static void EnsureNotSelf(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.SelfLifecycleChange);
        }
    }

    public static void EnsureRoleCanBeAssigned(
        string roleName,
        bool hasGlobalAccess,
        OrganizationLevel targetLevel,
        bool roleIsActive)
    {
        if (!roleIsActive)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.InactiveRole);
        }

        if (hasGlobalAccess)
        {
            return;
        }

        var requiredLevel = GetRequiredLevel(roleName);
        if (!requiredLevel.HasValue || requiredLevel.Value != targetLevel)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
        }
    }

    public static void EnsureAdministratorRemains(
        IReadOnlyCollection<string> currentRoles,
        IReadOnlyCollection<string> replacementRoles,
        int administratorCount)
    {
        var wasAdministrator = currentRoles.Any(AdministratorRoles.Contains);
        var remainsAdministrator = replacementRoles.Any(AdministratorRoles.Contains);
        if (wasAdministrator && !remainsAdministrator && administratorCount <= 1)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.LastAdministrator);
        }
    }

    public static void EnsureSelfAdministratorRoleRemains(
        Guid currentUserId,
        Guid targetUserId,
        IReadOnlyCollection<string> currentRoles,
        IReadOnlyCollection<string> replacementRoles)
    {
        if (currentUserId != targetUserId)
        {
            return;
        }

        var wasAdministrator = currentRoles.Any(AdministratorRoles.Contains);
        var remainsAdministrator = replacementRoles.Any(AdministratorRoles.Contains);
        if (wasAdministrator && !remainsAdministrator)
        {
            throw new BusinessException(
                FoodSafeDomainErrorCodes.IdentityAdministration.SelfLifecycleChange);
        }
    }

    public static bool IsAdministratorRole(string roleName) =>
        AdministratorRoles.Contains(roleName);

    private static OrganizationLevel? GetRequiredLevel(string roleName) =>
        roleName.ToUpperInvariant() switch
        {
            "PROVINCEADMIN" or "PROVINCESTAFF" => OrganizationLevel.Province,
            "COMMUNEADMIN" or "COMMUNESTAFF" => OrganizationLevel.Commune,
            _ => null
        };
}
