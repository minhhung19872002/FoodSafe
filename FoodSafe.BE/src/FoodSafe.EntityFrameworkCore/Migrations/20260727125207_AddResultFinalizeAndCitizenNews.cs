using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddResultFinalizeAndCitizenNews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.AddColumn<DateTime>(
                name: "finalized_at",
                table: "inspection_results",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "finalized_by_id",
                table: "inspection_results",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_finalized",
                table: "inspection_results",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "reporter_contact",
                table: "atp_news",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "reporter_name",
                table: "atp_news",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "source",
                table: "atp_news",
                type: "smallint",
                nullable: false,
                defaultValue: (short)1);

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL\r\n AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1)\r\nOR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL\r\n AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL\r\n AND product_group_id IS NULL)\r\nOR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL\r\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\r\n AND product_group_id IS NULL)\r\nOR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL\r\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\r\n AND business_type_id IS NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments");

            migrationBuilder.DropColumn(
                name: "finalized_at",
                table: "inspection_results");

            migrationBuilder.DropColumn(
                name: "finalized_by_id",
                table: "inspection_results");

            migrationBuilder.DropColumn(
                name: "is_finalized",
                table: "inspection_results");

            migrationBuilder.DropColumn(
                name: "reporter_contact",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "reporter_name",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "source",
                table: "atp_news");

            migrationBuilder.AddCheckConstraint(
                name: "chk_msa_one_target",
                table: "management_scope_assignments",
                sql: "(scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL\n AND product_group_id IS NULL AND num_nonnulls(province_id, district_id, commune_id) = 1)\nOR (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_type_id IS NULL\n AND product_group_id IS NULL)\nOR (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\n AND product_group_id IS NULL)\nOR (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL\n AND district_id IS NULL AND commune_id IS NULL AND business_id IS NULL\n AND business_type_id IS NULL)");
        }
    }
}
