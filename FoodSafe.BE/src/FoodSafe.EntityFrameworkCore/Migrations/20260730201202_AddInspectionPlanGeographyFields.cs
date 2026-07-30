using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddInspectionPlanGeographyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "commune_id",
                table: "inspection_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "province_id",
                table: "inspection_plans",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_inspection_plans_commune_id",
                table: "inspection_plans",
                column: "commune_id");

            migrationBuilder.CreateIndex(
                name: "IX_inspection_plans_province_id",
                table: "inspection_plans",
                column: "province_id");

            migrationBuilder.AddForeignKey(
                name: "fk_plans_commune",
                table: "inspection_plans",
                column: "commune_id",
                principalTable: "cat_communes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_plans_province",
                table: "inspection_plans",
                column: "province_id",
                principalTable: "cat_provinces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_plans_commune",
                table: "inspection_plans");

            migrationBuilder.DropForeignKey(
                name: "fk_plans_province",
                table: "inspection_plans");

            migrationBuilder.DropIndex(
                name: "IX_inspection_plans_commune_id",
                table: "inspection_plans");

            migrationBuilder.DropIndex(
                name: "IX_inspection_plans_province_id",
                table: "inspection_plans");

            migrationBuilder.DropColumn(
                name: "commune_id",
                table: "inspection_plans");

            migrationBuilder.DropColumn(
                name: "province_id",
                table: "inspection_plans");
        }
    }
}
