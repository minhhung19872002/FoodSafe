using FoodSafe.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace FoodSafe.Catalogs;

public class MasterCatalogMappingTests
{
    private static FoodSafeDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;
        return new FoodSafeDbContext(options);
    }

    [Fact]
    public void Model_Should_Map_All_Approved_Master_Catalog_Tables()
    {
        using var context = CreateContext();

        context.Model.FindEntityType(typeof(ProductGroup))!.GetTableName().ShouldBe("cat_product_groups");
        context.Model.FindEntityType(typeof(BusinessType))!.GetTableName().ShouldBe("cat_business_types");
        context.Model.FindEntityType(typeof(BusinessClassification))!.GetTableName().ShouldBe("cat_business_classifications");
        context.Model.FindEntityType(typeof(AdvertisementType))!.GetTableName().ShouldBe("cat_advertisement_types");
        context.Model.FindEntityType(typeof(DocumentType))!.GetTableName().ShouldBe("cat_document_types");
        context.Model.FindEntityType(typeof(TestingCenter))!.GetTableName().ShouldBe("cat_testing_centers");
        context.Model.FindEntityType(typeof(TestingService))!.GetTableName().ShouldBe("cat_testing_services");
    }

    [Fact]
    public void Testing_Service_Should_Have_Center_Scoped_Unique_Code()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(TestingService))!;

        entity.GetIndexes().ShouldContain(index => index.IsUnique &&
            index.Properties.Select(x => x.Name).SequenceEqual(
                new[] { nameof(TestingService.TestingCenterId), nameof(TestingService.Code) }));
    }

    [Fact]
    public void Product_Group_And_Testing_Dependencies_Should_Be_Restrictive()
    {
        using var context = CreateContext();

        context.Model.FindEntityType(typeof(ProductGroup))!.GetForeignKeys()
            .Single().DeleteBehavior.ShouldBe(DeleteBehavior.Restrict);
        context.Model.FindEntityType(typeof(TestingService))!.GetForeignKeys()
            .Single().DeleteBehavior.ShouldBe(DeleteBehavior.Restrict);
    }

    [Fact]
    public void Data_Scope_Should_Reference_Implemented_Catalogs()
    {
        using var context = CreateContext();
        var entity = context.Model.FindEntityType(typeof(FoodSafe.Security.ManagementScopeAssignment))!;
        var constraints = entity.GetForeignKeys().Select(x => x.GetConstraintName()).ToArray();

        constraints.ShouldContain("fk_msa_business_type");
        constraints.ShouldContain("fk_msa_product_group");
    }
}
