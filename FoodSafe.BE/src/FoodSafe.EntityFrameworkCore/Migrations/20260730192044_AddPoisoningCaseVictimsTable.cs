using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddPoisoningCaseVictimsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "poisoning_case_victims",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    age = table.Column<int>(type: "integer", nullable: true),
                    gender = table.Column<short>(type: "smallint", nullable: true),
                    phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    address = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pcv", x => x.id);
                    table.ForeignKey(
                        name: "fk_pcv_case",
                        column: x => x.case_id,
                        principalTable: "food_poisoning_cases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_pcv_case",
                table: "poisoning_case_victims",
                column: "case_id");

            migrationBuilder.Sql(@"
                INSERT INTO poisoning_case_victims (id, case_id, name, age, gender, phone, address)
                SELECT gen_random_uuid(), id, victim_name, victim_age, victim_gender, victim_phone, victim_address
                FROM food_poisoning_cases
                WHERE victim_name IS NOT NULL AND victim_name <> '';
            ");

            migrationBuilder.DropColumn(
                name: "victim_address",
                table: "food_poisoning_cases");

            migrationBuilder.DropColumn(
                name: "victim_age",
                table: "food_poisoning_cases");

            migrationBuilder.DropColumn(
                name: "victim_gender",
                table: "food_poisoning_cases");

            migrationBuilder.DropColumn(
                name: "victim_name",
                table: "food_poisoning_cases");

            migrationBuilder.DropColumn(
                name: "victim_phone",
                table: "food_poisoning_cases");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "poisoning_case_victims");

            migrationBuilder.AddColumn<string>(
                name: "victim_address",
                table: "food_poisoning_cases",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "victim_age",
                table: "food_poisoning_cases",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<short>(
                name: "victim_gender",
                table: "food_poisoning_cases",
                type: "smallint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "victim_name",
                table: "food_poisoning_cases",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "victim_phone",
                table: "food_poisoning_cases",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }
    }
}
