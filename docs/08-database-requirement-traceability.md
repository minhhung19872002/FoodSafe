# Database Requirement Traceability Matrix — FoodSafe

> Hệ thống quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh  
> Cấp độ ATTT: Cấp độ 2 — Nghị định 85/2016/NĐ-CP

---

## Metadata

| Item | Value |
|------|-------|
| Database engine | PostgreSQL 15 |
| Total functional requirements | 57 STTs (nhóm A–F) |
| Total NFR coverage entries | 8 |
| Custom tables (after audit improvements) | ~52 |
| ABP built-in tables | ~21 |
| Generated | 2026-07-25 |
| Audited by | Database audit — July 2026 |

---

## Summary Statistics

| Category | Count | Coverage |
|----------|-------|----------|
| Nhóm A — Quản trị hệ thống (STT 1–5) | 5 | 5/5 Covered |
| Nhóm B — Quản lý danh mục (STT 6–18) | 13 | 13/13 Covered |
| Nhóm C — Quản lý ATTP (STT 19–40) | 22 | 22/22 Covered |
| Nhóm E — Cổng thông tin công khai (STT 41–49) | 9 | 9/9 Covered (shared tables) |
| Nhóm F — Tích hợp dữ liệu (STT 50–57) | 8 | 8/8 Covered |
| NFR — Bảo mật & vận hành | 8 | 6/8 Covered, 2 Partial |
| **Tổng** | **65** | **63 Covered, 2 Partial** |

**Partial coverage**: Audit log retention (lưu trữ 2 năm — cần policy ngoài DB) và Session management (HTTP-only cookie — xử lý ở application layer).

---

## Traceability Matrix

---

### NHÓM A — Quản trị Hệ thống

---

#### REQ-001: STT 1 — Quản lý Vai trò (Roles)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 1 |
| Bounded context | Organizations / Admin |
| Persistence responsibility | ABP built-in (Identity module) |
| Tables | `AbpRoles`, `AbpRoleClaims`, `AbpPermissionGrants`, `AbpUserRoles` |
| Coverage | **Covered** — ABP Framework 9 Identity quản lý toàn bộ |

**Gap**: Không có gap. ABP cung cấp CRUD vai trò, gán quyền cây, và phân quyền theo module.

---

#### REQ-002: STT 2 — Quản lý Người dùng (Users)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 2 |
| Bounded context | Organizations |
| Persistence responsibility | ABP Identity + custom extension |
| Tables | `AbpUsers`, `AbpUserRoles`, `AbpUserLogins`, `app_user_profiles`, `password_history` (NEW) |
| Coverage | **Covered** — sau khi thêm `password_history` |

**Mapping chi tiết:**
- Thông tin cơ bản (email, tên, SĐT): `AbpUsers`
- Thông tin tổ chức (đơn vị, chức vụ, phòng ban): `app_user_profiles`
- Password expires / must change: `app_user_profiles.password_expires_at`, `must_change_password`
- Không trùng 5 mật khẩu gần nhất: `password_history` (NEW — CRITICAL fix)
- Khóa tài khoản: `AbpUsers.IsActive` + `AbpSettings` (max login attempts)
- Mật khẩu hết hạn 90 ngày: `app_user_profiles.password_expires_at`

**Gap trước audit**: Thiếu bảng `password_history` — đã thêm.

---

#### REQ-003: STT 3 — Nhật ký Kiểm soát Hệ thống (Audit Log)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 3 |
| Bounded context | Cross-cutting |
| Persistence responsibility | ABP Audit Logging module |
| Tables | `AbpAuditLogs`, `AbpAuditLogActions`, `AbpEntityChanges`, `AbpEntityPropertyChanges` |
| Coverage | **Covered** |

**Mapping chi tiết:**
- User ID, tên, email: `AbpAuditLogs.UserId`, `UserName`
- Organization: `AbpAuditLogs.TenantId` (repurposed) hoặc custom extra_properties
- Module / Action type: `AbpAuditLogActions`
- Entity type / Entity ID, before/after diff: `AbpEntityChanges`, `AbpEntityPropertyChanges`
- IP, User agent, Timestamp: `AbpAuditLogs.ClientIpAddress`, `BrowserInfo`, `ExecutionTime`
- Execution time: `AbpAuditLogs.ExecutionDuration`
- Login failures: `AbpAuditLogs` với `Exceptions` field

**Lưu trữ 2 năm**: Xem NFR-003 — cần PostgreSQL partitioning hoặc scheduled cleanup job.

---

#### REQ-004: STT 4 — Quản lý Cấu hình Hệ thống (Settings)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 4 |
| Bounded context | Admin |
| Persistence responsibility | ABP Settings module |
| Tables | `AbpSettings`, `AbpFeatureValues` |
| Coverage | **Covered** |

**Mapping chi tiết:**
- Mọi cấu hình (security, email, SMTP, MinIO, thông báo): `AbpSettings` key-value store
- Credentials MinIO (encrypted): `AbpSettings` với value encrypted
- Số ngày cảnh báo hết hạn giấy phép: `AbpSettings` key `FoodSafe.License.ExpiryWarningDays`

---

#### REQ-005: STT 5 — Quản lý Phân quyền (Access Management)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 5 |
| Bounded context | Admin |
| Persistence responsibility | ABP Authorization module |
| Tables | `AbpPermissionGrants`, `AbpRoleClaims`, `AbpUserClaims` |
| Coverage | **Covered** |

---

### NHÓM B — Quản lý Danh mục

---

#### REQ-006: STT 6 — Quản lý Đơn vị Tổ chức (Organizations)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 6 |
| Bounded context | Organizations |
| Tables | `organizations` |
| Coverage | **Covered** |

**Mapping:**
- 3 cấp (Tỉnh/Huyện/Xã): `organizations.level` (1/2/3)
- Cây tổ chức: `organizations.parent_id` (self-referencing FK)
- Kích hoạt/vô hiệu hóa: `organizations.is_active`
- Liên kết địa lý: `organizations.province_id`, `district_id`

---

#### REQ-007: STT 7 — Quản lý Tài khoản Đơn vị

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 7 |
| Bounded context | Organizations |
| Tables | `app_user_profiles` (organization_id scoping), `AbpUsers`, `AbpUserRoles` |
| Coverage | **Covered** — là view phân cấp của STT 2 |

---

#### REQ-008: STT 8 — Quản lý Quốc gia (Countries)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_countries` |
| Coverage | **Covered** |

---

#### REQ-009: STT 9 — Quản lý Vùng/Miền (Regions)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_regions` |
| Coverage | **Covered** |

---

#### REQ-010: STT 10 — Quản lý Tỉnh/Thành phố (Provinces)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_provinces` (FK → `cat_regions`) |
| Coverage | **Covered** |

---

#### REQ-011: STT 11 — Quản lý Huyện/Quận và Xã/Phường

| Attribute | Value |
|-----------|-------|
| Tables | `cat_districts` (FK → `cat_provinces`), `cat_communes` (FK → `cat_districts`) |
| Coverage | **Covered** |

---

#### REQ-012: STT 12 — Quản lý Phân loại Cơ sở (Business Classification)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_business_classifications` |
| Coverage | **Covered** |

**Mapping:** `risk_level` (1=Cao, 2=Vừa, 3=Thấp), `criteria` (tiêu chí phân loại).

---

#### REQ-013: STT 13 — Quản lý Nhóm Sản phẩm (Product Groups)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_product_groups` (self-referencing FK cho 2 cấp) |
| Coverage | **Covered** |

---

#### REQ-014: STT 14 — Quản lý Loại hình Cơ sở (Business Types)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_business_types` |
| Coverage | **Covered** |

---

#### REQ-015: STT 15 — Quản lý Loại hình Quảng cáo (Ad Types)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_advertisement_types` |
| Coverage | **Covered** |

---

#### REQ-016: STT 16 — Quản lý Cơ sở Kiểm nghiệm (Testing Centers)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_testing_centers` |
| Coverage | **Covered** |

**Mapping:** `accreditation_number`, `accreditation_scope`, `accreditation_expiry` — đủ cho STT 16.

---

#### REQ-017: STT 17 — Quản lý Dịch vụ Kiểm nghiệm (Testing Services)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_testing_services` (FK → `cat_testing_centers`) |
| Coverage | **Covered** |

**Mapping:** `unit_price`, `turnaround_days`, `method` (TCVN/ISO).

---

#### REQ-018: STT 18 — Quản lý Loại Văn bản (Document Types)

| Attribute | Value |
|-----------|-------|
| Tables | `cat_document_types` |
| Coverage | **Covered** |

---

### NHÓM C — Quản lý ATTP

---

#### REQ-019: STT 19 — Quản lý Cơ sở SXKD (Businesses)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 19 |
| Bounded context | BusinessManagement |
| Tables | `businesses`, `business_product_groups`, `business_handlers` |
| Coverage | **Covered** — sau audit improvements |

**Mapping chi tiết:**
- Thông tin cơ bản: `businesses` (name, code, tax_code, representative_name...)
- Địa chỉ + GPS: `address_street/commune/district/province`, `address_latitude/longitude`
- Nhóm sản phẩm (M2M): `business_product_groups`
- Người trực tiếp kinh doanh: `business_handlers`
- Phân loại nguy cơ: `businesses.business_classification_id`
- Bản đồ (Leaflet): `address_latitude`, `address_longitude`
- Data scoping: `businesses.organization_id`

**Gap trước audit (HIGH):**
- `businesses.tax_code` thiếu UNIQUE constraint → đã thêm `UNIQUE INDEX uq_businesses_tax_code ON businesses(tax_code) WHERE tax_code IS NOT NULL AND is_deleted = FALSE`
- Thiếu index trên `tax_code` → đã thêm

---

#### REQ-020: STT 20 — Quản lý Sản phẩm (Products)

| Attribute | Value |
|-----------|-------|
| Tables | `products` (FK → `businesses`, `cat_product_groups`, `cat_countries`) |
| Coverage | **Covered** |

---

#### REQ-021: STT 21 — Tự công bố Sản phẩm (Self Declarations)

| Attribute | Value |
|-----------|-------|
| Tables | `self_declarations` |
| Coverage | **Covered** — sau khi thêm UNIQUE constraint |

**Gap trước audit (CRITICAL):** Thiếu UNIQUE constraint trên `declaration_number` → đã thêm:
```sql
CREATE UNIQUE INDEX uq_self_declarations_number
  ON self_declarations(declaration_number, organization_id)
  WHERE is_deleted = FALSE;
```

---

#### REQ-022: STT 22 — Đăng ký Công bố Sản phẩm — DKCB (Product Registrations)

| Attribute | Value |
|-----------|-------|
| Tables | `product_registrations` |
| Coverage | **Covered** — sau khi thêm UNIQUE constraint |

**Gap trước audit (CRITICAL):** Thiếu UNIQUE trên `registration_number` → đã thêm:
```sql
CREATE UNIQUE INDEX uq_product_registrations_number
  ON product_registrations(registration_number, organization_id)
  WHERE is_deleted = FALSE;
```

---

#### REQ-023: STT 23 — Đăng ký Nội dung Quảng cáo (Ad Registrations)

| Attribute | Value |
|-----------|-------|
| Tables | `advertisement_registrations`, `advertisement_registration_products` |
| Coverage | **Covered** |

---

#### REQ-024: STT 24 — Giấy Xác nhận Đủ Điều kiện — DDK (Eligibility Certificates)

| Attribute | Value |
|-----------|-------|
| Tables | `eligibility_certificates` |
| Coverage | **Covered** — sau khi thêm UNIQUE constraint |

**Gap trước audit (CRITICAL):** Thiếu UNIQUE trên `certificate_number` → đã thêm:
```sql
CREATE UNIQUE INDEX uq_eligibility_certificates_number
  ON eligibility_certificates(certificate_number, organization_id)
  WHERE is_deleted = FALSE;
```

---

#### REQ-025: STT 25 — Giấy Chứng nhận Lưu hành Tự do — CFS

| Attribute | Value |
|-----------|-------|
| Tables | `cfs_certificates` (FK → `businesses`, `products`, `cat_countries`) |
| Coverage | **Covered** — sau khi thêm UNIQUE constraint |

**Gap trước audit (CRITICAL):** Thiếu UNIQUE trên `certificate_number` → đã thêm:
```sql
CREATE UNIQUE INDEX uq_cfs_certificates_number
  ON cfs_certificates(certificate_number, organization_id)
  WHERE is_deleted = FALSE;
```

---

#### REQ-026: STT 26 — Giấy Chứng nhận Thực phẩm Xuất khẩu (Export Certificates)

| Attribute | Value |
|-----------|-------|
| Tables | `export_food_certificates` |
| Coverage | **Covered** — sau khi thêm UNIQUE constraint |

**Gap trước audit (CRITICAL):** Thiếu UNIQUE trên `certificate_number` → đã thêm:
```sql
CREATE UNIQUE INDEX uq_export_food_certificates_number
  ON export_food_certificates(certificate_number, organization_id)
  WHERE is_deleted = FALSE;
```

---

#### REQ-027: STT 27 — Kế hoạch Thanh Kiểm tra (Inspection Plans)

| Attribute | Value |
|-----------|-------|
| Tables | `inspection_plans`, `inspection_plan_items` |
| Coverage | **Covered** — sau audit improvements |

**Mapping workflow:** `status` (1=Draft, 2=Submitted, 3=Approved, 4=InProgress, 5=Completed, 6=Cancelled/Rejected)

**Gaps trước audit:**
- (HIGH) Thiếu `rejected_reason` column cho Reject() transition → đã thêm `rejected_reason TEXT NULL, rejected_at TIMESTAMPTZ NULL, rejected_by_id UUID NULL`
- (HIGH) Thiếu UNIQUE `(plan_id, business_id)` trong `inspection_plan_items` → đã thêm:
  ```sql
  CREATE UNIQUE INDEX uq_inspection_plan_items_business
    ON inspection_plan_items(plan_id, business_id);
  ```

---

#### REQ-028: STT 28 — Kết quả Thanh Kiểm tra (Inspection Results)

| Attribute | Value |
|-----------|-------|
| Tables | `inspection_results`, `inspection_violations`, `inspection_result_inspectors` (NEW) |
| Coverage | **Covered** — sau khi thay thế UUID[] array |

**Mapping:**
- Thành phần đoàn thanh tra: `inspection_result_inspectors` (NEW) thay cho `inspector_ids UUID[]`
- Vi phạm phát hiện: `inspection_violations`
- Tiền phạt / Quyết định xử phạt: `fine_amount`, `admin_decision_number`
- Theo dõi khắc phục: `follow_up_required`, `follow_up_date`, `inspection_violations.is_remedied`

**Gap trước audit (CRITICAL):** `inspector_ids UUID[]` vi phạm relational model, không enforce FK → thay bằng bảng `inspection_result_inspectors`.

---

#### REQ-029: STT 29 — Cảnh báo VSATTP (ATTP Alerts)

| Attribute | Value |
|-----------|-------|
| Tables | `atp_alerts`, `news_linked_alerts` |
| Coverage | **Covered** — sau audit improvement |

**Gap trước audit (MEDIUM):** `atp_alerts` không liên kết ngược về `public_alert_submissions.id` khi được convert → đã thêm `public_submission_id UUID NULL` với FK.

---

#### REQ-030: STT 30 — Tin tức, Hoạt động ATTP (News)

| Attribute | Value |
|-----------|-------|
| Tables | `atp_news`, `news_linked_alerts` |
| Coverage | **Covered** |

**Mapping:** `tags TEXT[]`, `view_count`, `thumbnail_storage_path` (MinIO).

---

#### REQ-031: STT 31 — Ca Ngộ độc Nhỏ lẻ (Food Poisoning Cases)

| Attribute | Value |
|-----------|-------|
| Tables | `food_poisoning_cases`, `poisoning_case_error_reports` |
| Coverage | **Covered** — sau audit improvement |

**Gap trước audit (HIGH):** `food_poisoning_cases` không có FK về `food_poisoning_incidents` khi ca thuộc vụ → đã thêm `incident_id UUID NULL` với FK.

**Workflow states:** Draft(1) → Reported(2) → Verified(3). Sau Verified: chỉ tạo `poisoning_case_error_reports`.

---

#### REQ-032: STT 32 — Vụ Ngộ độc Thực phẩm (Food Poisoning Incidents)

| Attribute | Value |
|-----------|-------|
| Tables | `food_poisoning_incidents`, `poisoning_incident_error_reports` |
| Coverage | **Covered** |

**Workflow states:** Draft(1) → Reported(2) → Verified(3) → Concluded(4).

---

#### REQ-033: STT 33 — Báo cáo Ngộ độc Thực phẩm — NĐTP (Monthly)

| Attribute | Value |
|-----------|-------|
| Tables | `ndtp_reports`, `ndtp_report_error_notifications` |
| Coverage | **Covered** |

**Workflow:** `status` (1=Draft, 2=Submitted, 3=Verified, 4=Returned, 5=Completed).  
UNIQUE `(organization_id, period_year, period_month)` — một đơn vị chỉ có 1 báo cáo/tháng.

---

#### REQ-034: STT 34 — Báo cáo Công tác ATTP (6 tháng + Năm)

| Attribute | Value |
|-----------|-------|
| Tables | `atp_work_reports`, `atp_work_report_error_notifications` (NEW) |
| Coverage | **Covered** — sau khi thêm error notification table |

**Gap trước audit (HIGH):** Chỉ có error notifications cho NĐTP reports, không có cho ATP work reports → đã thêm `atp_work_report_error_notifications`.

---

#### REQ-035: STT 35 — Báo cáo Tháng Hành động ATTP (Yearly)

| Attribute | Value |
|-----------|-------|
| Tables | `action_month_reports`, `action_month_report_error_notifications` (NEW) |
| Coverage | **Covered** — sau khi thêm error notification table |

**Gap trước audit (HIGH):** Tương tự STT 34 → đã thêm `action_month_report_error_notifications`.

---

#### REQ-036: STT 36 — Phân tích Mối nguy cơ (Risk Analysis)

| Attribute | Value |
|-----------|-------|
| Tables | `risk_analyses` |
| Coverage | **Covered** |

**Mapping:** `risk_level` (1=Low → 4=Critical), `is_public`, `status` (Draft/Published).

---

#### REQ-037: STT 37 — Kết quả Kiểm nghiệm (Testing Results)

| Attribute | Value |
|-----------|-------|
| Tables | `testing_results`, `testing_result_services` (NEW) |
| Coverage | **Covered** — sau khi thêm `testing_result_services` |

**Gap trước audit (CRITICAL):** `testing_results` không có FK về `cat_testing_services.id` — chỉ có `testing_center_id`. STT 37 yêu cầu liên kết tới dịch vụ kiểm nghiệm cụ thể → đã thêm bảng junction `testing_result_services`.

---

#### REQ-038: STT 38 — Quản lý Văn bản (Regulatory Documents)

| Attribute | Value |
|-----------|-------|
| Tables | `regulatory_documents` |
| Coverage | **Covered** — sau khi thêm full-text search |

**Gap trước audit (MEDIUM):** Chỉ có GIN trigram index trên `title`. STT 38 yêu cầu full-text search → đã thêm:
```sql
ALTER TABLE regulatory_documents ADD COLUMN fts_vector TSVECTOR
  GENERATED ALWAYS AS (to_tsvector('simple', title || ' ' || COALESCE(summary, ''))) STORED;
CREATE INDEX idx_rd_fts ON regulatory_documents USING GIN (fts_vector);
```

---

#### REQ-039: STT 39 — Dashboard Thống kê Tổng hợp

| Attribute | Value |
|-----------|-------|
| Tables | `cached_dashboard_stats` (cache layer), truy vấn trực tiếp từ tất cả bảng |
| Coverage | **Covered** |

**Pattern:** Cache hóa số liệu hàng ngày vào `cached_dashboard_stats`. Real-time queries cho dữ liệu nhỏ, cache cho aggregations lớn.

---

#### REQ-040: STT 40 — Thống kê Báo cáo (Statistics)

| Attribute | Value |
|-----------|-------|
| Tables | Queries trên toàn bộ bảng domain + `cached_dashboard_stats` |
| Coverage | **Covered** — không cần thêm bảng riêng |

---

### NHÓM E — Cổng Thông tin Công khai

*Nhóm E (STT 41–49) không cần bảng riêng — dùng chung bảng với nhóm C, filter `is_public = TRUE`.*

---

#### REQ-041: STT 41 — Tra cứu Cơ sở SXKD (Public)

| Tables | `businesses`, `cat_business_types`, `cat_business_classifications` |
|--------|-----|
| Coverage | **Covered** — filter `is_deleted = FALSE`, status active |

---

#### REQ-042: STT 42 — Tra cứu Sản phẩm (Public)

| Tables | `products`, `businesses` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-043: STT 43 — Tra cứu Giấy phép (Public)

| Tables | `product_registrations`, `self_declarations`, `advertisement_registrations`, `eligibility_certificates`, `cfs_certificates`, `export_food_certificates` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-044: STT 44 — Tra cứu Kết quả Kiểm nghiệm (Public)

| Tables | `testing_results` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-045: STT 45 — Tra cứu Kết quả Thanh Kiểm tra (Public)

| Tables | `inspection_results`, `inspection_violations` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-046: STT 46 — Tra cứu Cảnh báo VSATTP (Public)

| Tables | `atp_alerts` — filter `is_public = TRUE AND status = 2` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-047: STT 47 — Tra cứu Phân tích Mối nguy cơ (Public)

| Tables | `risk_analyses` — filter `is_public = TRUE AND status = 2` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-048: STT 48 — Tra cứu Tin tức, Hoạt động ATTP (Public)

| Tables | `atp_news` — filter `is_public = TRUE AND status = 2` |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-049: STT 49 — Gửi Phản ánh Cảnh báo (Public Alert Submission)

| Tables | `public_alert_submissions`, `atp_alerts` (khi convert), `document_owners`, `file_attachments` |
|--------|-----|
| Coverage | **Covered** |

**Mapping:**
- CAPTCHA verified: `public_alert_submissions.captcha_verified`
- Mã tra cứu: `tracking_code` (UNIQUE, random)
- Convert thành cảnh báo: `atp_alerts.public_submission_id` là FK authoritative
  và UNIQUE; reverse lookup được derive, không lưu reverse FK độc lập.

---

### NHÓM F — Tích hợp Dữ liệu

---

#### REQ-050: STT 50 — Quản lý Đặc tả API (API Spec Management)

| Attribute | Value |
|-----------|-------|
| Tables | `api_specs` |
| Coverage | **Covered** |

**Mapping:**
- Tuân thủ Thông tư 31/2026/TT-BCT: tracked qua `api_specs.data_type` và `direction`
- Credentials encrypted: `auth_config_encrypted TEXT` (AES-256)
- Test connection: application logic (không cần cột riêng)

---

#### REQ-051: STT 51 — Lịch sử Chia sẻ Cảnh báo

| Tables | `data_sharing_histories` — `data_type = 1` (Alert) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-052: STT 52 — Lịch sử Chia sẻ Kết quả Thanh kiểm tra

| Tables | `data_sharing_histories` — `data_type = 2` (InspectionResult) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-053: STT 53 — Lịch sử Chia sẻ Ngộ độc Thực phẩm

| Tables | `data_sharing_histories` — `data_type = 3` (FoodPoisoning) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-054: STT 54 — Lịch sử Chia sẻ Giấy phép

| Tables | `data_sharing_histories` — `data_type = 4` (License) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-055: STT 55 — Lịch sử Chia sẻ Sản phẩm

| Tables | `data_sharing_histories` — `data_type = 5` (Product) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-056: STT 56 — Lịch sử Chia sẻ Tin tức

| Tables | `data_sharing_histories` — `data_type = 6` (News) |
|--------|-----|
| Coverage | **Covered** |

---

#### REQ-057: STT 57 — Lịch sử Chia sẻ Cơ sở

| Tables | `data_sharing_histories` — `data_type = 7` (Business) |
|--------|-----|
| Coverage | **Covered** |

**Gaps trước audit (STT 51–57 — HIGH/MEDIUM):**
- `data_sharing_histories` thiếu `idempotency_key` → đã thêm `idempotency_key VARCHAR(100) UNIQUE NULL`
- Thiếu `next_retry_at TIMESTAMPTZ NULL` cho retry scheduling
- Thiếu `payload_checksum VARCHAR(64) NULL` (SHA-256) cho integrity verification

---

### Non-Functional Requirements (NFR)

---

#### NFR-001: Chính sách Mật khẩu

| Attribute | Value |
|-----------|-------|
| Source | docs/07-non-functional-requirements.md §Security; docs/01-functional-requirements.md §STT 2 |
| Tables | `password_history` (NEW), `AbpSettings`, `app_user_profiles` |
| Coverage | **Covered** — sau khi thêm `password_history` |

**Requirements:**
- Tối thiểu 8 ký tự, chữ hoa/thường/số/ký tự đặc biệt: `AbpSettings` (Identity options)
- Không trùng 5 mật khẩu gần nhất: `password_history` — lưu 5 hash gần nhất
- Hết hạn 90 ngày: `app_user_profiles.password_expires_at`
- Đổi mật khẩu lần đầu: `app_user_profiles.must_change_password`

---

#### NFR-002: Session Management

| Attribute | Value |
|-----------|-------|
| Source | docs/07-non-functional-requirements.md §Security |
| Tables | `AbpOpenIddictTokens` (token storage), `AbpSettings` (timeout config) |
| Coverage | **Partial** — Session timeout và HTTP-Only cookie là application-layer concern, không cần DB thay đổi |

**Note:** HTTP-Only cookie và Secure flag được cấu hình ở ASP.NET Core middleware. DB chỉ lưu token để invalidate khi cần.

---

#### NFR-003: Audit Log Retention (2 năm)

| Attribute | Value |
|-----------|-------|
| Source | docs/01-functional-requirements.md §STT 3 |
| Tables | `AbpAuditLogs`, `AbpAuditLogActions`, `AbpEntityChanges` |
| Coverage | **Partial** — ABP lưu logs, nhưng retention policy cần scheduled job hoặc PostgreSQL partitioning |

**Khuyến nghị:** Partition `AbpAuditLogs` theo năm:
```sql
CREATE TABLE abp_audit_logs_2024 PARTITION OF AbpAuditLogs
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```
Hoặc dùng ABP Background Job để archive/delete logs > 2 năm.

---

#### NFR-004: File Attachments

| Attribute | Value |
|-----------|-------|
| Source | CLAUDE.md §8 — File & Document Requirements |
| Tables | `file_attachments` |
| Coverage | **Covered** — sau audit improvements |

**Gaps trước audit (HIGH):**
- Thiếu `checksum VARCHAR(64)` (SHA-256 để verify integrity)
- Thiếu `virus_scan_status SMALLINT` (1=Pending, 2=Clean, 3=Infected, 4=Error)
- Thiếu `retention_until DATE NULL` (cho document lifecycle)
- Thiếu owner FK và phiên bản nội dung báo cáo. v2.3 thay polymorphic/version
  column bằng `document_owners`; tệp báo cáo đã gửi thuộc owner của immutable
  `*_report_submissions` tương ứng.

---

#### NFR-005: CSRF Protection

| Attribute | Value |
|-----------|-------|
| Coverage | **Covered** — ABP built-in CSRF tokens, không cần bảng riêng |

---

#### NFR-006: XSS Protection

| Attribute | Value |
|-----------|-------|
| Coverage | **Covered** — HTML encode ở application layer; `atp_news.content` được sanitize trước khi lưu |

---

#### NFR-007: CAPTCHA

| Attribute | Value |
|-----------|-------|
| Tables | `public_alert_submissions.captcha_verified BOOL` |
| Coverage | **Covered** |

---

#### NFR-008: Data Integration (Thông tư 31/2026/TT-BCT)

| Attribute | Value |
|-----------|-------|
| Tables | `api_specs`, `data_sharing_histories` |
| Coverage | **Covered** |

**Mapping:** Mọi API call đi/đến đều được ghi vào `data_sharing_histories` với request/response payload đầy đủ, status, retry count, và (sau audit) `idempotency_key` + `payload_checksum`.

---

## v2.3 Independent-resolution traceability addendum

| Source requirement | Enforced persistence |
|---|---|
| PDF req. 15; STT 19–28 — server data scope and facility children | Composite business/product/organization FKs |
| PDF STT 20, 22, 27–32, 40 — geography **or management focal point** | `management_scope_assignments` plus organization tree |
| PDF req. 32 — related-field DB integrity | hierarchy trigger, geographic composite FKs, inspection/testing tuples |
| PDF STT 21–28; req. 39 — files on electronic records | `document_owners` + `file_attachments.document_owner_id` FK |
| PDF STT 33–35 — official send locks content; correction/resubmit | immutable three typed `*_report_submissions` tables |
| PDF STT 51–57 — detailed receive/share history and retry | envelope `data_sharing_histories` + immutable `data_sharing_attempts` |
| PDF STT 21–26; public lookup | official-number uniqueness across retained soft-deleted history |
| PDF STT 29/48 — citizen warning verification/conversion | unique authoritative `atp_alerts.public_submission_id` |

Unimplemented partially accepted items and their stakeholder questions are
listed in `15-database-assumptions-and-open-questions.md`; rejected IDB-013 and
IDB-027 are not requirements.

## Tổng kết Gap Analysis

| Priority | Gap | Table/Column bị ảnh hưởng | Trạng thái |
|----------|-----|--------------------------|------------|
| CRITICAL | Thiếu `testing_service_id` FK trong testing_results | `testing_result_services` (NEW) | Đã fix |
| CRITICAL | Không có UNIQUE trên `registration_number` | `product_registrations` | Đã fix |
| CRITICAL | Không có UNIQUE trên `declaration_number` | `self_declarations` | Đã fix |
| CRITICAL | Không có UNIQUE trên `certificate_number` | `eligibility_certificates`, `cfs_certificates`, `export_food_certificates` | Đã fix |
| CRITICAL | Thiếu `password_history` table | `password_history` (NEW) | Đã fix |
| CRITICAL | `inspector_ids UUID[]` vi phạm relational model | `inspection_result_inspectors` (NEW) | Đã fix |
| HIGH | Thiếu error notification cho ATP/Action Month reports | 2 bảng NEW | Đã fix |
| HIGH | `file_attachments` thiếu checksum, virus scan, retention | `file_attachments` | Đã fix |
| HIGH | `data_sharing_histories` thiếu idempotency_key, next_retry_at | `data_sharing_histories` | Đã fix |
| HIGH | Thiếu UNIQUE `(plan_id, business_id)` trong plan_items | `inspection_plan_items` | Đã fix |
| HIGH | `food_poisoning_cases` không link về `incidents` | `food_poisoning_cases.incident_id` (NEW col) | Đã fix |
| HIGH | `businesses.tax_code` thiếu UNIQUE | `businesses` | Đã fix |
| HIGH | `inspection_plans` thiếu `rejected_reason` | `inspection_plans` | Đã fix |
| MEDIUM | `atp_alerts` không link về `public_alert_submissions` | `atp_alerts.public_submission_id` (NEW col) | Đã fix |
| MEDIUM | `data_sharing_histories` thiếu `payload_checksum` | `data_sharing_histories` | Đã fix |
| MEDIUM | `regulatory_documents` cần tsvector full-text search | `regulatory_documents.fts_vector` (NEW col) | Đã fix |
| MEDIUM | Thiếu index trên `businesses.tax_code` | Index thêm | Đã fix |
