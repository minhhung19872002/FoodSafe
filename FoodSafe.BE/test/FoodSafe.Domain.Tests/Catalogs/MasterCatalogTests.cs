using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Catalogs;

public class MasterCatalogTests
{
    [Fact]
    public void Product_Group_Should_Enforce_Two_Level_Hierarchy()
    {
        Should.Throw<BusinessException>(() => ProductGroup.Create(
            Guid.NewGuid(), "child", "Child", 2, null, null, 0, true))
            .Code.ShouldBe(FoodSafeDomainErrorCodes.Catalog.InvalidProductGroupHierarchy);
    }

    [Fact]
    public void Product_Group_Should_Normalize_Code()
    {
        var group = ProductGroup.Create(
            Guid.NewGuid(), " food ", "Food", 1, null, null, 1, true);

        group.Code.ShouldBe("FOOD");
        group.Level.ShouldBe((short)1);
    }

    [Theory]
    [InlineData(-1, 2)]
    [InlineData(1, -1)]
    public void Testing_Service_Should_Reject_Negative_Commercial_Values(decimal price, int days)
    {
        Should.Throw<BusinessException>(() => TestingService.Create(
            Guid.NewGuid(), Guid.NewGuid(), "T", "Test", "sample", "ISO",
            price, days, null, 0, true));
    }

    [Fact]
    public void Classification_Should_Reject_Unknown_Risk()
    {
        Should.Throw<BusinessException>(() => BusinessClassification.Create(
            Guid.NewGuid(), "A", "Class A", "criteria", (BusinessRiskLevel)99,
            null, 0, true));
    }
}
