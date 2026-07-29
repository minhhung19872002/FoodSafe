using Shouldly;
using Xunit;

namespace FoodSafe.Geocoding;

public sealed class AddressQueryTests
{
    [Theory]
    // The address that exposed the problem: with the "Số 12 phố" wrapper the
    // provider returns nothing; with just the road name it matches.
    [InlineData("Số 12 phố Cao Thắng", "Cao Thắng")]
    [InlineData("Số 15 đường Trần Quốc Nghiễn", "Trần Quốc Nghiễn")]
    [InlineData("Số 82 phố Giếng Đồn", "Giếng Đồn")]
    [InlineData("Lô B4, KCN Cái Lân", "KCN Cái Lân")]
    [InlineData("Khu 3, thị trấn Cái Rồng", "thị trấn Cái Rồng")]
    [InlineData("Số 25 đường 25 Tháng 4", "Tháng 4")]
    public void Should_Strip_House_Numbers_And_Street_Type_Words(
        string street,
        string expected)
    {
        AddressQuery.StripStreetPrefixes(street).ShouldBe(expected);
    }

    [Theory]
    [InlineData("Cao Thắng", "Cao Thắng")]
    [InlineData("Trần Hưng Đạo", "Trần Hưng Đạo")]
    public void Should_Leave_A_Bare_Road_Name_Untouched(
        string street,
        string expected)
    {
        AddressQuery.StripStreetPrefixes(street).ShouldBe(expected);
    }

    [Fact]
    public void Should_Not_Loop_Forever_On_Numbers_Only()
    {
        AddressQuery.StripStreetPrefixes("Số 12").ShouldBe("12");
    }

    [Fact]
    public void Should_Handle_Whitespace_Only_Input()
    {
        AddressQuery.StripStreetPrefixes("   ").ShouldBeEmpty();
    }
}
