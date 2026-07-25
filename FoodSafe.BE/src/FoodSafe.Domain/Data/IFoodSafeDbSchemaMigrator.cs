using System.Threading.Tasks;

namespace FoodSafe.Data;

public interface IFoodSafeDbSchemaMigrator
{
    Task MigrateAsync();
}
