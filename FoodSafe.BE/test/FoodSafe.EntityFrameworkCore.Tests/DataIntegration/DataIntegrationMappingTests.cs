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

    [Fact]
    public void Partner_tables_should_enforce_identity_and_idempotency()
    {
        using var context = CreateContext();
        var model = context.Model;

        var partner = model.FindEntityType(typeof(PartnerAccount))!;
        partner.GetTableName().ShouldBe("di_partner_accounts");
        var code = partner.GetIndexes().Single(index =>
            index.GetDatabaseName() == "uq_di_partner_accounts_code");
        code.IsUnique.ShouldBeTrue();
        code.GetFilter().ShouldBe("is_deleted = FALSE");

        var key = model.FindEntityType(typeof(PartnerApiKey))!;
        key.GetTableName().ShouldBe("di_partner_api_keys");
        key.FindProperty(nameof(PartnerApiKey.KeyHash))!
            .GetMaxLength().ShouldBe(PartnerApiKeyConsts.HashLength);
        key.GetIndexes().Single(index =>
                index.GetDatabaseName() == "uq_di_partner_api_keys_prefix")
            .IsUnique.ShouldBeTrue();
        key.GetForeignKeys().ShouldContain(fk =>
            fk.GetConstraintName() == "fk_di_pak_partner");

        var submission = model.FindEntityType(typeof(InboundSubmission))!;
        submission.GetTableName().ShouldBe("di_inbound_submissions");
        // Database-enforced idempotency: one live row per partner request id.
        submission.GetIndexes().Single(index =>
                index.GetDatabaseName() == "uq_di_is_partner_request")
            .IsUnique.ShouldBeTrue();
        submission.GetForeignKeys().ShouldContain(fk =>
            fk.GetConstraintName() == "fk_di_is_partner");
        // Officer disposition columns (INT-03 approve/reject). The matching
        // chk_di_is_disposition check constraint lives in the migration — check
        // constraints are not part of the read-optimized runtime model.
        submission.FindProperty(nameof(InboundSubmission.ProcessedById))!
            .GetColumnName().ShouldBe("processed_by_id");
        submission.FindProperty(nameof(InboundSubmission.ProcessedAt))!
            .GetColumnName().ShouldBe("processed_at");
    }
}
