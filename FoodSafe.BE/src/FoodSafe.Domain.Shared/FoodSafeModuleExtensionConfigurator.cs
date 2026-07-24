using Volo.Abp.ObjectExtending;
using Volo.Abp.Threading;

namespace FoodSafe;

public static class FoodSafeModuleExtensionConfigurator
{
    private static readonly OneTimeRunner OneTimeRunner = new();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            ConfigureExistingProperties();
            ConfigureExtraProperties();
        });
    }

    private static void ConfigureExistingProperties()
    {
        /* Configure existing properties here */
    }

    private static void ConfigureExtraProperties()
    {
        /* Configure extra properties here */
    }
}
