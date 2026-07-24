-- ============================================================
-- FoodSafe — PostgreSQL 15 Database Schema
-- Chi cục ATVSTP tỉnh Quảng Ninh
-- Chuẩn: ABP Framework 9 naming convention (snake_case)
-- Schema: public (default)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";   -- Full-text search
CREATE EXTENSION IF NOT EXISTS "btree_gist"; -- GiST index for date ranges

-- ============================================================
-- SECTION 1: ABP FRAMEWORK BUILT-IN TABLES
-- (Managed by ABP EF Core migrations — do NOT create manually)
-- Listed here for reference only
-- ============================================================
-- AbpUsers
-- AbpRoles
-- AbpUserRoles
-- AbpUserClaims
-- AbpRoleClaims
-- AbpUserLogins
-- AbpUserTokens
-- AbpOrganizationUnits (NOT USED — using custom Organizations table)
-- AbpAuditLogs
-- AbpAuditLogActions
-- AbpEntityChanges
-- AbpEntityPropertyChanges
-- AbpPermissionGrants
-- AbpSettings
-- AbpBackgroundJobs
-- AbpOpenIddictApplications
-- AbpOpenIddictAuthorizations
-- AbpOpenIddictScopes
-- AbpOpenIddictTokens
-- AbpFeatureGroups
-- AbpFeatures
-- AbpFeatureValues

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
    province_id              UUID         NULL,     -- FK to cat_provinces
    district_id              UUID         NULL,     -- FK to cat_districts
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
    CONSTRAINT chk_organizations_level CHECK (level IN (1, 2, 3))
);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_organizations_level ON organizations(level) WHERE is_deleted = FALSE;

-- Extended user profile (1-1 với AbpUsers)
CREATE TABLE app_user_profiles (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id                  UUID         NOT NULL,  -- = AbpUsers.Id
    organization_id          UUID         NOT NULL,
    full_name                VARCHAR(200) NOT NULL,
    position                 VARCHAR(200) NULL,
    department               VARCHAR(200) NULL,
    password_expires_at      TIMESTAMPTZ  NULL,
    must_change_password     BOOL         NOT NULL DEFAULT FALSE,
    last_login_at            TIMESTAMPTZ  NULL,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_modification_time   TIMESTAMPTZ  NULL,
    CONSTRAINT pk_app_user_profiles PRIMARY KEY (id),
    CONSTRAINT uq_app_user_profiles_user_id UNIQUE (user_id),
    CONSTRAINT fk_app_user_profiles_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_app_user_profiles_org_id ON app_user_profiles(organization_id);

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
    type                     SMALLINT     NOT NULL DEFAULT 1, -- 1=Huyện, 2=Quận, 3=Thị xã, 4=TP trực thuộc tỉnh
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_districts PRIMARY KEY (id),
    CONSTRAINT uq_cat_districts_code UNIQUE (code),
    CONSTRAINT fk_cat_districts_province FOREIGN KEY (province_id) REFERENCES cat_provinces(id)
);
CREATE INDEX idx_cat_districts_province ON cat_districts(province_id) WHERE is_deleted = FALSE;

CREATE TABLE cat_communes (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    district_id              UUID         NOT NULL,
    code                     VARCHAR(10)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    type                     SMALLINT     NOT NULL DEFAULT 1, -- 1=Xã, 2=Phường, 3=Thị trấn
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_communes PRIMARY KEY (id),
    CONSTRAINT uq_cat_communes_code UNIQUE (code),
    CONSTRAINT fk_cat_communes_district FOREIGN KEY (district_id) REFERENCES cat_districts(id)
);
CREATE INDEX idx_cat_communes_district ON cat_communes(district_id) WHERE is_deleted = FALSE;

CREATE TABLE cat_product_groups (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    parent_id                UUID         NULL,
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(200) NOT NULL,
    level                    SMALLINT     NOT NULL DEFAULT 1, -- 1=Nhóm chính, 2=Nhóm phụ
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
    CONSTRAINT fk_cat_product_groups_parent FOREIGN KEY (parent_id) REFERENCES cat_product_groups(id)
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
    criteria                 TEXT         NULL,      -- Tiêu chí phân loại
    risk_level               SMALLINT     NOT NULL DEFAULT 2, -- 1=Cao, 2=Vừa, 3=Thấp
    is_active                BOOL         NOT NULL DEFAULT TRUE,
    sort_order               INT          NOT NULL DEFAULT 0,
    creation_time            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    creator_id               UUID         NULL,
    last_modification_time   TIMESTAMPTZ  NULL,
    last_modifier_id         UUID         NULL,
    is_deleted               BOOL         NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_business_classifications PRIMARY KEY (id),
    CONSTRAINT uq_cat_business_classifications_code UNIQUE (code)
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

CREATE TABLE cat_testing_centers (
    id                       UUID         NOT NULL DEFAULT uuid_generate_v4(),
    code                     VARCHAR(50)  NOT NULL,
    name                     VARCHAR(300) NOT NULL,
    -- Address
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
    accreditation_number     VARCHAR(100) NULL,
    accreditation_scope      TEXT         NULL,       -- Phạm vi kiểm nghiệm
    accreditation_expiry     DATE         NULL,
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
    CONSTRAINT uq_cat_testing_centers_code UNIQUE (code)
);

CREATE TABLE cat_testing_services (
    id                       UUID          NOT NULL DEFAULT uuid_generate_v4(),
    testing_center_id        UUID          NOT NULL,
    code                     VARCHAR(50)   NOT NULL,
    name                     VARCHAR(300)  NOT NULL,
    unit                     VARCHAR(50)   NULL,     -- Đơn vị kiểm nghiệm
    method                   VARCHAR(200)  NULL,     -- Phương pháp (TCVN/ISO)
    unit_price               NUMERIC(18,2) NULL,     -- Đơn giá (VND)
    turnaround_days          INT           NULL,     -- Thời gian trả kết quả
    is_active                BOOL          NOT NULL DEFAULT TRUE,
    creation_time            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id               UUID          NULL,
    last_modification_time   TIMESTAMPTZ   NULL,
    last_modifier_id         UUID          NULL,
    is_deleted               BOOL          NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_cat_testing_services PRIMARY KEY (id),
    CONSTRAINT fk_cat_testing_services_center FOREIGN KEY (testing_center_id) REFERENCES cat_testing_centers(id)
);
CREATE INDEX idx_cat_testing_services_center ON cat_testing_services(testing_center_id) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 4: BUSINESS MANAGEMENT MODULE
-- ============================================================

CREATE TABLE businesses (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,   -- Đơn vị quản lý
    code                         VARCHAR(50)   NULL,
    name                         VARCHAR(500)  NOT NULL,
    business_type_id             UUID          NULL,
    business_classification_id   UUID          NULL,
    tax_code                     VARCHAR(50)   NULL,       -- Mã số thuế
    representative_name          VARCHAR(200)  NULL,       -- Chủ cơ sở/người đại diện
    representative_id_card       VARCHAR(50)   NULL,       -- CMND/CCCD chủ cơ sở
    contact_name                 VARCHAR(200)  NULL,       -- Người liên hệ
    contact_phone                VARCHAR(50)   NULL,
    contact_email                VARCHAR(200)  NULL,
    -- Address (Value Object embedded)
    address_street               TEXT          NULL,
    address_commune_id           UUID          NULL,
    address_district_id          UUID          NULL,
    address_province_id          UUID          NULL,
    address_latitude             FLOAT8        NULL,
    address_longitude            FLOAT8        NULL,
    -- Status flags
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Active, 2=Inactive, 3=Suspended
    suspension_reason            TEXT          NULL,       -- Lý do đình chỉ (khi status=3)
    suspended_at                 TIMESTAMPTZ   NULL,
    has_eligibility_certificate  BOOL          NOT NULL DEFAULT FALSE,
    has_vsattp_commitment        BOOL          NOT NULL DEFAULT FALSE,
    -- Other
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
    CONSTRAINT chk_businesses_status CHECK (status IN (1, 2, 3))
);
CREATE UNIQUE INDEX uq_businesses_code ON businesses(code) WHERE code IS NOT NULL AND is_deleted = FALSE;
CREATE INDEX idx_businesses_org_id ON businesses(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_type ON businesses(business_type_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_status ON businesses(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_name_trgm ON businesses USING GIN (name gin_trgm_ops) WHERE is_deleted = FALSE;
CREATE INDEX idx_businesses_location ON businesses(address_latitude, address_longitude)
    WHERE address_latitude IS NOT NULL AND address_longitude IS NOT NULL AND is_deleted = FALSE;

-- Nhóm sản phẩm của cơ sở (M2M)
CREATE TABLE business_product_groups (
    business_id      UUID NOT NULL,
    product_group_id UUID NOT NULL,
    CONSTRAINT pk_business_product_groups PRIMARY KEY (business_id, product_group_id),
    CONSTRAINT fk_bpg_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    CONSTRAINT fk_bpg_product_group FOREIGN KEY (product_group_id) REFERENCES cat_product_groups(id)
);

-- Người trực tiếp kinh doanh
CREATE TABLE business_handlers (
    id                               UUID         NOT NULL DEFAULT uuid_generate_v4(),
    business_id                      UUID         NOT NULL,
    full_name                        VARCHAR(200) NOT NULL,
    position                         VARCHAR(200) NULL,       -- Chức vụ
    id_card_number                   VARCHAR(50)  NULL,       -- CMND/CCCD
    -- Chứng nhận tập huấn ATTP
    training_certificate_number      VARCHAR(100) NULL,
    training_date                    DATE         NULL,
    training_organization            VARCHAR(300) NULL,
    training_expiry_date             DATE         NULL,
    -- Giấy khám sức khỏe
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
    CONSTRAINT pk_business_handlers PRIMARY KEY (id),
    CONSTRAINT fk_business_handlers_business FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);
CREATE INDEX idx_business_handlers_business ON business_handlers(business_id) WHERE is_deleted = FALSE;

-- Sản phẩm
CREATE TABLE products (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    code                         VARCHAR(50)   NULL,
    name                         VARCHAR(500)  NOT NULL,
    product_group_id             UUID          NULL,
    brand_name                   VARCHAR(200)  NULL,
    manufacturer                 VARCHAR(300)  NULL,
    manufacturing_country_id     UUID          NULL,
    net_weight                   VARCHAR(100)  NULL,
    specifications               TEXT          NULL,          -- Thông số kỹ thuật
    ingredients                  TEXT          NULL,          -- Thành phần nguyên liệu
    expiry_period_months         INT           NULL,          -- Hạn sử dụng (tháng)
    storage_conditions           TEXT          NULL,          -- Điều kiện bảo quản
    usage_instructions           TEXT          NULL,          -- Hướng dẫn sử dụng
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Active, 2=Inactive
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
    CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_products_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_products_group FOREIGN KEY (product_group_id) REFERENCES cat_product_groups(id),
    CONSTRAINT fk_products_country FOREIGN KEY (manufacturing_country_id) REFERENCES cat_countries(id)
);
CREATE INDEX idx_products_business ON products(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_org ON products(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops) WHERE is_deleted = FALSE;

-- Tự công bố sản phẩm
CREATE TABLE self_declarations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    declaration_number           VARCHAR(100)  NOT NULL,  -- Số giấy tự công bố
    declaration_date             DATE          NOT NULL,
    product_name                 VARCHAR(500)  NOT NULL,
    manufacturer                 VARCHAR(300)  NULL,
    purpose                      VARCHAR(200)  NULL,      -- Mục đích sử dụng
    expiry_date                  DATE          NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Active, 2=Expired, 3=Revoked
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_self_declarations_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_self_declarations_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_self_declarations_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_self_declarations_business ON self_declarations(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_self_declarations_status ON self_declarations(status, expiry_date) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 5: LICENSING MODULE
-- ============================================================

-- Đăng ký công bố sản phẩm (DKCB)
CREATE TABLE product_registrations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    registration_number          VARCHAR(100)  NOT NULL,
    receipt_number               VARCHAR(100)  NULL,      -- Số tiếp nhận
    registration_date            DATE          NOT NULL,
    receipt_date                 DATE          NULL,      -- Ngày tiếp nhận
    expiry_date                  DATE          NULL,
    product_name                 VARCHAR(500)  NOT NULL,
    manufacturer                 VARCHAR(300)  NULL,
    certifying_authority         VARCHAR(200)  NULL,      -- Cơ quan cấp
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Active, 2=Expired, 3=Revoked
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_product_reg_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_product_reg_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_product_reg_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_product_registrations_business ON product_registrations(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_product_registrations_expiry ON product_registrations(expiry_date, status) WHERE is_deleted = FALSE;

-- Đăng ký nội dung quảng cáo (DDK Quảng cáo)
CREATE TABLE advertisement_registrations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    advertisement_type_id        UUID          NULL,
    registration_number          VARCHAR(100)  NOT NULL,
    registration_date            DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    content_description          TEXT          NULL,      -- Mô tả nội dung QC
    medium                       VARCHAR(200)  NULL,      -- Phương tiện QC
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_ad_reg_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_ad_reg_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_ad_reg_type FOREIGN KEY (advertisement_type_id) REFERENCES cat_advertisement_types(id)
);

-- Sản phẩm trong đăng ký quảng cáo (M2M)
CREATE TABLE advertisement_registration_products (
    advertisement_registration_id UUID NOT NULL,
    product_id                    UUID NOT NULL,
    CONSTRAINT pk_ad_reg_products PRIMARY KEY (advertisement_registration_id, product_id),
    CONSTRAINT fk_arp_ad_reg FOREIGN KEY (advertisement_registration_id) REFERENCES advertisement_registrations(id) ON DELETE CASCADE,
    CONSTRAINT fk_arp_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Giấy xác nhận cơ sở đủ điều kiện ATTP (DDK)
CREATE TABLE eligibility_certificates (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    certificate_number           VARCHAR(100)  NOT NULL,
    issue_date                   DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    certifying_authority         VARCHAR(200)  NULL,
    certification_scope          TEXT          NULL,      -- Phạm vi chứng nhận
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_elic_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_elic_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_eligibility_certificates_business ON eligibility_certificates(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_eligibility_certificates_expiry ON eligibility_certificates(expiry_date, status) WHERE is_deleted = FALSE;

-- Giấy chứng nhận lưu hành tự do (CFS)
CREATE TABLE cfs_certificates (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    business_id                  UUID          NOT NULL,
    product_id                   UUID          NULL,
    organization_id              UUID          NOT NULL,
    certificate_number           VARCHAR(100)  NOT NULL,
    issue_date                   DATE          NOT NULL,
    expiry_date                  DATE          NULL,
    destination_country_id       UUID          NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_cfs_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_cfs_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_cfs_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_cfs_country FOREIGN KEY (destination_country_id) REFERENCES cat_countries(id)
);

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
    lot_number                   VARCHAR(100)  NULL,     -- Số lô hàng
    quantity                     NUMERIC(18,3) NULL,     -- Số lượng
    quantity_unit                VARCHAR(50)   NULL,     -- Đơn vị (tấn, kg, hộp...)
    status                       SMALLINT      NOT NULL DEFAULT 1,
    revoke_reason                TEXT          NULL,
    revoked_at                   TIMESTAMPTZ   NULL,
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
    CONSTRAINT fk_efc_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_efc_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_efc_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_efc_country FOREIGN KEY (destination_country_id) REFERENCES cat_countries(id)
);

-- ============================================================
-- SECTION 6: INSPECTION MODULE
-- ============================================================

CREATE TABLE inspection_plans (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    plan_code                    VARCHAR(50)   NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    plan_type                    SMALLINT      NOT NULL, -- 1=Annual, 2=Periodic, 3=Irregular, 4=FollowUp
    year                         INT           NOT NULL,
    start_date                   DATE          NULL,
    end_date                     DATE          NULL,
    description                  TEXT          NULL,
    objectives                   TEXT          NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Submitted, 3=Approved, 4=InProgress, 5=Completed, 6=Cancelled
    approved_by_id               UUID          NULL,
    approved_at                  TIMESTAMPTZ   NULL,
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
    CONSTRAINT uq_inspection_plans_code UNIQUE (plan_code, organization_id),
    CONSTRAINT fk_plans_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_inspection_plans_org ON inspection_plans(organization_id, year) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_plans_status ON inspection_plans(status) WHERE is_deleted = FALSE;

CREATE TABLE inspection_plan_items (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    plan_id                      UUID          NOT NULL,
    business_id                  UUID          NOT NULL,
    sequence_number              INT           NOT NULL DEFAULT 0,
    planned_date                 DATE          NULL,
    assigned_inspector_id        UUID          NULL,    -- AbpUsers.Id
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Pending, 2=InProgress, 3=Completed, 4=Skipped
    notes                        TEXT          NULL,
    CONSTRAINT pk_inspection_plan_items PRIMARY KEY (id),
    CONSTRAINT fk_ipi_plan FOREIGN KEY (plan_id) REFERENCES inspection_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_ipi_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);
CREATE INDEX idx_inspection_plan_items_plan ON inspection_plan_items(plan_id);
CREATE INDEX idx_inspection_plan_items_business ON inspection_plan_items(business_id);

CREATE TABLE inspection_results (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    plan_id                      UUID          NULL,   -- NULL nếu thanh tra đột xuất
    plan_item_id                 UUID          NULL,
    business_id                  UUID          NOT NULL,
    organization_id              UUID          NOT NULL,
    inspection_date              DATE          NOT NULL,
    inspection_type              SMALLINT      NOT NULL, -- 1=Scheduled, 2=Unscheduled, 3=FollowUp, 4=Emergency
    team_leader                  VARCHAR(200)  NULL,
    inspector_ids                UUID[]        NULL,    -- Array of inspector user IDs
    team_members_text            TEXT          NULL,
    overall_result               SMALLINT      NOT NULL, -- 1=Pass, 2=Fail, 3=ConditionalPass
    has_violation                BOOL          NOT NULL DEFAULT FALSE,
    violation_description        TEXT          NULL,
    fine_amount                  NUMERIC(18,2) NULL,
    fine_currency                VARCHAR(3)    NOT NULL DEFAULT 'VND',
    admin_decision_number        VARCHAR(100)  NULL,    -- Số quyết định xử phạt
    admin_decision_date          DATE          NULL,
    follow_up_required           BOOL          NOT NULL DEFAULT FALSE,
    follow_up_date               DATE          NULL,
    follow_up_result             SMALLINT      NULL,    -- 1=Passed, 2=StillFailed
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
    CONSTRAINT fk_ir_plan_item FOREIGN KEY (plan_item_id) REFERENCES inspection_plan_items(id),
    CONSTRAINT fk_ir_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_ir_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_inspection_results_business ON inspection_results(business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_results_date ON inspection_results(inspection_date) WHERE is_deleted = FALSE;
CREATE INDEX idx_inspection_results_org ON inspection_results(organization_id) WHERE is_deleted = FALSE;

CREATE TABLE inspection_violations (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    inspection_result_id         UUID          NOT NULL,
    violation_code               VARCHAR(50)   NULL,
    description                  TEXT          NOT NULL,
    regulation_reference         TEXT          NULL,    -- Điều khoản vi phạm
    fine_amount                  NUMERIC(18,2) NULL,
    remedy_required              TEXT          NULL,
    remedy_deadline              DATE          NULL,
    is_remedied                  BOOL          NOT NULL DEFAULT FALSE,
    remedied_at                  TIMESTAMPTZ   NULL,
    CONSTRAINT pk_inspection_violations PRIMARY KEY (id),
    CONSTRAINT fk_iv_inspection_result FOREIGN KEY (inspection_result_id) REFERENCES inspection_results(id) ON DELETE CASCADE
);

-- ============================================================
-- SECTION 7: FOOD POISONING MODULE
-- ============================================================

CREATE TABLE food_poisoning_cases (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    case_code                    VARCHAR(50)   NOT NULL,
    report_date                  DATE          NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    -- Location (Address VO)
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    location_province_id         UUID          NULL,
    location_latitude            FLOAT8        NULL,
    location_longitude           FLOAT8        NULL,
    -- Victim Info (VO)
    victim_name                  VARCHAR(200)  NULL,
    victim_age                   INT           NULL,
    victim_gender                SMALLINT      NULL,    -- 1=Male, 2=Female, 3=Other
    victim_phone                 VARCHAR(50)   NULL,
    victim_address               TEXT          NULL,
    -- Food Info (VO)
    suspected_food               TEXT          NULL,
    food_source                  VARCHAR(200)  NULL,
    food_preparation_date        DATE          NULL,
    symptoms                     TEXT          NULL,
    onset_time                   TIMESTAMPTZ   NULL,
    -- Medical (VO)
    medical_facility             VARCHAR(300)  NULL,
    treatment_start_date         DATE          NULL,
    treatment_result             SMALLINT      NULL,    -- 1=Recovered, 2=Hospitalized, 3=Deceased
    -- Reporter (VO)
    reporter_name                VARCHAR(200)  NULL,
    reporter_phone               VARCHAR(50)   NULL,
    reporter_organization        VARCHAR(300)  NULL,
    reporter_relation            VARCHAR(100)  NULL,
    -- Workflow
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Reported, 3=Verified
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
    CONSTRAINT fk_fpc_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT fk_fpc_district FOREIGN KEY (location_district_id) REFERENCES cat_districts(id)
);
CREATE INDEX idx_fpc_org ON food_poisoning_cases(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpc_report_date ON food_poisoning_cases(report_date, status) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_fpc_case_code ON food_poisoning_cases(case_code, organization_id) WHERE is_deleted = FALSE;

CREATE TABLE poisoning_case_error_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    case_id                      UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_description            TEXT          NOT NULL,
    correction_request           TEXT          NOT NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Pending, 2=Acknowledged, 3=Corrected
    response                     TEXT          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_pcer PRIMARY KEY (id),
    CONSTRAINT fk_pcer_case FOREIGN KEY (case_id) REFERENCES food_poisoning_cases(id),
    CONSTRAINT fk_pcer_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id)
);

CREATE TABLE food_poisoning_incidents (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    incident_code                VARCHAR(50)   NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    end_date                     TIMESTAMPTZ   NULL,
    -- Location
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    location_province_id         UUID          NULL,
    location_latitude            FLOAT8        NULL,
    location_longitude           FLOAT8        NULL,
    -- Food Info
    suspected_food               TEXT          NULL,
    food_source                  VARCHAR(200)  NULL,   -- Nguồn thực phẩm
    food_service_type            VARCHAR(200)  NULL,   -- Đám tiệc, bếp ăn tập thể, hộ GĐ...
    -- Statistics
    exposed_count                INT           NOT NULL DEFAULT 0,  -- Số người phơi nhiễm
    affected_count               INT           NOT NULL DEFAULT 0,  -- Số mắc
    hospitalized_count           INT           NOT NULL DEFAULT 0,  -- Nhập viện
    death_count                  INT           NOT NULL DEFAULT 0,  -- Tử vong
    -- Investigation
    cause_assessment             SMALLINT      NULL,   -- 1=Confirmed, 2=Probable, 3=Suspected, 4=Unknown
    causative_agent              VARCHAR(200)  NULL,   -- Tác nhân gây bệnh (vi khuẩn, hóa chất...)
    pathogen                     VARCHAR(200)  NULL,   -- Mầm bệnh cụ thể
    investigation_team           TEXT          NULL,
    control_measures             TEXT          NULL,   -- Biện pháp kiểm soát
    prevention_measures          TEXT          NULL,   -- Biện pháp phòng chống
    conclusion                   TEXT          NULL,
    -- Workflow
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Reported, 3=Verified, 4=Concluded
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
    CONSTRAINT fk_fpi_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id)
);
CREATE INDEX idx_fpi_org ON food_poisoning_incidents(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_fpi_date ON food_poisoning_incidents(occurrence_date) WHERE is_deleted = FALSE;
CREATE UNIQUE INDEX uq_fpi_incident_code ON food_poisoning_incidents(incident_code, organization_id) WHERE is_deleted = FALSE;

CREATE TABLE poisoning_incident_error_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    incident_id                  UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_description            TEXT          NOT NULL,
    correction_request           TEXT          NOT NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1,
    response                     TEXT          NULL,
    responded_at                 TIMESTAMPTZ   NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_pier PRIMARY KEY (id),
    CONSTRAINT fk_pier_incident FOREIGN KEY (incident_id) REFERENCES food_poisoning_incidents(id),
    CONSTRAINT fk_pier_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id)
);

-- ============================================================
-- SECTION 8: REPORTING MODULE
-- ============================================================

-- Báo cáo NĐTP hàng tháng
CREATE TABLE ndtp_reports (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    period_year                  INT           NOT NULL,
    period_month                 INT           NOT NULL,  -- 1-12
    -- Ca ngộ độc lẻ
    case_count                   INT           NOT NULL DEFAULT 0,
    case_affected                INT           NOT NULL DEFAULT 0,
    case_hospitalized            INT           NOT NULL DEFAULT 0,
    case_deaths                  INT           NOT NULL DEFAULT 0,
    -- Vụ ngộ độc
    incident_count               INT           NOT NULL DEFAULT 0,
    incident_affected            INT           NOT NULL DEFAULT 0,
    incident_hospitalized        INT           NOT NULL DEFAULT 0,
    incident_deaths              INT           NOT NULL DEFAULT 0,
    -- Tường thuật
    prevention_activities        TEXT          NULL,
    risk_factors                 TEXT          NULL,
    recommendations              TEXT          NULL,
    notes                        TEXT          NULL,
    -- Workflow
    status                       SMALLINT      NOT NULL DEFAULT 1,  -- 1=Draft, 2=Submitted, 3=Verified, 4=Returned, 5=Completed
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
    CONSTRAINT uq_ndtp_reports_period UNIQUE (organization_id, period_year, period_month),
    CONSTRAINT fk_ndtp_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT chk_ndtp_month CHECK (period_month BETWEEN 1 AND 12)
);
CREATE INDEX idx_ndtp_reports_org_period ON ndtp_reports(organization_id, period_year, period_month) WHERE is_deleted = FALSE;
CREATE INDEX idx_ndtp_reports_status ON ndtp_reports(status) WHERE is_deleted = FALSE;

-- Phiếu thông báo sai sót báo cáo NĐTP
CREATE TABLE ndtp_report_error_notifications (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    report_id                    UUID          NOT NULL,
    from_organization_id         UUID          NOT NULL,
    error_fields                 TEXT          NULL,
    correction_details           TEXT          NOT NULL,
    status                       SMALLINT      NOT NULL DEFAULT 1,  -- 1=Pending, 2=Acknowledged, 3=Corrected
    response                     TEXT          NULL,
    creation_time                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    creator_id                   UUID          NULL,
    CONSTRAINT pk_ndtp_error_notifs PRIMARY KEY (id),
    CONSTRAINT fk_nen_report FOREIGN KEY (report_id) REFERENCES ndtp_reports(id),
    CONSTRAINT fk_nen_org FOREIGN KEY (from_organization_id) REFERENCES organizations(id)
);

-- Báo cáo công tác ATTP (6 tháng, cả năm)
CREATE TABLE atp_work_reports (
    id                               UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id                  UUID          NOT NULL,
    period_type                      SMALLINT      NOT NULL,  -- 1=HalfYear, 2=FullYear
    period_year                      INT           NOT NULL,
    period_half                      SMALLINT      NULL,       -- 1 hoặc 2 (nếu HalfYear)
    -- Cơ sở SXKD
    total_businesses                 INT           NOT NULL DEFAULT 0,
    new_businesses                   INT           NOT NULL DEFAULT 0,
    inactive_businesses              INT           NOT NULL DEFAULT 0,
    businesses_with_certificate      INT           NOT NULL DEFAULT 0,
    -- Giấy phép được cấp
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
    -- Ngộ độc
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
    -- Workflow (giống ndtp_reports)
    status                           SMALLINT      NOT NULL DEFAULT 1,
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
    CONSTRAINT fk_awr_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
-- NOTE: NULL không tương đương trong UNIQUE constraint — dùng partial index thay thế
CREATE UNIQUE INDEX uq_atp_work_reports_halfyear ON atp_work_reports(organization_id, period_year, period_half)
    WHERE period_type = 1 AND period_half IS NOT NULL AND is_deleted = FALSE;
CREATE UNIQUE INDEX uq_atp_work_reports_fullyear ON atp_work_reports(organization_id, period_year)
    WHERE period_type = 2 AND is_deleted = FALSE;

-- Báo cáo Tháng hành động ATTP (hàng năm)
CREATE TABLE action_month_reports (
    id                               UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id                  UUID          NOT NULL,
    period_year                      INT           NOT NULL,
    action_month_theme               TEXT          NULL,       -- Chủ đề tháng hành động
    action_month_dates               VARCHAR(100)  NULL,       -- Ví dụ: "15/4 - 15/5/2025"
    -- Truyền thông
    media_articles                   INT           NOT NULL DEFAULT 0,  -- Bài báo, phóng sự
    broadcast_programs               INT           NOT NULL DEFAULT 0,  -- Chương trình phát thanh/TV
    propaganda_sessions              INT           NOT NULL DEFAULT 0,  -- Buổi tuyên truyền
    participants                     INT           NOT NULL DEFAULT 0,  -- Số người tham gia
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
    -- Workflow
    status                           SMALLINT      NOT NULL DEFAULT 1,
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
    CONSTRAINT uq_action_month_reports UNIQUE (organization_id, period_year),
    CONSTRAINT fk_amr_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- ============================================================
-- SECTION 9: ALERTS AND TESTING MODULE
-- ============================================================

CREATE TABLE atp_alerts (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    alert_number                 VARCHAR(50)   NULL,
    title                        VARCHAR(500)  NOT NULL,
    content                      TEXT          NOT NULL,
    category                     SMALLINT      NOT NULL, -- 1=FoodSafety, 2=Contamination, 3=Chemical, 4=Biological, 5=Physical, 6=Other
    severity                     SMALLINT      NOT NULL DEFAULT 2, -- 1=Low, 2=Medium, 3=High, 4=Critical
    affected_area                TEXT          NULL,
    affected_products            TEXT          NULL,
    business_id                  UUID          NULL,
    source                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Internal, 2=PublicReport, 3=ExternalSystem
    -- Thông tin người gửi (nếu từ dân)
    reporter_name                VARCHAR(200)  NULL,
    reporter_phone               VARCHAR(50)   NULL,
    reporter_email               VARCHAR(200)  NULL,
    -- Workflow
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Published, 3=Recalled
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
    CONSTRAINT fk_alerts_business FOREIGN KEY (business_id) REFERENCES businesses(id)
);
CREATE INDEX idx_atp_alerts_org ON atp_alerts(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_alerts_public ON atp_alerts(is_public, status, published_at DESC) WHERE is_deleted = FALSE;

CREATE TABLE atp_news (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    summary                      TEXT          NULL,
    content                      TEXT          NOT NULL,   -- Rich text HTML (sanitized)
    thumbnail_storage_path       VARCHAR(1000) NULL,
    category                     VARCHAR(100)  NULL,
    tags                         TEXT[]        NULL,
    view_count                   INT           NOT NULL DEFAULT 0,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Published, 3=Recalled
    published_at                 TIMESTAMPTZ   NULL,
    published_by_id              UUID          NULL,
    recalled_at                  TIMESTAMPTZ   NULL,
    recalled_by_id               UUID          NULL,
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
    CONSTRAINT fk_news_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE INDEX idx_atp_news_public ON atp_news(is_public, status, published_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_atp_news_title_trgm ON atp_news USING GIN (title gin_trgm_ops) WHERE is_deleted = FALSE;

CREATE TABLE news_linked_alerts (
    news_id                      UUID NOT NULL,
    alert_id                     UUID NOT NULL,
    CONSTRAINT pk_news_linked_alerts PRIMARY KEY (news_id, alert_id),
    CONSTRAINT fk_nla_news FOREIGN KEY (news_id) REFERENCES atp_news(id) ON DELETE CASCADE,
    CONSTRAINT fk_nla_alert FOREIGN KEY (alert_id) REFERENCES atp_alerts(id)
);

CREATE TABLE risk_analyses (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    title                        VARCHAR(500)  NOT NULL,
    category                     VARCHAR(200)  NULL,
    content                      TEXT          NOT NULL,
    risk_level                   SMALLINT      NOT NULL DEFAULT 2, -- 1=Low, 2=Medium, 3=High, 4=Critical
    analysis_date                DATE          NULL,
    affected_products            TEXT          NULL,
    evidence_summary             TEXT          NULL,
    recommendations              TEXT          NULL,
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Draft, 2=Published
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
    CONSTRAINT fk_ra_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

CREATE TABLE testing_results (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    business_id                  UUID          NULL,
    product_id                   UUID          NULL,
    testing_center_id            UUID          NOT NULL,
    sample_code                  VARCHAR(100)  NOT NULL,
    sample_name                  VARCHAR(500)  NOT NULL,
    sample_description           TEXT          NULL,
    sample_collection_date       DATE          NULL,
    submitted_date               DATE          NULL,
    result_date                  DATE          NULL,
    overall_result               SMALLINT      NULL,    -- 1=Pass, 2=Fail, 3=Conditional (NULL=pending)
    result_details               TEXT          NULL,
    failed_parameters            TEXT          NULL,    -- Chỉ tiêu không đạt
    certificate_number           VARCHAR(100)  NULL,    -- Số phiếu kiểm nghiệm
    inspection_result_id         UUID          NULL,    -- Liên kết với TKT nếu có
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
    CONSTRAINT fk_tr_business FOREIGN KEY (business_id) REFERENCES businesses(id),
    CONSTRAINT fk_tr_product FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_tr_center FOREIGN KEY (testing_center_id) REFERENCES cat_testing_centers(id),
    CONSTRAINT fk_tr_inspection FOREIGN KEY (inspection_result_id) REFERENCES inspection_results(id)
);
CREATE INDEX idx_testing_results_org ON testing_results(organization_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_testing_results_business ON testing_results(business_id) WHERE is_deleted = FALSE;

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
    content_storage_path         VARCHAR(1000) NULL,     -- MinIO path
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Active, 2=Expired, 3=Replaced, 4=Revoked
    replaced_by_id               UUID          NULL,     -- FK self
    tags                         TEXT[]        NULL,
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
    CONSTRAINT pk_regulatory_documents PRIMARY KEY (id),
    CONSTRAINT fk_rd_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_rd_doc_type FOREIGN KEY (document_type_id) REFERENCES cat_document_types(id),
    CONSTRAINT fk_rd_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES regulatory_documents(id)
);
CREATE INDEX idx_rd_org ON regulatory_documents(organization_id, status) WHERE is_deleted = FALSE;
CREATE INDEX idx_rd_title_trgm ON regulatory_documents USING GIN (title gin_trgm_ops) WHERE is_deleted = FALSE;

-- Phản ánh từ người dân (STT 49)
CREATE TABLE public_alert_submissions (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    submitter_name               VARCHAR(200)  NULL,
    submitter_phone              VARCHAR(50)   NULL,
    submitter_email              VARCHAR(200)  NULL,
    submitter_address            TEXT          NULL,
    title                        VARCHAR(500)  NULL,
    description                  TEXT          NOT NULL,
    occurrence_date              TIMESTAMPTZ   NULL,
    location_description         TEXT          NULL,
    location_commune_id          UUID          NULL,
    location_district_id         UUID          NULL,
    suspected_food               TEXT          NULL,
    tracking_code                VARCHAR(20)   NOT NULL,  -- Mã tra cứu (random, unique)
    captcha_verified             BOOL          NOT NULL DEFAULT FALSE,
    status                       SMALLINT      NOT NULL DEFAULT 1, -- 1=Pending, 2=UnderReview, 3=ConvertedToAlert, 4=Dismissed
    assigned_to_id               UUID          NULL,
    assigned_organization_id     UUID          NULL,
    review_notes                 TEXT          NULL,
    converted_alert_id           UUID          NULL,
    created_at                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                   TIMESTAMPTZ   NULL,
    CONSTRAINT pk_public_alert_submissions PRIMARY KEY (id),
    CONSTRAINT uq_pas_tracking_code UNIQUE (tracking_code),
    CONSTRAINT fk_pas_commune FOREIGN KEY (location_commune_id) REFERENCES cat_communes(id),
    CONSTRAINT fk_pas_converted_alert FOREIGN KEY (converted_alert_id) REFERENCES atp_alerts(id)
);

-- ============================================================
-- SECTION 10: FILE ATTACHMENTS (Cross-cutting)
-- ============================================================

CREATE TABLE file_attachments (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    entity_type                  VARCHAR(100)  NOT NULL,   -- 'business', 'inspection_result', 'product', etc.
    entity_id                    UUID          NOT NULL,
    file_name                    VARCHAR(500)  NOT NULL,   -- Tên file lưu trên MinIO
    original_name                VARCHAR(500)  NOT NULL,   -- Tên file gốc
    storage_path                 VARCHAR(1000) NOT NULL,   -- MinIO bucket/object path
    file_size                    BIGINT        NOT NULL,   -- Bytes
    mime_type                    VARCHAR(100)  NULL,
    description                  VARCHAR(500)  NULL,       -- Mô tả file
    is_public                    BOOL          NOT NULL DEFAULT FALSE,
    uploaded_by_id               UUID          NULL,       -- AbpUsers.Id
    upload_time                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    is_deleted                   BOOL          NOT NULL DEFAULT FALSE,
    CONSTRAINT pk_file_attachments PRIMARY KEY (id)
);
CREATE INDEX idx_file_attachments_entity ON file_attachments(entity_type, entity_id) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 11: DATA INTEGRATION MODULE
-- ============================================================

CREATE TABLE api_specs (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    api_code                     VARCHAR(50)   NOT NULL,
    api_name                     VARCHAR(200)  NOT NULL,
    version                      VARCHAR(50)   NULL,
    partner_system               VARCHAR(200)  NOT NULL,  -- Bộ Y tế, Sở NN, Sở CT...
    base_url                     VARCHAR(500)  NULL,
    description                  TEXT          NULL,
    data_type                    SMALLINT      NOT NULL,  -- 1=Alert, 2=InspectionResult, 3=FoodPoisoning, 4=License, 5=Product, 6=News, 7=Business
    direction                    SMALLINT      NOT NULL,  -- 1=Outbound, 2=Inbound, 3=Both
    auth_type                    SMALLINT      NOT NULL DEFAULT 1, -- 1=ApiKey, 2=OAuth2, 3=Basic, 4=None
    auth_config_encrypted        TEXT          NULL,      -- AES-256 encrypted JSON credentials
    spec_document_path           VARCHAR(1000) NULL,      -- MinIO path to OpenAPI spec
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
    CONSTRAINT fk_as_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);
CREATE UNIQUE INDEX uq_api_specs_code ON api_specs(api_code, organization_id) WHERE is_deleted = FALSE;

CREATE TABLE data_sharing_histories (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    api_spec_id                  UUID          NULL,
    direction                    SMALLINT      NOT NULL,  -- 1=Sent, 2=Received
    data_type                    SMALLINT      NOT NULL,  -- 1-7 (same as api_specs.data_type)
    entity_type                  VARCHAR(100)  NULL,      -- 'atp_alert', 'inspection_result', etc.
    entity_id                    UUID          NULL,
    partner_system               VARCHAR(200)  NULL,
    request_method               VARCHAR(10)   NULL,
    request_url                  VARCHAR(1000) NULL,
    request_payload              TEXT          NULL,
    response_status_code         INT           NULL,
    response_payload             TEXT          NULL,
    status                       SMALLINT      NOT NULL DEFAULT 3, -- 1=Success, 2=Failed, 3=Pending, 4=Retrying
    error_message                TEXT          NULL,
    retry_count                  INT           NOT NULL DEFAULT 0,
    initiated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    completed_at                 TIMESTAMPTZ   NULL,
    duration_ms                  INT           NULL,
    creator_id                   UUID          NULL,
    CONSTRAINT pk_data_sharing_histories PRIMARY KEY (id),
    CONSTRAINT fk_dsh_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    CONSTRAINT fk_dsh_api_spec FOREIGN KEY (api_spec_id) REFERENCES api_specs(id)
);
CREATE INDEX idx_dsh_org_type ON data_sharing_histories(organization_id, data_type, direction);
CREATE INDEX idx_dsh_entity ON data_sharing_histories(entity_type, entity_id);
CREATE INDEX idx_dsh_initiated ON data_sharing_histories(initiated_at DESC);

-- ============================================================
-- SECTION 12: STATISTICS / DASHBOARD CACHE (Optional)
-- ============================================================

CREATE TABLE cached_dashboard_stats (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    organization_id              UUID          NOT NULL,
    stats_date                   DATE          NOT NULL,   -- Ngày tính thống kê
    -- Cơ sở
    total_businesses             INT           NOT NULL DEFAULT 0,
    active_businesses            INT           NOT NULL DEFAULT 0,
    businesses_with_certificate  INT           NOT NULL DEFAULT 0,
    businesses_expiring_licenses INT           NOT NULL DEFAULT 0,  -- Sắp hết hạn 30 ngày
    -- Giấy phép
    total_dkcb_active            INT           NOT NULL DEFAULT 0,
    total_self_declarations      INT           NOT NULL DEFAULT 0,
    -- Thanh kiểm tra (YTD)
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
    -- Báo cáo chờ
    reports_pending_verification INT           NOT NULL DEFAULT 0,
    computed_at                  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_cached_dashboard_stats PRIMARY KEY (id),
    CONSTRAINT uq_cds_org_date UNIQUE (organization_id, stats_date),
    CONSTRAINT fk_cds_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- ============================================================
-- SECTION 13: COMMENTS / NOTES (for status transitions)
-- ============================================================
-- Status transition log cho các entity có workflow phức tạp

CREATE TABLE status_history (
    id                           UUID          NOT NULL DEFAULT uuid_generate_v4(),
    entity_type                  VARCHAR(100)  NOT NULL,   -- 'ndtp_report', 'inspection_plan', etc.
    entity_id                    UUID          NOT NULL,
    from_status                  SMALLINT      NULL,
    to_status                    SMALLINT      NOT NULL,
    comment                      TEXT          NULL,
    changed_by_id                UUID          NULL,
    changed_at                   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_status_history PRIMARY KEY (id)
);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);

-- ============================================================
-- SUMMARY: TABLE COUNT
-- ============================================================
-- Section 2: Organizations:          2 tables
-- Section 3: Catalogs:               9 tables  (cat_*)
-- Section 4: Business Management:    5 tables
-- Section 5: Licensing:              5 tables (+ 1 junction)
-- Section 6: Inspection:             3 tables
-- Section 7: Food Poisoning:         4 tables
-- Section 8: Reporting:              3 tables (+ 1 error notifs)
-- Section 9: Alerts & Testing:       6 tables
-- Section 10: File Attachments:      1 table
-- Section 11: Data Integration:      2 tables
-- Section 12: Dashboard Cache:       1 table
-- Section 13: Status History:        1 table
-- ============================================================
-- TOTAL CUSTOM TABLES: 43 tables (+ ABP built-in ~20 tables)
-- ============================================================
