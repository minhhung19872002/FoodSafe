using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddCitizenReportAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubmissionHash",
                table: "ndtp_reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubmissionHash",
                table: "atp_work_reports",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "assigned_at",
                table: "atp_alerts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "assigned_by_user_id",
                table: "atp_alerts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "assignee_id",
                table: "atp_alerts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SubmissionHash",
                table: "action_month_reports",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubmissionHash",
                table: "ndtp_reports");

            migrationBuilder.DropColumn(
                name: "SubmissionHash",
                table: "atp_work_reports");

            migrationBuilder.DropColumn(
                name: "assigned_at",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "assigned_by_user_id",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "assignee_id",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "SubmissionHash",
                table: "action_month_reports");
        }
    }
}
