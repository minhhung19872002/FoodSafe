using FoodSafe.EntityFrameworkCore;
using FoodSafe.Inspection;
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
    public void Model_should_map_all_STT_19_to_23_tables()
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
        context.Model.FindEntityType(typeof(AdvertisementRegistration))!
            .GetTableName().ShouldBe("advertisement_registrations");
        context.Model.FindEntityType(
                typeof(AdvertisementRegistrationProduct))!
            .GetTableName().ShouldBe(
                "advertisement_registration_products");
        context.Model.FindEntityType(typeof(EligibilityCertificate))!
            .GetTableName().ShouldBe("eligibility_certificates");
        context.Model.FindEntityType(typeof(CfsCertificate))!
            .GetTableName().ShouldBe("cfs_certificates");
        context.Model.FindEntityType(typeof(ExportFoodCertificate))!
            .GetTableName().ShouldBe("export_food_certificates");
        context.Model.FindEntityType(typeof(InspectionPlan))!
            .GetTableName().ShouldBe("inspection_plans");
        context.Model.FindEntityType(typeof(InspectionPlanItem))!
            .GetTableName().ShouldBe("inspection_plan_items");
        context.Model.FindEntityType(typeof(InspectionResult))!
            .GetTableName().ShouldBe("inspection_results");
        context.Model.FindEntityType(typeof(InspectionResultInspector))!
            .GetTableName().ShouldBe("inspection_result_inspectors");
        context.Model.FindEntityType(typeof(InspectionViolation))!
            .GetTableName().ShouldBe("inspection_violations");
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

    [Fact]
    public void Advertisement_registration_should_enforce_owned_products()
    {
        using var context = CreateContext();
        var registration =
            context.Model.FindEntityType(typeof(AdvertisementRegistration))!;
        var link = context.Model.FindEntityType(
            typeof(AdvertisementRegistrationProduct))!;

        registration.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_ad_reg_business_org");
        registration.GetIndexes().Single(index =>
                index.GetDatabaseName() ==
                "uq_advertisement_registrations_number")
            .IsUnique.ShouldBeTrue();
        link.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_arp_ad_reg_owner");
        link.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_arp_product_owner");
    }

    [Fact]
    public void Eligibility_certificate_should_enforce_ownership_and_number()
    {
        using var context = CreateContext();
        var certificate =
            context.Model.FindEntityType(typeof(EligibilityCertificate))!;

        certificate.GetForeignKeys().ShouldContain(key =>
            key.GetConstraintName() == "fk_elic_business_org");
        var unique = certificate.GetIndexes().Single(index =>
            index.GetDatabaseName() ==
            "uq_eligibility_certificates_number");
        unique.IsUnique.ShouldBeTrue();
        unique.GetFilter().ShouldBeNull();
    }
}
