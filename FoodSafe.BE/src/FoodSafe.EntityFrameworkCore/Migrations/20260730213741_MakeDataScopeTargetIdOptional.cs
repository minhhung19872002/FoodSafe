using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class MakeDataScopeTargetIdOptional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL AND num_nonnulls(province_id, commune_id) = 1) OR (scope_type = 2 AND province_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 3 AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 4 AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND organization_id IS NULL) OR (scope_type = 5 AND organization_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL AND num_nonnulls(province_id, commune_id) = 1) OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND organization_id IS NULL) OR (scope_type = 5 AND organization_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL)");
        }
    }
}
