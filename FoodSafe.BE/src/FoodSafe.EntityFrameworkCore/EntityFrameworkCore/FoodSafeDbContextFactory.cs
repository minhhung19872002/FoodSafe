using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FoodSafe.EntityFrameworkCore;

public class FoodSafeDbContextFactory : IDesignTimeDbContextFactory<FoodSafeDbContext>
{
    public FoodSafeDbContext CreateDbContext(string[] args)
    {
        var configuration = BuildConfiguration();

        var builder = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(configuration.GetConnectionString("Default"));

        return new FoodSafeDbContext(builder.Options);
    }

    private static IConfigurationRoot BuildConfiguration()
    {
        var builder = new ConfigurationBuilder()
            .SetBasePath(Path.Combine(Directory.GetCurrentDirectory(),
                "../FoodSafe.HttpApi.Host/"))
            .AddJsonFile("appsettings.json", optional: false);

        return builder.Build();
    }
}
