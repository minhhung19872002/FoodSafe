using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDistrictAddCommuneProvinceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_businesses_commune_district",
                table: "businesses");

            migrationBuilder.DropForeignKey(
                name: "fk_businesses_district_province",
                table: "businesses");

            migrationBuilder.DropForeignKey(
                name: "fk_cat_communes_district",
                table: "cat_communes");

            migrationBuilder.DropForeignKey(
                name: "fk_testing_centers_commune_district",
                table: "cat_testing_centers");

            migrationBuilder.DropForeignKey(
                name: "fk_testing_centers_district_province",
                table: "cat_testing_centers");

            migrationBuilder.DropForeignKey(
                name: "fk_fpc_district",
                table: "food_poisoning_cases");

            migrationBuilder.DropForeignKey(
                name: "fk_fpi_district",
                table: "food_poisoning_incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_msa_district",
                table: "management_scope_assignments");

            migrationBuilder.DropForeignKey(
                name: "fk_organizations_commune_district",
                table: "organizations");

            migrationBuilder.DropForeignKey(
                name: "fk_organizations_district_province",
                table: "organizations");

            // Backfill commune province_id from district before dropping district table
            migrationBuilder.Sql("""
                UPDATE cat_communes c
                SET district_id = d.province_id
                FROM cat_districts d
                WHERE c.district_id = d.id
                """);

            migrationBuilder.DropTable(
                name: "cat_districts");

            migrationBuilder.DropIndex(
                name: "IX_organizations_commune_id_district_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_organizations_district_id_province_id",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_management_scope_assignments_district_id",
                table: "management_scope_assignments");

            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_incidents_location_district_id",
                table: "food_poisoning_incidents");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_cases_location_district_id",
                table: "food_poisoning_cases");

            migrationBuilder.DropIndex(
                name: "IX_cat_testing_centers_address_commune_id_address_district_id",
                table: "cat_testing_centers");

            migrationBuilder.DropIndex(
                name: "IX_cat_testing_centers_address_district_id_address_province_id",
                table: "cat_testing_centers");

            migrationBuilder.DropUniqueConstraint(
                name: "uq_cat_communes_id_district",
                table: "cat_communes");

            migrationBuilder.DropIndex(
                name: "idx_businesses_district",
                table: "businesses");

            migrationBuilder.DropIndex(
                name: "IX_businesses_address_commune_id_address_district_id",
                table: "businesses");

            migrationBuilder.DropIndex(
                name: "IX_businesses_address_district_id_address_province_id",
                table: "businesses");

            migrationBuilder.DropCheckConstraint(
                name: "chk_businesses_address_chain",
                table: "businesses");

            migrationBuilder.DropColumn(
                name: "district_id",
                table: "organizations");

            migrationBuilder.DropColumn(
                name: "district_id",
                table: "management_scope_assignments");

            migrationBuilder.DropColumn(
                name: "location_district_id",
                table: "food_poisoning_incidents");

            migrationBuilder.DropColumn(
                name: "location_district_id",
                table: "food_poisoning_cases");

            migrationBuilder.DropColumn(
                name: "address_district_id",
                table: "cat_testing_centers");

            migrationBuilder.DropColumn(
                name: "address_district_id",
                table: "businesses");

            migrationBuilder.RenameColumn(
                name: "district_id",
                table: "cat_communes",
                newName: "province_id");

            migrationBuilder.RenameIndex(
                name: "IX_cat_communes_district_id",
                table: "cat_communes",
                newName: "IX_cat_communes_province_id");

            migrationBuilder.AddUniqueConstraint(
                name: "uq_cat_communes_id_province",
                table: "cat_communes",
                columns: new[] { "id", "province_id" });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_commune_id_province_id",
                table: "organizations",
                columns: new[] { "commune_id", "province_id" });

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND num_nonnulls(province_id, commune_id) = 1) OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL) OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL) OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_commune_id_address_province_id",
                table: "cat_testing_centers",
                columns: new[] { "address_commune_id", "address_province_id" });

            migrationBuilder.CreateIndex(
                name: "IX_businesses_address_commune_id_address_province_id",
                table: "businesses",
                columns: new[] { "address_commune_id", "address_province_id" });

            migrationBuilder.AddCheckConstraint(
                name: "chk_businesses_address_chain",
                table: "businesses",
                sql: "address_commune_id IS NULL OR address_province_id IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "fk_businesses_commune_province",
                table: "businesses",
                columns: new[] { "address_commune_id", "address_province_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_cat_communes_province",
                table: "cat_communes",
                column: "province_id",
                principalTable: "cat_provinces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_testing_centers_commune_province",
                table: "cat_testing_centers",
                columns: new[] { "address_commune_id", "address_province_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_organizations_commune_province",
                table: "organizations",
                columns: new[] { "commune_id", "province_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_businesses_commune_province",
                table: "businesses");

            migrationBuilder.DropForeignKey(
                name: "fk_cat_communes_province",
                table: "cat_communes");

            migrationBuilder.DropForeignKey(
                name: "fk_testing_centers_commune_province",
                table: "cat_testing_centers");

            migrationBuilder.DropForeignKey(
                name: "fk_organizations_commune_province",
                table: "organizations");

            migrationBuilder.DropIndex(
                name: "IX_organizations_commune_id_province_id",
                table: "organizations");

            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.DropIndex(
                name: "IX_cat_testing_centers_address_commune_id_address_province_id",
                table: "cat_testing_centers");

            migrationBuilder.DropUniqueConstraint(
                name: "uq_cat_communes_id_province",
                table: "cat_communes");

            migrationBuilder.DropIndex(
                name: "IX_businesses_address_commune_id_address_province_id",
                table: "businesses");

            migrationBuilder.DropCheckConstraint(
                name: "chk_businesses_address_chain",
                table: "businesses");

            migrationBuilder.RenameColumn(
                name: "province_id",
                table: "cat_communes",
                newName: "district_id");

            migrationBuilder.RenameIndex(
                name: "IX_cat_communes_province_id",
                table: "cat_communes",
                newName: "IX_cat_communes_district_id");

            migrationBuilder.AddColumn<Guid>(
                name: "district_id",
                table: "organizations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "district_id",
                table: "management_scope_assignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "location_district_id",
                table: "food_poisoning_incidents",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "location_district_id",
                table: "food_poisoning_cases",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "address_district_id",
                table: "cat_testing_centers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "address_district_id",
                table: "businesses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddUniqueConstraint(
                name: "uq_cat_communes_id_district",
                table: "cat_communes",
                columns: new[] { "id", "district_id" });

            migrationBuilder.CreateTable(
                name: "cat_districts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    province_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<short>(type: "smallint", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_organizations_commune_id_district_id",
                table: "organizations",
                columns: new[] { "commune_id", "district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_organizations_district_id_province_id",
                table: "organizations",
                columns: new[] { "district_id", "province_id" });

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_district_id",
                table: "management_scope_assignments",
                column: "district_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1) OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL) OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL) OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_incidents_location_district_id",
                table: "food_poisoning_incidents",
                column: "location_district_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_cases_location_district_id",
                table: "food_poisoning_cases",
                column: "location_district_id");

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_commune_id_address_district_id",
                table: "cat_testing_centers",
                columns: new[] { "address_commune_id", "address_district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_cat_testing_centers_address_district_id_address_province_id",
                table: "cat_testing_centers",
                columns: new[] { "address_district_id", "address_province_id" });

            migrationBuilder.CreateIndex(
                name: "idx_businesses_district",
                table: "businesses",
                column: "address_district_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_address_commune_id_address_district_id",
                table: "businesses",
                columns: new[] { "address_commune_id", "address_district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_businesses_address_district_id_address_province_id",
                table: "businesses",
                columns: new[] { "address_district_id", "address_province_id" });

            migrationBuilder.AddCheckConstraint(
                name: "chk_businesses_address_chain",
                table: "businesses",
                sql: "(address_commune_id IS NULL OR address_district_id IS NOT NULL) AND (address_district_id IS NULL OR address_province_id IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "IX_cat_districts_province_id",
                table: "cat_districts",
                column: "province_id");

            migrationBuilder.CreateIndex(
                name: "uq_cat_districts_code",
                table: "cat_districts",
                column: "code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "fk_businesses_commune_district",
                table: "businesses",
                columns: new[] { "address_commune_id", "address_district_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "district_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_businesses_district_province",
                table: "businesses",
                columns: new[] { "address_district_id", "address_province_id" },
                principalTable: "cat_districts",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_cat_communes_district",
                table: "cat_communes",
                column: "district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_testing_centers_commune_district",
                table: "cat_testing_centers",
                columns: new[] { "address_commune_id", "address_district_id" },
                principalTable: "cat_communes",
                principalColumns: new[] { "id", "district_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_testing_centers_district_province",
                table: "cat_testing_centers",
                columns: new[] { "address_district_id", "address_province_id" },
                principalTable: "cat_districts",
                principalColumns: new[] { "id", "province_id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpc_district",
                table: "food_poisoning_cases",
                column: "location_district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpi_district",
                table: "food_poisoning_incidents",
                column: "location_district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_msa_district",
                table: "management_scope_assignments",
                column: "district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

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
        }
    }
}
