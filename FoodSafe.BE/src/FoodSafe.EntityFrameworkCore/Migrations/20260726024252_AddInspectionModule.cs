using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddInspectionModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "inspection_plans",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    plan_type = table.Column<short>(type: "smallint", nullable: false),
                    year = table.Column<int>(type: "integer", nullable: false),
                    start_date = table.Column<DateTime>(type: "date", nullable: true),
                    end_date = table.Column<DateTime>(type: "date", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    objectives = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    submitted_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejected_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rejected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejected_reason = table.Column<string>(type: "text", nullable: true),
                    cancelled_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    cancelled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    cancelled_reason = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_inspection_plans", x => x.id);
                    table.CheckConstraint("chk_inspection_plan_approval", "status NOT IN (3, 4, 5) OR (approved_by_id IS NOT NULL AND approved_at IS NOT NULL)");
                    table.CheckConstraint("chk_inspection_plan_cancellation", "status <> 6 OR (cancelled_by_id IS NOT NULL AND cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL)");
                    table.CheckConstraint("chk_inspection_plan_submission", "(status = 1) OR (submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)");
                    table.CheckConstraint("chk_inspection_plans_dates", "start_date IS NULL OR end_date IS NULL OR start_date <= end_date");
                    table.CheckConstraint("chk_inspection_plans_status", "status IN (1, 2, 3, 4, 5, 6)");
                    table.CheckConstraint("chk_inspection_plans_type", "plan_type IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "fk_plans_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inspection_plan_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sequence_number = table.Column<int>(type: "integer", nullable: false),
                    planned_date = table.Column<DateTime>(type: "date", nullable: true),
                    assigned_inspector_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inspection_plan_items", x => x.id);
                    table.CheckConstraint("chk_ipi_status", "status IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "FK_inspection_plan_items_inspection_plans_plan_id",
                        column: x => x.plan_id,
                        principalTable: "inspection_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ipi_business",
                        column: x => x.business_id,
                        principalTable: "businesses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inspection_results",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    plan_id = table.Column<Guid>(type: "uuid", nullable: true),
                    plan_item_id = table.Column<Guid>(type: "uuid", nullable: true),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    inspection_date = table.Column<DateTime>(type: "date", nullable: false),
                    inspection_type = table.Column<short>(type: "smallint", nullable: false),
                    team_leader = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    team_members_text = table.Column<string>(type: "text", nullable: true),
                    overall_result = table.Column<short>(type: "smallint", nullable: false),
                    has_violation = table.Column<bool>(type: "boolean", nullable: false),
                    violation_description = table.Column<string>(type: "text", nullable: true),
                    fine_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    fine_currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    admin_decision_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    admin_decision_date = table.Column<DateTime>(type: "date", nullable: true),
                    follow_up_required = table.Column<bool>(type: "boolean", nullable: false),
                    follow_up_date = table.Column<DateTime>(type: "date", nullable: true),
                    follow_up_result = table.Column<short>(type: "smallint", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
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
                    table.PrimaryKey("pk_inspection_results", x => x.id);
                    table.CheckConstraint("chk_ir_plan_tuple", "(plan_item_id IS NULL AND plan_id IS NULL) OR (plan_item_id IS NOT NULL AND plan_id IS NOT NULL)");
                    table.CheckConstraint("chk_ir_result", "overall_result IN (1, 2, 3)");
                    table.CheckConstraint("chk_ir_type", "inspection_type IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "fk_ir_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_ir_plan",
                        column: x => x.plan_id,
                        principalTable: "inspection_plans",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "inspection_result_inspectors",
                columns: table => new
                {
                    inspection_result_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_team_leader = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inspection_result_inspectors", x => new { x.inspection_result_id, x.user_id });
                    table.ForeignKey(
                        name: "FK_inspection_result_inspectors_inspection_results_inspection_~",
                        column: x => x.inspection_result_id,
                        principalTable: "inspection_results",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "inspection_violations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    inspection_result_id = table.Column<Guid>(type: "uuid", nullable: false),
                    violation_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    description = table.Column<string>(type: "text", nullable: false),
                    regulation_reference = table.Column<string>(type: "text", nullable: true),
                    fine_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    remedy_required = table.Column<string>(type: "text", nullable: true),
                    remedy_deadline = table.Column<DateTime>(type: "date", nullable: true),
                    is_remedied = table.Column<bool>(type: "boolean", nullable: false),
                    remedied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    remedied_notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_inspection_violations", x => x.id);
                    table.ForeignKey(
                        name: "FK_inspection_violations_inspection_results_inspection_result_~",
                        column: x => x.inspection_result_id,
                        principalTable: "inspection_results",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_inspection_plan_items_business",
                table: "inspection_plan_items",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "uq_ipi_id_plan_business",
                table: "inspection_plan_items",
                columns: new[] { "id", "plan_id", "business_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_ipi_plan_business",
                table: "inspection_plan_items",
                columns: new[] { "plan_id", "business_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_inspection_plans_org",
                table: "inspection_plans",
                columns: new[] { "organization_id", "year" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_plans_status",
                table: "inspection_plans",
                column: "status",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_inspection_plans_code",
                table: "inspection_plans",
                columns: new[] { "plan_code", "organization_id" },
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_iri_user",
                table: "inspection_result_inspectors",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_business",
                table: "inspection_results",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_date",
                table: "inspection_results",
                column: "inspection_date",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_org",
                table: "inspection_results",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_plan",
                table: "inspection_results",
                column: "plan_id",
                filter: "plan_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_plan_item",
                table: "inspection_results",
                column: "plan_item_id",
                unique: true,
                filter: "plan_item_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_results_violation",
                table: "inspection_results",
                column: "has_violation",
                filter: "has_violation = TRUE AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_violations_remedied",
                table: "inspection_violations",
                columns: new[] { "is_remedied", "remedy_deadline" },
                filter: "is_remedied = FALSE AND remedy_deadline IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "idx_inspection_violations_result",
                table: "inspection_violations",
                column: "inspection_result_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "inspection_plan_items");

            migrationBuilder.DropTable(
                name: "inspection_result_inspectors");

            migrationBuilder.DropTable(
                name: "inspection_violations");

            migrationBuilder.DropTable(
                name: "inspection_results");

            migrationBuilder.DropTable(
                name: "inspection_plans");
        }
    }
}
