using FoodSafe.EntityFrameworkCore;
using FoodSafe.Organizations;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Shouldly;
using Testcontainers.PostgreSql;
using Xunit;

namespace FoodSafe.Catalogs;

public sealed class GeographicCatalogPostgreSqlTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:15-alpine")
        .WithDatabase("foodsafe_tests")
        .WithUsername("foodsafe")
        .WithPassword("test-only-password")
        .Build();

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await using var context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    [Fact]
    public async Task Migrations_Should_Create_Clean_Database_And_Be_Idempotent()
    {
        await using var context = CreateContext();

        await context.Database.MigrateAsync();
        await context.Database.MigrateAsync();

        (await context.Database.CanConnectAsync()).ShouldBeTrue();
        context.Model.FindEntityType(typeof(Commune)).ShouldNotBeNull();
    }

    [Fact]
    public async Task Database_Should_Reject_District_From_Another_Province()
    {
        var provinceOneId = Guid.NewGuid();
        var provinceTwoId = Guid.NewGuid();
        var districtId = Guid.NewGuid();
        var parentId = Guid.NewGuid();

        await using var connection = new NpgsqlConnection(_postgres.GetConnectionString());
        await connection.OpenAsync();

        await ExecuteAsync(connection, """
            INSERT INTO cat_provinces
                (id, code, name, is_active, sort_order, creation_time, is_deleted)
            VALUES
                (@p1, 'P01', 'Tỉnh 1', TRUE, 0, NOW(), FALSE),
                (@p2, 'P02', 'Tỉnh 2', TRUE, 0, NOW(), FALSE);
            INSERT INTO cat_districts
                (id, province_id, code, name, type, is_active, sort_order, creation_time, is_deleted)
            VALUES
                (@district, @p1, 'D01', 'Huyện 1', 1, TRUE, 0, NOW(), FALSE);
            INSERT INTO organizations
                (id, code, name, level, province_id, is_active, extra_properties,
                 concurrency_stamp, creation_time, is_deleted)
            VALUES
                (@parent, 'ORG-P02', 'Đơn vị tỉnh 2', 1, @p2, TRUE, '{}',
                 'test-parent', NOW(), FALSE);
            """,
            new("p1", provinceOneId),
            new("p2", provinceTwoId),
            new("district", districtId),
            new("parent", parentId));

        var exception = await Should.ThrowAsync<PostgresException>(() =>
            ExecuteAsync(connection, """
                INSERT INTO organizations
                    (id, parent_id, code, name, level, province_id, district_id,
                     is_active, extra_properties, concurrency_stamp, creation_time, is_deleted)
                VALUES
                    (@id, @parent, 'ORG-D01', 'Đơn vị huyện sai địa bàn', 2, @p2, @district,
                     TRUE, '{}', 'test-child', NOW(), FALSE);
                """,
                new("id", Guid.NewGuid()),
                new("parent", parentId),
                new("p2", provinceTwoId),
                new("district", districtId)));

        exception.SqlState.ShouldBe(PostgresErrorCodes.ForeignKeyViolation);
    }

    private FoodSafeDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;
        return new FoodSafeDbContext(options);
    }

    private static async Task ExecuteAsync(
        NpgsqlConnection connection,
        string sql,
        params NpgsqlParameter[] parameters)
    {
        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddRange(parameters);
        await command.ExecuteNonQueryAsync();
    }
}
