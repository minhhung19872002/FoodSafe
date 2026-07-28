using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkflowDispositionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_news_publish",
                table: "atp_news");

            migrationBuilder.DropCheckConstraint(
                name: "chk_news_status",
                table: "atp_news");

            migrationBuilder.DropCheckConstraint(
                name: "chk_alerts_publish",
                table: "atp_alerts");

            migrationBuilder.DropCheckConstraint(
                name: "chk_alerts_status",
                table: "atp_alerts");

            migrationBuilder.AddColumn<DateTime>(
                name: "processed_at",
                table: "di_inbound_submissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "processed_by_id",
                table: "di_inbound_submissions",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rejected_at",
                table: "atp_news",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "rejected_by_id",
                table: "atp_news",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rejected_reason",
                table: "atp_news",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "rejected_at",
                table: "atp_alerts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "rejected_by_id",
                table: "atp_alerts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "rejected_reason",
                table: "atp_alerts",
                type: "text",
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "chk_di_is_disposition",
                table: "di_inbound_submissions",
                sql: "status = 1 OR (processed_by_id IS NOT NULL AND processed_at IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_di_is_reject_reason",
                table: "di_inbound_submissions",
                sql: "status <> 3 OR reject_reason IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "chk_di_is_status",
                table: "di_inbound_submissions",
                sql: "status IN (1, 2, 3)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_publish",
                table: "atp_news",
                sql: "status IN (1, 4) OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_reject",
                table: "atp_news",
                sql: "status <> 4 OR (rejected_by_id IS NOT NULL AND rejected_at IS NOT NULL AND rejected_reason IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_status",
                table: "atp_news",
                sql: "status IN (1, 2, 3, 4)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_alerts_publish",
                table: "atp_alerts",
                sql: "status IN (1, 4) OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_alerts_reject",
                table: "atp_alerts",
                sql: "status <> 4 OR (rejected_by_id IS NOT NULL AND rejected_at IS NOT NULL AND rejected_reason IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_alerts_status",
                table: "atp_alerts",
                sql: "status IN (1, 2, 3, 4)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_di_is_disposition",
                table: "di_inbound_submissions");

            migrationBuilder.DropCheckConstraint(
                name: "chk_di_is_reject_reason",
                table: "di_inbound_submissions");

            migrationBuilder.DropCheckConstraint(
                name: "chk_di_is_status",
                table: "di_inbound_submissions");

            migrationBuilder.DropCheckConstraint(
                name: "chk_news_publish",
                table: "atp_news");

            migrationBuilder.DropCheckConstraint(
                name: "chk_news_reject",
                table: "atp_news");

            migrationBuilder.DropCheckConstraint(
                name: "chk_news_status",
                table: "atp_news");

            migrationBuilder.DropCheckConstraint(
                name: "chk_alerts_publish",
                table: "atp_alerts");

            migrationBuilder.DropCheckConstraint(
                name: "chk_alerts_reject",
                table: "atp_alerts");

            migrationBuilder.DropCheckConstraint(
                name: "chk_alerts_status",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "processed_at",
                table: "di_inbound_submissions");

            migrationBuilder.DropColumn(
                name: "processed_by_id",
                table: "di_inbound_submissions");

            migrationBuilder.DropColumn(
                name: "rejected_at",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "rejected_by_id",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "rejected_reason",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "rejected_at",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "rejected_by_id",
                table: "atp_alerts");

            migrationBuilder.DropColumn(
                name: "rejected_reason",
                table: "atp_alerts");

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_publish",
                table: "atp_news",
                sql: "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_status",
                table: "atp_news",
                sql: "status IN (1, 2, 3)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_alerts_publish",
                table: "atp_alerts",
                sql: "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "chk_alerts_status",
                table: "atp_alerts",
                sql: "status IN (1, 2, 3)");
        }
    }
}
