using Shouldly;
using Xunit;

namespace FoodSafe.Organizations;

public class OrganizationTreeBuilderTests
{
    [Fact]
    public void Build_Should_Nest_Children_And_Order_By_Code()
    {
        var provinceId = Guid.NewGuid();
        var commune1Id = Guid.NewGuid();
        var commune2Id = Guid.NewGuid();
        var items = new List<OrganizationDto>
        {
            Create(commune2Id, provinceId, "03", OrganizationLevel.Commune),
            Create(provinceId, null, "01", OrganizationLevel.Province),
            Create(commune1Id, provinceId, "02", OrganizationLevel.Commune)
        };

        var tree = OrganizationTreeBuilder.Build(items);

        tree.Count.ShouldBe(1);
        tree[0].Id.ShouldBe(provinceId);
        tree[0].Children.Count.ShouldBe(2);
        tree[0].Children[0].Id.ShouldBe(commune1Id);
        tree[0].Children[0].Children.ShouldBeEmpty();
    }

    private static OrganizationDto Create(
        Guid id,
        Guid? parentId,
        string code,
        OrganizationLevel level) =>
        new()
        {
            Id = id,
            ParentId = parentId,
            Code = code,
            Name = code,
            Level = level,
            IsActive = true
        };
}
