using FoodSafe.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace FoodSafe.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(FoodSafeEntityFrameworkCoreModule),
    typeof(FoodSafeApplicationContractsModule)
)]
public class FoodSafeDbMigratorModule : AbpModule
{
}
