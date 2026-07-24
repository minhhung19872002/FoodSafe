using Volo.Abp.Threading;

namespace FoodSafe;

public static class FoodSafeGlobalFeatureConfigurator
{
    private static readonly OneTimeRunner OneTimeRunner = new();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            /* Configure global features here */
        });
    }
}
