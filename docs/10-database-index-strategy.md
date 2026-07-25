# Database Index Strategy — FoodSafe

> Hệ thống quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh  
> PostgreSQL 15 | Reviewed: 2026-07-25

---

## 1. Indexing Principles

1. **Index lazy** — Thêm index khi query pattern rõ ràng, không thêm phòng ngừa.
2. **Partial indexes first** — Luôn ưu tiên `WHERE is_deleted = FALSE` cho soft-delete tables.
3. **Selectivity matters** — Index trên cột có ít distinct values (boolean, low-cardinality SMALLINT) chỉ có giá trị khi kết hợp cột khác.
4. **Cover write cost** — Mỗi index tăng latency INSERT/UPDATE. Với bảng ghi nhiều (data_sharing_histories), giới hạn index.
5. **FK columns must be indexed** — Mọi FK column cần index (PostgreSQL không tự tạo).
6. **GIN for trigram / full-text** — Dùng `GIN (col gin_trgm_ops)` cho ILIKE; `GIN (tsvector_col)` cho full-text.
7. **GiST for spatial** — Dùng GiST hoặc BRIN cho geo queries nếu volume tăng lên.
8. **Composite index column order** — Cột equality filter trước, cột range filter sau.
9. **Unique partial indexes** — Dùng `UNIQUE ... WHERE condition` thay vì NULL workarounds.
10. **Naming convention** — `idx_{table}_{columns}` cho non-unique; `uq_{table}_{columns}` cho unique.

---

## 2. Index Catalog

---

### ORGANIZATIONS MODULE

#### `organizations`

| Index | Columns | Type | Unique | Partial | Serves | Selectivity | Write cost |
|-------|---------|------|--------|---------|--------|-------------|------------|
| `pk_organizations` | id | btree | Y | | PK lookup | High | Minimal |
| `uq_organizations_code` | code | btree | Y | | Code lookup | High | Low |
| `idx_organizations_parent_id` | parent_id | btree | N | `WHERE is_deleted = FALSE` | Cây tổ chức — lấy con | Medium | Low |
| `idx_organizations_level` | level | btree | N | `WHERE is_deleted = FALSE` | Filter cấp 1/2/3 | Low | Low |

**Justification `idx_organizations_level`:** Dù cardinality thấp (3 values), bảng nhỏ (~250 rows) nên index overhead không đáng kể và giúp query cấp tỉnh nhanh.

#### `app_user_profiles`

| Index | Columns | Type | Unique | Partial | Serves |
|-------|---------|------|--------|---------|--------|
| `pk_app_user_profiles` | id | btree | Y | | PK |
| `uq_app_user_profiles_user_id` | user_id | btree | Y | | 1-1 lookup với AbpUsers |
| `idx_app_user_profiles_org_id` | organization_id | btree | N | | Filter user theo đơn vị |

---

### CATALOGS MODULE

Tất cả catalog tables đều nhỏ (<5K rows). Index tối giản: PK + UNIQUE code + FK indexes.

| Table | Indexes |
|-------|---------|
| `cat_countries` | PK, `uq_cat_countries_code` (code_alpha2) |
| `cat_regions` | PK, `uq_cat_regions_code` |
| `cat_provinces` | PK, `uq_cat_provinces_code`, `idx_cat_provinces_region` (region_id) |
| `cat_districts` | PK, `uq_cat_districts_code`, `idx_cat_districts_province` (province_id) WHERE is_deleted=FALSE |
| `cat_communes` | PK, `uq_cat_communes_code`, `idx_cat_communes_district` (district_id) WHERE is_deleted=FALSE |
| `cat_product_groups` | PK, `uq_cat_product_groups_code`, `idx_cat_product_groups_parent` (parent_id) |
| `cat_business_types` | PK, `uq_cat_business_types_code` |
| `cat_business_classifications` | PK, `uq_cat_business_classifications_code` |
| `cat_advertisement_types` | PK, `uq_cat_advertisement_types_code` |
| `cat_document_types` | PK, `uq_cat_document_types_code` |
| `cat_testing_centers` | PK, `uq_cat_testing_centers_code` |
| `cat_testing_services` | PK, `idx_cat_testing_services_center` (testing_center_id) WHERE is_deleted=FALSE |

---

### BUSINESS MANAGEMENT MODULE

#### `businesses`

| Index | Columns | Type | Unique | Partial | Serves | Selectivity |
|-------|---------|------|--------|---------|--------|-------------|
| `pk_businesses` | id | btree | Y | | PK | High |
| `uq_businesses_code` | code | btree | Y | `WHERE code IS NOT NULL AND is_deleted=FALSE` | Code lookup | High |
| `uq_businesses_tax_code` | tax_code | btree | Y | `WHERE tax_code IS NOT NULL AND is_deleted=FALSE` | **NEW** — unique tax code | High |
| `idx_businesses_org_id` | organization_id | btree | N | `WHERE is_deleted=FALSE` | Data scoping (critical path) | Medium |
| `idx_businesses_type` | business_type_id | btree | N | `WHERE is_deleted=FALSE` | Filter loại hình | Low-Medium |
| `idx_businesses_status` | status | btree | N | `WHERE is_deleted=FALSE` | Filter trạng thái | Low |
| `idx_businesses_name_trgm` | name | GIN (trgm) | N | `WHERE is_deleted=FALSE` | ILIKE search tên cơ sở | Medium |
| `idx_businesses_location` | address_latitude, address_longitude | btree | N | `WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND is_deleted=FALSE` | Leaflet map queries | High |
| `idx_businesses_tax_code` | tax_code | btree | N | `WHERE tax_code IS NOT NULL AND is_deleted=FALSE` | Search theo MST | High |

**Note:** `idx_businesses_org_id` là index quan trọng nhất — mọi query đều filter `organization_id` theo data scoping rules.

#### `business_handlers`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_business_handlers_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |

#### `products`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_products_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_products_org` | organization_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_products_name_trgm` | name | GIN (trgm) | N | `WHERE is_deleted=FALSE` |

#### `self_declarations`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_self_declarations_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_self_declarations_status` | status, expiry_date | btree | N | `WHERE is_deleted=FALSE` |
| `uq_self_declarations_number` | declaration_number, organization_id | btree | Y | `WHERE is_deleted=FALSE` — **NEW** |

**Justification composite unique:** Số tự công bố unique trong phạm vi đơn vị tổ chức cấp phép.

---

### LICENSING MODULE

#### `product_registrations`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_product_registrations_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_product_registrations_expiry` | expiry_date, status | btree | N | `WHERE is_deleted=FALSE` |
| `uq_product_registrations_number` | registration_number, organization_id | btree | Y | `WHERE is_deleted=FALSE` — **NEW** |

**Justification `idx_product_registrations_expiry`:** Dùng cho job cảnh báo hết hạn (chạy hàng ngày).

#### `eligibility_certificates`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_eligibility_certificates_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_eligibility_certificates_expiry` | expiry_date, status | btree | N | `WHERE is_deleted=FALSE` |
| `uq_eligibility_certificates_number` | certificate_number, organization_id | btree | Y | `WHERE is_deleted=FALSE` — **NEW** |

#### `cfs_certificates` và `export_food_certificates`

| Index | Columns | Unique | Note |
|-------|---------|--------|------|
| `uq_cfs_certificates_number` | certificate_number, organization_id | Y | **NEW** |
| `uq_export_food_certificates_number` | certificate_number, organization_id | Y | **NEW** |
| `idx_cfs_business` | business_id | N | WHERE is_deleted=FALSE |
| `idx_efc_business` | business_id | N | WHERE is_deleted=FALSE |

---

### INSPECTION MODULE

#### `inspection_plans`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `uq_inspection_plans_code` | plan_code, organization_id | btree | Y | |
| `idx_inspection_plans_org` | organization_id, year | btree | N | `WHERE is_deleted=FALSE` |
| `idx_inspection_plans_status` | status | btree | N | `WHERE is_deleted=FALSE` |

**Justification composite `(organization_id, year)`:** Danh sách kế hoạch luôn filter theo đơn vị + năm.

#### `inspection_plan_items`

| Index | Columns | Type | Unique | Partial | Note |
|-------|---------|------|--------|---------|------|
| `idx_inspection_plan_items_plan` | plan_id | btree | N | | Lấy items của kế hoạch |
| `idx_inspection_plan_items_business` | business_id | btree | N | | Lịch sử theo cơ sở |
| `uq_inspection_plan_items_business` | plan_id, business_id | btree | Y | | **NEW** — prevent duplicate |

#### `inspection_results`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_inspection_results_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_inspection_results_date` | inspection_date | btree | N | `WHERE is_deleted=FALSE` |
| `idx_inspection_results_org` | organization_id | btree | N | `WHERE is_deleted=FALSE` |

**Missing FK index found in audit:**
- `inspection_results.plan_id` — cần index nếu cần query kết quả theo kế hoạch:
  ```sql
  CREATE INDEX idx_inspection_results_plan ON inspection_results(plan_id)
    WHERE plan_id IS NOT NULL AND is_deleted = FALSE;
  ```

#### `inspection_result_inspectors` (NEW)

| Index | Columns | Type | Unique |
|-------|---------|------|--------|
| `pk_inspection_result_inspectors` | inspection_result_id, user_id | btree | Y |
| `idx_iri_user_id` | user_id | btree | N |

**Justification `idx_iri_user_id`:** Tìm tất cả cuộc thanh tra cán bộ đã tham gia.

---

### FOOD POISONING MODULE

#### `food_poisoning_cases`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_fpc_org` | organization_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_fpc_report_date` | report_date, status | btree | N | `WHERE is_deleted=FALSE` |
| `uq_fpc_case_code` | case_code, organization_id | btree | Y | `WHERE is_deleted=FALSE` |
| `idx_fpc_incident_id` | incident_id | btree | N | `WHERE incident_id IS NOT NULL AND is_deleted=FALSE` — **NEW** |

#### `food_poisoning_incidents`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_fpi_org` | organization_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_fpi_date` | occurrence_date | btree | N | `WHERE is_deleted=FALSE` |
| `uq_fpi_incident_code` | incident_code, organization_id | btree | Y | `WHERE is_deleted=FALSE` |

---

### REPORTING MODULE

#### `ndtp_reports`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `uq_ndtp_reports_period` | organization_id, period_year, period_month | btree | Y | |
| `idx_ndtp_reports_org_period` | organization_id, period_year, period_month | btree | N | `WHERE is_deleted=FALSE` |
| `idx_ndtp_reports_status` | status | btree | N | `WHERE is_deleted=FALSE` |

**Note:** `uq_ndtp_reports_period` đã bao phủ use case của `idx_ndtp_reports_org_period`. Cân nhắc giữ cả hai vì unique index không filter `is_deleted`.

#### `atp_work_reports`

| Index | Columns | Type | Unique | Partial | Note |
|-------|---------|------|--------|---------|------|
| `uq_atp_work_reports_halfyear` | organization_id, period_year, period_half | btree | Y | `WHERE period_type=1 AND period_half IS NOT NULL AND is_deleted=FALSE` | Half-year uniqueness |
| `uq_atp_work_reports_fullyear` | organization_id, period_year | btree | Y | `WHERE period_type=2 AND is_deleted=FALSE` | Full-year uniqueness |

**Justification partial unique indexes:** `period_half` có thể NULL cho full-year reports — dùng partial index thay vì xử lý NULL trong UNIQUE constraint.

#### `action_month_reports`

| Index | Columns | Type | Unique |
|-------|---------|------|--------|
| `uq_action_month_reports` | organization_id, period_year | btree | Y |

---

### ALERTS AND TESTING MODULE

#### `atp_alerts`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_atp_alerts_org` | organization_id, status | btree | N | `WHERE is_deleted=FALSE` |
| `idx_atp_alerts_public` | is_public, status, published_at DESC | btree | N | `WHERE is_deleted=FALSE` |

**Justification `idx_atp_alerts_public`:** Critical path cho cổng công khai — filter `is_public=TRUE AND status=2` rồi sort theo `published_at DESC`.

#### `atp_news`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_atp_news_public` | is_public, status, published_at DESC | btree | N | `WHERE is_deleted=FALSE` |
| `idx_atp_news_title_trgm` | title | GIN (trgm) | N | `WHERE is_deleted=FALSE` |

#### `regulatory_documents`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_rd_org` | organization_id, status | btree | N | `WHERE is_deleted=FALSE` |
| `idx_rd_title_trgm` | title | GIN (trgm) | N | `WHERE is_deleted=FALSE` |
| `idx_rd_fts` | fts_vector | GIN | N | | **NEW — full-text search** |

**Full-text search setup:**
```sql
-- Thêm generated column
ALTER TABLE regulatory_documents
  ADD COLUMN fts_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(summary, '') || ' ' ||
      COALESCE(document_number, ''))
  ) STORED;

-- GIN index trên generated column
CREATE INDEX idx_rd_fts ON regulatory_documents USING GIN (fts_vector);

-- Query pattern:
-- WHERE fts_vector @@ plainto_tsquery('simple', :query)
```

**Note:** Dùng `'simple'` dictionary thay vì `'vietnamese'` vì PostgreSQL không có sẵn Vietnamese dictionary. `'simple'` lowercase + no stemming — đủ tốt cho văn bản pháp luật.

#### `testing_results`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_testing_results_org` | organization_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_testing_results_business` | business_id | btree | N | `WHERE is_deleted=FALSE` |
| `idx_testing_results_center` | testing_center_id | btree | N | `WHERE is_deleted=FALSE` |

**Missing FK index found in audit:**
- `testing_results.inspection_result_id` cần index:
  ```sql
  CREATE INDEX idx_testing_results_inspection ON testing_results(inspection_result_id)
    WHERE inspection_result_id IS NOT NULL AND is_deleted = FALSE;
  ```

#### `testing_result_services` (NEW)

| Index | Columns | Type | Unique |
|-------|---------|------|--------|
| `pk_testing_result_services` | testing_result_id, testing_service_id | btree | Y |
| `idx_trs_service_id` | testing_service_id | btree | N |

#### `public_alert_submissions`

| Index | Columns | Type | Unique |
|-------|---------|------|--------|
| `uq_pas_tracking_code` | tracking_code | btree | Y |
| `idx_pas_status` | status | btree | N |

---

### CROSS-CUTTING

#### `file_attachments`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_file_attachments_entity` | entity_type, entity_id | btree | N | `WHERE is_deleted=FALSE` |

**Note:** `(entity_type, entity_id)` là primary access pattern — load tất cả files của 1 entity.

#### `status_history`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_status_history_entity` | entity_type, entity_id | btree | N | |

**Note:** Immutable log — không cần WHERE is_deleted.

#### `cached_dashboard_stats`

| Index | Columns | Type | Unique |
|-------|---------|------|--------|
| `uq_cds_org_date` | organization_id, stats_date | btree | Y |

#### `password_history` (NEW)

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `idx_password_history_user` | user_id, created_at DESC | btree | N | | 

**Justification:** Khi check duplicate password, query lấy 5 hash gần nhất: `WHERE user_id = :uid ORDER BY created_at DESC LIMIT 5`.

---

### DATA INTEGRATION MODULE

#### `api_specs`

| Index | Columns | Type | Unique | Partial |
|-------|---------|------|--------|---------|
| `uq_api_specs_code` | api_code, organization_id | btree | Y | `WHERE is_deleted=FALSE` |

#### `data_sharing_histories`

| Index | Columns | Type | Unique | Partial | Serves |
|-------|---------|------|--------|---------|--------|
| `idx_dsh_org_type` | organization_id, data_type, direction | btree | N | | Filter lịch sử theo đơn vị + loại |
| `idx_dsh_entity` | entity_type, entity_id | btree | N | | Lịch sử chia sẻ của 1 entity |
| `idx_dsh_initiated` | initiated_at DESC | btree | N | | Sắp xếp theo thời gian |
| `idx_dsh_status_retry` | status, next_retry_at | btree | N | `WHERE status IN (2,4)` | **NEW** — Background job retry |
| `uq_dsh_idempotency` | idempotency_key | btree | Y | `WHERE idempotency_key IS NOT NULL` | **NEW** — Prevent duplicate sends |

**Justification `idx_dsh_status_retry`:** Background retry job query: `WHERE status IN (2,4) AND next_retry_at <= NOW()`. Partial index chỉ index failed/retrying rows — tiết kiệm space.

---

## 3. Missing FK Indexes Found in Audit

Các FK column thiếu index — có thể gây sequential scan khi JOIN hoặc ON DELETE CASCADE:

| Table | FK Column | Referenced Table | Fix |
|-------|-----------|-----------------|-----|
| `inspection_results` | `plan_id` | `inspection_plans` | Thêm `idx_inspection_results_plan` |
| `inspection_results` | `inspection_result_id` (từ testing_results) | | Đã fix bên testing_results |
| `testing_results` | `inspection_result_id` | `inspection_results` | Thêm `idx_testing_results_inspection` |
| `atp_alerts` | `public_submission_id` | `public_alert_submissions` | Thêm index khi thêm cột |
| `food_poisoning_cases` | `incident_id` (NEW) | `food_poisoning_incidents` | `idx_fpc_incident_id` |
| `ndtp_report_error_notifications` | `report_id` | `ndtp_reports` | Thêm `idx_nen_report_id` |
| `poisoning_case_error_reports` | `case_id` | `food_poisoning_cases` | Thêm `idx_pcer_case_id` |
| `poisoning_incident_error_reports` | `incident_id` | `food_poisoning_incidents` | Thêm `idx_pier_incident_id` |
| `business_product_groups` | `product_group_id` | `cat_product_groups` | Thêm index (PK covers business_id) |
| `news_linked_alerts` | `alert_id` | `atp_alerts` | Thêm index (PK covers news_id) |
| `advertisement_registration_products` | `product_id` | `products` | Thêm index |

**SQL fixes cho missing FK indexes:**
```sql
CREATE INDEX idx_inspection_results_plan
  ON inspection_results(plan_id) WHERE plan_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX idx_testing_results_inspection
  ON testing_results(inspection_result_id)
  WHERE inspection_result_id IS NOT NULL AND is_deleted = FALSE;

CREATE INDEX idx_nen_report_id ON ndtp_report_error_notifications(report_id);
CREATE INDEX idx_pcer_case_id ON poisoning_case_error_reports(case_id);
CREATE INDEX idx_pier_incident_id ON poisoning_incident_error_reports(incident_id);

CREATE INDEX idx_bpg_product_group ON business_product_groups(product_group_id);
CREATE INDEX idx_nla_alert_id ON news_linked_alerts(alert_id);
CREATE INDEX idx_arp_product_id ON advertisement_registration_products(product_id);
```

---

## 4. Duplicate / Redundant Indexes

| Table | Redundant Index | Covered By | Action |
|-------|----------------|------------|--------|
| `ndtp_reports` | `idx_ndtp_reports_org_period` | Mostly covered by `uq_ndtp_reports_period` | Giữ cả hai — unique index không filter is_deleted |
| `businesses` | `idx_businesses_status` | Có thể merge vào composite với org | Monitor — remove nếu query planner không dùng |

---

## 5. Full-Text Search Requirements

### 5.1 `regulatory_documents` — Bắt buộc Full-Text Search (STT 38)

**Yêu cầu:** Tra cứu văn bản — tìm kiếm theo nội dung tiêu đề và tóm tắt.

**Giải pháp:** Generated TSVECTOR column + GIN index:
```sql
ALTER TABLE regulatory_documents
  ADD COLUMN fts_vector TSVECTOR
  GENERATED ALWAYS AS (
    to_tsvector('simple',
      COALESCE(title, '') || ' ' ||
      COALESCE(summary, '') || ' ' ||
      COALESCE(document_number, '') || ' ' ||
      COALESCE(issuing_authority, ''))
  ) STORED;

CREATE INDEX idx_rd_fts ON regulatory_documents USING GIN (fts_vector)
  WHERE is_deleted = FALSE;
```

**Query pattern:**
```sql
SELECT * FROM regulatory_documents
WHERE fts_vector @@ plainto_tsquery('simple', 'an toàn thực phẩm')
  AND is_deleted = FALSE
  AND is_public = TRUE
ORDER BY ts_rank(fts_vector, plainto_tsquery('simple', 'an toàn thực phẩm')) DESC
LIMIT 20;
```

### 5.2 `atp_news` — GIN Trigram Đủ Dùng

GIN trigram index `idx_atp_news_title_trgm` đã đủ cho search theo tiêu đề tin tức. Không cần TSVECTOR vì content là HTML (khó index).

### 5.3 `businesses` — GIN Trigram Đã Có

`idx_businesses_name_trgm` đã cover ILIKE search tên cơ sở.

### 5.4 `products` — GIN Trigram Đã Có

`idx_products_name_trgm` đã cover ILIKE search tên sản phẩm.

---

## 6. Geo / Spatial Indexes

**Hiện tại:** Dùng btree index trên `(address_latitude, address_longitude)` cho bảng `businesses` — đủ với volume Quảng Ninh (<5K cơ sở).

**Nếu volume tăng lên (>50K rows):** Chuyển sang PostGIS hoặc GiST cube index:
```sql
-- Option 1: Thêm PostGIS
ALTER TABLE businesses ADD COLUMN geom GEOMETRY(POINT, 4326)
  GENERATED ALWAYS AS (
    CASE WHEN address_latitude IS NOT NULL AND address_longitude IS NOT NULL
    THEN ST_MakePoint(address_longitude, address_latitude)
    END
  ) STORED;
CREATE INDEX idx_businesses_geom ON businesses USING GIST (geom);

-- Option 2: BRIN cho latitude/longitude (nếu data có tương quan vật lý)
CREATE INDEX idx_businesses_lat_brin ON businesses USING BRIN (address_latitude, address_longitude);
```

**Bảng `food_poisoning_cases` và `food_poisoning_incidents`:** Cũng có lat/lng — cân nhắc GiST nếu cần heatmap queries.

---

## 7. Performance Considerations for High-Write Tables

### `data_sharing_histories`

**Volume:** Mỗi API call ghi 1 row. Nếu tích hợp 3 đơn vị ngoài × 100 calls/ngày = ~100K rows/năm.

**Strategy:**
- Giữ index tối thiểu (3 indexes là đủ + 2 new)
- Cân nhắc PostgreSQL partitioning theo `initiated_at` (monthly partitions) khi volume > 1M rows
- Archive rows > 2 năm bằng pg_partman hoặc background job

### `AbpAuditLogs`

**Volume:** Mọi request đều ghi audit log → growth cao nhất trong hệ thống.

**Strategy:**
- Partition theo năm:
  ```sql
  -- Chuyển AbpAuditLogs sang partitioned table (cần migration)
  CREATE TABLE "AbpAuditLogs" (...) PARTITION BY RANGE ("ExecutionTime");
  CREATE TABLE audit_logs_2025 PARTITION OF "AbpAuditLogs"
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
  ```
- Xóa partition cũ sau 2 năm

### `file_attachments`

**Volume:** Mỗi file đính kèm upload = 1 row. Growth: High.

**Strategy:** Index duy nhất cần là `idx_file_attachments_entity (entity_type, entity_id)`. Không cần thêm index khác.

---

## 8. Index Maintenance Recommendations

### REINDEX Schedule

```sql
-- Chạy monthly cho GIN indexes (có thể bloat theo thời gian):
REINDEX INDEX CONCURRENTLY idx_businesses_name_trgm;
REINDEX INDEX CONCURRENTLY idx_rd_title_trgm;
REINDEX INDEX CONCURRENTLY idx_rd_fts;
REINDEX INDEX CONCURRENTLY idx_atp_news_title_trgm;
REINDEX INDEX CONCURRENTLY idx_products_name_trgm;
```

### ANALYZE Schedule

```sql
-- Chạy weekly hoặc sau bulk import:
ANALYZE businesses;
ANALYZE products;
ANALYZE data_sharing_histories;
ANALYZE "AbpAuditLogs";
```

### Monitor Unused Indexes

```sql
-- Kiểm tra index không được dùng (chạy sau 30 ngày production):
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pk_%'
  AND indexname NOT LIKE 'uq_%'
ORDER BY schemaname, tablename;
```

---

## 9. Summary: New Indexes Added by Audit

| Index | Table | Type | Reason |
|-------|-------|------|--------|
| `uq_businesses_tax_code` | businesses | UNIQUE partial | CRITICAL: duplicate tax codes |
| `idx_businesses_tax_code` | businesses | btree partial | Search by tax code |
| `uq_self_declarations_number` | self_declarations | UNIQUE partial | CRITICAL: duplicate declaration numbers |
| `uq_product_registrations_number` | product_registrations | UNIQUE partial | CRITICAL: duplicate registration numbers |
| `uq_eligibility_certificates_number` | eligibility_certificates | UNIQUE partial | CRITICAL: duplicate certificate numbers |
| `uq_cfs_certificates_number` | cfs_certificates | UNIQUE partial | CRITICAL: duplicate CFS numbers |
| `uq_export_food_certificates_number` | export_food_certificates | UNIQUE partial | CRITICAL: duplicate export cert numbers |
| `uq_inspection_plan_items_business` | inspection_plan_items | UNIQUE | HIGH: duplicate business in same plan |
| `idx_inspection_results_plan` | inspection_results | btree partial | Missing FK index |
| `idx_testing_results_inspection` | testing_results | btree partial | Missing FK index |
| `idx_fpc_incident_id` | food_poisoning_cases | btree partial | NEW column FK index |
| `idx_rd_fts` | regulatory_documents | GIN | MEDIUM: full-text search STT 38 |
| `idx_dsh_status_retry` | data_sharing_histories | btree partial | HIGH: retry job performance |
| `uq_dsh_idempotency` | data_sharing_histories | UNIQUE partial | HIGH: idempotent API calls |
| `idx_password_history_user` | password_history | btree | NEW table index |
| `idx_iri_user_id` | inspection_result_inspectors | btree | NEW table FK index |
| `idx_trs_service_id` | testing_result_services | btree | NEW table FK index |
| `idx_nen_report_id` | ndtp_report_error_notifications | btree | Missing FK index |
| `idx_pcer_case_id` | poisoning_case_error_reports | btree | Missing FK index |
| `idx_pier_incident_id` | poisoning_incident_error_reports | btree | Missing FK index |
| `idx_bpg_product_group` | business_product_groups | btree | Missing FK index |
| `idx_nla_alert_id` | news_linked_alerts | btree | Missing FK index |
| `idx_arp_product_id` | advertisement_registration_products | btree | Missing FK index |
## v2.3 independent-resolution index changes

- Removed indexes duplicated by an identical unique key/predicate:
  `idx_ndtp_reports_org_period`, `idx_amr_org_year`, `idx_pas_tracking`, and
  `idx_inspection_plan_items_plan`.
- Added FK/join indexes for organization province/district, business
  classification/province, inspection `plan_item_id`, alert business, testing
  product, regulatory document type/replacement, and integration API spec.
- Added access paths for focal-point grantees, report-submission recipients,
  document owners, and integration attempts.
- Official document-number unique indexes intentionally have no
  `is_deleted = FALSE` predicate; retained identifiers are never released.
