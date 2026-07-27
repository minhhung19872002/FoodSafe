using System.Reflection;
using Xunit;

namespace FoodSafe.Architecture;

public sealed class DependencyBoundaryTests
{
    [Fact]
    public void Domain_shared_should_not_reference_higher_layers()
    {
        AssertDoesNotReference(
            typeof(FoodSafeDomainSharedModule).Assembly,
            "FoodSafe.Domain",
            "FoodSafe.Application.Contracts",
            "FoodSafe.Application",
            "FoodSafe.EntityFrameworkCore",
            "FoodSafe.HttpApi",
            "FoodSafe.HttpApi.Host");
    }

    [Fact]
    public void Domain_should_not_reference_application_or_delivery_layers()
    {
        AssertDoesNotReference(
            typeof(FoodSafeDomainModule).Assembly,
            "FoodSafe.Application.Contracts",
            "FoodSafe.Application",
            "FoodSafe.EntityFrameworkCore",
            "FoodSafe.HttpApi",
            "FoodSafe.HttpApi.Host");
    }

    private static void AssertDoesNotReference(
        Assembly assembly,
        params string[] forbiddenAssemblies)
    {
        var references = assembly.GetReferencedAssemblies()
            .Select(reference => reference.Name ?? string.Empty)
            .ToArray();

        foreach (var forbiddenAssembly in forbiddenAssemblies)
        {
            Assert.DoesNotContain(forbiddenAssembly, references);
        }
    }
}
