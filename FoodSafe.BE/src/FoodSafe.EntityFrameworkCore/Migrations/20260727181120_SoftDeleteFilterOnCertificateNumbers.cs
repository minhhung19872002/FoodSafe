using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class SoftDeleteFilterOnCertificateNumbers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_self_declarations_business_number",
                table: "self_declarations");

            migrationBuilder.DropIndex(
                name: "uq_product_registrations_number",
                table: "product_registrations");

            migrationBuilder.DropIndex(
                name: "uq_export_food_certificates_number",
                table: "export_food_certificates");

            migrationBuilder.DropIndex(
                name: "uq_eligibility_certificates_number",
                table: "eligibility_certificates");

            migrationBuilder.DropIndex(
                name: "uq_cfs_certificates_number",
                table: "cfs_certificates");

            migrationBuilder.DropIndex(
                name: "uq_advertisement_registrations_number",
                table: "advertisement_registrations");

            migrationBuilder.CreateIndex(
                name: "uq_self_declarations_business_number",
                table: "self_declarations",
                columns: new[] { "business_id", "declaration_number" },
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_product_registrations_number",
                table: "product_registrations",
                column: "registration_number",
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_export_food_certificates_number",
                table: "export_food_certificates",
                column: "certificate_number",
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_eligibility_certificates_number",
                table: "eligibility_certificates",
                column: "certificate_number",
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_cfs_certificates_number",
                table: "cfs_certificates",
                column: "certificate_number",
                unique: true,
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_advertisement_registrations_number",
                table: "advertisement_registrations",
                column: "registration_number",
                unique: true,
                filter: "is_deleted = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "uq_self_declarations_business_number",
                table: "self_declarations");

            migrationBuilder.DropIndex(
                name: "uq_product_registrations_number",
                table: "product_registrations");

            migrationBuilder.DropIndex(
                name: "uq_export_food_certificates_number",
                table: "export_food_certificates");

            migrationBuilder.DropIndex(
                name: "uq_eligibility_certificates_number",
                table: "eligibility_certificates");

            migrationBuilder.DropIndex(
                name: "uq_cfs_certificates_number",
                table: "cfs_certificates");

            migrationBuilder.DropIndex(
                name: "uq_advertisement_registrations_number",
                table: "advertisement_registrations");

            migrationBuilder.CreateIndex(
                name: "uq_self_declarations_business_number",
                table: "self_declarations",
                columns: new[] { "business_id", "declaration_number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_product_registrations_number",
                table: "product_registrations",
                column: "registration_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_export_food_certificates_number",
                table: "export_food_certificates",
                column: "certificate_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_eligibility_certificates_number",
                table: "eligibility_certificates",
                column: "certificate_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_cfs_certificates_number",
                table: "cfs_certificates",
                column: "certificate_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "uq_advertisement_registrations_number",
                table: "advertisement_registrations",
                column: "registration_number",
                unique: true);
        }
    }
}
