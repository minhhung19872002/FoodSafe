using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using FoodSafe.Data;
using Volo.Abp.DependencyInjection;

namespace FoodSafe.EntityFrameworkCore;

public class EntityFrameworkCoreFoodSafeDbSchemaMigrator
    : IFoodSafeDbSchemaMigrator, ITransientDependency
{
    private readonly IServiceProvider _serviceProvider;

    public EntityFrameworkCoreFoodSafeDbSchemaMigrator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task MigrateAsync()
    {
        await _serviceProvider
            .GetRequiredService<FoodSafeDbContext>()
            .Database
            .MigrateAsync();
    }
}
