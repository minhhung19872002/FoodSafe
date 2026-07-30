using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationScopeToManagementScopeAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_type",
                table: "management_scope_assignments");

            migrationBuilder.AddColumn<Guid>(
                name: "organization_id",
                table: "management_scope_assignments",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_msa_scope_org",
                table: "management_scope_assignments",
                column: "organization_id");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL AND num_nonnulls(province_id, commune_id) = 1) OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL AND organization_id IS NULL) OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND organization_id IS NULL) OR (scope_type = 5 AND organization_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_type",
                table: "management_scope_assignments",
                sql: "scope_type IN (1, 2, 3, 4, 5)");

            migrationBuilder.AddForeignKey(
                name: "fk_msa_scope_org",
                table: "management_scope_assignments",
                column: "organization_id",
                principalTable: "organizations",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_msa_scope_org",
                table: "management_scope_assignments");

            migrationBuilder.DropIndex(
                name: "idx_msa_scope_org",
                table: "management_scope_assignments");

            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_type",
                table: "management_scope_assignments");

            migrationBuilder.DropColumn(
                name: "organization_id",
                table: "management_scope_assignments");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL AND num_nonnulls(province_id, commune_id) = 1) OR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL) OR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL) OR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_type",
                table: "management_scope_assignments",
                sql: "scope_type IN (1, 2, 3, 4)");
        }
    }
}
