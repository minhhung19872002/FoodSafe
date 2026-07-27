using System.Reflection;
using Volo.Abp.Application.Services;
using Xunit;

namespace FoodSafe.Architecture;

public sealed class ApplicationDependencyBoundaryTests
{
    [Fact]
    public void Application_contracts_should_not_reference_implementation_layers()
    {
        AssertDoesNotReference(
            typeof(FoodSafeApplicationContractsModule).Assembly,
            "FoodSafe.Domain",
            "FoodSafe.Application",
            "FoodSafe.EntityFrameworkCore",
            "FoodSafe.HttpApi",
            "FoodSafe.HttpApi.Host");
    }

    [Fact]
    public void Application_should_not_reference_persistence_or_delivery_layers()
    {
        AssertDoesNotReference(
            typeof(FoodSafeApplicationModule).Assembly,
            "FoodSafe.EntityFrameworkCore",
            "FoodSafe.HttpApi",
            "FoodSafe.HttpApi.Host");
    }

    [Fact]
    public void Application_services_should_remain_proxyable()
    {
        var sealedApplicationServices = typeof(FoodSafeApplicationModule).Assembly
            .GetTypes()
            .Where(type =>
                type.IsClass &&
                !type.IsAbstract &&
                type.IsSealed &&
                typeof(IApplicationService).IsAssignableFrom(type))
            .Select(type => type.FullName)
            .ToArray();

        Assert.Empty(sealedApplicationServices);
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
