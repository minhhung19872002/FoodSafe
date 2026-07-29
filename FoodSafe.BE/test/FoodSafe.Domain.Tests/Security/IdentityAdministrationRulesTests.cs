using FoodSafe.Organizations;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Security;

public sealed class IdentityAdministrationRulesTests
{
    [Fact]
    public void Self_lifecycle_changes_should_be_rejected()
    {
        var userId = Guid.NewGuid();

        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureNotSelf(userId, userId));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.SelfLifecycleChange);
    }

    [Fact]
    public void Scoped_administrator_should_assign_only_matching_default_roles()
    {
        Should.NotThrow(() =>
            IdentityAdministrationRules.EnsureRoleCanBeAssigned(
                "CommuneStaff",
                false,
                OrganizationLevel.Commune,
                true));

        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureRoleCanBeAssigned(
                "ProvinceAdmin",
                false,
                OrganizationLevel.Commune,
                true));
        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
    }

    [Fact]
    public void Scoped_administrator_should_not_assign_custom_roles()
    {
        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureRoleCanBeAssigned(
                "CustomPowerRole",
                false,
                OrganizationLevel.Commune,
                true));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.IncompatibleRole);
    }

    [Fact]
    public void Inactive_roles_should_never_be_assignable()
    {
        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureRoleCanBeAssigned(
                "CommuneStaff",
                true,
                OrganizationLevel.Commune,
                false));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.InactiveRole);
    }

    [Fact]
    public void Last_administrator_role_should_not_be_removed()
    {
        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureAdministratorRemains(
                ["SystemAdmin"],
                ["ProvinceStaff"],
                1));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.LastAdministrator);
    }

    [Fact]
    public void Administrator_role_can_change_when_another_admin_remains()
    {
        Should.NotThrow(() =>
            IdentityAdministrationRules.EnsureAdministratorRemains(
                ["ProvinceAdmin"],
                ["ProvinceStaff"],
                2));
    }

    [Fact]
    public void Administrator_should_not_remove_their_own_admin_role()
    {
        var userId = Guid.NewGuid();

        var exception = Should.Throw<BusinessException>(() =>
            IdentityAdministrationRules.EnsureSelfAdministratorRoleRemains(
                userId,
                userId,
                ["ProvinceAdmin"],
                ["ProvinceStaff"]));

        exception.Code.ShouldBe(
            FoodSafeDomainErrorCodes.IdentityAdministration.SelfLifecycleChange);
    }

    [Fact]
    public void Administrator_can_change_another_users_admin_role()
    {
        Should.NotThrow(() =>
            IdentityAdministrationRules.EnsureSelfAdministratorRoleRemains(
                Guid.NewGuid(),
                Guid.NewGuid(),
                ["ProvinceAdmin"],
                ["ProvinceStaff"]));
    }
}
