using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddNewsRecallAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "recalled_at",
                table: "atp_news",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "recalled_by_id",
                table: "atp_news",
                type: "uuid",
                nullable: true);

            // Backfill rows recalled before these audit columns existed; the
            // recall was necessarily the last modification to the row.
            migrationBuilder.Sql(
                """
                UPDATE atp_news
                SET recalled_by_id = COALESCE(last_modifier_id, creator_id),
                    recalled_at = COALESCE(last_modification_time, creation_time)
                WHERE status = 3 AND recalled_by_id IS NULL;
                """);

            migrationBuilder.AddCheckConstraint(
                name: "chk_news_recall",
                table: "atp_news",
                sql: "status <> 3 OR (recalled_by_id IS NOT NULL AND recalled_at IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "chk_news_recall",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "recalled_at",
                table: "atp_news");

            migrationBuilder.DropColumn(
                name: "recalled_by_id",
                table: "atp_news");
        }
    }
}
