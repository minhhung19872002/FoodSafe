using FoodSafe.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Shouldly;
using Xunit;

namespace FoodSafe.DataIntegration;

public sealed class DataIntegrationMappingTests
{
    private static FoodSafeDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<FoodSafeDbContext>()
            .UseNpgsql(
                "Host=localhost;Database=model_only;Username=model_only;Password=model_only")
            .Options;
        return new FoodSafeDbContext(options);
    }

    [Fact]
    public void Call_log_should_map_immutable_attempt_history_columns()
    {
        using var context = CreateContext();
        // Check constraints only live on the design-time model.
        var log = context.GetService<IDesignTimeModel>().Model
            .FindEntityType(typeof(ApiCallLog))!;

        log.GetTableName().ShouldBe("di_api_call_logs");
        log.FindProperty(nameof(ApiCallLog.EndpointId))!
            .GetColumnName().ShouldBe("endpoint_id");
        log.FindProperty(nameof(ApiCallLog.CorrelationId))!
            .GetColumnName().ShouldBe("correlation_id");

        var attempt = log.FindProperty(nameof(ApiCallLog.AttemptNumber))!;
        attempt.GetColumnName().ShouldBe("attempt_number");
        attempt.GetDefaultValue().ShouldBe(1);

        var checksum = log.FindProperty(nameof(ApiCallLog.PayloadChecksum))!;
        checksum.GetColumnName().ShouldBe("payload_checksum");
        checksum.GetMaxLength().ShouldBe(64);

        log.GetIndexes().Single(index =>
                index.GetDatabaseName() == "idx_di_cl_correlation")
            .GetFilter().ShouldBe("correlation_id IS NOT NULL");

        log.GetCheckConstraints().Single(constraint =>
                constraint.Name == "chk_di_cl_attempt")
            .Sql.ShouldBe("attempt_number >= 1");
    }
}
