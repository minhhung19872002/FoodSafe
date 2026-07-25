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
        var district = Guid.NewGuid();
        var commune = Guid.NewGuid();
        var otherProvince = Guid.NewGuid();
        var nodes = new[]
        {
            new OrganizationScopeNode(province, null, null, null, null),
            new OrganizationScopeNode(district, province, null, null, null),
            new OrganizationScopeNode(commune, district, null, null, null),
            new OrganizationScopeNode(otherProvince, null, null, null, null)
        };

        var scope = OrganizationHierarchyScope.Expand(district, nodes);

        scope.SetEquals([district, commune]).ShouldBeTrue();
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
            new OrganizationScopeNode(first, second, null, null, null),
            new OrganizationScopeNode(second, first, null, null, null)
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
                null,
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
}
