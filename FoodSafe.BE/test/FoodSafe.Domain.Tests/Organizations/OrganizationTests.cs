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
                null));

        exception.Code.ShouldBe(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
    }

    [Fact]
    public void ValidateParent_Should_Reject_Commune_With_Wrong_Province()
    {
        var province1Id = Guid.NewGuid();
        var province2Id = Guid.NewGuid();
        var province1 = Organization.Create(
            Guid.NewGuid(), "T1", "Tỉnh 1", OrganizationLevel.Province,
            null, province1Id, null);
        var province2 = Organization.Create(
            Guid.NewGuid(), "T2", "Tỉnh 2", OrganizationLevel.Province,
            null, province2Id, null);
        var commune = Organization.Create(
            Guid.NewGuid(), "X", "Xã", OrganizationLevel.Commune,
            province1.Id, province1Id, Guid.NewGuid());

        var exception = Should.Throw<BusinessException>(() =>
            OrganizationHierarchyRules.ValidateParent(commune, province2));

        exception.Code.ShouldBe(FoodSafeDomainErrorCodes.Organization.InvalidGeography);
    }

    [Fact]
    public void ValidateParent_Should_Accept_Commune_Under_Province()
    {
        var provinceId = Guid.NewGuid();
        var province = Organization.Create(
            Guid.NewGuid(), "T", "Tỉnh", OrganizationLevel.Province,
            null, provinceId, null);
        var commune = Organization.Create(
            Guid.NewGuid(), "X", "Xã", OrganizationLevel.Commune,
            province.Id, provinceId, Guid.NewGuid());

        Should.NotThrow(() =>
            OrganizationHierarchyRules.ValidateParent(commune, province));
    }
}
