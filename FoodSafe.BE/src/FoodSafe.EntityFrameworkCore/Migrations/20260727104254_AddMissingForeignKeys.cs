using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingForeignKeys : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_testing_results_business_id",
                table: "testing_results",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_testing_results_inspection_result_id",
                table: "testing_results",
                column: "inspection_result_id");

            migrationBuilder.CreateIndex(
                name: "IX_testing_results_product_id",
                table: "testing_results",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_testing_results_testing_center_id",
                table: "testing_results",
                column: "testing_center_id");

            migrationBuilder.CreateIndex(
                name: "IX_testing_results_testing_service_id",
                table: "testing_results",
                column: "testing_service_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_incidents_location_commune_id",
                table: "food_poisoning_incidents",
                column: "location_commune_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_incidents_location_district_id",
                table: "food_poisoning_incidents",
                column: "location_district_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_incidents_location_province_id",
                table: "food_poisoning_incidents",
                column: "location_province_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_cases_location_commune_id",
                table: "food_poisoning_cases",
                column: "location_commune_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_cases_location_district_id",
                table: "food_poisoning_cases",
                column: "location_district_id");

            migrationBuilder.CreateIndex(
                name: "IX_food_poisoning_cases_location_province_id",
                table: "food_poisoning_cases",
                column: "location_province_id");

            migrationBuilder.CreateIndex(
                name: "IX_atp_alerts_business_id",
                table: "atp_alerts",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "IX_administrative_documents_document_type_id",
                table: "administrative_documents",
                column: "document_type_id");

            // Remove orphaned rows that reference non-existent document types before enforcing the FK.
            migrationBuilder.Sql(@"
                DELETE FROM administrative_documents
                WHERE document_type_id NOT IN (SELECT id FROM cat_document_types);
            ");

            migrationBuilder.AddForeignKey(
                name: "fk_ad_document_type",
                table: "administrative_documents",
                column: "document_type_id",
                principalTable: "cat_document_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.Sql(@"
                DELETE FROM atp_alerts WHERE business_id NOT IN (SELECT id FROM businesses);
                DELETE FROM food_poisoning_cases WHERE location_commune_id IS NOT NULL AND location_commune_id NOT IN (SELECT id FROM cat_communes);
                DELETE FROM food_poisoning_cases WHERE location_district_id IS NOT NULL AND location_district_id NOT IN (SELECT id FROM cat_districts);
                DELETE FROM food_poisoning_cases WHERE location_province_id IS NOT NULL AND location_province_id NOT IN (SELECT id FROM cat_provinces);
                DELETE FROM food_poisoning_incidents WHERE location_commune_id IS NOT NULL AND location_commune_id NOT IN (SELECT id FROM cat_communes);
                DELETE FROM food_poisoning_incidents WHERE location_district_id IS NOT NULL AND location_district_id NOT IN (SELECT id FROM cat_districts);
                DELETE FROM food_poisoning_incidents WHERE location_province_id IS NOT NULL AND location_province_id NOT IN (SELECT id FROM cat_provinces);
                DELETE FROM testing_results WHERE business_id IS NOT NULL AND business_id NOT IN (SELECT id FROM businesses);
                DELETE FROM testing_results WHERE inspection_result_id IS NOT NULL AND inspection_result_id NOT IN (SELECT id FROM inspection_results);
                DELETE FROM testing_results WHERE product_id IS NOT NULL AND product_id NOT IN (SELECT id FROM products);
                DELETE FROM testing_results WHERE testing_center_id IS NOT NULL AND testing_center_id NOT IN (SELECT id FROM cat_testing_centers);
                DELETE FROM testing_results WHERE testing_service_id IS NOT NULL AND testing_service_id NOT IN (SELECT id FROM cat_testing_services);
            ");

            migrationBuilder.AddForeignKey(
                name: "fk_alerts_business",
                table: "atp_alerts",
                column: "business_id",
                principalTable: "businesses",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpc_commune",
                table: "food_poisoning_cases",
                column: "location_commune_id",
                principalTable: "cat_communes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpc_district",
                table: "food_poisoning_cases",
                column: "location_district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpc_province",
                table: "food_poisoning_cases",
                column: "location_province_id",
                principalTable: "cat_provinces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpi_commune",
                table: "food_poisoning_incidents",
                column: "location_commune_id",
                principalTable: "cat_communes",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpi_district",
                table: "food_poisoning_incidents",
                column: "location_district_id",
                principalTable: "cat_districts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_fpi_province",
                table: "food_poisoning_incidents",
                column: "location_province_id",
                principalTable: "cat_provinces",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_tr_business",
                table: "testing_results",
                column: "business_id",
                principalTable: "businesses",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_tr_inspection_result",
                table: "testing_results",
                column: "inspection_result_id",
                principalTable: "inspection_results",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_tr_product",
                table: "testing_results",
                column: "product_id",
                principalTable: "products",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_tr_testing_center",
                table: "testing_results",
                column: "testing_center_id",
                principalTable: "cat_testing_centers",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "fk_tr_testing_service",
                table: "testing_results",
                column: "testing_service_id",
                principalTable: "cat_testing_services",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_ad_document_type",
                table: "administrative_documents");

            migrationBuilder.DropForeignKey(
                name: "fk_alerts_business",
                table: "atp_alerts");

            migrationBuilder.DropForeignKey(
                name: "fk_fpc_commune",
                table: "food_poisoning_cases");

            migrationBuilder.DropForeignKey(
                name: "fk_fpc_district",
                table: "food_poisoning_cases");

            migrationBuilder.DropForeignKey(
                name: "fk_fpc_province",
                table: "food_poisoning_cases");

            migrationBuilder.DropForeignKey(
                name: "fk_fpi_commune",
                table: "food_poisoning_incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_fpi_district",
                table: "food_poisoning_incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_fpi_province",
                table: "food_poisoning_incidents");

            migrationBuilder.DropForeignKey(
                name: "fk_tr_business",
                table: "testing_results");

            migrationBuilder.DropForeignKey(
                name: "fk_tr_inspection_result",
                table: "testing_results");

            migrationBuilder.DropForeignKey(
                name: "fk_tr_product",
                table: "testing_results");

            migrationBuilder.DropForeignKey(
                name: "fk_tr_testing_center",
                table: "testing_results");

            migrationBuilder.DropForeignKey(
                name: "fk_tr_testing_service",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_testing_results_business_id",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_testing_results_inspection_result_id",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_testing_results_product_id",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_testing_results_testing_center_id",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_testing_results_testing_service_id",
                table: "testing_results");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_incidents_location_commune_id",
                table: "food_poisoning_incidents");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_incidents_location_district_id",
                table: "food_poisoning_incidents");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_incidents_location_province_id",
                table: "food_poisoning_incidents");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_cases_location_commune_id",
                table: "food_poisoning_cases");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_cases_location_district_id",
                table: "food_poisoning_cases");

            migrationBuilder.DropIndex(
                name: "IX_food_poisoning_cases_location_province_id",
                table: "food_poisoning_cases");

            migrationBuilder.DropIndex(
                name: "IX_atp_alerts_business_id",
                table: "atp_alerts");

            migrationBuilder.DropIndex(
                name: "IX_administrative_documents_document_type_id",
                table: "administrative_documents");
        }
    }
}
