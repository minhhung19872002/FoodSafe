using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddSelfDeclarations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "self_declarations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    declaration_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    declaration_date = table.Column<DateTime>(type: "date", nullable: false),
                    product_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    manufacturer = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    purpose = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    expiry_date = table.Column<DateTime>(type: "date", nullable: true),
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
                    table.PrimaryKey("pk_self_declarations", x => x.id);
                    table.CheckConstraint("chk_self_declarations_dates", "expiry_date IS NULL OR declaration_date <= expiry_date");
                    table.CheckConstraint("chk_self_declarations_revoke", "(status != 3 AND revoke_reason IS NULL AND revoked_at IS NULL AND revoked_by_id IS NULL) OR (status = 3 AND revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)");
                    table.CheckConstraint("chk_self_declarations_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_self_declarations_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_self_declarations_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_self_declarations_product",
                        columns: x => new { x.product_id, x.business_id, x.organization_id },
                        principalTable: "products",
                        principalColumns: new[] { "id", "business_id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_self_declarations_business",
                table: "self_declarations",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_self_declarations_org",
                table: "self_declarations",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_self_declarations_product",
                table: "self_declarations",
                column: "product_id",
                filter: "product_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_self_declarations_status_expiry",
                table: "self_declarations",
                columns: new[] { "status", "expiry_date" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_self_declarations_business_id_organization_id",
                table: "self_declarations",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_self_declarations_product_id_business_id_organization_id",
                table: "self_declarations",
                columns: new[] { "product_id", "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "uq_self_declarations_business_number",
                table: "self_declarations",
                columns: new[] { "business_id", "declaration_number" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_self_declarations_document_owner",
                table: "self_declarations",
                columns: new[] { "id", "organization_id" },
                principalTable: "document_owners",
                principalColumns: new[] { "id", "organization_id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "self_declarations");
        }
    }
}
