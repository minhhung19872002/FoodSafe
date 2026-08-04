using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AllowSpecialZoneCommuneType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_cat_communes_type",
                table: "cat_communes");

            migrationBuilder.AddCheckConstraint(
                name: "chk_cat_communes_type",
                table: "cat_communes",
                sql: "type IN (1, 2, 3, 4)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_cat_communes_type",
                table: "cat_communes");

            migrationBuilder.AddCheckConstraint(
                name: "chk_cat_communes_type",
                table: "cat_communes",
                sql: "type IN (1, 2, 3)");
        }
    }
}
