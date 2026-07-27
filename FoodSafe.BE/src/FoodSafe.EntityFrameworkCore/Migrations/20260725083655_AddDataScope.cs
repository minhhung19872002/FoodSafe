using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddDataScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_user_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    department = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    password_expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false),
                    last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    failed_login_count = table.Column<short>(type: "smallint", nullable: false),
                    locked_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_app_user_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_app_user_profiles_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "management_scope_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    grantee_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    grantee_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    scope_type = table.Column<short>(type: "smallint", nullable: false),
                    province_id = table.Column<Guid>(type: "uuid", nullable: true),
                    district_id = table.Column<Guid>(type: "uuid", nullable: true),
                    commune_id = table.Column<Guid>(type: "uuid", nullable: true),
                    business_id = table.Column<Guid>(type: "uuid", nullable: true),
                    business_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    product_group_id = table.Column<Guid>(type: "uuid", nullable: true),
                    can_view = table.Column<bool>(type: "boolean", nullable: false),
                    can_create = table.Column<bool>(type: "boolean", nullable: false),
                    can_edit = table.Column<bool>(type: "boolean", nullable: false),
                    can_delete = table.Column<bool>(type: "boolean", nullable: false),
                    valid_from = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    valid_to = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_management_scope_assignments", x => x.id);
                    table.CheckConstraint("chk_msa_dates", "valid_to IS NULL OR valid_from < valid_to");
                    table.CheckConstraint("chk_msa_one_target", "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL\n AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1)\nOR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL\n AND product_group_id IS NULL)\nOR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\n AND product_group_id IS NULL)\nOR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\n AND business_type_id IS NULL)");
                    table.CheckConstraint("chk_msa_type", "scope_type IN (1, 2, 3, 4)");
                    table.ForeignKey(
                        name: "fk_msa_commune",
                        column: x => x.commune_id,
                        principalTable: "cat_communes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_msa_district",
                        column: x => x.district_id,
                        principalTable: "cat_districts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_msa_grantee_org",
                        column: x => x.grantee_organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_msa_province",
                        column: x => x.province_id,
                        principalTable: "cat_provinces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_app_user_profiles_organization_id",
                table: "app_user_profiles",
                column: "organization_id");

            migrationBuilder.CreateIndex(
                name: "uq_app_user_profiles_user_id",
                table: "app_user_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_msa_grantee",
                table: "management_scope_assignments",
                columns: new[] { "grantee_organization_id", "grantee_user_id", "valid_from", "valid_to" });

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_commune_id",
                table: "management_scope_assignments",
                column: "commune_id");

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_district_id",
                table: "management_scope_assignments",
                column: "district_id");

            migrationBuilder.CreateIndex(
                name: "IX_management_scope_assignments_province_id",
                table: "management_scope_assignments",
                column: "province_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_user_profiles");

            migrationBuilder.DropTable(
                name: "management_scope_assignments");
        }
    }
}
