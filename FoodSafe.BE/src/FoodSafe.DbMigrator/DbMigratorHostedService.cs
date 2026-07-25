using System;
using System.Threading;
using System.Threading.Tasks;
using FoodSafe.Data;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Serilog;
using Volo.Abp;
using Volo.Abp.Data;

namespace FoodSafe.DbMigrator;

public class DbMigratorHostedService : IHostedService
{
    private readonly IHostApplicationLifetime _hostApplicationLifetime;
    private readonly IConfiguration _configuration;

    public DbMigratorHostedService(
        IHostApplicationLifetime hostApplicationLifetime,
        IConfiguration configuration)
    {
        _hostApplicationLifetime = hostApplicationLifetime;
        _configuration = configuration;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            Log.Information("Starting database migration...");

            using var application = await AbpApplicationFactory.CreateAsync<FoodSafeDbMigratorModule>(options =>
            {
                options.Services.ReplaceConfiguration(_configuration);
                options.UseAutofac();
                options.Services.AddLogging(c => c.AddSerilog());
                options.AddDataMigrationEnvironment();
            });

            Log.Information("Application initialized, running migrations...");
            await application.InitializeAsync();

            await application
                .ServiceProvider
                .GetRequiredService<FoodSafeDbMigrationService>()
                .MigrateAsync();

            Log.Information("Migration completed successfully!");
            await application.ShutdownAsync();

            _hostApplicationLifetime.StopApplication();
        }
        catch (Exception ex)
        {
            Log.Fatal(ex, "Migration failed: {Message}", ex.Message);
            _hostApplicationLifetime.StopApplication();
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
