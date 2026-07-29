using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Security;

public class DataScopeTests
{
    [Fact]
    public void Hierarchy_Scope_Should_Contain_Only_Root_And_Descendants()
    {
        var province = Guid.NewGuid();
        var branch = Guid.NewGuid();
        var commune = Guid.NewGuid();
        var otherProvince = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(province, null, null, null),
            new OrganizationScopeNode(branch, province, null, null),
            new OrganizationScopeNode(commune, branch, null, null),
            new OrganizationScopeNode(otherProvince, null, null, null)
        };

        var scope = OrganizationHierarchyScope.Expand(branch, nodes);

        scope.SetEquals([branch, commune]).ShouldBeTrue();
        scope.ShouldNotContain(province);
        scope.ShouldNotContain(otherProvince);
    }

    [Fact]
    public void Hierarchy_Scope_Should_Tolerate_Corrupt_Cycle_Without_Looping()
    {
        var first = Guid.NewGuid();
        var second = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(first, second, null, null),
            new OrganizationScopeNode(second, first, null, null)
        };

        OrganizationHierarchyScope.Expand(first, nodes).SetEquals([first, second]).ShouldBeTrue();
    }

    [Fact]
    public void Geography_Assignment_Should_Require_Exactly_One_Target()
    {
        Should.Throw<BusinessException>(() =>
            ManagementScopeAssignment.CreateGeography(
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                null,
                true,
                false,
                false,
                false,
                DateTime.UtcNow,
                null,
                DateTime.UtcNow,
                null));
    }

    [Fact]
    public void Hierarchy_does_not_leak_sibling_branches()
    {
        var root = Guid.NewGuid();
        var branchA = Guid.NewGuid();
        var branchB = Guid.NewGuid();
        var leafA = Guid.NewGuid();
        var leafB = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(root, null, null, null),
            new OrganizationScopeNode(branchA, root, null, null),
            new OrganizationScopeNode(branchB, root, null, null),
            new OrganizationScopeNode(leafA, branchA, null, null),
            new OrganizationScopeNode(leafB, branchB, null, null)
        };

        var scopeA = OrganizationHierarchyScope.Expand(branchA, nodes);

        scopeA.ShouldContain(branchA);
        scopeA.ShouldContain(leafA);
        scopeA.ShouldNotContain(root);
        scopeA.ShouldNotContain(branchB);
        scopeA.ShouldNotContain(leafB);
    }

    [Fact]
    public void Leaf_node_scope_contains_only_itself()
    {
        var root = Guid.NewGuid();
        var middle = Guid.NewGuid();
        var leaf = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(root, null, null, null),
            new OrganizationScopeNode(middle, root, null, null),
            new OrganizationScopeNode(leaf, middle, null, null)
        };

        var scope = OrganizationHierarchyScope.Expand(leaf, nodes);

        scope.SetEquals([leaf]).ShouldBeTrue();
    }

    [Fact]
    public void Unknown_node_throws_InvalidOperationException()
    {
        var unknown = Guid.NewGuid();
        var existing = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(existing, null, null, null)
        };

        Should.Throw<InvalidOperationException>(
            () => OrganizationHierarchyScope.Expand(unknown, nodes));
    }

}
