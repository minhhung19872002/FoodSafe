using System.ComponentModel.DataAnnotations;
using Shouldly;
using Xunit;

namespace FoodSafe.Catalogs;

public class GeographicCatalogContractTests
{
    [Fact]
    public void Province_code_longer_than_domain_limit_should_fail_request_validation()
    {
        var input = new UpsertProvinceDto
        {
            Code = "TOO-LONG-001",
            Name = "Test province"
        };
        var results = new List<ValidationResult>();

        Validator.TryValidateObject(
                input,
                new ValidationContext(input),
                results,
                validateAllProperties: true)
            .ShouldBeFalse();
        results.ShouldContain(result =>
            result.MemberNames.Contains(nameof(UpsertProvinceDto.Code)));
    }
}
