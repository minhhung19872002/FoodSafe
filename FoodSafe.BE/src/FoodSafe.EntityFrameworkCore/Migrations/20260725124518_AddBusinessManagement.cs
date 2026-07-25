using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "businesses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    business_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    business_classification_id = table.Column<Guid>(type: "uuid", nullable: true),
                    tax_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    representative_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    representative_id_card = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    contact_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    contact_website = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    address_street = table.Column<string>(type: "text", nullable: true),
                    address_province_id = table.Column<Guid>(type: "uuid", nullable: true),
                    address_district_id = table.Column<Guid>(type: "uuid", nullable: true),
                    address_commune_id = table.Column<Guid>(type: "uuid", nullable: true),
                    address_latitude = table.Column<double>(type: "double precision", nullable: true),
                    address_longitude = table.Column<double>(type: "double precision", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    suspension_reason = table.Column<string>(type: "text", nullable: true),
                    suspended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    has_eligibility_certificate = table.Column<bool>(type: "boolean", nullable: false),
                    has_vsattp_commitment = table.Column<bool>(type: "boolean", nullable: false),
                    established_date = table.Column<DateTime>(type: "date", nullable: true),
                    employee_count = table.Column<int>(type: "integer", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_businesses", x => x.id);
                    table.UniqueConstraint("uq_businesses_id_org", x => new { x.id, x.organization_id });
                    table.CheckConstraint("chk_businesses_address_chain", "(address_commune_id IS NULL OR address_district_id IS NOT NULL) AND (address_district_id IS NULL OR address_province_id IS NOT NULL)");
                    table.CheckConstraint("chk_businesses_coordinates", "(address_latitude IS NULL AND address_longitude IS NULL) OR (address_latitude BETWEEN -90 AND 90 AND address_longitude BETWEEN -180 AND 180)");
                    table.CheckConstraint("chk_businesses_employee_count", "employee_count IS NULL OR employee_count >= 0");
                    table.CheckConstraint("chk_businesses_status", "status IN (1, 2, 3)");
                    table.CheckConstraint("chk_businesses_suspension", "status != 3 OR suspension_reason IS NOT NULL");
                    table.ForeignKey(
                        name: "fk_businesses_classification",
                        column: x => x.business_classification_id,
                        principalTable: "cat_business_classifications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_businesses_commune_district",
                        columns: x => new { x.address_commune_id, x.address_district_id },
                        principalTable: "cat_communes",
                        principalColumns: new[] { "id", "district_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_businesses_district_province",
                        columns: x => new { x.address_district_id, x.address_province_id },
                        principalTable: "cat_districts",
                        principalColumns: new[] { "id", "province_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_businesses_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_businesses_province",
                        column: x => x.address_province_id,
                        principalTable: "cat_provinces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_businesses_type",
                        column: x => x.business_type_id,
                        principalTable: "cat_business_types",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "business_handlers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    position = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    id_card_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    training_certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    training_date = table.Column<DateTime>(type: "date", nullable: true),
                    training_organization = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    training_expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    health_certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    health_check_date = table.Column<DateTime>(type: "date", nullable: true),
                    health_check_facility = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    health_check_expiry_date = table.Column<DateTime>(type: "date", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_business_handlers", x => x.id);
                    table.CheckConstraint("chk_bh_health_dates", "health_check_date IS NULL OR health_check_expiry_date IS NULL OR health_check_date <= health_check_expiry_date");
                    table.CheckConstraint("chk_bh_training_dates", "training_date IS NULL OR training_expiry_date IS NULL OR training_date <= training_expiry_date");
                    table.ForeignKey(
                        name: "fk_business_handlers_business",
                        column: x => x.business_id,
                        principalTable: "businesses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "business_product_groups",
                columns: table => new
                {
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_group_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_business_product_groups", x => new { x.business_id, x.product_group_id });
                    table.ForeignKey(
                        name: "fk_bpg_business",
                        column: x => x.business_id,
                        principalTable: "businesses",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_bpg_product_group",
                        column: x => x.product_group_id,
                        principalTable: "cat_product_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    business_id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    product_group_id = table.Column<Guid>(type: "uuid", nullable: true),
                    brand_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    manufacturer = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    manufacturing_country_id = table.Column<Guid>(type: "uuid", nullable: true),
                    net_weight = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    specifications = table.Column<string>(type: "text", nullable: true),
                    ingredients = table.Column<string>(type: "text", nullable: true),
                    expiry_period_months = table.Column<int>(type: "integer", nullable: true),
                    storage_conditions = table.Column<string>(type: "text", nullable: true),
                    usage_instructions = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    notes = table.Column<string>(type: "text", nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_products", x => x.id);
                    table.UniqueConstraint("uq_products_id_business_org", x => new { x.id, x.business_id, x.organization_id });
                    table.CheckConstraint("chk_products_expiry", "expiry_period_months IS NULL OR expiry_period_months >= 0");
                    table.CheckConstraint("chk_products_status", "status IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_products_business_org",
                        columns: x => new { x.business_id, x.organization_id },
                        principalTable: "businesses",
                        principalColumns: new[] { "id", "organization_id" },
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_products_country",
                        column: x => x.manufacturing_country_id,
                        principalTable: "cat_countries",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_products_group",
                        column: x => x.product_group_id,
                        principalTable: "cat_product_groups",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_products_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_msa_business",
                table: "management_scope_assignments",
                column: "business_id");

            migrationBuilder.CreateIndex(
                name: "idx_business_handlers_business",
                table: "business_handlers",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_business_handlers_health_expiry",
                table: "business_handlers",
                column: "health_check_expiry_date",
                filter: "health_check_expiry_date IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_business_handlers_training_expiry",
                table: "business_handlers",
                column: "training_expiry_date",
                filter: "training_expiry_date IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_bpg_product_group",
                table: "business_product_groups",
                column: "product_group_id");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_classification",
                table: "businesses",
                column: "business_classification_id",
                filter: "business_classification_id IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_commune",
                table: "businesses",
                column: "address_commune_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_district",
                table: "businesses",
                column: "address_district_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_org_id",
                table: "businesses",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_province",
                table: "businesses",
                column: "address_province_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_status",
                table: "businesses",
                column: "status",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_businesses_type",
                table: "businesses",
                column: "business_type_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_businesses_address_commune_id_address_district_id",
                table: "businesses",
                columns: new[] { "address_commune_id", "address_district_id" });

            migrationBuilder.CreateIndex(
                name: "IX_businesses_address_district_id_address_province_id",
                table: "businesses",
                columns: new[] { "address_district_id", "address_province_id" });

            migrationBuilder.CreateIndex(
                name: "uq_businesses_code",
                table: "businesses",
                column: "code",
                unique: true,
                filter: "code IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "uq_businesses_tax_code",
                table: "businesses",
                column: "tax_code",
                unique: true,
                filter: "tax_code IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_products_business",
                table: "products",
                column: "business_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_products_group",
                table: "products",
                column: "product_group_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_products_org",
                table: "products",
                column: "organization_id",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_products_business_id_organization_id",
                table: "products",
                columns: new[] { "business_id", "organization_id" });

            migrationBuilder.CreateIndex(
                name: "IX_products_manufacturing_country_id",
                table: "products",
                column: "manufacturing_country_id");

            migrationBuilder.CreateIndex(
                name: "uq_products_business_code",
                table: "products",
                columns: new[] { "business_id", "code" },
                unique: true,
                filter: "code IS NOT NULL AND is_deleted = FALSE");

            migrationBuilder.AddForeignKey(
                name: "fk_msa_business",
                table: "management_scope_assignments",
                column: "business_id",
                principalTable: "businesses",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_msa_business",
                table: "management_scope_assignments");

            migrationBuilder.DropTable(
                name: "business_handlers");

            migrationBuilder.DropTable(
                name: "business_product_groups");

            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.DropTable(
                name: "businesses");

            migrationBuilder.DropIndex(
                name: "idx_msa_business",
                table: "management_scope_assignments");
        }
    }
}
