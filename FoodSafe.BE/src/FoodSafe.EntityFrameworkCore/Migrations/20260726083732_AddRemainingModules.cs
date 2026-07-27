using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FoodSafe.Migrations
{
    /// <inheritdoc />
    public partial class AddRemainingModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "action_month_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    period_year = table.Column<int>(type: "integer", nullable: false),
                    action_month_theme = table.Column<string>(type: "text", nullable: true),
                    action_month_dates = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    media_articles = table.Column<int>(type: "integer", nullable: false),
                    broadcast_programs = table.Column<int>(type: "integer", nullable: false),
                    propaganda_sessions = table.Column<int>(type: "integer", nullable: false),
                    participants = table.Column<int>(type: "integer", nullable: false),
                    posters_distributed = table.Column<int>(type: "integer", nullable: false),
                    leaflets_distributed = table.Column<int>(type: "integer", nullable: false),
                    businesses_inspected = table.Column<int>(type: "integer", nullable: false),
                    violations_found = table.Column<int>(type: "integer", nullable: false),
                    fines_issued = table.Column<int>(type: "integer", nullable: false),
                    fine_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    new_self_declarations = table.Column<int>(type: "integer", nullable: false),
                    achievements = table.Column<string>(type: "text", nullable: true),
                    limitations = table.Column<string>(type: "text", nullable: true),
                    lessons_learned = table.Column<string>(type: "text", nullable: true),
                    next_steps = table.Column<string>(type: "text", nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    submission_version = table.Column<short>(type: "smallint", nullable: false),
                    submitted_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    returned_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    returned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    return_reason = table.Column<string>(type: "text", nullable: true),
                    completed_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_action_month_reports", x => x.id);
                    table.CheckConstraint("chk_amr_status", "status IN (1, 2, 3, 4, 5)");
                    table.ForeignKey(
                        name: "fk_action_month_reports_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "administrative_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    issuing_authority = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    issued_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    effective_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    expiry_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    summary = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_administrative_documents", x => x.id);
                    table.CheckConstraint("chk_ad_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_ad_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "atp_alerts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    alert_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<short>(type: "smallint", nullable: false),
                    severity = table.Column<short>(type: "smallint", nullable: false),
                    affected_area = table.Column<string>(type: "text", nullable: true),
                    affected_products = table.Column<string>(type: "text", nullable: true),
                    business_id = table.Column<Guid>(type: "uuid", nullable: true),
                    source = table.Column<short>(type: "smallint", nullable: false),
                    reporter_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    reporter_phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    reporter_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    published_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    recalled_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    recalled_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    recall_reason = table.Column<string>(type: "text", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_atp_alerts", x => x.id);
                    table.CheckConstraint("chk_alerts_category", "category IN (1, 2, 3, 4, 5, 6)");
                    table.CheckConstraint("chk_alerts_publish", "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");
                    table.CheckConstraint("chk_alerts_recall", "status <> 3 OR (recalled_by_id IS NOT NULL AND recalled_at IS NOT NULL AND recall_reason IS NOT NULL)");
                    table.CheckConstraint("chk_alerts_severity", "severity IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_alerts_source", "source IN (1, 2, 3)");
                    table.CheckConstraint("chk_alerts_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_alerts_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "atp_news",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    thumbnail_storage_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    tags = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    view_count = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    published_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    is_featured = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_atp_news", x => x.id);
                    table.CheckConstraint("chk_news_publish", "status = 1 OR (published_by_id IS NOT NULL AND published_at IS NOT NULL)");
                    table.CheckConstraint("chk_news_status", "status IN (1, 2, 3)");
                    table.CheckConstraint("chk_news_view_count", "view_count >= 0");
                    table.ForeignKey(
                        name: "fk_news_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "atp_work_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    period_type = table.Column<short>(type: "smallint", nullable: false),
                    period_year = table.Column<int>(type: "integer", nullable: false),
                    period_half = table.Column<int>(type: "integer", nullable: true),
                    total_businesses = table.Column<int>(type: "integer", nullable: false),
                    new_businesses = table.Column<int>(type: "integer", nullable: false),
                    inactive_businesses = table.Column<int>(type: "integer", nullable: false),
                    businesses_with_certificate = table.Column<int>(type: "integer", nullable: false),
                    dkcb_issued = table.Column<int>(type: "integer", nullable: false),
                    self_declarations_received = table.Column<int>(type: "integer", nullable: false),
                    ad_registrations_issued = table.Column<int>(type: "integer", nullable: false),
                    eligibility_certificates_issued = table.Column<int>(type: "integer", nullable: false),
                    cfs_issued = table.Column<int>(type: "integer", nullable: false),
                    export_certificates_issued = table.Column<int>(type: "integer", nullable: false),
                    total_inspection_plans = table.Column<int>(type: "integer", nullable: false),
                    businesses_inspected = table.Column<int>(type: "integer", nullable: false),
                    violations_found = table.Column<int>(type: "integer", nullable: false),
                    fines_issued = table.Column<int>(type: "integer", nullable: false),
                    fine_total_amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    poisoning_case_count = table.Column<int>(type: "integer", nullable: false),
                    poisoning_incident_count = table.Column<int>(type: "integer", nullable: false),
                    total_affected = table.Column<int>(type: "integer", nullable: false),
                    total_deaths = table.Column<int>(type: "integer", nullable: false),
                    training_sessions = table.Column<int>(type: "integer", nullable: false),
                    training_participants = table.Column<int>(type: "integer", nullable: false),
                    media_appearances = table.Column<int>(type: "integer", nullable: false),
                    documents_issued = table.Column<int>(type: "integer", nullable: false),
                    overview = table.Column<string>(type: "text", nullable: true),
                    achievements = table.Column<string>(type: "text", nullable: true),
                    limitations = table.Column<string>(type: "text", nullable: true),
                    solutions = table.Column<string>(type: "text", nullable: true),
                    next_period_plan = table.Column<string>(type: "text", nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    submission_version = table.Column<short>(type: "smallint", nullable: false),
                    submitted_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    returned_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    returned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    return_reason = table.Column<string>(type: "text", nullable: true),
                    completed_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_atp_work_reports", x => x.id);
                    table.CheckConstraint("chk_atp_period_type", "period_type IN (1, 2)");
                    table.CheckConstraint("chk_atp_status", "status IN (1, 2, 3, 4, 5)");
                    table.ForeignKey(
                        name: "fk_atp_work_reports_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "di_api_call_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    direction = table.Column<short>(type: "smallint", nullable: false),
                    external_system_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    endpoint_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    request_headers = table.Column<string>(type: "text", nullable: true),
                    request_body = table.Column<string>(type: "text", nullable: true),
                    response_status_code = table.Column<int>(type: "integer", nullable: true),
                    response_body = table.Column<string>(type: "text", nullable: true),
                    called_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    is_success = table.Column<bool>(type: "boolean", nullable: false),
                    error_message = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: true),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_di_call_logs", x => x.id);
                    table.CheckConstraint("chk_di_cl_direction", "direction IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_di_cl_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "di_api_endpoints",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    external_system = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    description = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    auth_type = table.Column<short>(type: "smallint", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    ExtraProperties = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("pk_di_endpoints", x => x.id);
                    table.CheckConstraint("chk_di_ep_auth_type", "auth_type IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_di_ep_status", "status IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_di_ep_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "food_poisoning_incidents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    incident_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    occurrence_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    end_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    location_description = table.Column<string>(type: "text", nullable: true),
                    location_commune_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_district_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_province_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_latitude = table.Column<double>(type: "double precision", nullable: true),
                    location_longitude = table.Column<double>(type: "double precision", nullable: true),
                    exposed_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    affected_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    hospitalized_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    death_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    suspected_food = table.Column<string>(type: "text", nullable: true),
                    food_source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    food_service_type = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    cause_assessment = table.Column<short>(type: "smallint", nullable: true),
                    causative_agent = table.Column<string>(type: "text", nullable: true),
                    pathogen = table.Column<string>(type: "text", nullable: true),
                    investigation_team = table.Column<string>(type: "text", nullable: true),
                    control_measures = table.Column<string>(type: "text", nullable: true),
                    prevention_measures = table.Column<string>(type: "text", nullable: true),
                    conclusion = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    reported_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reported_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    concluded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    concluded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("pk_fpi", x => x.id);
                    table.CheckConstraint("chk_fpi_conclude_evidence", "status <> 4 OR (concluded_by_id IS NOT NULL AND concluded_at IS NOT NULL)");
                    table.CheckConstraint("chk_fpi_report_evidence", "status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)");
                    table.CheckConstraint("chk_fpi_status", "status IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_fpi_verify_evidence", "status NOT IN (3, 4) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_fpi_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ndtp_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    period_year = table.Column<int>(type: "integer", nullable: false),
                    period_month = table.Column<int>(type: "integer", nullable: false),
                    case_count = table.Column<int>(type: "integer", nullable: false),
                    case_affected = table.Column<int>(type: "integer", nullable: false),
                    case_hospitalized = table.Column<int>(type: "integer", nullable: false),
                    case_deaths = table.Column<int>(type: "integer", nullable: false),
                    incident_count = table.Column<int>(type: "integer", nullable: false),
                    incident_affected = table.Column<int>(type: "integer", nullable: false),
                    incident_hospitalized = table.Column<int>(type: "integer", nullable: false),
                    incident_deaths = table.Column<int>(type: "integer", nullable: false),
                    prevention_activities = table.Column<string>(type: "text", nullable: true),
                    risk_factors = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    extra_properties = table.Column<string>(type: "jsonb", nullable: false),
                    concurrency_stamp = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true),
                    last_modification_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_modifier_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    deleter_id = table.Column<Guid>(type: "uuid", nullable: true),
                    deletion_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    submission_version = table.Column<short>(type: "smallint", nullable: false),
                    submitted_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    returned_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    returned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    return_reason = table.Column<string>(type: "text", nullable: true),
                    completed_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ndtp_reports", x => x.id);
                    table.CheckConstraint("chk_ndtp_month", "period_month >= 1 AND period_month <= 12");
                    table.CheckConstraint("chk_ndtp_status", "status IN (1, 2, 3, 4, 5)");
                    table.ForeignKey(
                        name: "fk_ndtp_reports_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "risk_analyses",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<short>(type: "smallint", nullable: false),
                    risk_level = table.Column<short>(type: "smallint", nullable: false),
                    related_products = table.Column<string>(type: "text", nullable: true),
                    evidence = table.Column<string>(type: "text", nullable: true),
                    recommendations = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
                    published_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("pk_risk_analyses", x => x.id);
                    table.CheckConstraint("chk_ra_category", "category IN (1, 2, 3, 4, 5, 6)");
                    table.CheckConstraint("chk_ra_risk_level", "risk_level IN (1, 2, 3, 4)");
                    table.CheckConstraint("chk_ra_status", "status IN (1, 2)");
                    table.ForeignKey(
                        name: "fk_ra_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "testing_results",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sample_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    sample_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    testing_center_id = table.Column<Guid>(type: "uuid", nullable: false),
                    testing_service_id = table.Column<Guid>(type: "uuid", nullable: true),
                    business_id = table.Column<Guid>(type: "uuid", nullable: true),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    sample_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    submission_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    result_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    outcome = table.Column<short>(type: "smallint", nullable: false),
                    failed_criteria = table.Column<string>(type: "text", nullable: true),
                    certificate_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    inspection_result_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_public = table.Column<bool>(type: "boolean", nullable: false),
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
                    table.PrimaryKey("pk_testing_results", x => x.id);
                    table.CheckConstraint("chk_tr_outcome", "outcome IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_tr_org",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "action_month_report_error_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    error_fields = table.Column<string>(type: "text", nullable: false),
                    correction_details = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    response = table.Column<string>(type: "text", nullable: true),
                    responded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_amr_ren", x => x.id);
                    table.CheckConstraint("chk_amr_ren_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_amr_error_notifications_report",
                        column: x => x.report_id,
                        principalTable: "action_month_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "news_linked_alerts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    news_id = table.Column<Guid>(type: "uuid", nullable: false),
                    alert_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_news_linked_alerts", x => x.id);
                    table.ForeignKey(
                        name: "FK_news_linked_alerts_atp_news_news_id",
                        column: x => x.news_id,
                        principalTable: "atp_news",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_nla_alert",
                        column: x => x.alert_id,
                        principalTable: "atp_alerts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "atp_work_report_error_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    error_fields = table.Column<string>(type: "text", nullable: false),
                    correction_details = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    response = table.Column<string>(type: "text", nullable: true),
                    responded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_atp_ren", x => x.id);
                    table.CheckConstraint("chk_atp_ren_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_atp_error_notifications_report",
                        column: x => x.report_id,
                        principalTable: "atp_work_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "food_poisoning_cases",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    incident_id = table.Column<Guid>(type: "uuid", nullable: true),
                    case_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    report_date = table.Column<DateOnly>(type: "date", nullable: false),
                    occurrence_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    location_description = table.Column<string>(type: "text", nullable: true),
                    location_commune_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_district_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_province_id = table.Column<Guid>(type: "uuid", nullable: true),
                    location_latitude = table.Column<double>(type: "double precision", nullable: true),
                    location_longitude = table.Column<double>(type: "double precision", nullable: true),
                    victim_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    victim_age = table.Column<int>(type: "integer", nullable: true),
                    victim_gender = table.Column<short>(type: "smallint", nullable: true),
                    victim_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    victim_address = table.Column<string>(type: "text", nullable: true),
                    suspected_food = table.Column<string>(type: "text", nullable: true),
                    food_source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    food_preparation_date = table.Column<DateOnly>(type: "date", nullable: true),
                    symptoms = table.Column<string>(type: "text", nullable: true),
                    onset_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    medical_facility = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    treatment_start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    treatment_result = table.Column<short>(type: "smallint", nullable: true),
                    reporter_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    reporter_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    reporter_organization = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    reporter_relation = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    reported_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    reported_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
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
                    table.PrimaryKey("pk_fpc", x => x.id);
                    table.CheckConstraint("chk_fpc_report_evidence", "status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)");
                    table.CheckConstraint("chk_fpc_status", "status IN (1, 2, 3)");
                    table.CheckConstraint("chk_fpc_verify_evidence", "status <> 3 OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)");
                    table.ForeignKey(
                        name: "fk_fpc_incident",
                        column: x => x.incident_id,
                        principalTable: "food_poisoning_incidents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "fk_fpc_organization",
                        column: x => x.organization_id,
                        principalTable: "organizations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "poisoning_incident_error_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    incident_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    error_description = table.Column<string>(type: "text", nullable: false),
                    correction_request = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    response = table.Column<string>(type: "text", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    responded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pier", x => x.id);
                    table.CheckConstraint("chk_pier_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_pier_incident",
                        column: x => x.incident_id,
                        principalTable: "food_poisoning_incidents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ndtp_report_error_notifications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    report_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    error_fields = table.Column<string>(type: "text", nullable: false),
                    correction_details = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    response = table.Column<string>(type: "text", nullable: true),
                    responded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ndtp_ren", x => x.id);
                    table.CheckConstraint("chk_ndtp_ren_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_ndtp_error_notifications_report",
                        column: x => x.report_id,
                        principalTable: "ndtp_reports",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "poisoning_case_error_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<Guid>(type: "uuid", nullable: false),
                    from_organization_id = table.Column<Guid>(type: "uuid", nullable: false),
                    error_description = table.Column<string>(type: "text", nullable: false),
                    correction_request = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<short>(type: "smallint", nullable: false),
                    response = table.Column<string>(type: "text", nullable: true),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    responded_by_id = table.Column<Guid>(type: "uuid", nullable: true),
                    creation_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    creator_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pcer", x => x.id);
                    table.CheckConstraint("chk_pcer_status", "status IN (1, 2, 3)");
                    table.ForeignKey(
                        name: "fk_pcer_case",
                        column: x => x.case_id,
                        principalTable: "food_poisoning_cases",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_amr_ren_report",
                table: "action_month_report_error_notifications",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "idx_amr_org_period",
                table: "action_month_reports",
                columns: new[] { "organization_id", "period_year" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "idx_amr_org_status",
                table: "action_month_reports",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_ad_doc_number",
                table: "administrative_documents",
                column: "document_number",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_ad_org_type",
                table: "administrative_documents",
                columns: new[] { "organization_id", "document_type_id" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_ad_public",
                table: "administrative_documents",
                column: "is_public",
                filter: "is_deleted = FALSE AND is_public = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_alerts_category",
                table: "atp_alerts",
                column: "category",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_alerts_org_status",
                table: "atp_alerts",
                columns: new[] { "organization_id", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_alerts_public",
                table: "atp_alerts",
                column: "is_public",
                filter: "is_deleted = FALSE AND is_public = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_alerts_severity",
                table: "atp_alerts",
                column: "severity",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_news_category",
                table: "atp_news",
                column: "category",
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_news_org_status",
                table: "atp_news",
                columns: new[] { "organization_id", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_news_public",
                table: "atp_news",
                column: "is_public",
                filter: "is_deleted = FALSE AND is_public = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_atp_ren_report",
                table: "atp_work_report_error_notifications",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "idx_atp_org_period",
                table: "atp_work_reports",
                columns: new[] { "organization_id", "period_type", "period_year", "period_half" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "idx_atp_org_status",
                table: "atp_work_reports",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_di_cl_ext_system",
                table: "di_api_call_logs",
                column: "external_system_name");

            migrationBuilder.CreateIndex(
                name: "idx_di_cl_org_called",
                table: "di_api_call_logs",
                columns: new[] { "organization_id", "called_at" });

            migrationBuilder.CreateIndex(
                name: "idx_di_cl_success",
                table: "di_api_call_logs",
                column: "is_success");

            migrationBuilder.CreateIndex(
                name: "idx_di_ep_ext_system",
                table: "di_api_endpoints",
                column: "external_system");

            migrationBuilder.CreateIndex(
                name: "idx_di_ep_org_status",
                table: "di_api_endpoints",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_fpc_incident",
                table: "food_poisoning_cases",
                column: "incident_id");

            migrationBuilder.CreateIndex(
                name: "idx_fpc_org_status",
                table: "food_poisoning_cases",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_fpc_report_date",
                table: "food_poisoning_cases",
                column: "report_date");

            migrationBuilder.CreateIndex(
                name: "idx_fpi_occurrence_date",
                table: "food_poisoning_incidents",
                column: "occurrence_date");

            migrationBuilder.CreateIndex(
                name: "idx_fpi_org_status",
                table: "food_poisoning_incidents",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "idx_ndtp_ren_report",
                table: "ndtp_report_error_notifications",
                column: "report_id");

            migrationBuilder.CreateIndex(
                name: "idx_ndtp_org_period",
                table: "ndtp_reports",
                columns: new[] { "organization_id", "period_year", "period_month" },
                unique: true,
                filter: "is_deleted = false");

            migrationBuilder.CreateIndex(
                name: "idx_ndtp_org_status",
                table: "ndtp_reports",
                columns: new[] { "organization_id", "status" });

            migrationBuilder.CreateIndex(
                name: "IX_news_linked_alerts_alert_id",
                table: "news_linked_alerts",
                column: "alert_id");

            migrationBuilder.CreateIndex(
                name: "uq_nla_news_alert",
                table: "news_linked_alerts",
                columns: new[] { "news_id", "alert_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_pcer_case",
                table: "poisoning_case_error_reports",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "idx_pier_incident",
                table: "poisoning_incident_error_reports",
                column: "incident_id");

            migrationBuilder.CreateIndex(
                name: "idx_ra_org_status",
                table: "risk_analyses",
                columns: new[] { "organization_id", "status" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_ra_public",
                table: "risk_analyses",
                column: "is_public",
                filter: "is_deleted = FALSE AND is_public = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_tr_org_outcome",
                table: "testing_results",
                columns: new[] { "organization_id", "outcome" },
                filter: "is_deleted = FALSE");

            migrationBuilder.CreateIndex(
                name: "idx_tr_public",
                table: "testing_results",
                column: "is_public",
                filter: "is_deleted = FALSE AND is_public = TRUE");

            migrationBuilder.CreateIndex(
                name: "idx_tr_sample_code",
                table: "testing_results",
                column: "sample_code",
                filter: "is_deleted = FALSE");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "action_month_report_error_notifications");

            migrationBuilder.DropTable(
                name: "administrative_documents");

            migrationBuilder.DropTable(
                name: "atp_work_report_error_notifications");

            migrationBuilder.DropTable(
                name: "di_api_call_logs");

            migrationBuilder.DropTable(
                name: "di_api_endpoints");

            migrationBuilder.DropTable(
                name: "ndtp_report_error_notifications");

            migrationBuilder.DropTable(
                name: "news_linked_alerts");

            migrationBuilder.DropTable(
                name: "poisoning_case_error_reports");

            migrationBuilder.DropTable(
                name: "poisoning_incident_error_reports");

            migrationBuilder.DropTable(
                name: "risk_analyses");

            migrationBuilder.DropTable(
                name: "testing_results");

            migrationBuilder.DropTable(
                name: "action_month_reports");

            migrationBuilder.DropTable(
                name: "atp_work_reports");

            migrationBuilder.DropTable(
                name: "ndtp_reports");

            migrationBuilder.DropTable(
                name: "atp_news");

            migrationBuilder.DropTable(
                name: "atp_alerts");

            migrationBuilder.DropTable(
                name: "food_poisoning_cases");

            migrationBuilder.DropTable(
                name: "food_poisoning_incidents");
        }
    }
}
