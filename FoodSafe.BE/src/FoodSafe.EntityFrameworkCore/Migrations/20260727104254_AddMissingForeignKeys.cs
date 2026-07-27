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

            // Production-safe orphan handling for NON-NULLABLE FKs.
            // administrative_documents.document_type_id and testing_results.testing_center_id
            // are NOT NULL, so a dangling reference cannot be repaired by nulling it.
            // Rather than silently DELETE real records (irrecoverable), abort the
            // migration and require a deliberate operator decision. On a clean database
            // this finds nothing and the migration proceeds; the check modifies no data.
            migrationBuilder.Sql(@"
                DO $$
                DECLARE ad_orphans bigint; tc_orphans bigint;
                BEGIN
                    SELECT count(*) INTO ad_orphans
                    FROM administrative_documents
                    WHERE document_type_id NOT IN (SELECT id FROM cat_document_types);

                    SELECT count(*) INTO tc_orphans
                    FROM testing_results
                    WHERE testing_center_id NOT IN (SELECT id FROM cat_testing_centers);

                    IF ad_orphans > 0 OR tc_orphans > 0 THEN
                        RAISE EXCEPTION 'AddMissingForeignKeys aborted: % administrative_documents row(s) with an invalid document_type_id and % testing_results row(s) with an invalid testing_center_id (both columns are NOT NULL). Resolve these rows manually (assign a valid reference or archive the records) before applying this migration. No data was modified.', ad_orphans, tc_orphans;
                    END IF;
                END $$;
            ");

            migrationBuilder.AddForeignKey(
                name: "fk_ad_document_type",
                table: "administrative_documents",
                column: "document_type_id",
                principalTable: "cat_document_types",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            // Production-safe orphan handling for NULLABLE FKs.
            // Every column below is nullable, so a dangling reference is repaired by
            // clearing it to NULL — preserving the business record (alert, poisoning
            // case/incident, testing result) — instead of deleting the whole row.
            // The referenced id was already invalid, so nulling loses no valid data.
            // On a clean database these UPDATEs affect zero rows.
            migrationBuilder.Sql(@"
                UPDATE atp_alerts SET business_id = NULL WHERE business_id IS NOT NULL AND business_id NOT IN (SELECT id FROM businesses);
                UPDATE food_poisoning_cases SET location_commune_id = NULL WHERE location_commune_id IS NOT NULL AND location_commune_id NOT IN (SELECT id FROM cat_communes);
                UPDATE food_poisoning_cases SET location_district_id = NULL WHERE location_district_id IS NOT NULL AND location_district_id NOT IN (SELECT id FROM cat_districts);
                UPDATE food_poisoning_cases SET location_province_id = NULL WHERE location_province_id IS NOT NULL AND location_province_id NOT IN (SELECT id FROM cat_provinces);
                UPDATE food_poisoning_incidents SET location_commune_id = NULL WHERE location_commune_id IS NOT NULL AND location_commune_id NOT IN (SELECT id FROM cat_communes);
                UPDATE food_poisoning_incidents SET location_district_id = NULL WHERE location_district_id IS NOT NULL AND location_district_id NOT IN (SELECT id FROM cat_districts);
                UPDATE food_poisoning_incidents SET location_province_id = NULL WHERE location_province_id IS NOT NULL AND location_province_id NOT IN (SELECT id FROM cat_provinces);
                UPDATE testing_results SET business_id = NULL WHERE business_id IS NOT NULL AND business_id NOT IN (SELECT id FROM businesses);
                UPDATE testing_results SET inspection_result_id = NULL WHERE inspection_result_id IS NOT NULL AND inspection_result_id NOT IN (SELECT id FROM inspection_results);
                UPDATE testing_results SET product_id = NULL WHERE product_id IS NOT NULL AND product_id NOT IN (SELECT id FROM products);
                UPDATE testing_results SET testing_service_id = NULL WHERE testing_service_id IS NOT NULL AND testing_service_id NOT IN (SELECT id FROM cat_testing_services);
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
