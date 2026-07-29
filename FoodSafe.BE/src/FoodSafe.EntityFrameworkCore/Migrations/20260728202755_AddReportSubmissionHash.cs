using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddReportSubmissionHash : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "SubmissionHash",
                table: "ndtp_reports",
                newName: "submission_hash");

            migrationBuilder.RenameColumn(
                name: "SubmissionHash",
                table: "atp_work_reports",
                newName: "submission_hash");

            migrationBuilder.RenameColumn(
                name: "SubmissionHash",
                table: "action_month_reports",
                newName: "submission_hash");

            migrationBuilder.AlterColumn<string>(
                name: "submission_hash",
                table: "ndtp_reports",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "submission_hash",
                table: "atp_work_reports",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "submission_hash",
                table: "action_month_reports",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "submission_hash",
                table: "ndtp_reports",
                newName: "SubmissionHash");

            migrationBuilder.RenameColumn(
                name: "submission_hash",
                table: "atp_work_reports",
                newName: "SubmissionHash");

            migrationBuilder.RenameColumn(
                name: "submission_hash",
                table: "action_month_reports",
                newName: "SubmissionHash");

            migrationBuilder.AlterColumn<string>(
                name: "SubmissionHash",
                table: "ndtp_reports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SubmissionHash",
                table: "atp_work_reports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "SubmissionHash",
                table: "action_month_reports",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(64)",
                oldMaxLength: 64,
                oldNullable: true);
        }
    }
}
