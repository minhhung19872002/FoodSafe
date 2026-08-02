using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class LegalAlignmentViolationCatalogRecallExemption : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "decision_date",
                table: "inspection_results",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "decision_number",
                table: "inspection_results",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "cause_category",
                table: "food_poisoning_incidents",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "eligibility_exemption_reason",
                table: "businesses",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "quality_certification_expiry",
                table: "businesses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "quality_certification_number",
                table: "businesses",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "quality_certification_type",
                table: "businesses",
                type: "smallint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "cat_violation_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    legal_reference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    min_fine = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    max_fine = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cat_violation_types", x => x.id);
                    table.CheckConstraint("chk_violation_types_fine_range", "min_fine IS NULL OR max_fine IS NULL OR min_fine <= max_fine");
                });

            migrationBuilder.CreateTable(
                name: "product_recalls",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    product_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    batch_info = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    recall_type = table.Column<short>(type: "smallint", nullable: false),
                    reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    decision_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    decision_date = table.Column<DateTime>(type: "date", nullable: true),
                    start_date = table.Column<DateTime>(type: "date", nullable: false),
                    completed_date = table.Column<DateTime>(type: "date", nullable: true),
                    quantity_recalled = table.Column<decimal>(type: "numeric(18,3)", nullable: true),
                    quantity_unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    post_recall_action = table.Column<short>(type: "smallint", nullable: true),
                    action_description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    cancel_reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_product_recalls", x => x.id);
                    table.CheckConstraint("chk_product_recalls_action", "post_recall_action IS NULL OR post_recall_action IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_product_recalls_cancelled", "(status != 4 AND cancel_reason IS NULL) OR (status = 4 AND cancel_reason IS NOT NULL)");
                    table.CheckConstraint("chk_product_recalls_completed", "status != 3 OR (post_recall_action IS NOT NULL AND completed_date IS NOT NULL)");
                    table.CheckConstraint("chk_product_recalls_dates", "completed_date IS NULL OR start_date <= completed_date");
                    table.CheckConstraint("chk_product_recalls_decision", "recall_type != 2 OR decision_number IS NOT NULL");
                    table.CheckConstraint("chk_product_recalls_quantity", "quantity_recalled IS NULL OR quantity_recalled >= 0");
                    table.CheckConstraint("chk_product_recalls_status", "status IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_product_recalls_type", "recall_type IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_product_recalls_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_recalls_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_product_recalls_product",
                        columns: x => new { x.product_id, x.business_id, x.organization_id },
                        principalTable: "products",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "uq_violation_types_code",
                table: "cat_violation_types",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_product_recalls_business",
                table: "product_recalls",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_product_recalls_org",
                table: "product_recalls",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_product_recalls_status_type",
                table: "product_recalls",
                columns: new[] { "status", "recall_type" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_product_recalls_business_id_organization_id",
                table: "product_recalls",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_product_recalls_product_id_business_id_organization_id",
                table: "product_recalls",
                columns: new[] { "product_id", "business_id", "organization_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cat_violation_types");

            migrationBuilder.DropTable(
                name: "product_recalls");

            migrationBuilder.DropColumn(
                name: "decision_date",
                table: "inspection_results");

            migrationBuilder.DropColumn(
                name: "decision_number",
                table: "inspection_results");

            migrationBuilder.DropColumn(
                name: "cause_category",
                table: "food_poisoning_incidents");

            migrationBuilder.DropColumn(
                name: "eligibility_exemption_reason",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "quality_certification_expiry",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "quality_certification_number",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "quality_certification_type",
                table: "businesses");
        }
    }
}
