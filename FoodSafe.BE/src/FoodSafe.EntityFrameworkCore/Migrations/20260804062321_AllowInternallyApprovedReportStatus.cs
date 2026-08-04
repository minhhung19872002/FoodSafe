using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AllowInternallyApprovedReportStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_ndtp_status",
                table: "ndtp_reports");

            migrationBuilder.DropCheckConstraint(
                name: "chk_atp_status",
                table: "atp_work_reports");

            migrationBuilder.DropCheckConstraint(
                name: "chk_amr_status",
                table: "action_month_reports");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ndtp_status",
                table: "ndtp_reports",
                sql: "status IN (1, 2, 3, 4, 5, 6)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_atp_status",
                table: "atp_work_reports",
                sql: "status IN (1, 2, 3, 4, 5, 6)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_amr_status",
                table: "action_month_reports",
                sql: "status IN (1, 2, 3, 4, 5, 6)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_ndtp_status",
                table: "ndtp_reports");

            migrationBuilder.DropCheckConstraint(
                name: "chk_atp_status",
                table: "atp_work_reports");

            migrationBuilder.DropCheckConstraint(
                name: "chk_amr_status",
                table: "action_month_reports");

            migrationBuilder.AddCheckConstraint(
                name: "chk_ndtp_status",
                table: "ndtp_reports",
                sql: "status IN (1, 2, 3, 4, 5)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_atp_status",
                table: "atp_work_reports",
                sql: "status IN (1, 2, 3, 4, 5)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_amr_status",
                table: "action_month_reports",
                sql: "status IN (1, 2, 3, 4, 5)");
        }
    }
}
