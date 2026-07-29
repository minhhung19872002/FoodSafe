using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddCitizenReportTrackingCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "product_group_ids",
                table: "risk_analyses",
                type: "text",
                nullable: false,
                defaultValueSql: "'[]'");

            migrationBuilder.AddColumn<string>(
                name: "tracking_code",
                table: "atp_alerts",
                type: "character varying(12)",
                maxLength: 12,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "uq_alerts_tracking_code",
                table: "atp_alerts",
                column: "tracking_code",
                unique: true,
                filter: "tracking_code IS NOT NULL AND is_deleted = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_alerts_tracking_code",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "product_group_ids",
                table: "risk_analyses");

            migrationBuilder.DropColumn(
                name: "tracking_code",
                table: "atp_alerts");
        }
    }
}
