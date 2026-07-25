using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddFileAttachments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "document_owners",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: true),
                    owner_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_document_owners", x => x.id);
                    table.ForeignKey(
                        name: "fk_document_owners_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.Sql(
                """
                ALTER TABLE document_owners
                    ADD CONSTRAINT uq_document_owners_id_org
                    UNIQUE (id, organization_id);

                INSERT INTO document_owners (
                    id, organization_id, owner_type, creation_time)
                SELECT id, organization_id, 'product', creation_time
                FROM products;
                """);

            migrationBuilder.CreateTable(
                name: "file_attachments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_owner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    original_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    storage_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    file_size = table.Column<long>(type: "bigint", nullable: false),
                    mime_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    checksum = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    virus_scan_status = table.Column<short>(type: "smallint", nullable: false),
                    virus_scanned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    retention_status = table.Column<short>(type: "smallint", nullable: false),
                    retention_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("pk_file_attachments", x => x.id);
                    table.CheckConstraint("chk_fa_file_size", "file_size > 0");
                    table.CheckConstraint("chk_fa_retention", "retention_status IN (1, 2, 3)");
                    table.CheckConstraint("chk_fa_virus_scan", "virus_scan_status IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "fk_fa_owner",
                        column: x => x.document_owner_id,
                        principalTable: "document_owners",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_document_owners_org",
                table: "document_owners",
                columns: new[] { "organization_id", "owner_type" });

            migrationBuilder.CreateIndex(
                name: "idx_file_attachments_owner",
                table: "file_attachments",
                column: "document_owner_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_file_attachments_scan",
                table: "file_attachments",
                column: "virus_scan_status",
                filter: "virus_scan_status = 1");

            migrationBuilder.CreateIndex(
                name: "uq_file_attachments_storage_path",
                table: "file_attachments",
                column: "storage_path",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_products_document_owner",
                table: "products",
                columns: new[] { "id", "organization_id" },
                principalTable: "document_owners",
                principalColumns: new[] { "id", "organization_id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_products_document_owner",
                table: "products");

            migrationBuilder.DropTable(
                name: "file_attachments");

            migrationBuilder.DropTable(
                name: "document_owners");
        }
    }
}
