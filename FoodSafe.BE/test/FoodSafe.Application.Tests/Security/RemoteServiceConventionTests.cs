using System.Reflection;
using FoodSafe.BusinessManagement;
using Shouldly;
using Volo.Abp;
using Xunit;

namespace FoodSafe.Security;

public sealed class RemoteServiceConventionTests
{
    private static readonly Assembly ApplicationAssembly =
        typeof(BusinessExcelAppService).Assembly;

    [Fact]
    public void All_excel_app_services_must_have_RemoteService_false()
    {
        var excelServices = ApplicationAssembly
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith("ExcelAppService"))
            .ToList();

        excelServices.Count.ShouldBeGreaterThanOrEqualTo(22,
            "Expected at least 22 Excel AppServices — did one get removed?");

        foreach (var type in excelServices)
        {
            var attr = type.GetCustomAttribute<RemoteServiceAttribute>();
            attr.ShouldNotBeNull(
                $"{type.Name} is missing [RemoteService(false)] — ABP will auto-generate a duplicate controller");
            attr!.IsEnabled.ShouldBeFalse(
                $"{type.Name} has [RemoteService] but IsEnabled is not false");
        }
    }

    [Fact]
    public void All_public_app_services_must_have_RemoteService_false()
    {
        var publicServices = ApplicationAssembly
            .GetTypes()
            .Where(t => t.IsClass && !t.IsAbstract && t.Name.StartsWith("Public") && t.Name.EndsWith("AppService"))
            .ToList();

        foreach (var type in publicServices)
        {
            var attr = type.GetCustomAttribute<RemoteServiceAttribute>();
            attr.ShouldNotBeNull(
                $"{type.Name} is missing [RemoteService(false)] — ABP will auto-generate a duplicate controller");
            attr!.IsEnabled.ShouldBeFalse(
                $"{type.Name} has [RemoteService] but IsEnabled is not false");
        }
    }
}
