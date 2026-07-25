using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Catalogs;

public class AdministrativeAreaTests
{
    [Fact]
    public void Country_Should_Normalize_Iso_Codes()
    {
        var country = Country.Create(Guid.NewGuid(), " vn ", "Việt Nam", " vnm ");

        country.CodeAlpha2.ShouldBe("VN");
        country.CodeAlpha3.ShouldBe("VNM");
        country.IsActive.ShouldBeTrue();
    }

    [Fact]
    public void Country_Should_Reject_Invalid_Alpha2_Code()
    {
        Should.Throw<BusinessException>(() =>
            Country.Create(Guid.NewGuid(), "V", "Việt Nam"));
    }

    [Fact]
    public void District_Should_Reject_Unknown_Type()
    {
        Should.Throw<BusinessException>(() =>
            District.Create(
                Guid.NewGuid(),
                "001",
                "Hạ Long",
                Guid.NewGuid(),
                (DistrictType)99));
    }

    [Fact]
    public void Commune_Should_Normalize_Common_Fields()
    {
        var commune = Commune.Create(
            Guid.NewGuid(),
            " 00001 ",
            " Phường Bạch Đằng ",
            Guid.NewGuid(),
            CommuneType.Ward,
            10);

        commune.Code.ShouldBe("00001");
        commune.Name.ShouldBe("Phường Bạch Đằng");
        commune.SortOrder.ShouldBe(10);
    }
}
