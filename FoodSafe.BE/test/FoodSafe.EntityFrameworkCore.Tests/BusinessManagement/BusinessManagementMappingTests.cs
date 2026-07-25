using FoodSafe.EntityFrameworkCore;
using FoodSafe.Licensing;
using FoodSafe.Security;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public sealed class BusinessManagementMappingTests
{
    private static FoodSafeDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;
        return new FoodSafeDbContext(options);
    }

    [Fact]
    public void Model_should_map_all_STT_19_to_22_tables()
    {
        using var context = CreateContext();

        context.Model.FindEntityType(typeof(Business))!
            .GetTableName().ShouldBe("businesses");
        context.Model.FindEntityType(typeof(BusinessProductGroup))!
            .GetTableName().ShouldBe("business_product_groups");
        context.Model.FindEntityType(typeof(BusinessHandler))!
            .GetTableName().ShouldBe("business_handlers");
        context.Model.FindEntityType(typeof(Product))!
            .GetTableName().ShouldBe("products");
        context.Model.FindEntityType(typeof(SelfDeclaration))!
            .GetTableName().ShouldBe("self_declarations");
        context.Model.FindEntityType(typeof(ProductRegistration))!
            .GetTableName().ShouldBe("product_registrations");
    }

    [Fact]
    public void Product_should_enforce_business_and_organization_ownership()
    {
        using var context = CreateContext();
        var product = context.Model.FindEntityType(typeof(Product))!;

        var ownership = product.GetForeignKeys().Single(key =>
            key.GetConstraintName() == "fk_products_business_org");
        ownership.Properties.Select(property => property.Name).ShouldBe(
            [nameof(Product.BusinessId), nameof(Product.OrganizationId)]);
        ownership.PrincipalKey.Properties.Select(property => property.Name)
            .ShouldBe([nameof(Business.Id), nameof(Business.OrganizationId)]);
    }

    [Fact]
    public void Identity_indexes_should_not_reuse_inactive_records()
    {
        using var context = CreateContext();
        var business = context.Model.FindEntityType(typeof(Business))!;
        var product = context.Model.FindEntityType(typeof(Product))!;

        business.GetIndexes().Single(index =>
                index.GetDatabaseName() == "uq_businesses_tax_code")
            .GetFilter().ShouldBe("tax_code IS NOT NULL AND is_deleted = FALSE");
        product.GetIndexes().Single(index =>
                index.GetDatabaseName() == "uq_products_business_code")
            .IsUnique.ShouldBeTrue();
    }

    [Fact]
    public void Explicit_business_management_scope_should_have_a_foreign_key()
    {
        using var context = CreateContext();
        var scope = context.Model.FindEntityType(typeof(ManagementScopeAssignment))!;

        scope.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_msa_business");
    }

    [Fact]
    public void Self_declaration_should_enforce_parent_ownership_and_number()
    {
        using var context = CreateContext();
        var declaration =
            context.Model.FindEntityType(typeof(SelfDeclaration))!;

        declaration.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() ==
            "fk_self_declarations_business_org");
        declaration.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() ==
            "fk_self_declarations_product");
        var unique = declaration.GetIndexes().Single(index =>
            index.GetDatabaseName() ==
            "uq_self_declarations_business_number");
        unique.IsUnique.ShouldBeTrue();
        unique.GetFilter().ShouldBeNull();
    }

    [Fact]
    public void Product_registration_should_enforce_ownership_and_global_number()
    {
        using var context = CreateContext();
        var registration =
            context.Model.FindEntityType(typeof(ProductRegistration))!;

        registration.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_product_reg_business_org");
        registration.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_product_reg_product_owner");
        var unique = registration.GetIndexes().Single(index =>
            index.GetDatabaseName() ==
            "uq_product_registrations_number");
        unique.IsUnique.ShouldBeTrue();
        unique.GetFilter().ShouldBeNull();
    }
}
