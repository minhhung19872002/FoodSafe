using Shouldly;
using Xunit;

namespace FoodSafe.BusinessManagement;

public class BusinessCodeSuggestionTests
{
    [Fact]
    public void Different_Organizations_Should_Have_Different_Code_Prefixes()
    {
        var hongGai = BusinessAppService.SuggestBusinessCode(
            "KH-HG-01", []);
        var baiChay = BusinessAppService.SuggestBusinessCode(
            "KH-BC-01", []);

        hongGai.ShouldBe("CS-KH-HG-01-0001");
        baiChay.ShouldBe("CS-KH-BC-01-0001");
        hongGai.ShouldNotBe(baiChay);
    }

    [Fact]
    public void Sequence_Should_Continue_From_Selected_Organization()
    {
        var code = BusinessAppService.SuggestBusinessCode(
            "kh-hg-01",
            ["CS-KH-HG-01-0002", "CS-KH-HG-01-0012"]);

        code.ShouldBe("CS-KH-HG-01-0013");
    }
}
