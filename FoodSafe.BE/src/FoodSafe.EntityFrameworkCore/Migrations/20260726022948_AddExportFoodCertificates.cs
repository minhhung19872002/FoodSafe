using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddExportFoodCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "export_food_certificates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    destination_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    issue_date = table.Column<DateTime>(type: "date", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    lot_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    quantity = table.Column<decimal>(type: "numeric(18,3)", nullable: true),
                    quantity_unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
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
                    table.PrimaryKey("pk_export_food_certificates", x => x.id);
                    table.CheckConstraint("chk_export_cert_dates", "expiry_date IS NULL OR issue_date <= expiry_date");
                    table.CheckConstraint("chk_export_cert_revoke", "(status != 3 AND revoke_reason IS NULL AND revoked_at IS NULL AND revoked_by_id IS NULL) OR (status = 3 AND revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
                    table.CheckConstraint("chk_export_cert_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_export_cert_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_export_cert_destination_country",
                        column: x => x.destination_country_id,
                        principalTable: "cat_countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_export_cert_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_export_cert_product_owner",
                        columns: x => new { x.product_id, x.business_id, x.organization_id },
                        principalTable: "products",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_export_cert_business",
                table: "export_food_certificates",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_export_cert_destination_country",
                table: "export_food_certificates",
                column: "destination_country_id",
                filter: "destination_country_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_export_cert_expiry",
                table: "export_food_certificates",
                columns: new[] { "expiry_date", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_export_cert_org",
                table: "export_food_certificates",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_export_cert_product",
                table: "export_food_certificates",
                column: "product_id",
                filter: "product_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_export_food_certificates_business_id_organization_id",
                table: "export_food_certificates",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_export_food_certificates_product_id_business_id_organizatio~",
                table: "export_food_certificates",
                columns: new[] { "product_id", "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "uq_export_food_certificates_number",
                table: "export_food_certificates",
                column: "certificate_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "export_food_certificates");
        }
    }
}
