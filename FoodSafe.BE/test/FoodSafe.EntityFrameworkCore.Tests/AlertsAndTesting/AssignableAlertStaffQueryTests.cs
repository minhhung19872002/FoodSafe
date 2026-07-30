using FoodSafe.EntityFrameworkCore;
using FoodSafe.Security;
using Microsoft.EntityFrameworkCore;
using Shouldly;
using Xunit;

namespace FoodSafe.AlertsAndTesting;

public sealed class AssignableAlertStaffQueryTests
{
    [Fact]
    public void Query_Should_Be_Translatable_By_PostgreSql_Provider()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;

        using var context = new FoodSafeDbContext(options);
        var scope = new CurrentDataScope(
            Guid.NewGuid(),
            null,
            HasGlobalAccess: true,
            HasRestrictedScope: false,
            new HashSet<Guid>(),
            new HashSet<Guid>(),
            new HashSet<Guid>());

        var query = AtpAlertAppService.BuildAssignableUsersQuery(
                context.Users.IgnoreQueryFilters(),
                context.AppUserProfiles.IgnoreQueryFilters(),
                scope)
            .Take(200);

        var sql = query.ToQueryString();

        sql.ShouldContain("ORDER BY");
        sql.ShouldContain("LIMIT");
    }

    [Fact]
    public void Assignee_Access_Check_Should_Be_Translatable_By_PostgreSql_Provider()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;

        using var context = new FoodSafeDbContext(options);
        var organizationId = Guid.NewGuid();
        var assigneeId = Guid.NewGuid();
        var scope = new CurrentDataScope(
            Guid.NewGuid(),
            organizationId,
            HasGlobalAccess: false,
            HasRestrictedScope: true,
            new HashSet<Guid> { organizationId },
            new HashSet<Guid>(),
            new HashSet<Guid>());

        var query = AtpAlertAppService.BuildAssignableUsersQuery(
                context.Users.IgnoreQueryFilters(),
                context.AppUserProfiles.IgnoreQueryFilters(),
                scope)
            .Where(x => x.Id == assigneeId);

        var sql = query.ToQueryString();

        sql.ShouldContain("organization_id");
        sql.ShouldContain("user_id");
    }
}
