using Shouldly;
using Xunit;

namespace FoodSafe.Organizations;

public class OrganizationTreeBuilderTests
{
    [Fact]
    public void Build_Should_Nest_Children_And_Order_By_Code()
    {
        var provinceId = Guid.NewGuid();
        var districtId = Guid.NewGuid();
        var items = new List<OrganizationDto>
        {
            Create(districtId, provinceId, "02", OrganizationLevel.District),
            Create(provinceId, null, "01", OrganizationLevel.Province),
            Create(Guid.NewGuid(), districtId, "03", OrganizationLevel.Commune)
        };

        var tree = OrganizationTreeBuilder.Build(items);

        tree.Count.ShouldBe(1);
        tree[0].Id.ShouldBe(provinceId);
        tree[0].Children.Single().Id.ShouldBe(districtId);
        tree[0].Children.Single().Children.Count.ShouldBe(1);
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
