using System.ComponentModel.DataAnnotations;
using System.Reflection;
using FoodSafe.Permissions;
using Microsoft.AspNetCore.Authorization;
using Shouldly;
using Xunit;

namespace FoodSafe.Catalogs;

public sealed class MasterCatalogApplicationContractTests
{
    [Fact]
    public void Every_contract_operation_should_be_implemented_by_the_app_service()
    {
        var contractMethods = typeof(IMasterCatalogAppService)
            .GetMethods()
            .Select(method => method.ToString())
            .OrderBy(signature => signature)
            .ToArray();
        var serviceMethods = typeof(MasterCatalogAppService)
            .GetMethods(BindingFlags.Instance | BindingFlags.Public |
                        BindingFlags.DeclaredOnly)
            .Select(method => method.ToString())
            .OrderBy(signature => signature)
            .ToArray();

        serviceMethods.ShouldBe(contractMethods);
        // 36 catalog operations + 4 ViolationType operations (NĐ 115/2018 catalog).
        serviceMethods.Length.ShouldBe(40);
    }

    [Fact]
    public void Catalog_operations_should_enforce_least_privilege_permissions()
    {
        PermissionOf(typeof(MasterCatalogAppService))
            .ShouldBe(FoodSafePermissions.Catalogs.View);

        foreach (var method in typeof(MasterCatalogAppService).GetMethods(
                     BindingFlags.Instance | BindingFlags.Public |
                     BindingFlags.DeclaredOnly))
        {
            var expected = method.Name.StartsWith("Create", StringComparison.Ordinal)
                ? FoodSafePermissions.Catalogs.Create
                : method.Name.StartsWith("Update", StringComparison.Ordinal)
                    ? FoodSafePermissions.Catalogs.Edit
                    : method.Name.StartsWith("Delete", StringComparison.Ordinal)
                        ? FoodSafePermissions.Catalogs.Delete
                        : null;

            PermissionOf(method).ShouldBe(expected, method.Name);
        }
    }

    [Fact]
    public void Specialized_upsert_contracts_should_reject_invalid_boundaries()
    {
        Validate(new UpsertCountryDto
        {
            CodeAlpha2 = "VNM",
            CodeAlpha3 = "VN",
            NameVi = "Việt Nam"
        }).Count.ShouldBe(2);

        Validate(new UpsertProductGroupDto
        {
            Code = "FOOD",
            Name = "Thực phẩm",
            Level = 3
        }).ShouldContain(result =>
            result.MemberNames.Contains(nameof(UpsertProductGroupDto.Level)));

        Validate(new UpsertTestingServiceDto
        {
            Code = "SERVICE",
            Name = "Dịch vụ",
            Unit = "mẫu",
            Method = "ISO",
            Price = -1,
            TurnaroundDays = -1
        }).Count.ShouldBe(2);
    }

    private static string? PermissionOf(MemberInfo member) =>
        member.GetCustomAttribute<AuthorizeAttribute>()?.Policy;

    private static List<ValidationResult> Validate(object input)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(
            input,
            new ValidationContext(input),
            results,
            validateAllProperties: true);
        return results;
    }
}
