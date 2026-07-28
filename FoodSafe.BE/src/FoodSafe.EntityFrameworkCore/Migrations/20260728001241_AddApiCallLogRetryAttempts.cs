using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddApiCallLogRetryAttempts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "attempt_number",
                table: "di_api_call_logs",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<Guid>(
                name: "correlation_id",
                table: "di_api_call_logs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "endpoint_id",
                table: "di_api_call_logs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "payload_checksum",
                table: "di_api_call_logs",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "idx_di_cl_correlation",
                table: "di_api_call_logs",
                column: "correlation_id",
                filter: "correlation_id IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "chk_di_cl_attempt",
                table: "di_api_call_logs",
                sql: "attempt_number >= 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_di_cl_correlation",
                table: "di_api_call_logs");

            migrationBuilder.DropCheckConstraint(
                name: "chk_di_cl_attempt",
                table: "di_api_call_logs");

            migrationBuilder.DropColumn(
                name: "attempt_number",
                table: "di_api_call_logs");

            migrationBuilder.DropColumn(
                name: "correlation_id",
                table: "di_api_call_logs");

            migrationBuilder.DropColumn(
                name: "endpoint_id",
                table: "di_api_call_logs");

            migrationBuilder.DropColumn(
                name: "payload_checksum",
                table: "di_api_call_logs");
        }
    }
}
