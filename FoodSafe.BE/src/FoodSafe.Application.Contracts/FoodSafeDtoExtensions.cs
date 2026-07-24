using Volo.Abp.Threading;

namespace FoodSafe;

public static class FoodSafeDtoExtensions
{
    private static readonly OneTimeRunner OneTimeRunner = new();

    public static void Configure()
    {
        OneTimeRunner.Run(() =>
        {
            /* Configure DTO extensions here */
        });
    }
}
