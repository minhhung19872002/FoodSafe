using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddCfsCertificates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cfs_certificates",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    destination_country_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    issue_date = table.Column<DateTime>(type: "date", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    certifying_authority = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
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
                    table.PrimaryKey("pk_cfs_certificates", x => x.id);
                    table.CheckConstraint("chk_cfs_dates", "expiry_date IS NULL OR issue_date <= expiry_date");
                    table.CheckConstraint("chk_cfs_revoke", "(status != 3 AND revoke_reason IS NULL AND revoked_at IS NULL AND revoked_by_id IS NULL) OR (status = 3 AND revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
                    table.CheckConstraint("chk_cfs_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_cfs_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_cfs_destination_country",
                        column: x => x.destination_country_id,
                        principalTable: "cat_countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_cfs_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_cfs_product_owner",
                        columns: x => new { x.product_id, x.business_id, x.organization_id },
                        principalTable: "products",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddForeignKey(
                name: "fk_cfs_document_owner",
                table: "cfs_certificates",
                column: "id",
                principalTable: "document_owners",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.CreateIndex(
                name: "idx_cfs_business",
                table: "cfs_certificates",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_cfs_destination_country",
                table: "cfs_certificates",
                column: "destination_country_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_cfs_expiry",
                table: "cfs_certificates",
                columns: new[] { "expiry_date", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_cfs_org",
                table: "cfs_certificates",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_cfs_product",
                table: "cfs_certificates",
                column: "product_id",
                filter: "product_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_cfs_certificates_business_id_organization_id",
                table: "cfs_certificates",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_cfs_certificates_product_id_business_id_organization_id",
                table: "cfs_certificates",
                columns: new[] { "product_id", "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "uq_cfs_certificates_number",
                table: "cfs_certificates",
                column: "certificate_number",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cfs_certificates");
        }
    }
}
