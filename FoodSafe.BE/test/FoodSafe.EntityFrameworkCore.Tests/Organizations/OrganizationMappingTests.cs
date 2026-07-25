using FoodSafe.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace FoodSafe.Organizations;

public class OrganizationMappingTests
{
    [Fact]
    public void Model_Should_Map_Organization_To_Reviewed_Schema()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;

        using var context = new FoodSafeDbContext(options);
        var entity = context.Model.FindEntityType(typeof(Organization));

        entity.ShouldNotBeNull();
        entity.GetTableName().ShouldBe("organizations");
        entity.FindProperty(nameof(Organization.CommuneId))
            .ShouldNotBeNull()
            .GetColumnName()
            .ShouldBe("commune_id");
    }
}
