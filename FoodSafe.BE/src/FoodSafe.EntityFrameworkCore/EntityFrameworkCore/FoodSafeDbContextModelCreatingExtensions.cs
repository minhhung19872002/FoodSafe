using Microsoft.EntityFrameworkCore;
using Volo.Abp;

namespace FoodSafe.EntityFrameworkCore;

public static class FoodSafeDbContextModelCreatingExtensions
{
    public static void ConfigureFoodSafe(this ModelBuilder builder)
    {
        Check.NotNull(builder, nameof(builder));

        /* Configure FoodSafe domain entities here.
         * Each bounded context will add its own entity configurations
         * as the domain modules are built (Phase 2+).
         */
    }
}
