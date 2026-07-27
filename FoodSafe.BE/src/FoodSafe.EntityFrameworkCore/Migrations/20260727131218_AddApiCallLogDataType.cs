using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddApiCallLogDataType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<short>(
                name: "data_type",
                table: "di_api_call_logs",
                type: "smallint",
                nullable: false,
                defaultValue: (short)0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "data_type",
                table: "di_api_call_logs");
        }
    }
}
