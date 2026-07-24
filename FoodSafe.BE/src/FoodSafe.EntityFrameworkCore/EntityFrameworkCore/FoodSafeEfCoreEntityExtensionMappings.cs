using Volo.Abp.Threading;

namespace FoodSafe.EntityFrameworkCore;

public static class FoodSafeEfCoreEntityExtensionMappings
{
    private static readonly OneTimeRunner OneTimeRunner = new();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            /* Configure extra properties for ABP entities here */
        });
    }
}
