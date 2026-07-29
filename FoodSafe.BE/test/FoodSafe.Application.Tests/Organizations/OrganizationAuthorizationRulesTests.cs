using FoodSafe.Security;
using Shouldly;
using Volo.Abp.Authorization;
using Xunit;

namespace FoodSafe.Organizations;

public class OrganizationAuthorizationRulesTests
{
    [Fact]
    public void Scoped_administrator_cannot_promote_a_child_to_a_root()
    {
        var organizationId = Guid.NewGuid();
        var scope = CreateScope(organizationId, hasGlobalAccess: false);

        Should.Throw<AbpAuthorizationException>(() =>
            OrganizationAuthorizationRules.EnsureParentChangeAllowed(
                scope,
                Guid.NewGuid(),
                null));
    }

    [Fact]
    public void Global_administrator_can_promote_a_child_to_a_root()
    {
        var scope = CreateScope(Guid.NewGuid(), hasGlobalAccess: true);

        Should.NotThrow(() =>
            OrganizationAuthorizationRules.EnsureParentChangeAllowed(
                scope,
                Guid.NewGuid(),
                null));
    }

    private static CurrentDataScope CreateScope(
        Guid organizationId,
        bool hasGlobalAccess) =>
        new(
            Guid.NewGuid(),
            organizationId,
            hasGlobalAccess,
            false,
            new HashSet<Guid> { organizationId },
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>());
}
