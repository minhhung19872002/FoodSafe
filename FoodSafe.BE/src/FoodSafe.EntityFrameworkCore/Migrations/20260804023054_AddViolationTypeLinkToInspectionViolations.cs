using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddViolationTypeLinkToInspectionViolations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "violation_type_id",
                table: "inspection_violations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_inspection_violations_type",
                table: "inspection_violations",
                column: "violation_type_id");

            migrationBuilder.AddForeignKey(
                name: "fk_inspection_violations_type",
                table: "inspection_violations",
                column: "violation_type_id",
                principalTable: "cat_violation_types",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_inspection_violations_type",
                table: "inspection_violations");

            migrationBuilder.DropIndex(
                name: "idx_inspection_violations_type",
                table: "inspection_violations");

            migrationBuilder.DropColumn(
                name: "violation_type_id",
                table: "inspection_violations");
        }
    }
}
