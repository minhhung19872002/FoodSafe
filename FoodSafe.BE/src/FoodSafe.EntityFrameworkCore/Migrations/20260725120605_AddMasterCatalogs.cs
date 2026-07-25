using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddMasterCatalogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cat_advertisement_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_cat_advertisement_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cat_business_classifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    criteria = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    risk_level = table.Column<short>(type: "smallint", nullable: false),
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
                    table.PrimaryKey("PK_cat_business_classifications", x => x.id);
                    table.CheckConstraint("chk_business_classifications_risk", "risk_level IN (1, 2, 3)");
                });

            migrationBuilder.CreateTable(
                name: "cat_business_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_cat_business_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cat_document_types",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
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
                    table.PrimaryKey("PK_cat_document_types", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cat_product_groups",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    level = table.Column<short>(type: "smallint", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
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
                    table.PrimaryKey("PK_cat_product_groups", x => x.id);
                    table.CheckConstraint("chk_cat_product_groups_level", "level IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_cat_product_groups_parent",
                        column: x => x.parent_id,
                        principalTable: "cat_product_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cat_testing_centers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    address_street = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    address_province_id = table.Column<Guid>(type: "uuid", nullable: false),
                    address_district_id = table.Column<Guid>(type: "uuid", nullable: true),
                    address_commune_id = table.Column<Guid>(type: "uuid", nullable: true),
                    contact_person = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    accreditation_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    accreditation_scope = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    accreditation_expiry = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                    table.PrimaryKey("PK_cat_testing_centers", x => x.id);
                    table.ForeignKey(
                        name: "fk_testing_centers_commune_district",
                        columns: x => new { x.address_commune_id, x.address_district_id },
                        principalTable: "cat_communes",
                        principalColumns: new[] { "id", "district_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_testing_centers_district_province",
                        columns: x => new { x.address_district_id, x.address_province_id },
                        principalTable: "cat_districts",
                        principalColumns: new[] { "id", "province_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_testing_centers_province",
                        column: x => x.address_province_id,
                        principalTable: "cat_provinces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cat_testing_services",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    testing_center_id = table.Column<Guid>(type: "uuid", nullable: false),
                    unit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    method = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    unit_price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    turnaround_days = table.Column<int>(type: "integer", nullable: false),
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
                    table.PrimaryKey("PK_cat_testing_services", x => x.id);
                    table.ForeignKey(
                        name: "fk_testing_services_center",
                        column: x => x.testing_center_id,
                        principalTable: "cat_testing_centers",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_business_type_id",
                table: "management_scope_assignments",
                column: "business_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_product_group_id",
                table: "management_scope_assignments",
                column: "product_group_id");

            migrationBuilder.CreateIndex(
                name: "uq_advertisement_types_code",
                table: "cat_advertisement_types",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_business_classifications_code",
                table: "cat_business_classifications",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_business_types_code",
                table: "cat_business_types",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_document_types_code",
                table: "cat_document_types",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_cat_product_groups_parent",
                table: "cat_product_groups",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "uq_cat_product_groups_code",
                table: "cat_product_groups",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_commune_id_address_district_id",
                table: "cat_testing_centers",
                columns: new[] { "address_commune_id", "address_district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_district_id_address_province_id",
                table: "cat_testing_centers",
                columns: new[] { "address_district_id", "address_province_id" });

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_province_id",
                table: "cat_testing_centers",
                column: "address_province_id");

            migrationBuilder.CreateIndex(
                name: "uq_testing_centers_code",
                table: "cat_testing_centers",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_testing_services_center_code",
                table: "cat_testing_services",
                columns: new[] { "testing_center_id", "code" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_msa_business_type",
                table: "management_scope_assignments",
                column: "business_type_id",
                principalTable: "cat_business_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_msa_product_group",
                table: "management_scope_assignments",
                column: "product_group_id",
                principalTable: "cat_product_groups",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_msa_business_type",
                table: "management_scope_assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_msa_product_group",
                table: "management_scope_assignments");

            migrationBuilder.DropTable(
                name: "cat_advertisement_types");

            migrationBuilder.DropTable(
                name: "cat_business_classifications");

            migrationBuilder.DropTable(
                name: "cat_business_types");

            migrationBuilder.DropTable(
                name: "cat_document_types");

            migrationBuilder.DropTable(
                name: "cat_product_groups");

            migrationBuilder.DropTable(
                name: "cat_testing_services");

            migrationBuilder.DropTable(
                name: "cat_testing_centers");

            migrationBuilder.DropIndex(
                name: "IX_management_scope_assignments_business_type_id",
                table: "management_scope_assignments");

            migrationBuilder.DropIndex(
                name: "IX_management_scope_assignments_product_group_id",
                table: "management_scope_assignments");
        }
    }
}
