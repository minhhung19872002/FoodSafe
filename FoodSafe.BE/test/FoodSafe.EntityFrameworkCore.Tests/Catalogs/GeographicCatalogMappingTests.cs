using FoodSafe.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Shouldly;
using Xunit;

namespace FoodSafe.Catalogs;

public class GeographicCatalogMappingTests
{
    private static FoodSafeDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;
        return new FoodSafeDbContext(options);
    }

    [Fact]
    public void Model_Should_Map_Geographic_Tables_To_Approved_Names()
    {
        using var context = CreateContext();

        context.Model.FindEntityType(typeof(Province))!.GetTableName().ShouldBe("cat_provinces");
        context.Model.FindEntityType(typeof(District))!.GetTableName().ShouldBe("cat_districts");
        context.Model.FindEntityType(typeof(Commune))!.GetTableName().ShouldBe("cat_communes");
    }

    [Fact]
    public void Organization_Should_Have_Hierarchy_Enforcing_Geographic_Foreign_Keys()
    {
        using var context = CreateContext();
        var organization = context.Model.FindEntityType(typeof(FoodSafe.Organizations.Organization))!;
        var constraintNames = organization.GetForeignKeys()
            .Select(fk => fk.GetConstraintName())
            .ToList();

        constraintNames.ShouldContain("fk_organizations_province");
        constraintNames.ShouldContain("fk_organizations_district_province");
        constraintNames.ShouldContain("fk_organizations_commune_district");
    }

    [Fact]
    public void District_And_Commune_Should_Expose_Composite_Alternate_Keys()
    {
        using var context = CreateContext();
        var district = context.Model.FindEntityType(typeof(District))!;
        var commune = context.Model.FindEntityType(typeof(Commune))!;

        district.GetKeys().ShouldContain(key =>
            key.Properties.Select(x => x.Name).SequenceEqual(
                new[] { nameof(District.Id), nameof(District.ProvinceId) }));
        commune.GetKeys().ShouldContain(key =>
            key.Properties.Select(x => x.Name).SequenceEqual(
                new[] { nameof(Commune.Id), nameof(Commune.DistrictId) }));
    }
}
