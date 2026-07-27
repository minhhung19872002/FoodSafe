using FoodSafe.Security;
using Volo.Abp.Authorization;

namespace FoodSafe.Organizations;

public static class OrganizationAuthorizationRules
{
    public static void EnsureParentChangeAllowed(
        CurrentDataScope scope,
        Guid? currentParentId,
        Guid? proposedParentId)
    {
        if (!proposedParentId.HasValue
            && currentParentId.HasValue
            && !scope.HasGlobalAccess)
        {
            throw new AbpAuthorizationException(
                "Only a global administrator can promote an organization to a root.");
        }
    }
}
