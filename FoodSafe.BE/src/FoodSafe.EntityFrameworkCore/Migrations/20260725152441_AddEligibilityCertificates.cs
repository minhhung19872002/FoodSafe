using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddEligibilityCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "eligibility_certificates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    issue_date = table.Column<DateTime>(type: "date", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    certifying_authority = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    certification_scope = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    revoke_reason = table.Column<string>(type: "text", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revoked_by_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("pk_eligibility_certificates", x => x.id);
                    table.CheckConstraint("chk_elic_dates", "expiry_date IS NULL OR issue_date <= expiry_date");
                    table.CheckConstraint("chk_elic_revoke", "(status != 3 AND revoke_reason IS NULL AND revoked_at IS NULL AND revoked_by_id IS NULL) OR (status = 3 AND revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
                    table.CheckConstraint("chk_elic_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_elic_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_elic_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddForeignKey(
                name: "fk_elic_document_owner",
                table: "eligibility_certificates",
                columns: new[] { "id", "organization_id" },
                principalTable: "document_owners",
                principalColumns: new[] { "id", "organization_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.CreateIndex(
                name: "idx_eligibility_certificates_business",
                table: "eligibility_certificates",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_eligibility_certificates_expiry",
                table: "eligibility_certificates",
                columns: new[] { "expiry_date", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_eligibility_certificates_org",
                table: "eligibility_certificates",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_eligibility_certificates_business_id_organization_id",
                table: "eligibility_certificates",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "uq_eligibility_certificates_number",
                table: "eligibility_certificates",
                column: "certificate_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "eligibility_certificates");
        }
    }
}
