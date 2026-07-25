-- ============================================================
-- FoodSafe — PostgreSQL 15 Database Schema (Revised)
-- Chi cục ATVSTP tỉnh Quảng Ninh
-- Chuẩn: ABP Framework 9 naming convention (snake_case)
-- Schema: public (default)
--
-- REVISION LOG:
--   v2.0 (2026-07-25): Full audit rebuild — 9 new tables, 17 structural fixes
--     C-01 FIX: Added password_history table (password reuse policy)
--     C-02 FIX: Added UNIQUE on product_registrations.registration_number
--     C-03 FIX: Added UNIQUE on self_declarations.declaration_number
--     C-04 FIX: Added UNIQUE on certificate_number for elic/cfs/export certs
--     C-05 FIX: Replaced inspection_results.inspector_ids UUID[] with
--               inspection_result_inspectors table (relational integrity)
--     C-06 FIX: Added testing_result_services table (M2M to cat_testing_services)
--     H-01 FIX: Added atp_work_report_error_notifications table
--     H-01 FIX: Added action_month_report_error_notifications table
--     H-02 FIX: Added checksum, virus_scan_status, retention_status and the
--               former entity_version approach (superseded by v2.3 typed submission owners)
--     H-03 FIX: Added idempotency_key, next_retry_at, payload_checksum
--               to data_sharing_histories
--     H-04 FIX: Added UNIQUE(plan_id, business_id) to inspection_plan_items
--     H-05 FIX: Added incident_id FK to food_poisoning_cases
--     H-06 FIX: Added partial UNIQUE index on businesses.tax_code
--     H-07 FIX: Added rejected_reason, rejected_by_id, rejected_at
--               to inspection_plans
--     M-01 FIX: Added public_submission_id FK to atp_alerts
--     M-02 FIX: Added tsvector column + GIN index to regulatory_documents
--     M-03 FIX: Added index on businesses.tax_code, advertisement_registrations
--
--   v2.1 (2026-07-25): Red-team adversarial review — 5 Critical + 7 High + 3 Medium fixes
--     RT-C1 FIX: ALTER TABLE organizations — added FK for province_id/district_id
--               (forward-reference; placed after cat_communes definition)
--     RT-C2 FIX: ndtp_reports — removed inline UNIQUE; added partial UNIQUE index
--               WHERE is_deleted = FALSE
--     RT-C3 FIX: action_month_reports — same fix as RT-C2
--     RT-C4 FIX: cat_testing_services — added UNIQUE(testing_center_id, code)
--     RT-C5 FIX: food_poisoning_incidents — ALTER TABLE added FK for
--               location_district_id, location_province_id
--     RT-H1 FIX: file_attachments — renamed deleted_at → deletion_time,
--               added deleter_id (ABP ISoftDelete compliance)
--     RT-H2 FIX: food_poisoning_cases — ALTER TABLE added FK for location_province_id
--     RT-H3 FIX: public_alert_submissions — ALTER TABLE added FK for location_district_id
--     RT-H4 FIX: atp_alerts — CHECK source!=2 OR public_submission_id IS NOT NULL
--     RT-H5 FIX: former reciprocal converted_alert_id check (superseded by v2.3 one-way relation)
--     RT-H6 FIX: testing_results — partial UNIQUE INDEX(sample_code, organization_id)
--               WHERE is_deleted = FALSE
--     RT-H7 FIX: inspection_plans — added submitted_by_id, submitted_at columns
--     RT-M1 FIX: businesses — CHECK status!=3 OR suspension_reason IS NOT NULL
--     RT-M2 FIX: inspection_plans — CHECK start_date <= end_date
--     RT-M3 FIX: eligibility/cfs/export certs + self_declarations — CHECK issue_date <= expiry_date
--
--   v2.2 (2026-07-25): Independent red-team review (Principal Database Reviewer)
--     B-01 FIX: ndtp_reports — removed inline UNIQUE (partial index already present, duplicate name)
--     B-02 FIX: action_month_reports — same as B-01
--     B-03 FIX: inspection_plans — replaced inline UNIQUE on plan_code with partial index
--     C-01 FIX: file_attachments — renamed deleted_at -> deletion_time + added deleter_id
--     D-01 FIX: cat_testing_centers — added FK for address_commune/district/province_id
--     E-01 FIX: self_declarations CHECK — fixed phantom column (effective_date -> declaration_date)
--     E-02 FIX: atp_alerts — CHECK status=3(Recalled) requires recall_reason IS NOT NULL
--     E-03 FIX: atp_news — CHECK status=3(Recalled) requires recalled_reason IS NOT NULL
--     E-04 FIX: ndtp/atp_work/action_month reports — CHECK status=4 requires return_reason
--     E-05 FIX: 6 license tables — CHECK status=3(Revoked) requires revoke_reason
--     G-01 FIX: food_poisoning_cases — added reported_by_id + reported_at
--     G-02 FIX: food_poisoning_incidents — added reported_by_id + reported_at
--     H-01 FIX: product_registrations — CHECK registration_date <= expiry_date
--     H-02 FIX: advertisement_registrations — CHECK registration_date <= expiry_date
--     H-03 FIX: regulatory_documents — CHECK date ordering (issue <= effective <= expiry)
--     I-01 FIX: business_handlers — CHECK training/health date ranges + added deletion_time + deleter_id
--     J-01 FIX: public_alert_submissions.assigned_organization_id — added FK to organizations
--     M-01 FIX: former attachment organization column (superseded by v2.3 document owner)
--     Q-01 FIX: Added product_id FK indexes on self_declarations, product_registrations
--     Q-02 FIX: Added geographic FK indexes on food_poisoning_incidents/cases
--     T-01 FIX: self_declarations unique index scoped to (business_id, declaration_number)
--     U-01 FIX: public_alert_submissions — replaced created_at/updated_at with ABP audit
--              columns + added soft-delete (is_deleted + deletion_time + deleter_id)
--
--   v2.3 (2026-07-25): Resolution of 27 independent findings against PDF/FR/state/permissions
--     Accepted 14; Partially accepted 11; Rejected 2. Added composite ownership FKs,
--     focal-point scopes, immutable report submissions, typed document owners,
--     hierarchy/geography enforcement, workflow evidence checks, immutable integration
--     attempts, retained official-number uniqueness, one-way public conversion, and FK indexes.
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Trigram full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- GiST index for date ranges

-- ============================================================
-- SECTION 1: ABP FRAMEWORK BUILT-IN TABLES
-- (Managed by ABP EF Core migrations — do NOT create manually)
-- Listed here for reference and completeness
-- ============================================================
-- AbpUsers                       — User accounts
-- AbpRoles                       — Role definitions
-- AbpUserRoles                   — User ↔ Role assignments
-- AbpUserClaims                  — User claims
-- AbpRoleClaims                  — Role claims
-- AbpUserLogins                  — External login providers
-- AbpUserTokens                  — Auth tokens
-- AbpOrganizationUnits           — NOT USED (using custom organizations table)
-- AbpAuditLogs                   — All API call audit records
-- AbpAuditLogActions             — Action detail per audit log
-- AbpEntityChanges               — Entity change records (before/after)
-- AbpEntityPropertyChanges       — Property-level change detail
-- AbpPermissionGrants            — Role/user permission assignments
-- AbpSettings                    — Application settings
-- AbpBackgroundJobs              — Hangfire-equivalent job queue
-- AbpOpenIddictApplications      — OAuth2 client applications
-- AbpOpenIddictAuthorizations    — OAuth2 authorizations
-- AbpOpenIddictScopes            — OAuth2 scopes
-- AbpOpenIddictTokens            — OAuth2 tokens
-- AbpFeatureGroups               — Feature group definitions
-- AbpFeatures                    — Feature flags
-- AbpFeatureValues               — Feature flag values per tenant/user

-- ============================================================
-- SECTION 2: ORGANIZATIONS MODULE
-- ============================================================

CREATE TABLE organizations (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    parent_id                UUID         NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    level                    SMALLINT     NOT NULL, -- 1=Province, 2=District, 3=Commune
    address                  TEXT         NULL,
    phone                    VARCHAR(50)  NULL,
    fax                      VARCHAR(50)  NULL,
    email                    VARCHAR(200) NULL,
    leader_name              VARCHAR(200) NULL,     -- Trưởng đơn vị
    province_id              UUID         NULL,     -- FK to cat_provinces
    district_id              UUID         NULL,     -- FK to cat_districts
    commune_id               UUID         NULL,     -- FK to cat_communes
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    -- ABP Audit Fields
    extra_properties         JSONB        NULL,
    concurrency_stamp        VARCHAR(40)  NULL,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    deletion_time            TIMESTAMPTZ  NULL,
    deleter_id               UUID         NULL,
    CONSTRAINT pk_organizations PRIMARY KEY (id),
    CONSTRAINT uq_organizations_code UNIQUE (code),
    CONSTRAINT fk_organizations_parent FOREIGN KEY (parent_id) REFERENCES organizations(id),
    CONSTRAINT chk_organizations_level CHECK (level IN (1, 2, 3)),
    -- [IDB-006 FIX] Level-1 orgs (province) must have no parent; non-root orgs must have parent
    CONSTRAINT chk_org_level_parent CHECK (
        (level = 1 AND parent_id IS NULL) OR
        (level != 1 AND parent_id IS NOT NULL)
    )
);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_organizations_level ON organizations(level) WHERE is_deleted = FALSE;
CREATE INDEX idx_organizations_province ON organizations(province_id) WHERE province_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_organizations_district ON organizations(district_id) WHERE district_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_organizations_commune ON organizations(commune_id) WHERE commune_id IS NOT NULL AND is_deleted = FALSE;

-- Extended user profile (1-1 với AbpUsers)
-- Stores business-specific user data not in AbpUsers
CREATE TABLE app_user_profiles (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id                  UUID         NOT NULL,  -- = AbpUsers.Id (no FK — ABP manages)
    organization_id          UUID         NOT NULL,
    full_name                VARCHAR(200) NOT NULL,
    position                 VARCHAR(200) NULL,
    department               VARCHAR(200) NULL,
    password_expires_at      TIMESTAMPTZ  NULL,
    must_change_password     BOOL         NOT NULL DEFAULT TRUE,  -- TRUE for new accounts
    last_login_at            TIMESTAMPTZ  NULL,
    failed_login_count       SMALLINT     NOT NULL DEFAULT 0,     -- Supplement to ABP tracking
    locked_until             TIMESTAMPTZ  NULL,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_modification_time   TIMESTAMPTZ  NULL,
    CONSTRAINT pk_app_user_profiles PRIMARY KEY (id),
    CONSTRAINT uq_app_user_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_app_user_profiles_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_app_user_profiles_org_id ON app_user_profiles(organization_id);

-- [C-01 NEW TABLE] Password history — "Không trùng 5 mật khẩu gần nhất"
-- Stores hashed passwords to enforce password reuse policy
CREATE TABLE password_history (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id                  UUID         NOT NULL,  -- = AbpUsers.Id
    password_hash            VARCHAR(500) NOT NULL,  -- bcrypt hash (same algo as AbpUsers)
    created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_password_history PRIMARY KEY (id)
);
CREATE INDEX idx_password_history_user ON password_history(user_id, created_at DESC);

-- [IDB-005 ACCEPTED] Effective-dated management focal-point scopes.
-- Organization ownership remains the record's home scope; these grants add an
-- independently managed jurisdiction for read/write authorization.
CREATE TABLE management_scope_assignments (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    grantee_organization_id  UUID         NOT NULL,
    grantee_user_id          UUID         NULL,       -- AbpUsers.Id; NULL = whole organization
    scope_type               SMALLINT     NOT NULL,   -- 1=Geography, 2=Business, 3=BusinessType, 4=ProductGroup
    province_id              UUID         NULL,
    district_id              UUID         NULL,
    commune_id               UUID         NULL,
    business_id              UUID         NULL,
    business_type_id         UUID         NULL,
    product_group_id         UUID         NULL,
    can_view                 BOOL         NOT NULL DEFAULT TRUE,
    can_create               BOOL         NOT NULL DEFAULT FALSE,
    can_edit                 BOOL         NOT NULL DEFAULT FALSE,
    can_delete               BOOL         NOT NULL DEFAULT FALSE,
    valid_from               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    valid_to                 TIMESTAMPTZ  NULL,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    CONSTRAINT pk_management_scope_assignments PRIMARY KEY (id),
    CONSTRAINT fk_msa_grantee_org FOREIGN KEY (grantee_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_msa_type CHECK (scope_type IN (1, 2, 3, 4)),
    CONSTRAINT chk_msa_dates CHECK (valid_to IS NULL OR valid_from < valid_to),
    CONSTRAINT chk_msa_one_target CHECK (
        (scope_type = 1 AND business_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL
            AND num_nonnulls(province_id, district_id, commune_id) = 1) OR
        (scope_type = 2 AND business_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL
            AND commune_id IS NULL AND business_type_id IS NULL AND product_group_id IS NULL) OR
        (scope_type = 3 AND business_type_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL
            AND commune_id IS NULL AND business_id IS NULL AND product_group_id IS NULL) OR
        (scope_type = 4 AND product_group_id IS NOT NULL AND province_id IS NULL AND district_id IS NULL
            AND commune_id IS NULL AND business_id IS NULL AND business_type_id IS NULL)
    )
);
CREATE INDEX idx_msa_grantee ON management_scope_assignments(grantee_organization_id, grantee_user_id, valid_from, valid_to);

-- ============================================================
-- SECTION 3: CATALOGS MODULE
-- ============================================================

CREATE TABLE cat_countries (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code_alpha2              VARCHAR(2)   NOT NULL,  -- ISO 3166-1 alpha-2
    code_alpha3              VARCHAR(3)   NULL,      -- ISO 3166-1 alpha-3
    name_vi                  VARCHAR(200) NOT NULL,  -- Tên tiếng Việt
    name_en                  VARCHAR(200) NULL,      -- Tên tiếng Anh
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_countries PRIMARY KEY (id),
    CONSTRAINT uq_cat_countries_code UNIQUE (code_alpha2)
);

CREATE TABLE cat_regions (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(20)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    description              TEXT         NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_regions PRIMARY KEY (id),
    CONSTRAINT uq_cat_regions_code UNIQUE (code)
);

CREATE TABLE cat_provinces (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    region_id                UUID         NULL,
    code                     VARCHAR(10)  NOT NULL,  -- Mã VNDIVISION
    name                     VARCHAR(200) NOT NULL,
    name_short               VARCHAR(100) NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_provinces PRIMARY KEY (id),
    CONSTRAINT uq_cat_provinces_code UNIQUE (code),
    CONSTRAINT fk_cat_provinces_region FOREIGN KEY (region_id) REFERENCES cat_regions(id)
);

CREATE TABLE cat_districts (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    province_id              UUID         NOT NULL,
    code                     VARCHAR(10)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    -- 1=Huyện, 2=Quận, 3=Thị xã, 4=TP trực thuộc tỉnh
    type                     SMALLINT     NOT NULL DEFAULT 1,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_districts PRIMARY KEY (id),
    CONSTRAINT uq_cat_districts_code UNIQUE (code),
    CONSTRAINT fk_cat_districts_province FOREIGN KEY (province_id) REFERENCES cat_provinces(id),
    CONSTRAINT chk_cat_districts_type CHECK (type IN (1, 2, 3, 4)),
    -- [IDB-007 FIX] Composite unique enables composite FK enforcement of address hierarchy
    CONSTRAINT uq_cat_districts_id_province UNIQUE (id, province_id)
);
CREATE INDEX idx_cat_districts_province ON cat_districts(province_id) WHERE is_deleted = FALSE;

CREATE TABLE cat_communes (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    district_id              UUID         NOT NULL,
    code                     VARCHAR(10)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    -- 1=Xã, 2=Phường, 3=Thị trấn
    type                     SMALLINT     NOT NULL DEFAULT 1,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_communes PRIMARY KEY (id),
    CONSTRAINT uq_cat_communes_code UNIQUE (code),
    CONSTRAINT fk_cat_communes_district FOREIGN KEY (district_id) REFERENCES cat_districts(id),
    CONSTRAINT chk_cat_communes_type CHECK (type IN (1, 2, 3)),
    -- [IDB-007 FIX] Composite unique enables composite FK enforcement of address hierarchy
    CONSTRAINT uq_cat_communes_id_district UNIQUE (id, district_id)
);
CREATE INDEX idx_cat_communes_district ON cat_communes(district_id) WHERE is_deleted = FALSE;

-- [RT-C1 FIX] organizations.province_id / district_id forward-reference FK constraints
-- Cannot be inline in CREATE TABLE organizations (Section 2) because cat_provinces and
-- cat_districts are defined here in Section 3. Added as ALTER TABLE after dependent tables exist.
ALTER TABLE organizations
    ADD CONSTRAINT fk_organizations_province FOREIGN KEY (province_id) REFERENCES cat_provinces(id),
    ADD CONSTRAINT fk_organizations_district FOREIGN KEY (district_id) REFERENCES cat_districts(id),
    ADD CONSTRAINT fk_organizations_commune FOREIGN KEY (commune_id) REFERENCES cat_communes(id),
    ADD CONSTRAINT fk_organizations_district_province FOREIGN KEY (district_id, province_id)
        REFERENCES cat_districts(id, province_id),
    ADD CONSTRAINT fk_organizations_commune_district FOREIGN KEY (commune_id, district_id)
        REFERENCES cat_communes(id, district_id);

-- [IDB-006 ACCEPTED] Parent level, cycle, and geography consistency cannot
-- be expressed completely with row-local CHECK constraints.
CREATE OR REPLACE FUNCTION validate_organization_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    parent_row organizations%ROWTYPE;
BEGIN
    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'An organization cannot be its own parent';
    END IF;

    IF NEW.level = 1 THEN
        IF NEW.parent_id IS NOT NULL OR NEW.district_id IS NOT NULL OR NEW.commune_id IS NOT NULL THEN
            RAISE EXCEPTION 'Province-level organizations cannot have a parent, district, or commune';
        END IF;
        RETURN NEW;
    END IF;

    SELECT * INTO parent_row FROM organizations WHERE id = NEW.parent_id;
    IF NOT FOUND OR parent_row.level <> NEW.level - 1 THEN
        RAISE EXCEPTION 'Organization parent must be exactly one administrative level higher';
    END IF;

    IF NEW.level = 2 AND (
        NEW.province_id IS NULL OR
        parent_row.province_id IS DISTINCT FROM NEW.province_id OR
        NEW.district_id IS NULL OR NEW.commune_id IS NOT NULL
    ) THEN
        RAISE EXCEPTION 'District organization geography must match its province parent';
    END IF;

    IF NEW.level = 3 AND (
        NEW.province_id IS NULL OR NEW.district_id IS NULL OR NEW.commune_id IS NULL OR
        parent_row.province_id IS DISTINCT FROM NEW.province_id OR
        parent_row.district_id IS DISTINCT FROM NEW.district_id
    ) THEN
        RAISE EXCEPTION 'Commune organization geography must match its district parent';
    END IF;

    IF EXISTS (
        WITH RECURSIVE ancestors AS (
            SELECT id, parent_id FROM organizations WHERE id = NEW.parent_id
            UNION ALL
            SELECT o.id, o.parent_id
            FROM organizations o
            JOIN ancestors a ON o.id = a.parent_id
        )
        SELECT 1 FROM ancestors WHERE id = NEW.id
    ) THEN
        RAISE EXCEPTION 'Organization hierarchy cycle detected';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_organization_hierarchy
BEFORE INSERT OR UPDATE OF parent_id, level, province_id, district_id, commune_id
ON organizations
FOR EACH ROW EXECUTE FUNCTION validate_organization_hierarchy();

-- Self-referencing hierarchy: Nhóm chính (level 1) → Nhóm phụ (level 2)
CREATE TABLE cat_product_groups (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    parent_id                UUID         NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    -- 1=Nhóm chính, 2=Nhóm phụ
    level                    SMALLINT     NOT NULL DEFAULT 1,
    description              TEXT         NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_product_groups PRIMARY KEY (id),
    CONSTRAINT uq_cat_product_groups_code UNIQUE (code),
    CONSTRAINT fk_cat_product_groups_parent FOREIGN KEY (parent_id) REFERENCES cat_product_groups(id),
    CONSTRAINT chk_cat_product_groups_level CHECK (level IN (1, 2))
);

CREATE TABLE cat_business_types (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    description              TEXT         NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_business_types PRIMARY KEY (id),
    CONSTRAINT uq_cat_business_types_code UNIQUE (code)
);

CREATE TABLE cat_business_classifications (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    criteria                 TEXT         NULL,        -- Tiêu chí phân loại
    -- 1=Cao (High risk), 2=Vừa (Medium), 3=Thấp (Low)
    risk_level               SMALLINT     NOT NULL DEFAULT 2,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_business_classifications PRIMARY KEY (id),
    CONSTRAINT uq_cat_business_classifications_code UNIQUE (code),
    CONSTRAINT chk_cat_bc_risk_level CHECK (risk_level IN (1, 2, 3))
);

CREATE TABLE cat_advertisement_types (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    description              TEXT         NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_advertisement_types PRIMARY KEY (id),
    CONSTRAINT uq_cat_advertisement_types_code UNIQUE (code)
);

CREATE TABLE cat_document_types (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_document_types PRIMARY KEY (id),
    CONSTRAINT uq_cat_document_types_code UNIQUE (code)
);

-- Cơ sở kiểm nghiệm được chỉ định (ISO 17025 accredited)
CREATE TABLE cat_testing_centers (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(300) NOT NULL,
    -- Address (embedded value object)
    address_street           TEXT         NULL,
    address_commune_id       UUID         NULL,
    address_district_id      UUID         NULL,
    address_province_id      UUID         NULL,
    -- Contact
    phone                    VARCHAR(50)  NULL,
    fax                      VARCHAR(50)  NULL,
    email                    VARCHAR(200) NULL,
    website                  VARCHAR(500) NULL,
    -- Accreditation
    accreditation_number     VARCHAR(100) NULL,        -- Số chứng chỉ ISO 17025
    accreditation_scope      TEXT         NULL,        -- Phạm vi kiểm nghiệm được công nhận
    accreditation_expiry     DATE         NULL,        -- Ngày hết hạn chứng nhận
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    -- ABP Audit
    extra_properties         JSONB        NULL,
    concurrency_stamp        VARCHAR(40)  NULL,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    deletion_time            TIMESTAMPTZ  NULL,
    deleter_id               UUID         NULL,
    CONSTRAINT pk_cat_testing_centers PRIMARY KEY (id),
    CONSTRAINT uq_cat_testing_centers_code UNIQUE (code),
    CONSTRAINT chk_ctc_address_chain CHECK (
        (address_commune_id IS NULL OR address_district_id IS NOT NULL) AND
        (address_district_id IS NULL OR address_province_id IS NOT NULL)
    )
);

-- Dịch vụ kiểm nghiệm của từng cơ sở
CREATE TABLE cat_testing_services (
    id                       UUID          NOT NULL DEFAULT uuid_generate_v4(),
    testing_center_id        UUID          NOT NULL,
    code                     VARCHAR(50)   NOT NULL,
    name                     VARCHAR(300)  NOT NULL,
    unit                     VARCHAR(50)   NULL,       -- Đơn vị kiểm nghiệm
    method                   VARCHAR(200)  NULL,       -- Phương pháp (TCVN/ISO)
    unit_price               NUMERIC(18,2) NULL,       -- Đơn giá (VND)
    turnaround_days          INT           NULL,       -- Thời gian trả kết quả (ngày)
    is_active                BOOL          NOT NULL DEFAULT TRUE,
    creation_time            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id               UUID          NULL,
    last_modification_time   TIMESTAMPTZ   NULL,
    last_modifier_id         UUID          NULL,
    is_deleted               BOOL          NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_testing_services PRIMARY KEY (id),
    CONSTRAINT uq_cat_testing_services_code UNIQUE (testing_center_id, code),
    CONSTRAINT uq_cat_testing_services_id_center UNIQUE (id, testing_center_id),
    CONSTRAINT fk_cat_testing_services_center FOREIGN KEY (testing_center_id) REFERENCES cat_testing_centers(id)
);
CREATE INDEX idx_cat_testing_services_center ON cat_testing_services(testing_center_id) WHERE is_deleted = FALSE;

-- [D-01 FIX] cat_testing_centers geographic column FKs (forward-reference to cat_communes/districts/provinces)
ALTER TABLE cat_testing_centers
    ADD CONSTRAINT fk_ctc_commune FOREIGN KEY (address_commune_id) REFERENCES cat_communes(id);
ALTER TABLE cat_testing_centers
    ADD CONSTRAINT fk_ctc_district FOREIGN KEY (address_district_id) REFERENCES cat_districts(id);
ALTER TABLE cat_testing_centers
    ADD CONSTRAINT fk_ctc_province FOREIGN KEY (address_province_id) REFERENCES cat_provinces(id);
ALTER TABLE cat_testing_centers
    ADD CONSTRAINT fk_ctc_district_province FOREIGN KEY (address_district_id, address_province_id)
        REFERENCES cat_districts(id, province_id),
    ADD CONSTRAINT fk_ctc_commune_district FOREIGN KEY (address_commune_id, address_district_id)
        REFERENCES cat_communes(id, district_id);

-- ============================================================
-- SECTION 4: BUSINESS MANAGEMENT MODULE
-- ============================================================

-- Cơ sở sản xuất kinh doanh thực phẩm
CREATE TABLE businesses (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,   -- Đơn vị quản lý (data scope)
    code                         VARCHAR(50)   NULL,       -- Mã cơ sở (nội bộ)
    name                         VARCHAR(500)  NOT NULL,
    business_type_id             UUID          NULL,
    business_classification_id   UUID          NULL,       -- Phân loại nguy cơ
    tax_code                     VARCHAR(50)   NULL,       -- Mã số thuế (MST)
    representative_name          VARCHAR(200)  NULL,       -- Chủ cơ sở / người đại diện pháp luật
    representative_id_card       VARCHAR(50)   NULL,       -- CMND/CCCD chủ cơ sở [SENSITIVE]
    -- Contact info (ContactInfo value object)
    contact_phone                VARCHAR(50)   NULL,
    contact_email                VARCHAR(200)  NULL,
    contact_website              VARCHAR(500)  NULL,
    -- Address (Address value object embedded)
    address_street               TEXT          NULL,
    address_commune_id           UUID          NULL,
    address_district_id          UUID          NULL,
    address_province_id          UUID          NULL,
    address_latitude             FLOAT8        NULL,       -- GPS for Leaflet.js map
    address_longitude            FLOAT8        NULL,
    -- Status
    -- 1=Active, 2=Inactive, 3=Suspended
    status                       SMALLINT      NOT NULL DEFAULT 1,
    suspension_reason            TEXT          NULL,       -- Required when status=3
    suspended_at                 TIMESTAMPTZ   NULL,
    has_eligibility_certificate  BOOL          NOT NULL DEFAULT FALSE,  -- Denormalized cache
    has_vsattp_commitment        BOOL          NOT NULL DEFAULT FALSE,  -- Cam kết ATTP
    -- Other business info
    established_date             DATE          NULL,
    employee_count               INT           NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_businesses PRIMARY KEY (id),
    CONSTRAINT fk_businesses_organization FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_businesses_type FOREIGN KEY (business_type_id) REFERENCES cat_business_types(id),
    CONSTRAINT fk_businesses_classification FOREIGN KEY (business_classification_id) REFERENCES cat_business_classifications(id),
    CONSTRAINT fk_businesses_commune FOREIGN KEY (address_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT fk_businesses_district FOREIGN KEY (address_district_id) REFERENCES cat_districts(id),
    CONSTRAINT fk_businesses_province FOREIGN KEY (address_province_id) REFERENCES cat_provinces(id),
    CONSTRAINT fk_businesses_district_province FOREIGN KEY (address_district_id, address_province_id)
        REFERENCES cat_districts(id, province_id),
    CONSTRAINT fk_businesses_commune_district FOREIGN KEY (address_commune_id, address_district_id)
        REFERENCES cat_communes(id, district_id),
    CONSTRAINT chk_businesses_status CHECK (status IN (1, 2, 3)),
    CONSTRAINT chk_businesses_address_chain CHECK (
        (address_commune_id IS NULL OR address_district_id IS NOT NULL) AND
        (address_district_id IS NULL OR address_province_id IS NOT NULL)
    ),
    CONSTRAINT chk_businesses_coordinates CHECK (
        (address_latitude IS NULL AND address_longitude IS NULL) OR
        (address_latitude BETWEEN -90 AND 90 AND address_longitude BETWEEN -180 AND 180)
    ),
    -- [RT-M1 FIX] Suspended businesses (status=3) must have suspension_reason
    CONSTRAINT chk_businesses_suspension CHECK (status != 3 OR suspension_reason IS NOT NULL)
);
ALTER TABLE businesses ADD CONSTRAINT uq_businesses_id_org UNIQUE (id, organization_id);
CREATE UNIQUE INDEX uq_businesses_code ON businesses(code)
    WHERE code IS NOT NULL AND is_deleted = FALSE;
-- [H-06 FIX] Unique tax code for active businesses (một MST chỉ một cơ sở hoạt động)
CREATE UNIQUE INDEX uq_businesses_tax_code ON businesses(tax_code)
    WHERE tax_code IS NOT NULL AND is_deleted = FALSE AND status != 2;
CREATE INDEX idx_businesses_org_id ON businesses(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_type ON businesses(business_type_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_classification ON businesses(business_classification_id)
    WHERE business_classification_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_businesses_status ON businesses(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_tax_code ON businesses(tax_code) WHERE tax_code IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_location ON businesses(address_latitude, address_longitude)
    WHERE address_latitude IS NOT NULL AND address_longitude IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_businesses_commune ON businesses(address_commune_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_district ON businesses(address_district_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_province ON businesses(address_province_id) WHERE is_deleted = FALSE;

-- Nhóm sản phẩm của cơ sở (M2M)
CREATE TABLE business_product_groups (
    business_id      UUID NOT NULL,
    product_group_id UUID NOT NULL,
    CONSTRAINT pk_business_product_groups PRIMARY KEY (business_id, product_group_id),
    CONSTRAINT fk_bpg_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    CONSTRAINT fk_bpg_product_group FOREIGN KEY (product_group_id) REFERENCES cat_product_groups(id)
);
CREATE INDEX idx_bpg_product_group ON business_product_groups(product_group_id);

-- Người trực tiếp kinh doanh (food handlers)
-- Phải có chứng nhận tập huấn ATTP và giấy khám sức khỏe
CREATE TABLE business_handlers (
    id                               UUID         NOT NULL DEFAULT uuid_generate_v4(),
    business_id                      UUID         NOT NULL,
    full_name                        VARCHAR(200) NOT NULL,
    position                         VARCHAR(200) NULL,       -- Chức vụ
    id_card_number                   VARCHAR(50)  NULL,       -- CMND/CCCD [SENSITIVE]
    -- Chứng nhận tập huấn ATTP (TrainingCertificate value object)
    training_certificate_number      VARCHAR(100) NULL,
    training_date                    DATE         NULL,
    training_organization            VARCHAR(300) NULL,
    training_expiry_date             DATE         NULL,
    -- Giấy khám sức khỏe (HealthCertificate value object)
    health_certificate_number        VARCHAR(100) NULL,
    health_check_date                DATE         NULL,
    health_check_facility            VARCHAR(300) NULL,
    health_check_expiry_date         DATE         NULL,
    is_active                        BOOL         NOT NULL DEFAULT TRUE,
    notes                            TEXT         NULL,
    creation_time                    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id                       UUID         NULL,
    last_modification_time           TIMESTAMPTZ  NULL,
    last_modifier_id                 UUID         NULL,
    is_deleted                       BOOL         NOT NULL DEFAULT FALSE,
    -- [NEW ABP FIX] business_handlers was missing ISoftDelete deletion_time + deleter_id
    deletion_time                    TIMESTAMPTZ  NULL,
    deleter_id                       UUID         NULL,
    -- [I-01 FIX] Certificate date ordering
    CONSTRAINT chk_bh_training_dates CHECK (
        training_date IS NULL OR training_expiry_date IS NULL OR
        training_date <= training_expiry_date
    ),
    CONSTRAINT chk_bh_health_dates CHECK (
        health_check_date IS NULL OR health_check_expiry_date IS NULL OR
        health_check_date <= health_check_expiry_date
    ),
    CONSTRAINT pk_business_handlers PRIMARY KEY (id),
    CONSTRAINT fk_business_handlers_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE INDEX idx_business_handlers_business ON business_handlers(business_id) WHERE is_deleted = FALSE;
-- Index to find handlers with expiring certificates
CREATE INDEX idx_business_handlers_training_expiry ON business_handlers(training_expiry_date)
    WHERE training_expiry_date IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_business_handlers_health_expiry ON business_handlers(health_check_expiry_date)
    WHERE health_check_expiry_date IS NOT NULL AND is_deleted = FALSE;

-- Sản phẩm thực phẩm
CREATE TABLE products (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,   -- Denormalized for data scope queries
    code                         VARCHAR(50)   NULL,
    name                         VARCHAR(500)  NOT NULL,
    product_group_id             UUID          NULL,
    brand_name                   VARCHAR(200)  NULL,
    manufacturer                 VARCHAR(300)  NULL,
    manufacturing_country_id     UUID          NULL,
    net_weight                   VARCHAR(100)  NULL,
    specifications               TEXT          NULL,       -- Thông số kỹ thuật
    ingredients                  TEXT          NULL,       -- Thành phần nguyên liệu
    expiry_period_months         INT           NULL,       -- Hạn sử dụng (tháng)
    storage_conditions           TEXT          NULL,       -- Điều kiện bảo quản
    usage_instructions           TEXT          NULL,       -- Hướng dẫn sử dụng
    -- 1=Active, 2=Inactive (ngừng kinh doanh)
    status                       SMALLINT      NOT NULL DEFAULT 1,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_products PRIMARY KEY (id),
    CONSTRAINT fk_products_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_products_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_products_group FOREIGN KEY (product_group_id) REFERENCES cat_product_groups(id),
    CONSTRAINT fk_products_country FOREIGN KEY (manufacturing_country_id) REFERENCES cat_countries(id),
    CONSTRAINT chk_products_status CHECK (status IN (1, 2))
);
ALTER TABLE products
    ADD CONSTRAINT uq_products_id_business_org UNIQUE (id, business_id, organization_id);
CREATE INDEX idx_products_business ON products(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_org ON products(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_group ON products(product_group_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops) WHERE is_deleted = FALSE;

-- Complete forward references for management focal-point scopes.
ALTER TABLE management_scope_assignments
    ADD CONSTRAINT fk_msa_province FOREIGN KEY (province_id) REFERENCES cat_provinces(id),
    ADD CONSTRAINT fk_msa_district FOREIGN KEY (district_id) REFERENCES cat_districts(id),
    ADD CONSTRAINT fk_msa_commune FOREIGN KEY (commune_id) REFERENCES cat_communes(id),
    ADD CONSTRAINT fk_msa_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    ADD CONSTRAINT fk_msa_business_type FOREIGN KEY (business_type_id) REFERENCES cat_business_types(id),
    ADD CONSTRAINT fk_msa_product_group FOREIGN KEY (product_group_id) REFERENCES cat_product_groups(id);

-- Tự công bố sản phẩm (Nghị định 15/2018)
CREATE TABLE self_declarations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,       -- Liên kết sản phẩm trong hệ thống (nếu có)
    organization_id              UUID          NOT NULL,
    declaration_number           VARCHAR(100)  NOT NULL,   -- Số giấy tự công bố
    declaration_date             DATE          NOT NULL,
    product_name                 VARCHAR(500)  NOT NULL,
    manufacturer                 VARCHAR(300)  NULL,
    purpose                      VARCHAR(200)  NULL,       -- Mục đích sử dụng
    expiry_date                  DATE          NULL,
    -- 1=Active (còn hiệu lực), 2=Expired (hết hạn), 3=Revoked (đã thu hồi)
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_self_declarations PRIMARY KEY (id),
    CONSTRAINT fk_self_declarations_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_self_declarations_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id),
    CONSTRAINT fk_self_declarations_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_self_declarations_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_self_declarations_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [RT-M3 FIX] Effective date must not be after expiry date
    CONSTRAINT chk_self_declarations_dates CHECK (declaration_date IS NULL OR expiry_date IS NULL OR declaration_date <= expiry_date)
);
-- [C-03 FIX] Declaration number must be unique (government-issued numbers are system-wide unique)
-- [T-01 FIX] Self-declaration numbers are business-controlled, not nationally unique
-- Scope uniqueness to (business_id, declaration_number) not globally
CREATE UNIQUE INDEX uq_self_declarations_number ON self_declarations(business_id, declaration_number);
CREATE INDEX idx_self_declarations_business ON self_declarations(business_id) WHERE is_deleted = FALSE;
-- [Q-01 FIX] Index FK column product_id (join from products to self_declarations)
CREATE INDEX idx_self_declarations_product ON self_declarations(product_id) WHERE product_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_self_declarations_status_expiry ON self_declarations(status, expiry_date) WHERE is_deleted = FALSE;
CREATE INDEX idx_self_declarations_org ON self_declarations(organization_id) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 5: LICENSING MODULE
-- ============================================================

-- Đăng ký công bố sản phẩm (DKCB) — product registration declarations
CREATE TABLE product_registrations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    registration_number          VARCHAR(100)  NOT NULL,   -- Số đăng ký
    receipt_number               VARCHAR(100)  NULL,       -- Số tiếp nhận
    registration_date            DATE          NOT NULL,
    receipt_date                 DATE          NULL,
    expiry_date                  DATE          NULL,
    product_name                 VARCHAR(500)  NOT NULL,
    manufacturer                 VARCHAR(300)  NULL,
    certifying_authority         VARCHAR(200)  NULL,       -- Cơ quan cấp
    -- 1=Active, 2=Expired, 3=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_product_registrations PRIMARY KEY (id),
    CONSTRAINT fk_product_reg_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_product_reg_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id),
    CONSTRAINT fk_product_reg_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_product_reg_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_product_reg_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [H-01 FIX] Registration date must not be after expiry date
    CONSTRAINT chk_product_reg_dates CHECK (expiry_date IS NULL OR registration_date <= expiry_date)
);
-- [C-02 FIX] Registration number is unique per government issuance
CREATE UNIQUE INDEX uq_product_registrations_number ON product_registrations(registration_number);
CREATE INDEX idx_product_registrations_business ON product_registrations(business_id) WHERE is_deleted = FALSE;
-- [Q-01 FIX] Index FK column product_id
CREATE INDEX idx_product_registrations_product ON product_registrations(product_id) WHERE product_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_product_registrations_expiry ON product_registrations(expiry_date, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_product_registrations_org ON product_registrations(organization_id) WHERE is_deleted = FALSE;

-- Đăng ký nội dung quảng cáo thực phẩm (DDK Quảng cáo)
CREATE TABLE advertisement_registrations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    advertisement_type_id        UUID          NULL,
    registration_number          VARCHAR(100)  NOT NULL,
    registration_date            DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    content_description          TEXT          NULL,       -- Mô tả nội dung QC
    medium                       VARCHAR(200)  NULL,       -- Phương tiện QC (TV, Radio...)
    -- 1=Active, 2=Expired, 3=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_advertisement_registrations PRIMARY KEY (id),
    CONSTRAINT fk_ad_reg_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_ad_reg_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_ad_reg_type FOREIGN KEY (advertisement_type_id) REFERENCES cat_advertisement_types(id),
    CONSTRAINT chk_ad_reg_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_ad_reg_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [H-02 FIX] Registration date must not be after expiry date
    CONSTRAINT chk_ad_reg_dates CHECK (expiry_date IS NULL OR registration_date <= expiry_date)
);
ALTER TABLE advertisement_registrations
    ADD CONSTRAINT uq_ad_reg_id_business_org UNIQUE (id, business_id, organization_id);
CREATE UNIQUE INDEX uq_advertisement_registrations_number ON advertisement_registrations(registration_number);
CREATE INDEX idx_ad_reg_business ON advertisement_registrations(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_ad_reg_org ON advertisement_registrations(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_ad_reg_expiry ON advertisement_registrations(expiry_date, status) WHERE is_deleted = FALSE;

-- Sản phẩm trong đăng ký quảng cáo (M2M)
CREATE TABLE advertisement_registration_products (
    advertisement_registration_id UUID NOT NULL,
    product_id                    UUID NOT NULL,
    business_id                   UUID NOT NULL,
    organization_id               UUID NOT NULL,
    CONSTRAINT pk_ad_reg_products PRIMARY KEY (advertisement_registration_id, product_id),
    CONSTRAINT fk_arp_ad_reg_owner FOREIGN KEY (advertisement_registration_id, business_id, organization_id)
        REFERENCES advertisement_registrations(id, business_id, organization_id) ON DELETE CASCADE,
    CONSTRAINT fk_arp_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id)
);
CREATE INDEX idx_arp_product ON advertisement_registration_products(product_id);

-- Giấy xác nhận cơ sở đủ điều kiện ATTP (DDK — Điều kiện kinh doanh)
CREATE TABLE eligibility_certificates (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    certificate_number           VARCHAR(100)  NOT NULL,
    issue_date                   DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    certifying_authority         VARCHAR(200)  NULL,
    certification_scope          TEXT          NULL,       -- Phạm vi chứng nhận
    -- 1=Active, 2=Expired, 3=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_eligibility_certificates PRIMARY KEY (id),
    CONSTRAINT fk_elic_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_elic_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_elic_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_elic_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [RT-M3 FIX] Issue date must not be after expiry date
    CONSTRAINT chk_elic_dates CHECK (issue_date IS NULL OR expiry_date IS NULL OR issue_date <= expiry_date)
);
-- [C-04 FIX] Certificate number is unique per government issuance
CREATE UNIQUE INDEX uq_eligibility_certificates_number ON eligibility_certificates(certificate_number);
CREATE INDEX idx_eligibility_certificates_business ON eligibility_certificates(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_eligibility_certificates_expiry ON eligibility_certificates(expiry_date, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_eligibility_certificates_org ON eligibility_certificates(organization_id) WHERE is_deleted = FALSE;

-- Giấy chứng nhận lưu hành tự do (CFS — Certificate of Free Sale)
CREATE TABLE cfs_certificates (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    certificate_number           VARCHAR(100)  NOT NULL,
    issue_date                   DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    destination_country_id       UUID          NULL,       -- Quốc gia nhập khẩu
    -- 1=Active, 2=Expired, 3=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_cfs_certificates PRIMARY KEY (id),
    CONSTRAINT fk_cfs_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_cfs_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id),
    CONSTRAINT fk_cfs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_cfs_country FOREIGN KEY (destination_country_id) REFERENCES cat_countries(id),
    CONSTRAINT chk_cfs_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_cfs_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [RT-M3 FIX] Issue date must not be after expiry date
    CONSTRAINT chk_cfs_dates CHECK (issue_date IS NULL OR expiry_date IS NULL OR issue_date <= expiry_date)
);
-- [C-04 FIX] Certificate number must be unique
CREATE UNIQUE INDEX uq_cfs_certificates_number ON cfs_certificates(certificate_number);
CREATE INDEX idx_cfs_business ON cfs_certificates(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_cfs_org ON cfs_certificates(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_cfs_expiry ON cfs_certificates(expiry_date, status) WHERE is_deleted = FALSE;

-- Giấy chứng nhận thực phẩm xuất khẩu
CREATE TABLE export_food_certificates (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    certificate_number           VARCHAR(100)  NOT NULL,
    issue_date                   DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    destination_country_id       UUID          NULL,
    lot_number                   VARCHAR(100)  NULL,       -- Số lô hàng
    quantity                     NUMERIC(18,3) NULL,
    quantity_unit                VARCHAR(50)   NULL,       -- Đơn vị (tấn, kg, thùng...)
    -- 1=Active, 2=Expired, 3=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
    revoked_by_id                UUID          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_export_food_certificates PRIMARY KEY (id),
    CONSTRAINT fk_efc_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_efc_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id),
    CONSTRAINT fk_efc_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_efc_country FOREIGN KEY (destination_country_id) REFERENCES cat_countries(id),
    CONSTRAINT chk_efc_status CHECK (status IN (1, 2, 3)),
    -- [E-05 FIX] Revoked status requires revoke_reason
    CONSTRAINT chk_efc_revoke CHECK (
        status != 3 OR (revoke_reason IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by_id IS NOT NULL)
    ),
    -- [RT-M3 FIX] Issue date must not be after expiry date
    CONSTRAINT chk_efc_dates CHECK (issue_date IS NULL OR expiry_date IS NULL OR issue_date <= expiry_date)
);
-- [C-04 FIX] Certificate number must be unique
CREATE UNIQUE INDEX uq_export_food_certificates_number ON export_food_certificates(certificate_number);
CREATE INDEX idx_efc_business ON export_food_certificates(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_efc_org ON export_food_certificates(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_efc_expiry ON export_food_certificates(expiry_date, status) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 6: INSPECTION MODULE
-- ============================================================

-- Kế hoạch thanh kiểm tra định kỳ / đột xuất
CREATE TABLE inspection_plans (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    plan_code                    VARCHAR(50)   NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    -- 1=Annual, 2=Periodic, 3=Irregular, 4=FollowUp
    plan_type                    SMALLINT      NOT NULL,
    year                         INT           NOT NULL,
    start_date                   DATE          NULL,
    end_date                     DATE          NULL,
    description                  TEXT          NULL,
    objectives                   TEXT          NULL,
    -- 1=Draft, 2=Submitted, 3=Approved, 4=InProgress, 5=Completed, 6=Cancelled
    status                       SMALLINT      NOT NULL DEFAULT 1,
    -- [RT-H7 FIX] Submission tracking (Draft -> Submitted)
    submitted_by_id              UUID          NULL,
    submitted_at                 TIMESTAMPTZ   NULL,
    -- Approval fields
    approved_by_id               UUID          NULL,
    approved_at                  TIMESTAMPTZ   NULL,
    -- [H-07 FIX] Rejection fields (Submitted → Draft via Reject)
    rejected_by_id               UUID          NULL,
    rejected_at                  TIMESTAMPTZ   NULL,
    rejected_reason              TEXT          NULL,
    -- Cancellation
    cancelled_by_id              UUID          NULL,
    cancelled_at                 TIMESTAMPTZ   NULL,
    cancelled_reason             TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_inspection_plans PRIMARY KEY (id),
    -- [B-03 FIX] Inline UNIQUE removed; partial index handles soft-delete-safe uniqueness
    CONSTRAINT fk_plans_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_inspection_plans_type CHECK (plan_type IN (1, 2, 3, 4)),
    CONSTRAINT chk_inspection_plans_status CHECK (status IN (1, 2, 3, 4, 5, 6)),
    CONSTRAINT chk_inspection_plan_submission CHECK (
        (status = 1) OR (submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)
    ),
    CONSTRAINT chk_inspection_plan_approval CHECK (
        status NOT IN (3, 4, 5) OR (approved_by_id IS NOT NULL AND approved_at IS NOT NULL)
    ),
    CONSTRAINT chk_inspection_plan_cancellation CHECK (
        status <> 6 OR (cancelled_by_id IS NOT NULL AND cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL)
    ),
    -- [RT-M2 FIX] Start must not be after end
    CONSTRAINT chk_inspection_plans_dates CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
);
-- [B-03 FIX] Partial unique index replaces the removed inline UNIQUE constraint
CREATE UNIQUE INDEX uq_inspection_plans_code ON inspection_plans(plan_code, organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_plans_org ON inspection_plans(organization_id, year) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_plans_status ON inspection_plans(status) WHERE is_deleted = FALSE;

-- Chi tiết cơ sở trong kế hoạch thanh kiểm tra
CREATE TABLE inspection_plan_items (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    plan_id                      UUID          NOT NULL,
    business_id                  UUID          NOT NULL,
    sequence_number              INT           NOT NULL DEFAULT 0,
    planned_date                 DATE          NULL,
    assigned_inspector_id        UUID          NULL,       -- AbpUsers.Id (primary inspector)
    -- 1=Pending, 2=InProgress, 3=Completed, 4=Skipped
    status                       SMALLINT      NOT NULL DEFAULT 1,
    notes                        TEXT          NULL,
    CONSTRAINT pk_inspection_plan_items PRIMARY KEY (id),
    CONSTRAINT fk_ipi_plan FOREIGN KEY (plan_id) REFERENCES inspection_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipi_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    -- [H-04 FIX] Each business can only appear once per plan
    CONSTRAINT uq_ipi_plan_business UNIQUE (plan_id, business_id),
    CONSTRAINT uq_ipi_id_plan_business UNIQUE (id, plan_id, business_id),
    CONSTRAINT chk_ipi_status CHECK (status IN (1, 2, 3, 4))
);
CREATE INDEX idx_inspection_plan_items_business ON inspection_plan_items(business_id);

-- Kết quả thanh kiểm tra từng cơ sở
CREATE TABLE inspection_results (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    plan_id                      UUID          NULL,       -- NULL nếu thanh tra đột xuất
    plan_item_id                 UUID          NULL,
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    inspection_date              DATE          NOT NULL,
    -- 1=Scheduled (định kỳ), 2=Unscheduled (đột xuất), 3=FollowUp (hậu kiểm), 4=Emergency
    inspection_type              SMALLINT      NOT NULL,
    team_leader                  VARCHAR(200)  NULL,       -- Trưởng đoàn
    team_members_text            TEXT          NULL,       -- Danh sách thành viên (text)
    -- 1=Pass (Đạt), 2=Fail (Không đạt), 3=ConditionalPass (Đạt có điều kiện)
    overall_result               SMALLINT      NOT NULL,
    has_violation                BOOL          NOT NULL DEFAULT FALSE,
    violation_description        TEXT          NULL,
    fine_amount                  NUMERIC(18,2) NULL,       -- Tổng tiền phạt (VND)
    fine_currency                VARCHAR(3)    NOT NULL DEFAULT 'VND',
    admin_decision_number        VARCHAR(100)  NULL,       -- Số quyết định xử phạt
    admin_decision_date          DATE          NULL,
    follow_up_required           BOOL          NOT NULL DEFAULT FALSE,
    follow_up_date               DATE          NULL,
    -- 1=Passed (khắc phục đạt), 2=StillFailed (vẫn chưa đạt)
    follow_up_result             SMALLINT      NULL,
    recommendations              TEXT          NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_inspection_results PRIMARY KEY (id),
    CONSTRAINT fk_ir_plan FOREIGN KEY (plan_id) REFERENCES inspection_plans(id),
    CONSTRAINT fk_ir_plan_item_tuple FOREIGN KEY (plan_item_id, plan_id, business_id)
        REFERENCES inspection_plan_items(id, plan_id, business_id),
    CONSTRAINT fk_ir_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_ir_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ir_type CHECK (inspection_type IN (1, 2, 3, 4)),
    CONSTRAINT chk_ir_result CHECK (overall_result IN (1, 2, 3)),
    CONSTRAINT chk_ir_plan_tuple CHECK (
        (plan_item_id IS NULL AND plan_id IS NULL) OR
        (plan_item_id IS NOT NULL AND plan_id IS NOT NULL)
    )
);
CREATE UNIQUE INDEX uq_inspection_results_primary_plan_item ON inspection_results(plan_item_id)
    WHERE plan_item_id IS NOT NULL AND inspection_type <> 3 AND is_deleted = FALSE;
CREATE INDEX idx_inspection_results_business ON inspection_results(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_results_date ON inspection_results(inspection_date) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_results_org ON inspection_results(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_results_plan ON inspection_results(plan_id) WHERE plan_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_inspection_results_plan_item ON inspection_results(plan_item_id)
    WHERE plan_item_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_inspection_results_violation ON inspection_results(has_violation) WHERE has_violation = TRUE AND is_deleted = FALSE;

-- [C-05 NEW TABLE] Inspectors per inspection result (replaces inspector_ids UUID[])
-- Allows proper FK to AbpUsers and query by inspector
CREATE TABLE inspection_result_inspectors (
    inspection_result_id     UUID     NOT NULL,
    user_id                  UUID     NOT NULL,   -- AbpUsers.Id
    is_team_leader           BOOL     NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_inspection_result_inspectors PRIMARY KEY (inspection_result_id, user_id),
    CONSTRAINT fk_iri_result FOREIGN KEY (inspection_result_id) REFERENCES inspection_results(id) ON DELETE CASCADE
);
CREATE INDEX idx_iri_user ON inspection_result_inspectors(user_id);

-- Vi phạm chi tiết trong kết quả thanh kiểm tra
CREATE TABLE inspection_violations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    inspection_result_id         UUID          NOT NULL,
    violation_code               VARCHAR(50)   NULL,
    description                  TEXT          NOT NULL,
    regulation_reference         TEXT          NULL,       -- Số điều khoản vi phạm
    fine_amount                  NUMERIC(18,2) NULL,       -- Mức phạt cho vi phạm này
    remedy_required              TEXT          NULL,       -- Yêu cầu khắc phục
    remedy_deadline              DATE          NULL,       -- Hạn khắc phục
    is_remedied                  BOOL          NOT NULL DEFAULT FALSE,
    remedied_at                  TIMESTAMPTZ   NULL,
    remedied_notes               TEXT          NULL,
    CONSTRAINT pk_inspection_violations PRIMARY KEY (id),
    CONSTRAINT fk_iv_inspection_result FOREIGN KEY (inspection_result_id) REFERENCES inspection_results(id) ON DELETE CASCADE
);
CREATE INDEX idx_inspection_violations_result ON inspection_violations(inspection_result_id);
CREATE INDEX idx_inspection_violations_remedied ON inspection_violations(is_remedied, remedy_deadline)
    WHERE is_remedied = FALSE AND remedy_deadline IS NOT NULL;

-- ============================================================
-- SECTION 7: FOOD POISONING MODULE
-- ============================================================

-- Vụ ngộ độc thực phẩm (many people, ≥2 from same source)
-- Declared BEFORE food_poisoning_cases so cases can reference it
CREATE TABLE food_poisoning_incidents (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    incident_code                VARCHAR(50)   NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    end_date                     TIMESTAMPTZ   NULL,
    -- Location (Address value object)
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    location_province_id         UUID          NULL,
    location_latitude            FLOAT8        NULL,
    location_longitude           FLOAT8        NULL,
    -- Food info
    suspected_food               TEXT          NULL,
    food_source                  VARCHAR(200)  NULL,       -- Nguồn thực phẩm
    food_service_type            VARCHAR(200)  NULL,       -- Loại hình (đám tiệc, bếp ăn tập thể...)
    -- Statistics (IncidentStatistics value object)
    exposed_count                INT           NOT NULL DEFAULT 0,   -- Số người phơi nhiễm
    affected_count               INT           NOT NULL DEFAULT 0,   -- Số mắc
    hospitalized_count           INT           NOT NULL DEFAULT 0,   -- Nhập viện
    death_count                  INT           NOT NULL DEFAULT 0,   -- Tử vong
    -- Investigation
    -- 1=Confirmed, 2=Probable, 3=Suspected, 4=Unknown
    cause_assessment             SMALLINT      NULL,
    causative_agent              VARCHAR(200)  NULL,       -- Tác nhân gây bệnh
    pathogen                     VARCHAR(200)  NULL,       -- Mầm bệnh cụ thể
    investigation_team           TEXT          NULL,
    control_measures             TEXT          NULL,
    prevention_measures          TEXT          NULL,
    conclusion                   TEXT          NULL,
    -- Workflow: 1=Draft, 2=Reported, 3=Verified, 4=Concluded
    status                       SMALLINT      NOT NULL DEFAULT 1,
    -- [G-02 FIX] Audit trail for Draft->Reported transition
    reported_by_id               UUID          NULL,
    reported_at                  TIMESTAMPTZ   NULL,
    verified_by_id               UUID          NULL,
    verified_at                  TIMESTAMPTZ   NULL,
    concluded_by_id              UUID          NULL,
    concluded_at                 TIMESTAMPTZ   NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_food_poisoning_incidents PRIMARY KEY (id),
    CONSTRAINT fk_fpi_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_fpi_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT chk_fpi_status CHECK (status IN (1, 2, 3, 4)),
    CONSTRAINT chk_fpi_cause CHECK (cause_assessment IS NULL OR cause_assessment IN (1, 2, 3, 4)),
    CONSTRAINT chk_fpi_counts CHECK (
        exposed_count >= 0 AND affected_count >= 0 AND
        hospitalized_count >= 0 AND death_count >= 0
    ),
    CONSTRAINT chk_fpi_address_chain CHECK (
        (location_commune_id IS NULL OR location_district_id IS NOT NULL) AND
        (location_district_id IS NULL OR location_province_id IS NOT NULL)
    ),
    CONSTRAINT chk_fpi_coordinates CHECK (
        (location_latitude IS NULL AND location_longitude IS NULL) OR
        (location_latitude BETWEEN -90 AND 90 AND location_longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT chk_fpi_report_evidence CHECK (
        status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)
    ),
    CONSTRAINT chk_fpi_verify_evidence CHECK (
        status NOT IN (3, 4) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_fpi_conclude_evidence CHECK (
        status <> 4 OR (concluded_by_id IS NOT NULL AND concluded_at IS NOT NULL)
    )
);
CREATE INDEX idx_fpi_org ON food_poisoning_incidents(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpi_date ON food_poisoning_incidents(occurrence_date) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpi_status ON food_poisoning_incidents(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpi_location ON food_poisoning_incidents(location_latitude, location_longitude)
    WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX uq_fpi_incident_code ON food_poisoning_incidents(incident_code, organization_id) WHERE is_deleted = FALSE;
-- [Q-02 FIX] Indexes on geographic FK columns (district/province added via ALTER TABLE)
CREATE INDEX idx_fpi_district ON food_poisoning_incidents(location_district_id) WHERE location_district_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_fpi_province ON food_poisoning_incidents(location_province_id) WHERE location_province_id IS NOT NULL AND is_deleted = FALSE;

-- [RT-C5 FIX] food_poisoning_incidents missing FK constraints for district and province
ALTER TABLE food_poisoning_incidents
    ADD CONSTRAINT fk_fpi_district FOREIGN KEY (location_district_id) REFERENCES cat_districts(id),
    ADD CONSTRAINT fk_fpi_province FOREIGN KEY (location_province_id) REFERENCES cat_provinces(id),
    ADD CONSTRAINT fk_fpi_district_province FOREIGN KEY (location_district_id, location_province_id)
        REFERENCES cat_districts(id, province_id),
    ADD CONSTRAINT fk_fpi_commune_district FOREIGN KEY (location_commune_id, location_district_id)
        REFERENCES cat_communes(id, district_id);

-- Ca ngộ độc thực phẩm nhỏ lẻ (individual cases)
CREATE TABLE food_poisoning_cases (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    -- [H-05 FIX] Optional link to incident (case can be standalone or part of an incident)
    incident_id                  UUID          NULL,
    case_code                    VARCHAR(50)   NOT NULL,
    report_date                  DATE          NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    -- Location (Address value object)
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    location_province_id         UUID          NULL,
    location_latitude            FLOAT8        NULL,
    location_longitude           FLOAT8        NULL,
    -- Victim Info (VictimInfo value object) [SENSITIVE — PII]
    victim_name                  VARCHAR(200)  NULL,
    victim_age                   INT           NULL,
    -- 1=Male, 2=Female, 3=Other
    victim_gender                SMALLINT      NULL,
    victim_phone                 VARCHAR(50)   NULL,
    victim_address               TEXT          NULL,
    -- Food Info (FoodInfo value object)
    suspected_food               TEXT          NULL,
    food_source                  VARCHAR(200)  NULL,
    food_preparation_date        DATE          NULL,
    symptoms                     TEXT          NULL,
    onset_time                   TIMESTAMPTZ   NULL,
    -- Medical Info (MedicalInfo value object)
    medical_facility             VARCHAR(300)  NULL,
    treatment_start_date         DATE          NULL,
    -- 1=Recovered, 2=Hospitalized, 3=Deceased
    treatment_result             SMALLINT      NULL,
    -- Reporter Info (ReporterInfo value object)
    reporter_name                VARCHAR(200)  NULL,
    reporter_phone               VARCHAR(50)   NULL,
    reporter_organization        VARCHAR(300)  NULL,
    reporter_relation            VARCHAR(100)  NULL,
    -- Workflow: 1=Draft, 2=Reported, 3=Verified
    status                       SMALLINT      NOT NULL DEFAULT 1,
    -- [G-01 FIX] Audit trail for Draft->Reported transition
    reported_by_id               UUID          NULL,
    reported_at                  TIMESTAMPTZ   NULL,
    verified_by_id               UUID          NULL,
    verified_at                  TIMESTAMPTZ   NULL,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_food_poisoning_cases PRIMARY KEY (id),
    CONSTRAINT fk_fpc_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    -- [H-05 FIX] FK to incident
    CONSTRAINT fk_fpc_incident FOREIGN KEY (incident_id) REFERENCES food_poisoning_incidents(id),
    CONSTRAINT fk_fpc_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT fk_fpc_district FOREIGN KEY (location_district_id) REFERENCES cat_districts(id),
    CONSTRAINT chk_fpc_status CHECK (status IN (1, 2, 3)),
    CONSTRAINT chk_fpc_gender CHECK (victim_gender IS NULL OR victim_gender IN (1, 2, 3)),
    CONSTRAINT chk_fpc_result CHECK (treatment_result IS NULL OR treatment_result IN (1, 2, 3)),
    CONSTRAINT chk_fpc_address_chain CHECK (
        (location_commune_id IS NULL OR location_district_id IS NOT NULL) AND
        (location_district_id IS NULL OR location_province_id IS NOT NULL)
    ),
    CONSTRAINT chk_fpc_coordinates CHECK (
        (location_latitude IS NULL AND location_longitude IS NULL) OR
        (location_latitude BETWEEN -90 AND 90 AND location_longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT chk_fpc_report_evidence CHECK (
        status = 1 OR (reported_by_id IS NOT NULL AND reported_at IS NOT NULL)
    ),
    CONSTRAINT chk_fpc_verify_evidence CHECK (
        status <> 3 OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)
    )
);
CREATE INDEX idx_fpc_org ON food_poisoning_cases(organization_id) WHERE is_deleted = FALSE;
-- [Q-02 FIX] Index on location_province_id FK column (added via ALTER TABLE)
CREATE INDEX idx_fpc_province ON food_poisoning_cases(location_province_id) WHERE location_province_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_fpc_report_date ON food_poisoning_cases(report_date, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpc_incident ON food_poisoning_cases(incident_id) WHERE incident_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_fpc_location ON food_poisoning_cases(location_latitude, location_longitude)
    WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX uq_fpc_case_code ON food_poisoning_cases(case_code, organization_id) WHERE is_deleted = FALSE;

-- [RT-H2 FIX] food_poisoning_cases missing FK for location_province_id
ALTER TABLE food_poisoning_cases
    ADD CONSTRAINT fk_fpc_province FOREIGN KEY (location_province_id) REFERENCES cat_provinces(id),
    ADD CONSTRAINT fk_fpc_district_province FOREIGN KEY (location_district_id, location_province_id)
        REFERENCES cat_districts(id, province_id),
    ADD CONSTRAINT fk_fpc_commune_district FOREIGN KEY (location_commune_id, location_district_id)
        REFERENCES cat_communes(id, district_id);

-- Phiếu thông báo sai sót ca ngộ độc
-- Created only when case is Verified; tracks correction requests
CREATE TABLE poisoning_case_error_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    case_id                      UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_description            TEXT          NOT NULL,
    correction_request           TEXT          NOT NULL,
    -- 1=Pending, 2=Acknowledged, 3=Corrected
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    responded_by_id              UUID          NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_pcer PRIMARY KEY (id),
    CONSTRAINT fk_pcer_case FOREIGN KEY (case_id) REFERENCES food_poisoning_cases(id),
    CONSTRAINT fk_pcer_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_pcer_status CHECK (status IN (1, 2, 3))
);
CREATE INDEX idx_pcer_case ON poisoning_case_error_reports(case_id);

-- Phiếu thông báo sai sót vụ ngộ độc
CREATE TABLE poisoning_incident_error_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    incident_id                  UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_description            TEXT          NOT NULL,
    correction_request           TEXT          NOT NULL,
    -- 1=Pending, 2=Acknowledged, 3=Corrected
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    responded_by_id              UUID          NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_pier PRIMARY KEY (id),
    CONSTRAINT fk_pier_incident FOREIGN KEY (incident_id) REFERENCES food_poisoning_incidents(id),
    CONSTRAINT fk_pier_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_pier_status CHECK (status IN (1, 2, 3))
);
CREATE INDEX idx_pier_incident ON poisoning_incident_error_reports(incident_id);

-- ============================================================
-- SECTION 8: REPORTING MODULE
-- ============================================================

-- Báo cáo NĐTP hàng tháng (Ngộ độc thực phẩm)
CREATE TABLE ndtp_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    period_year                  INT           NOT NULL,
    period_month                 INT           NOT NULL,   -- 1-12
    -- Số liệu ca ngộ độc lẻ (auto-aggregated from food_poisoning_cases)
    case_count                   INT           NOT NULL DEFAULT 0,
    case_affected                INT           NOT NULL DEFAULT 0,
    case_hospitalized            INT           NOT NULL DEFAULT 0,
    case_deaths                  INT           NOT NULL DEFAULT 0,
    -- Số liệu vụ ngộ độc (auto-aggregated from food_poisoning_incidents)
    incident_count               INT           NOT NULL DEFAULT 0,
    incident_affected            INT           NOT NULL DEFAULT 0,
    incident_hospitalized        INT           NOT NULL DEFAULT 0,
    incident_deaths              INT           NOT NULL DEFAULT 0,
    -- Nội dung tường thuật
    prevention_activities        TEXT          NULL,
    risk_factors                 TEXT          NULL,
    recommendations              TEXT          NULL,
    notes                        TEXT          NULL,
    -- Report version tracking (incremented on each re-submission after Return)
    submission_version           SMALLINT      NOT NULL DEFAULT 1,
    -- Workflow: 1=Draft, 2=Submitted, 3=Verified, 4=Returned, 5=Completed
    status                       SMALLINT      NOT NULL DEFAULT 1,
    submitted_to_organization_id UUID          NULL,
    submitted_by_id              UUID          NULL,
    submitted_at                 TIMESTAMPTZ   NULL,
    verified_by_id               UUID          NULL,
    verified_at                  TIMESTAMPTZ   NULL,
    returned_by_id               UUID          NULL,
    returned_at                  TIMESTAMPTZ   NULL,
    return_reason                TEXT          NULL,
    completed_by_id              UUID          NULL,
    completed_at                 TIMESTAMPTZ   NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_ndtp_reports PRIMARY KEY (id),
    -- [B-01 FIX] Inline UNIQUE removed; partial index below handles soft-delete-safe uniqueness
    CONSTRAINT fk_ndtp_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ndtp_month CHECK (period_month BETWEEN 1 AND 12),
    CONSTRAINT chk_ndtp_status CHECK (status IN (1, 2, 3, 4, 5)),
    CONSTRAINT fk_ndtp_recipient FOREIGN KEY (submitted_to_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ndtp_submission_evidence CHECK (
        status = 1 OR (submitted_to_organization_id IS NOT NULL AND submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)
    ),
    CONSTRAINT chk_ndtp_verification_evidence CHECK (
        status NOT IN (3, 5) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_ndtp_completion_evidence CHECK (
        status <> 5 OR (completed_by_id IS NOT NULL AND completed_at IS NOT NULL)
    ),
    -- [E-04 FIX] Returned status requires return_reason
    CONSTRAINT chk_ndtp_return CHECK (
        status != 4 OR (return_reason IS NOT NULL AND returned_by_id IS NOT NULL AND returned_at IS NOT NULL)
    )
);
-- [RT-C2 FIX] Partial unique index (not inline UNIQUE) to allow re-creation after soft-delete
CREATE UNIQUE INDEX uq_ndtp_reports_period ON ndtp_reports(organization_id, period_year, period_month) WHERE is_deleted = FALSE;
CREATE INDEX idx_ndtp_reports_status ON ndtp_reports(status) WHERE is_deleted = FALSE;

-- Phiếu thông báo sai sót báo cáo NĐTP
CREATE TABLE ndtp_report_error_notifications (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_fields                 TEXT          NULL,       -- Các trường cần sửa
    correction_details           TEXT          NOT NULL,
    -- 1=Pending, 2=Acknowledged, 3=Corrected
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_by_id              UUID          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_ndtp_error_notifs PRIMARY KEY (id),
    CONSTRAINT fk_nen_report FOREIGN KEY (report_id) REFERENCES ndtp_reports(id),
    CONSTRAINT fk_nen_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_nen_status CHECK (status IN (1, 2, 3))
);
CREATE INDEX idx_nen_report ON ndtp_report_error_notifications(report_id);

-- Báo cáo công tác ATTP (6 tháng đầu năm / cả năm)
CREATE TABLE atp_work_reports (
    id                               UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id                  UUID          NOT NULL,
    -- 1=HalfYear (6 tháng), 2=FullYear (cả năm)
    period_type                      SMALLINT      NOT NULL,
    period_year                      INT           NOT NULL,
    period_half                      SMALLINT      NULL,           -- 1 hoặc 2 (chỉ khi HalfYear)
    -- Cơ sở SXKD
    total_businesses                 INT           NOT NULL DEFAULT 0,
    new_businesses                   INT           NOT NULL DEFAULT 0,
    inactive_businesses              INT           NOT NULL DEFAULT 0,
    businesses_with_certificate      INT           NOT NULL DEFAULT 0,
    -- Giấy phép được cấp trong kỳ
    dkcb_issued                      INT           NOT NULL DEFAULT 0,
    self_declarations_received       INT           NOT NULL DEFAULT 0,
    ad_registrations_issued          INT           NOT NULL DEFAULT 0,
    eligibility_certificates_issued  INT           NOT NULL DEFAULT 0,
    cfs_issued                       INT           NOT NULL DEFAULT 0,
    export_certificates_issued       INT           NOT NULL DEFAULT 0,
    -- Thanh kiểm tra
    total_inspection_plans           INT           NOT NULL DEFAULT 0,
    businesses_inspected             INT           NOT NULL DEFAULT 0,
    violations_found                 INT           NOT NULL DEFAULT 0,
    fines_issued                     INT           NOT NULL DEFAULT 0,
    fine_total_amount                NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Ngộ độc thực phẩm
    case_count                       INT           NOT NULL DEFAULT 0,
    incident_count                   INT           NOT NULL DEFAULT 0,
    total_affected                   INT           NOT NULL DEFAULT 0,
    total_deaths                     INT           NOT NULL DEFAULT 0,
    -- Truyền thông, tập huấn
    training_sessions                INT           NOT NULL DEFAULT 0,
    training_participants            INT           NOT NULL DEFAULT 0,
    media_appearances                INT           NOT NULL DEFAULT 0,
    documents_issued                 INT           NOT NULL DEFAULT 0,
    -- Tường thuật
    overview                         TEXT          NULL,
    achievements                     TEXT          NULL,
    limitations                      TEXT          NULL,
    solutions                        TEXT          NULL,
    next_period_plan                 TEXT          NULL,
    notes                            TEXT          NULL,
    -- Report version tracking
    submission_version               SMALLINT      NOT NULL DEFAULT 1,
    -- Workflow: 1=Draft, 2=Submitted, 3=Verified, 4=Returned, 5=Completed
    status                           SMALLINT      NOT NULL DEFAULT 1,
    submitted_to_organization_id     UUID          NULL,
    submitted_by_id                  UUID          NULL,
    submitted_at                     TIMESTAMPTZ   NULL,
    verified_by_id                   UUID          NULL,
    verified_at                      TIMESTAMPTZ   NULL,
    returned_by_id                   UUID          NULL,
    returned_at                      TIMESTAMPTZ   NULL,
    return_reason                    TEXT          NULL,
    completed_by_id                  UUID          NULL,
    completed_at                     TIMESTAMPTZ   NULL,
    -- ABP Audit
    extra_properties                 JSONB         NULL,
    concurrency_stamp                VARCHAR(40)   NULL,
    creation_time                    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                       UUID          NULL,
    last_modification_time           TIMESTAMPTZ   NULL,
    last_modifier_id                 UUID          NULL,
    is_deleted                       BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                    TIMESTAMPTZ   NULL,
    deleter_id                       UUID          NULL,
    CONSTRAINT pk_atp_work_reports PRIMARY KEY (id),
    CONSTRAINT fk_awr_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_awr_recipient FOREIGN KEY (submitted_to_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_awr_period_type CHECK (period_type IN (1, 2)),
    CONSTRAINT chk_awr_period_half CHECK (
        (period_type = 1 AND period_half IN (1, 2)) OR
        (period_type = 2 AND period_half IS NULL)
    ),
    CONSTRAINT chk_awr_status CHECK (status IN (1, 2, 3, 4, 5)),
    CONSTRAINT chk_awr_submission_evidence CHECK (
        status = 1 OR (submitted_to_organization_id IS NOT NULL AND submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)
    ),
    CONSTRAINT chk_awr_verification_evidence CHECK (
        status NOT IN (3, 5) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_awr_completion_evidence CHECK (
        status <> 5 OR (completed_by_id IS NOT NULL AND completed_at IS NOT NULL)
    ),
    -- [E-04 FIX] Returned status requires return_reason
    CONSTRAINT chk_awr_return CHECK (
        status != 4 OR (return_reason IS NOT NULL AND returned_by_id IS NOT NULL AND returned_at IS NOT NULL)
    )
);
-- NULL !== NULL in PostgreSQL UNIQUE — use partial indexes
CREATE UNIQUE INDEX uq_atp_work_reports_halfyear ON atp_work_reports(organization_id, period_year, period_half)
    WHERE period_type = 1 AND period_half IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX uq_atp_work_reports_fullyear ON atp_work_reports(organization_id, period_year)
    WHERE period_type = 2 AND is_deleted = FALSE;
CREATE INDEX idx_awr_org_year ON atp_work_reports(organization_id, period_year) WHERE is_deleted = FALSE;
CREATE INDEX idx_awr_status ON atp_work_reports(status) WHERE is_deleted = FALSE;

-- [H-01 NEW TABLE] Phiếu thông báo sai sót báo cáo công tác ATTP
CREATE TABLE atp_work_report_error_notifications (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_fields                 TEXT          NULL,
    correction_details           TEXT          NOT NULL,
    -- 1=Pending, 2=Acknowledged, 3=Corrected
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_by_id              UUID          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_awr_error_notifs PRIMARY KEY (id),
    CONSTRAINT fk_awren_report FOREIGN KEY (report_id) REFERENCES atp_work_reports(id),
    CONSTRAINT fk_awren_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_awren_status CHECK (status IN (1, 2, 3))
);
CREATE INDEX idx_awren_report ON atp_work_report_error_notifications(report_id);

-- Báo cáo Tháng hành động ATTP (hàng năm — tháng 4/5)
CREATE TABLE action_month_reports (
    id                               UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id                  UUID          NOT NULL,
    period_year                      INT           NOT NULL,
    action_month_theme               TEXT          NULL,        -- Chủ đề năm
    action_month_dates               VARCHAR(100)  NULL,        -- VD: "15/4 - 15/5/2025"
    -- Truyền thông
    media_articles                   INT           NOT NULL DEFAULT 0,
    broadcast_programs               INT           NOT NULL DEFAULT 0,
    propaganda_sessions              INT           NOT NULL DEFAULT 0,
    participants                     INT           NOT NULL DEFAULT 0,
    posters_distributed              INT           NOT NULL DEFAULT 0,
    leaflets_distributed             INT           NOT NULL DEFAULT 0,
    -- Thanh kiểm tra trong tháng hành động
    businesses_inspected             INT           NOT NULL DEFAULT 0,
    violations_found                 INT           NOT NULL DEFAULT 0,
    fines_issued                     INT           NOT NULL DEFAULT 0,
    fine_amount                      NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Tự công bố
    new_self_declarations            INT           NOT NULL DEFAULT 0,
    -- Đánh giá
    achievements                     TEXT          NULL,
    limitations                      TEXT          NULL,
    lessons_learned                  TEXT          NULL,
    next_steps                       TEXT          NULL,
    notes                            TEXT          NULL,
    -- Report version tracking
    submission_version               SMALLINT      NOT NULL DEFAULT 1,
    -- Workflow: 1=Draft, 2=Submitted, 3=Verified, 4=Returned, 5=Completed
    status                           SMALLINT      NOT NULL DEFAULT 1,
    submitted_to_organization_id     UUID          NULL,
    submitted_by_id                  UUID          NULL,
    submitted_at                     TIMESTAMPTZ   NULL,
    verified_by_id                   UUID          NULL,
    verified_at                      TIMESTAMPTZ   NULL,
    returned_by_id                   UUID          NULL,
    returned_at                      TIMESTAMPTZ   NULL,
    return_reason                    TEXT          NULL,
    completed_by_id                  UUID          NULL,
    completed_at                     TIMESTAMPTZ   NULL,
    -- ABP Audit
    extra_properties                 JSONB         NULL,
    concurrency_stamp                VARCHAR(40)   NULL,
    creation_time                    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                       UUID          NULL,
    last_modification_time           TIMESTAMPTZ   NULL,
    last_modifier_id                 UUID          NULL,
    is_deleted                       BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                    TIMESTAMPTZ   NULL,
    deleter_id                       UUID          NULL,
    CONSTRAINT pk_action_month_reports PRIMARY KEY (id),
    -- [B-02 FIX] Inline UNIQUE removed; partial index below handles soft-delete-safe uniqueness
    CONSTRAINT fk_amr_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_amr_recipient FOREIGN KEY (submitted_to_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_amr_status CHECK (status IN (1, 2, 3, 4, 5)),
    CONSTRAINT chk_amr_submission_evidence CHECK (
        status = 1 OR (submitted_to_organization_id IS NOT NULL AND submitted_by_id IS NOT NULL AND submitted_at IS NOT NULL)
    ),
    CONSTRAINT chk_amr_verification_evidence CHECK (
        status NOT IN (3, 5) OR (verified_by_id IS NOT NULL AND verified_at IS NOT NULL)
    ),
    CONSTRAINT chk_amr_completion_evidence CHECK (
        status <> 5 OR (completed_by_id IS NOT NULL AND completed_at IS NOT NULL)
    ),
    -- [E-04 FIX] Returned status requires return_reason
    CONSTRAINT chk_amr_return CHECK (
        status != 4 OR (return_reason IS NOT NULL AND returned_by_id IS NOT NULL AND returned_at IS NOT NULL)
    )
);
-- [RT-C3 FIX] Partial unique index to allow re-creation of report after soft-delete
CREATE UNIQUE INDEX uq_action_month_reports ON action_month_reports(organization_id, period_year) WHERE is_deleted = FALSE;
CREATE INDEX idx_amr_status ON action_month_reports(status) WHERE is_deleted = FALSE;

-- [H-01 NEW TABLE] Phiếu thông báo sai sót báo cáo Tháng hành động
CREATE TABLE action_month_report_error_notifications (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_fields                 TEXT          NULL,
    correction_details           TEXT          NOT NULL,
    -- 1=Pending, 2=Acknowledged, 3=Corrected
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_by_id              UUID          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_amren PRIMARY KEY (id),
    CONSTRAINT fk_amren_report FOREIGN KEY (report_id) REFERENCES action_month_reports(id),
    CONSTRAINT fk_amren_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_amren_status CHECK (status IN (1, 2, 3))
);
CREATE INDEX idx_amren_report ON action_month_report_error_notifications(report_id);

-- [IDB-002 ACCEPTED] Immutable content snapshots for every official submission.
-- The application role receives INSERT/SELECT only on these tables; no UPDATE/DELETE.
CREATE TABLE ndtp_report_submissions (
    id                           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID         NOT NULL,
    submission_version           SMALLINT     NOT NULL,
    submitting_organization_id   UUID         NOT NULL,
    recipient_organization_id    UUID         NOT NULL,
    submitted_by_id              UUID         NOT NULL,
    submitted_at                 TIMESTAMPTZ  NOT NULL,
    content_snapshot             JSONB        NOT NULL,
    content_sha256               VARCHAR(64)  NOT NULL,
    CONSTRAINT pk_ndtp_report_submissions PRIMARY KEY (id),
    CONSTRAINT uq_ndtp_report_submission UNIQUE (report_id, submission_version),
    CONSTRAINT fk_ndtprs_report FOREIGN KEY (report_id) REFERENCES ndtp_reports(id),
    CONSTRAINT fk_ndtprs_from_org FOREIGN KEY (submitting_organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_ndtprs_to_org FOREIGN KEY (recipient_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ndtprs_version CHECK (submission_version > 0),
    CONSTRAINT chk_ndtprs_hash CHECK (content_sha256 ~ '^[0-9A-Fa-f]{64}$')
);
CREATE INDEX idx_ndtprs_recipient ON ndtp_report_submissions(recipient_organization_id, submitted_at DESC);

CREATE TABLE atp_work_report_submissions (
    id                           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID         NOT NULL,
    submission_version           SMALLINT     NOT NULL,
    submitting_organization_id   UUID         NOT NULL,
    recipient_organization_id    UUID         NOT NULL,
    submitted_by_id              UUID         NOT NULL,
    submitted_at                 TIMESTAMPTZ  NOT NULL,
    content_snapshot             JSONB        NOT NULL,
    content_sha256               VARCHAR(64)  NOT NULL,
    CONSTRAINT pk_atp_work_report_submissions PRIMARY KEY (id),
    CONSTRAINT uq_atp_work_report_submission UNIQUE (report_id, submission_version),
    CONSTRAINT fk_awrs_report FOREIGN KEY (report_id) REFERENCES atp_work_reports(id),
    CONSTRAINT fk_awrs_from_org FOREIGN KEY (submitting_organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_awrs_to_org FOREIGN KEY (recipient_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_awrs_version CHECK (submission_version > 0),
    CONSTRAINT chk_awrs_hash CHECK (content_sha256 ~ '^[0-9A-Fa-f]{64}$')
);
CREATE INDEX idx_awrs_recipient ON atp_work_report_submissions(recipient_organization_id, submitted_at DESC);

CREATE TABLE action_month_report_submissions (
    id                           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID         NOT NULL,
    submission_version           SMALLINT     NOT NULL,
    submitting_organization_id   UUID         NOT NULL,
    recipient_organization_id    UUID         NOT NULL,
    submitted_by_id              UUID         NOT NULL,
    submitted_at                 TIMESTAMPTZ  NOT NULL,
    content_snapshot             JSONB        NOT NULL,
    content_sha256               VARCHAR(64)  NOT NULL,
    CONSTRAINT pk_action_month_report_submissions PRIMARY KEY (id),
    CONSTRAINT uq_action_month_report_submission UNIQUE (report_id, submission_version),
    CONSTRAINT fk_amrs_report FOREIGN KEY (report_id) REFERENCES action_month_reports(id),
    CONSTRAINT fk_amrs_from_org FOREIGN KEY (submitting_organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_amrs_to_org FOREIGN KEY (recipient_organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_amrs_version CHECK (submission_version > 0),
    CONSTRAINT chk_amrs_hash CHECK (content_sha256 ~ '^[0-9A-Fa-f]{64}$')
);
CREATE INDEX idx_amrs_recipient ON action_month_report_submissions(recipient_organization_id, submitted_at DESC);

-- ============================================================
-- SECTION 9: ALERTS AND TESTING MODULE
-- ============================================================

-- Phản ánh cảnh báo từ người dân (Public Portal — STT 49)
-- Declared before atp_alerts because atp_alerts references it
CREATE TABLE public_alert_submissions (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    -- Submitter info (not required — anonymous submissions allowed)  [SENSITIVE — PII]
    submitter_name               VARCHAR(200)  NULL,
    submitter_phone              VARCHAR(50)   NULL,
    submitter_email              VARCHAR(200)  NULL,
    submitter_address            TEXT          NULL,
    -- Content
    title                        VARCHAR(500)  NULL,
    description                  TEXT          NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    location_latitude            FLOAT8        NULL,
    location_longitude           FLOAT8        NULL,
    suspected_food               TEXT          NULL,
    -- Tracking
    tracking_code                VARCHAR(20)   NOT NULL,   -- Public-facing code for status lookup
    captcha_verified             BOOL          NOT NULL DEFAULT FALSE,
    -- Workflow: 1=Pending, 2=UnderReview, 3=ConvertedToAlert, 4=Dismissed
    status                       SMALLINT      NOT NULL DEFAULT 1,
    assigned_to_id               UUID          NULL,       -- Staff user handling this
    assigned_organization_id     UUID          NULL,
    review_notes                 TEXT          NULL,
    dismissed_reason             TEXT          NULL,
    dismissed_by_id              UUID          NULL,
    dismissed_at                 TIMESTAMPTZ   NULL,
    -- [U-01 FIX] ABP standard audit columns (replaced created_at/updated_at)
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    -- [U-01 FIX] Soft-delete support (submissions may be evidence — hard delete is inappropriate)
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_public_alert_submissions PRIMARY KEY (id),
    CONSTRAINT uq_pas_tracking_code UNIQUE (tracking_code),
    CONSTRAINT fk_pas_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT chk_pas_status CHECK (status IN (1, 2, 3, 4)),
    CONSTRAINT chk_pas_address_chain CHECK (location_commune_id IS NULL OR location_district_id IS NOT NULL),
    CONSTRAINT chk_pas_coordinates CHECK (
        (location_latitude IS NULL AND location_longitude IS NULL) OR
        (location_latitude BETWEEN -90 AND 90 AND location_longitude BETWEEN -180 AND 180)
    ),
    CONSTRAINT chk_pas_dismissal CHECK (
        status <> 4 OR (dismissed_reason IS NOT NULL AND dismissed_by_id IS NOT NULL AND dismissed_at IS NOT NULL)
    )
);
CREATE INDEX idx_pas_status ON public_alert_submissions(status, creation_time DESC);

-- Cảnh báo VSATTP (Food Safety Alerts)
CREATE TABLE atp_alerts (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    alert_number                 VARCHAR(50)   NULL,       -- Số hiệu cảnh báo (optional)
    title                        VARCHAR(500)  NOT NULL,
    content                      TEXT          NOT NULL,
    -- 1=FoodSafety, 2=Contamination, 3=Chemical, 4=Biological, 5=Physical, 6=Other
    category                     SMALLINT      NOT NULL,
    -- 1=Low, 2=Medium, 3=High, 4=Critical
    severity                     SMALLINT      NOT NULL DEFAULT 2,
    affected_area                TEXT          NULL,
    affected_products            TEXT          NULL,
    business_id                  UUID          NULL,       -- Specific business if applicable
    -- 1=Internal, 2=PublicReport, 3=ExternalSystem
    source                       SMALLINT      NOT NULL DEFAULT 1,
    -- [M-01 FIX] Link back to the public submission that created this alert
    public_submission_id         UUID          NULL,
    -- Reporter info (when source = PublicReport, denormalized from submission)
    reporter_name                VARCHAR(200)  NULL,
    reporter_phone               VARCHAR(50)   NULL,
    reporter_email               VARCHAR(200)  NULL,
    -- Workflow: 1=Draft, 2=Published, 3=Recalled
    status                       SMALLINT      NOT NULL DEFAULT 1,
    published_at                 TIMESTAMPTZ   NULL,
    published_by_id              UUID          NULL,
    recalled_at                  TIMESTAMPTZ   NULL,
    recalled_by_id               UUID          NULL,
    recall_reason                TEXT          NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_atp_alerts PRIMARY KEY (id),
    CONSTRAINT fk_alerts_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_alerts_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    -- [M-01 FIX] FK to public submission
    CONSTRAINT fk_alerts_submission FOREIGN KEY (public_submission_id) REFERENCES public_alert_submissions(id),
    CONSTRAINT uq_alerts_public_submission UNIQUE (public_submission_id),
    CONSTRAINT chk_alerts_category CHECK (category IN (1, 2, 3, 4, 5, 6)),
    CONSTRAINT chk_alerts_severity CHECK (severity IN (1, 2, 3, 4)),
    CONSTRAINT chk_alerts_source CHECK (source IN (1, 2, 3)),
    CONSTRAINT chk_alerts_status CHECK (status IN (1, 2, 3)),
    -- [E-02 FIX] Recalled status requires recall_reason
    CONSTRAINT chk_alerts_publish CHECK (
        status = 1 OR (published_at IS NOT NULL AND published_by_id IS NOT NULL AND is_public = TRUE)
    ),
    CONSTRAINT chk_alerts_recall CHECK (
        status != 3 OR (recall_reason IS NOT NULL AND recalled_at IS NOT NULL AND recalled_by_id IS NOT NULL)
    ),
    -- [RT-H4 FIX] source=2 (PublicReport) must have public_submission_id
    CONSTRAINT chk_alerts_source_submission CHECK (source != 2 OR public_submission_id IS NOT NULL)
);
-- [RT-H3 FIX] public_alert_submissions missing FK for location_district_id
ALTER TABLE public_alert_submissions
    ADD CONSTRAINT fk_pas_district FOREIGN KEY (location_district_id) REFERENCES cat_districts(id),
    ADD CONSTRAINT fk_pas_commune_district FOREIGN KEY (location_commune_id, location_district_id)
        REFERENCES cat_communes(id, district_id);
-- [J-01 FIX] assigned_organization_id missing FK
ALTER TABLE public_alert_submissions
    ADD CONSTRAINT fk_pas_assigned_org FOREIGN KEY (assigned_organization_id) REFERENCES organizations(id);
CREATE INDEX idx_atp_alerts_org ON atp_alerts(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_alerts_public ON atp_alerts(is_public, status, published_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_alerts_severity ON atp_alerts(severity, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_alerts_submission ON atp_alerts(public_submission_id) WHERE public_submission_id IS NOT NULL;
CREATE INDEX idx_atp_alerts_business ON atp_alerts(business_id) WHERE business_id IS NOT NULL AND is_deleted = FALSE;

-- Tin tức và hoạt động ATTP
CREATE TABLE atp_news (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    summary                      TEXT          NULL,
    content                      TEXT          NOT NULL,   -- Rich text HTML (sanitized by DOMPurify before save)
    thumbnail_storage_path       VARCHAR(1000) NULL,       -- MinIO path (maintained separately from file_attachments for performance)
    category                     VARCHAR(100)  NULL,
    tags                         TEXT[]        NULL,
    view_count                   INT           NOT NULL DEFAULT 0,
    -- 1=Draft, 2=Published, 3=Recalled
    status                       SMALLINT      NOT NULL DEFAULT 1,
    published_at                 TIMESTAMPTZ   NULL,
    published_by_id              UUID          NULL,
    recalled_at                  TIMESTAMPTZ   NULL,
    recalled_by_id               UUID          NULL,
    recalled_reason              TEXT          NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    is_featured                  BOOL          NOT NULL DEFAULT FALSE,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_atp_news PRIMARY KEY (id),
    CONSTRAINT fk_news_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_news_status CHECK (status IN (1, 2, 3)),
    -- [E-03 FIX] Recalled status requires recalled_reason
    CONSTRAINT chk_news_publish CHECK (
        status = 1 OR (published_at IS NOT NULL AND published_by_id IS NOT NULL AND is_public = TRUE)
    ),
    CONSTRAINT chk_news_recall CHECK (
        status != 3 OR (recalled_reason IS NOT NULL AND recalled_at IS NOT NULL AND recalled_by_id IS NOT NULL)
    )
);
CREATE INDEX idx_atp_news_public ON atp_news(is_public, status, published_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_news_title_trgm ON atp_news USING GIN (title gin_trgm_ops) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_news_featured ON atp_news(is_featured, published_at DESC) WHERE is_featured = TRUE AND is_deleted = FALSE;

-- Liên kết Tin tức ↔ Cảnh báo (M2M)
CREATE TABLE news_linked_alerts (
    news_id                      UUID NOT NULL,
    alert_id                     UUID NOT NULL,
    CONSTRAINT pk_news_linked_alerts PRIMARY KEY (news_id, alert_id),
    CONSTRAINT fk_nla_news FOREIGN KEY (news_id) REFERENCES atp_news(id) ON DELETE CASCADE,
    CONSTRAINT fk_nla_alert FOREIGN KEY (alert_id) REFERENCES atp_alerts(id)
);
CREATE INDEX idx_nla_alert ON news_linked_alerts(alert_id);

-- Phân tích mối nguy cơ ATTP
CREATE TABLE risk_analyses (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    category                     VARCHAR(200)  NULL,
    content                      TEXT          NOT NULL,
    -- 1=Low, 2=Medium, 3=High, 4=Critical
    risk_level                   SMALLINT      NOT NULL DEFAULT 2,
    analysis_date                DATE          NULL,
    affected_products            TEXT          NULL,
    evidence_summary             TEXT          NULL,
    recommendations              TEXT          NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    -- 1=Draft, 2=Published
    status                       SMALLINT      NOT NULL DEFAULT 1,
    published_at                 TIMESTAMPTZ   NULL,
    published_by_id              UUID          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_risk_analyses PRIMARY KEY (id),
    CONSTRAINT fk_ra_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ra_risk_level CHECK (risk_level IN (1, 2, 3, 4)),
    CONSTRAINT chk_ra_status CHECK (status IN (1, 2)),
    CONSTRAINT chk_ra_publish CHECK (
        status = 1 OR (published_at IS NOT NULL AND published_by_id IS NOT NULL AND is_public = TRUE)
    )
);
CREATE INDEX idx_ra_org ON risk_analyses(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_ra_public ON risk_analyses(is_public, status) WHERE is_deleted = FALSE;

-- Kết quả kiểm nghiệm mẫu thực phẩm
CREATE TABLE testing_results (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    business_id                  UUID          NULL,       -- Cơ sở lấy mẫu
    product_id                   UUID          NULL,       -- Sản phẩm (nếu xác định được)
    testing_center_id            UUID          NOT NULL,   -- Cơ sở kiểm nghiệm
    sample_code                  VARCHAR(100)  NOT NULL,   -- Mã mẫu
    sample_name                  VARCHAR(500)  NOT NULL,
    sample_description           TEXT          NULL,
    sample_collection_date       DATE          NULL,
    submitted_date               DATE          NULL,
    result_date                  DATE          NULL,
    -- NULL = pending result, 1=Pass, 2=Fail, 3=Conditional
    overall_result               SMALLINT      NULL,
    result_details               TEXT          NULL,
    failed_parameters            TEXT          NULL,       -- Chỉ tiêu không đạt
    certificate_number           VARCHAR(100)  NULL,       -- Số phiếu kiểm nghiệm
    inspection_result_id         UUID          NULL,       -- Link to inspection (if sample from inspection)
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_testing_results PRIMARY KEY (id),
    CONSTRAINT fk_tr_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_tr_business_org FOREIGN KEY (business_id, organization_id)
        REFERENCES businesses(id, organization_id),
    CONSTRAINT fk_tr_product_owner FOREIGN KEY (product_id, business_id, organization_id)
        REFERENCES products(id, business_id, organization_id),
    CONSTRAINT fk_tr_center FOREIGN KEY (testing_center_id) REFERENCES cat_testing_centers(id),
    CONSTRAINT fk_tr_inspection FOREIGN KEY (inspection_result_id) REFERENCES inspection_results(id),
    CONSTRAINT chk_tr_result CHECK (overall_result IS NULL OR overall_result IN (1, 2, 3)),
    CONSTRAINT chk_tr_product_business CHECK (product_id IS NULL OR business_id IS NOT NULL)
);
ALTER TABLE testing_results
    ADD CONSTRAINT uq_testing_results_id_center UNIQUE (id, testing_center_id);
CREATE INDEX idx_testing_results_org ON testing_results(organization_id) WHERE is_deleted = FALSE;
-- [RT-H6 FIX] Prevent duplicate sample codes within same organization
CREATE UNIQUE INDEX uq_testing_results_sample_code ON testing_results(sample_code, organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_testing_results_business ON testing_results(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_testing_results_product ON testing_results(product_id) WHERE product_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_testing_results_center ON testing_results(testing_center_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_testing_results_result ON testing_results(overall_result) WHERE is_deleted = FALSE;
CREATE INDEX idx_testing_results_inspection ON testing_results(inspection_result_id)
    WHERE inspection_result_id IS NOT NULL AND is_deleted = FALSE;

-- [C-06 NEW TABLE] Dịch vụ kiểm nghiệm được sử dụng trong một kết quả (M2M)
-- Một mẫu có thể được kiểm nghiệm theo nhiều dịch vụ
CREATE TABLE testing_result_services (
    testing_result_id        UUID NOT NULL,
    testing_service_id       UUID NOT NULL,
    testing_center_id        UUID NOT NULL,
    CONSTRAINT pk_testing_result_services PRIMARY KEY (testing_result_id, testing_service_id),
    CONSTRAINT fk_trs_result_center FOREIGN KEY (testing_result_id, testing_center_id)
        REFERENCES testing_results(id, testing_center_id) ON DELETE CASCADE,
    CONSTRAINT fk_trs_service_center FOREIGN KEY (testing_service_id, testing_center_id)
        REFERENCES cat_testing_services(id, testing_center_id)
);
CREATE INDEX idx_trs_service ON testing_result_services(testing_service_id);

-- Văn bản chỉ đạo, điều hành liên quan ATTP
CREATE TABLE regulatory_documents (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    document_type_id             UUID          NULL,
    document_number              VARCHAR(100)  NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    issuing_authority            VARCHAR(200)  NULL,
    issue_date                   DATE          NULL,
    effective_date               DATE          NULL,
    expiry_date                  DATE          NULL,
    summary                      TEXT          NULL,
    content_storage_path         VARCHAR(1000) NULL,       -- MinIO path to PDF
    -- 1=Active, 2=Expired, 3=Replaced, 4=Revoked
    status                       SMALLINT      NOT NULL DEFAULT 1,
    replaced_by_id               UUID          NULL,       -- Self-reference to replacement document
    tags                         TEXT[]        NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    -- [M-02 FIX] Full-text search vector (auto-updated via trigger or application)
    search_vector                TSVECTOR      NULL,       -- Computed from title + summary for FTS
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_regulatory_documents PRIMARY KEY (id),
    CONSTRAINT fk_rd_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_rd_doc_type FOREIGN KEY (document_type_id) REFERENCES cat_document_types(id),
    CONSTRAINT fk_rd_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES regulatory_documents(id),
    CONSTRAINT chk_rd_status CHECK (status IN (1, 2, 3, 4)),
    -- [H-03 FIX] Dates must be logically ordered
    CONSTRAINT chk_rd_dates CHECK (
        (issue_date IS NULL OR effective_date IS NULL OR issue_date <= effective_date) AND
        (effective_date IS NULL OR expiry_date IS NULL OR effective_date <= expiry_date)
    )
);
CREATE INDEX idx_rd_org ON regulatory_documents(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_rd_document_type ON regulatory_documents(document_type_id)
    WHERE document_type_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_rd_replaced_by ON regulatory_documents(replaced_by_id)
    WHERE replaced_by_id IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_rd_title_trgm ON regulatory_documents USING GIN (title gin_trgm_ops) WHERE is_deleted = FALSE;
-- [M-02 FIX] Full-text search index for document content lookup (STT 38)
CREATE INDEX idx_rd_search_vector ON regulatory_documents USING GIN (search_vector) WHERE is_deleted = FALSE;
CREATE INDEX idx_rd_public ON regulatory_documents(is_public, status) WHERE is_deleted = FALSE;

-- Trigger to auto-update search_vector on insert/update
CREATE OR REPLACE FUNCTION update_regulatory_documents_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(NEW.document_number, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_regulatory_documents_search_vector
    BEFORE INSERT OR UPDATE OF title, summary, document_number
    ON regulatory_documents
    FOR EACH ROW EXECUTE FUNCTION update_regulatory_documents_search_vector();

-- ============================================================
-- SECTION 10: FILE ATTACHMENTS (Cross-cutting)
-- ============================================================

-- [IDB-004 ACCEPTED] Enforceable attachment-owner supertype. Each attachable
-- aggregate uses its own id as the document-owner id (shared-primary-key pattern).
CREATE TABLE document_owners (
    id                           UUID          NOT NULL,
    organization_id              UUID          NULL,       -- NULL only for anonymous/system-wide owners
    owner_type                   VARCHAR(100)  NOT NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_document_owners PRIMARY KEY (id),
    CONSTRAINT uq_document_owners_id_org UNIQUE (id, organization_id),
    CONSTRAINT fk_document_owners_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_document_owners_org ON document_owners(organization_id, owner_type);

-- File attachments for typed owners
-- Files stored in MinIO; this table stores metadata only
CREATE TABLE file_attachments (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    document_owner_id            UUID          NOT NULL,
    file_name                    VARCHAR(500)  NOT NULL,   -- Stored object name in MinIO
    original_name                VARCHAR(500)  NOT NULL,   -- User's original filename
    storage_path                 VARCHAR(1000) NOT NULL,   -- MinIO bucket/object path
    file_size                    BIGINT        NOT NULL,   -- Bytes
    mime_type                    VARCHAR(100)  NULL,
    description                  VARCHAR(500)  NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    uploaded_by_id               UUID          NULL,       -- AbpUsers.Id
    upload_time                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- [H-02 FIX] Integrity and security fields
    -- SHA-256 hex digest computed before upload
    checksum                     VARCHAR(64)   NULL,
    -- 1=Pending, 2=Clean, 3=Infected, 4=ScanFailed
    virus_scan_status            SMALLINT      NOT NULL DEFAULT 1,
    virus_scanned_at             TIMESTAMPTZ   NULL,
    -- 1=Active, 2=Archived, 3=PendingDeletion (for retention management)
    retention_status             SMALLINT      NOT NULL DEFAULT 1,
    retention_expires_at         TIMESTAMPTZ   NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    -- [C-01 FIX] ABP ISoftDelete compliance: deletion_time + deleter_id (not deleted_at)
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_file_attachments PRIMARY KEY (id),
    CONSTRAINT fk_fa_owner FOREIGN KEY (document_owner_id) REFERENCES document_owners(id),
    CONSTRAINT chk_fa_virus_scan CHECK (virus_scan_status IN (1, 2, 3, 4)),
    CONSTRAINT chk_fa_retention CHECK (retention_status IN (1, 2, 3)),
    CONSTRAINT chk_fa_file_size CHECK (file_size > 0)
);
CREATE UNIQUE INDEX uq_file_attachments_storage_path ON file_attachments(storage_path);
CREATE INDEX idx_file_attachments_owner ON file_attachments(document_owner_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_file_attachments_scan ON file_attachments(virus_scan_status)
    WHERE virus_scan_status = 1;  -- Pending scan

-- Typed owner membership and organization equality.
ALTER TABLE products ADD CONSTRAINT fk_products_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE self_declarations ADD CONSTRAINT fk_self_declarations_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE product_registrations ADD CONSTRAINT fk_product_reg_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE advertisement_registrations ADD CONSTRAINT fk_ad_reg_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE eligibility_certificates ADD CONSTRAINT fk_elic_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE cfs_certificates ADD CONSTRAINT fk_cfs_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE export_food_certificates ADD CONSTRAINT fk_efc_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE inspection_plans ADD CONSTRAINT fk_plans_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE inspection_results ADD CONSTRAINT fk_ir_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE ndtp_report_submissions ADD CONSTRAINT fk_ndtprs_document_owner
    FOREIGN KEY (id, submitting_organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE atp_work_report_submissions ADD CONSTRAINT fk_awrs_document_owner
    FOREIGN KEY (id, submitting_organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE action_month_report_submissions ADD CONSTRAINT fk_amrs_document_owner
    FOREIGN KEY (id, submitting_organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE public_alert_submissions ADD CONSTRAINT fk_pas_document_owner
    FOREIGN KEY (id) REFERENCES document_owners(id);
ALTER TABLE atp_alerts ADD CONSTRAINT fk_alerts_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE atp_news ADD CONSTRAINT fk_news_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE risk_analyses ADD CONSTRAINT fk_ra_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE testing_results ADD CONSTRAINT fk_tr_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);
ALTER TABLE regulatory_documents ADD CONSTRAINT fk_rd_document_owner
    FOREIGN KEY (id, organization_id) REFERENCES document_owners(id, organization_id);

-- ============================================================
-- SECTION 11: DATA INTEGRATION MODULE
-- ============================================================

-- Đặc tả API tích hợp với hệ thống ngoài
CREATE TABLE api_specs (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    api_code                     VARCHAR(50)   NOT NULL,
    api_name                     VARCHAR(200)  NOT NULL,
    version                      VARCHAR(50)   NULL,
    partner_system               VARCHAR(200)  NOT NULL,   -- Bộ Y tế / Sở NN / Sở CT / Khác
    base_url                     VARCHAR(500)  NULL,
    description                  TEXT          NULL,
    -- Data type: 1=Alert, 2=InspectionResult, 3=FoodPoisoning, 4=License, 5=Product, 6=News, 7=Business
    data_type                    SMALLINT      NOT NULL,
    -- Direction: 1=Outbound (gửi đi), 2=Inbound (nhận về), 3=Both
    direction                    SMALLINT      NOT NULL,
    -- Auth: 1=ApiKey, 2=OAuth2, 3=Basic, 4=None
    auth_type                    SMALLINT      NOT NULL DEFAULT 1,
    -- Encrypted credentials (AES-256, key from environment variable — never committed)
    auth_config_encrypted        TEXT          NULL,
    spec_document_path           VARCHAR(1000) NULL,       -- MinIO path to OpenAPI spec file
    is_active                    BOOL          NOT NULL DEFAULT TRUE,
    notes                        TEXT          NULL,
    -- ABP Audit
    extra_properties             JSONB         NULL,
    concurrency_stamp            VARCHAR(40)   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    last_modification_time       TIMESTAMPTZ   NULL,
    last_modifier_id             UUID          NULL,
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    deletion_time                TIMESTAMPTZ   NULL,
    deleter_id                   UUID          NULL,
    CONSTRAINT pk_api_specs PRIMARY KEY (id),
    CONSTRAINT fk_as_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_as_data_type CHECK (data_type BETWEEN 1 AND 7),
    CONSTRAINT chk_as_direction CHECK (direction IN (1, 2, 3)),
    CONSTRAINT chk_as_auth_type CHECK (auth_type IN (1, 2, 3, 4))
);
CREATE UNIQUE INDEX uq_api_specs_code ON api_specs(api_code, organization_id) WHERE is_deleted = FALSE;

-- Lịch sử chia sẻ dữ liệu (ghi TOÀN BỘ các API call — nhận và gửi)
-- Immutable records — no soft delete, no update after completion
CREATE TABLE data_sharing_histories (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    api_spec_id                  UUID          NULL,
    -- Direction: 1=Outbound, 2=Inbound
    direction                    SMALLINT      NOT NULL,
    -- Data type: 1-7 matching api_specs.data_type
    data_type                    SMALLINT      NOT NULL,
    entity_type                  VARCHAR(100)  NULL,       -- 'atp_alert', 'inspection_result', etc.
    entity_id                    UUID          NULL,
    partner_system               VARCHAR(200)  NULL,
    request_method               VARCHAR(10)   NULL,       -- GET/POST/PUT
    request_url                  VARCHAR(1000) NULL,
    request_payload              TEXT          NULL,       -- For small payloads; large → MinIO
    response_status_code         INT           NULL,
    response_payload             TEXT          NULL,
    -- [H-03 FIX] Idempotency key — prevents duplicate processing of inbound requests
    -- Provided by partner system or generated for outbound
    idempotency_key              VARCHAR(200)  NULL,
    -- [H-03 FIX] SHA-256 of request payload for integrity verification
    payload_checksum             VARCHAR(64)   NULL,
    -- Status: 1=Success, 2=Failed, 3=Pending, 4=Retrying, 5=ManualReview (dead letter)
    status                       SMALLINT      NOT NULL DEFAULT 3,
    error_message                TEXT          NULL,
    error_code                   VARCHAR(50)   NULL,
    retry_count                  INT           NOT NULL DEFAULT 0,
    -- [H-03 FIX] Scheduled time for next retry (used by Hangfire)
    next_retry_at                TIMESTAMPTZ   NULL,
    initiated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at                 TIMESTAMPTZ   NULL,
    duration_ms                  INT           NULL,
    creator_id                   UUID          NULL,       -- User/system that initiated
    CONSTRAINT pk_data_sharing_histories PRIMARY KEY (id),
    CONSTRAINT fk_dsh_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_dsh_api_spec FOREIGN KEY (api_spec_id) REFERENCES api_specs(id),
    CONSTRAINT chk_dsh_direction CHECK (direction IN (1, 2)),
    CONSTRAINT chk_dsh_data_type CHECK (data_type BETWEEN 1 AND 7),
    CONSTRAINT chk_dsh_status CHECK (status IN (1, 2, 3, 4, 5))
);
CREATE UNIQUE INDEX uq_dsh_idempotency ON data_sharing_histories(idempotency_key, direction)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_dsh_org_type ON data_sharing_histories(organization_id, data_type, direction);
CREATE INDEX idx_dsh_entity ON data_sharing_histories(entity_type, entity_id);
CREATE INDEX idx_dsh_api_spec ON data_sharing_histories(api_spec_id) WHERE api_spec_id IS NOT NULL;
CREATE INDEX idx_dsh_initiated ON data_sharing_histories(initiated_at DESC);
CREATE INDEX idx_dsh_retry ON data_sharing_histories(status, next_retry_at)
    WHERE status IN (2, 4) AND next_retry_at IS NOT NULL;  -- Failed or Retrying + scheduled

-- [IDB-018 ACCEPTED] Immutable per-attempt history. The parent is the
-- integration envelope/current delivery state; every initial call and retry
-- inserts one attempt row rather than overwriting prior evidence.
CREATE TABLE data_sharing_attempts (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    data_sharing_history_id      UUID          NOT NULL,
    attempt_number               INT           NOT NULL,
    endpoint_url                 VARCHAR(1000) NULL,
    request_payload              TEXT          NULL,
    request_checksum_sha256      VARCHAR(64)   NULL,
    response_status_code         INT           NULL,
    response_payload             TEXT          NULL,
    response_checksum_sha256     VARCHAR(64)   NULL,
    started_at                   TIMESTAMPTZ   NOT NULL,
    completed_at                 TIMESTAMPTZ   NULL,
    duration_ms                  INT           NULL,
    outcome                      SMALLINT      NOT NULL,   -- 1=Success, 2=HTTPError, 3=Timeout, 4=TransportError
    error_code                   VARCHAR(50)   NULL,
    error_message                TEXT          NULL,
    CONSTRAINT pk_data_sharing_attempts PRIMARY KEY (id),
    CONSTRAINT uq_dsa_attempt UNIQUE (data_sharing_history_id, attempt_number),
    CONSTRAINT fk_dsa_history FOREIGN KEY (data_sharing_history_id) REFERENCES data_sharing_histories(id),
    CONSTRAINT chk_dsa_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT chk_dsa_outcome CHECK (outcome IN (1, 2, 3, 4)),
    CONSTRAINT chk_dsa_times CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX idx_dsa_history_time ON data_sharing_attempts(data_sharing_history_id, started_at DESC);

-- ============================================================
-- SECTION 12: STATISTICS / DASHBOARD CACHE
-- ============================================================

-- Pre-computed dashboard statistics (refreshed daily by background job)
-- Avoids expensive real-time aggregate queries on dashboard load
CREATE TABLE cached_dashboard_stats (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    stats_date                   DATE          NOT NULL,
    -- Cơ sở SXKD
    total_businesses             INT           NOT NULL DEFAULT 0,
    active_businesses            INT           NOT NULL DEFAULT 0,
    businesses_with_certificate  INT           NOT NULL DEFAULT 0,
    businesses_expiring_licenses INT           NOT NULL DEFAULT 0,  -- Sắp hết hạn trong 30 ngày
    -- Giấy phép
    total_dkcb_active            INT           NOT NULL DEFAULT 0,
    total_self_declarations      INT           NOT NULL DEFAULT 0,
    -- Thanh kiểm tra (YTD = Year To Date)
    total_inspections_ytd        INT           NOT NULL DEFAULT 0,
    violations_ytd               INT           NOT NULL DEFAULT 0,
    fine_amount_ytd              NUMERIC(18,2) NOT NULL DEFAULT 0,
    -- Ngộ độc (YTD)
    total_cases_ytd              INT           NOT NULL DEFAULT 0,
    total_incidents_ytd          INT           NOT NULL DEFAULT 0,
    total_affected_ytd           INT           NOT NULL DEFAULT 0,
    total_deaths_ytd             INT           NOT NULL DEFAULT 0,
    -- Cảnh báo
    active_alerts                INT           NOT NULL DEFAULT 0,
    critical_alerts              INT           NOT NULL DEFAULT 0,
    -- Báo cáo chờ xác minh
    reports_pending_verification INT           NOT NULL DEFAULT 0,
    computed_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cached_dashboard_stats PRIMARY KEY (id),
    CONSTRAINT uq_cds_org_date UNIQUE (organization_id, stats_date),
    CONSTRAINT fk_cds_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_cds_org ON cached_dashboard_stats(organization_id, stats_date DESC);

-- ============================================================
-- SECTION 13: STATUS HISTORY (Cross-cutting workflow audit)
-- ============================================================

-- Records every status transition for all workflow entities
-- Complements ABP audit logs with business-level transition context
CREATE TABLE status_history (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    -- Polymorphic association (no FK — entity may be from different tables)
    entity_type                  VARCHAR(100)  NOT NULL,   -- 'ndtp_report', 'inspection_plan', etc.
    entity_id                    UUID          NOT NULL,
    from_status                  SMALLINT      NULL,        -- NULL for initial creation
    to_status                    SMALLINT      NOT NULL,
    comment                      TEXT          NULL,        -- Reason for transition (required for Return)
    changed_by_id                UUID          NULL,        -- AbpUsers.Id (NULL for system transitions)
    changed_at                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    -- Additional context
    organization_id              UUID          NULL,        -- For data scope queries on history
    CONSTRAINT pk_status_history PRIMARY KEY (id)
);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX idx_status_history_org ON status_history(organization_id, changed_at DESC)
    WHERE organization_id IS NOT NULL;

-- ============================================================
-- SECTION 14: TABLE COUNT SUMMARY
-- ============================================================
-- Section 2:  Organizations          4 tables  (organizations, app_user_profiles, password_history,
--                                              management_scope_assignments)
-- Section 3:  Catalogs              12 tables  (cat_countries, cat_regions, cat_provinces,
--                                              cat_districts, cat_communes, cat_product_groups,
--                                              cat_business_types, cat_business_classifications,
--                                              cat_advertisement_types, cat_document_types,
--                                              cat_testing_centers, cat_testing_services)
-- Section 4:  BusinessManagement     5 tables  (businesses, business_product_groups,
--                                              business_handlers, products, self_declarations)
-- Section 5:  Licensing              6 tables  (product_registrations, advertisement_registrations,
--                                              advertisement_registration_products,
--                                              eligibility_certificates, cfs_certificates,
--                                              export_food_certificates)
-- Section 6:  Inspection             5 tables  (inspection_plans, inspection_plan_items,
--                                              inspection_results, inspection_result_inspectors[NEW],
--                                              inspection_violations)
-- Section 7:  FoodPoisoning          4 tables  (food_poisoning_incidents, food_poisoning_cases,
--                                              poisoning_case_error_reports,
--                                              poisoning_incident_error_reports)
--                                             NOTE: incidents declared before cases
-- Section 8:  Reporting              9 tables  (ndtp_reports, ndtp_report_error_notifications,
--                                              atp_work_reports, atp_work_report_error_notifications[NEW],
--                                              action_month_reports, action_month_report_error_notifications[NEW],
--                                              ndtp_report_submissions, atp_work_report_submissions,
--                                              action_month_report_submissions)
-- Section 9:  AlertsAndTesting       8 tables  (public_alert_submissions, atp_alerts, atp_news,
--                                              news_linked_alerts, risk_analyses, testing_results,
--                                              testing_result_services[NEW], regulatory_documents)
-- Section 10: FileAttachments        2 tables  (document_owners, file_attachments)
-- Section 11: DataIntegration        3 tables  (api_specs, data_sharing_histories,
--                                              data_sharing_attempts)
-- Section 12: DashboardCache         1 table   (cached_dashboard_stats)
-- Section 13: StatusHistory          1 table   (status_history)
-- ============================================================
-- TOTAL CUSTOM TABLES: 60 tables
-- ============================================================
-- + ABP built-in: ~21 tables (AbpUsers, AbpRoles, AbpUserRoles, etc.)
-- GRAND TOTAL: ~81 tables
-- ============================================================
