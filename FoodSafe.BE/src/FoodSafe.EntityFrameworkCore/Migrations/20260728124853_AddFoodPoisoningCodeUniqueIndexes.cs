using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddFoodPoisoningCodeUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "uq_fpi_org_code",
                table: "food_poisoning_incidents",
                columns: new[] { "organization_id", "incident_code" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "uq_fpc_org_code",
                table: "food_poisoning_cases",
                columns: new[] { "organization_id", "case_code" },
                unique: true,
                filter: "is_deleted = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_fpi_org_code",
                table: "food_poisoning_incidents");

            migrationBuilder.DropIndex(
                name: "uq_fpc_org_code",
                table: "food_poisoning_cases");
        }
    }
}
