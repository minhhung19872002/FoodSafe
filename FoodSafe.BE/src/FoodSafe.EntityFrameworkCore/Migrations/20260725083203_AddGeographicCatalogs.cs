using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddGeographicCatalogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "cat_countries",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code_alpha2 = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    code_alpha3 = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    name_vi = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    name_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
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
                    table.PrimaryKey("pk_cat_countries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cat_regions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cat_regions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "cat_provinces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    region_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name_short = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cat_provinces", x => x.id);
                    table.ForeignKey(
                        name: "fk_cat_provinces_region",
                        column: x => x.region_id,
                        principalTable: "cat_regions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cat_districts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    province_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<short>(type: "smallint", nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cat_districts", x => x.id);
                    table.UniqueConstraint("uq_cat_districts_id_province", x => new { x.id, x.province_id });
                    table.CheckConstraint("chk_cat_districts_type", "type IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "fk_cat_districts_province",
                        column: x => x.province_id,
                        principalTable: "cat_provinces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "cat_communes",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    district_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<short>(type: "smallint", nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cat_communes", x => x.id);
                    table.UniqueConstraint("uq_cat_communes_id_district", x => new { x.id, x.district_id });
                    table.CheckConstraint("chk_cat_communes_type", "type IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_cat_communes_district",
                        column: x => x.district_id,
                        principalTable: "cat_districts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_commune_id_district_id",
                table: "organizations",
                columns: new[] { "commune_id", "district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_district_id_province_id",
                table: "organizations",
                columns: new[] { "district_id", "province_id" });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_province_id",
                table: "organizations",
                column: "province_id");

            migrationBuilder.CreateIndex(
                name: "IX_cat_communes_district_id",
                table: "cat_communes",
                column: "district_id");

            migrationBuilder.CreateIndex(
                name: "uq_cat_communes_code",
                table: "cat_communes",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_cat_countries_code",
                table: "cat_countries",
                column: "code_alpha2",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cat_districts_province_id",
                table: "cat_districts",
                column: "province_id");

            migrationBuilder.CreateIndex(
                name: "uq_cat_districts_code",
                table: "cat_districts",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cat_provinces_region_id",
                table: "cat_provinces",
                column: "region_id");

            migrationBuilder.CreateIndex(
                name: "uq_cat_provinces_code",
                table: "cat_provinces",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_cat_regions_code",
                table: "cat_regions",
                column: "code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_organizations_commune_district",
                table: "organizations",
                columns: new[] { "commune_id", "district_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "district_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_organizations_district_province",
                table: "organizations",
                columns: new[] { "district_id", "province_id" },
                principalTable: "cat_districts",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_organizations_province",
                table: "organizations",
                column: "province_id",
                principalTable: "cat_provinces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_organizations_commune_district",
                table: "organizations");

            migrationBuilder.DropForeignKey(
                name: "fk_organizations_district_province",
                table: "organizations");

            migrationBuilder.DropForeignKey(
                name: "fk_organizations_province",
                table: "organizations");

            migrationBuilder.DropTable(
                name: "cat_communes");

            migrationBuilder.DropTable(
                name: "cat_countries");

            migrationBuilder.DropTable(
                name: "cat_districts");

            migrationBuilder.DropTable(
                name: "cat_provinces");

            migrationBuilder.DropTable(
                name: "cat_regions");

            migrationBuilder.DropIndex(
                name: "IX_organizations_commune_id_district_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_organizations_district_id_province_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_organizations_province_id",
                table: "organizations");
        }
    }
}
