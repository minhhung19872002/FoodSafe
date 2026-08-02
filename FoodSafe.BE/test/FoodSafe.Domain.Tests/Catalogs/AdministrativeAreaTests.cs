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
    public void Commune_Should_Normalize_Common_Fields()
    {
        var commune = Commune.Create(
            Guid.NewGuid(),
            " 00001 ",
            " Phường Hồng Gai ",
            Guid.NewGuid(),
            CommuneType.Ward,
            10);

        commune.Code.ShouldBe("00001");
        commune.Name.ShouldBe("Phường Hồng Gai");
        commune.SortOrder.ShouldBe(10);
    }
}
