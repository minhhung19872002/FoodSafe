using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Organizations;

public class OrganizationTests
{
    [Fact]
    public void Create_Should_Normalize_Code_And_Default_To_Active()
    {
        var organization = Organization.Create(
            Guid.NewGuid(),
            " qn ",
            " Chi cục ATVSTP ",
            OrganizationLevel.Province,
            null,
            Guid.NewGuid(),
            null,
            null);

        organization.Code.ShouldBe("QN");
        organization.Name.ShouldBe("Chi cục ATVSTP");
        organization.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Create_Commune_Without_Commune_Geography_Should_Fail()
    {
        var exception = Should.Throw<BusinessException>(() =>
            Organization.Create(
                Guid.NewGuid(),
                "P01",
                "Phường 1",
                OrganizationLevel.Commune,
                Guid.NewGuid(),
                Guid.NewGuid(),
                Guid.NewGuid(),
                null));

        exception.Code.ShouldBe(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
    }

    [Fact]
    public void ValidateParent_Should_Reject_Skipped_Level()
    {
        var provinceId = Guid.NewGuid();
        var province = Organization.Create(
            Guid.NewGuid(), "T", "Tỉnh", OrganizationLevel.Province,
            null, provinceId, null, null);
        var commune = Organization.Create(
            Guid.NewGuid(), "X", "Xã", OrganizationLevel.Commune,
            province.Id, provinceId, Guid.NewGuid(), Guid.NewGuid());

        var exception = Should.Throw<BusinessException>(() =>
            OrganizationHierarchyRules.ValidateParent(commune, province));

        exception.Code.ShouldBe(FoodSafeDomainErrorCodes.Organization.InvalidParent);
    }

    [Fact]
    public void ValidateParent_Should_Accept_Matching_District()
    {
        var provinceId = Guid.NewGuid();
        var districtId = Guid.NewGuid();
        var province = Organization.Create(
            Guid.NewGuid(), "T", "Tỉnh", OrganizationLevel.Province,
            null, provinceId, null, null);
        var district = Organization.Create(
            Guid.NewGuid(), "H", "Huyện", OrganizationLevel.District,
            province.Id, provinceId, districtId, null);

        Should.NotThrow(() =>
            OrganizationHierarchyRules.ValidateParent(district, province));
    }
}
