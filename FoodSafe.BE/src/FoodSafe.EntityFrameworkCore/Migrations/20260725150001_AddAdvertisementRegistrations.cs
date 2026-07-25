using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddAdvertisementRegistrations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "advertisement_registrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    advertisement_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    registration_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    registration_date = table.Column<DateTime>(type: "date", nullable: false),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    content_description = table.Column<string>(type: "text", nullable: true),
                    medium = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
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
                    table.PrimaryKey("pk_advertisement_registrations", x => x.id);
                    table.UniqueConstraint("uq_ad_reg_id_business_org", x => new { x.id, x.business_id, x.organization_id });
                    table.CheckConstraint("chk_ad_reg_dates", "expiry_date IS NULL OR registration_date <= expiry_date");
                    table.CheckConstraint("chk_ad_reg_revoke", "(status != 3 AND revoke_reason IS NULL AND revoked_at IS NULL AND revoked_by_id IS NULL) OR (status = 3 AND revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
                    table.CheckConstraint("chk_ad_reg_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_ad_reg_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_ad_reg_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_ad_reg_type",
                        column: x => x.advertisement_type_id,
                        principalTable: "cat_advertisement_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "advertisement_registration_products",
                columns: table => new
                {
                    advertisement_registration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ad_reg_products", x => new { x.advertisement_registration_id, x.product_id });
                    table.ForeignKey(
                        name: "fk_arp_ad_reg_owner",
                        columns: x => new { x.advertisement_registration_id, x.business_id, x.organization_id },
                        principalTable: "advertisement_registrations",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_arp_product_owner",
                        columns: x => new { x.product_id, x.business_id, x.organization_id },
                        principalTable: "products",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_arp_product",
                table: "advertisement_registration_products",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_advertisement_registration_products_advertisement_registrat~",
                table: "advertisement_registration_products",
                columns: new[] { "advertisement_registration_id", "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_advertisement_registration_products_product_id_business_id_~",
                table: "advertisement_registration_products",
                columns: new[] { "product_id", "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "idx_ad_reg_business",
                table: "advertisement_registrations",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_ad_reg_expiry",
                table: "advertisement_registrations",
                columns: new[] { "expiry_date", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_ad_reg_org",
                table: "advertisement_registrations",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_advertisement_registrations_advertisement_type_id",
                table: "advertisement_registrations",
                column: "advertisement_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_advertisement_registrations_business_id_organization_id",
                table: "advertisement_registrations",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "uq_advertisement_registrations_number",
                table: "advertisement_registrations",
                column: "registration_number",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_ad_reg_document_owner",
                table: "advertisement_registrations",
                columns: new[] { "id", "organization_id" },
                principalTable: "document_owners",
                principalColumns: new[] { "id", "organization_id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "advertisement_registration_products");

            migrationBuilder.DropTable(
                name: "advertisement_registrations");
        }
    }
}
