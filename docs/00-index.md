# FoodSafe — Tài liệu Phân tích Dự án

> Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
> Phiên bản: 2.3 — Cập nhật lần cuối: 2026-07-25 (independent-finding resolution: 14 Accepted / 11 Partially accepted / 2 Rejected)

---

## Danh sách Tài liệu

### Implementation documents

| Document | Purpose | Status |
|---|---|---|
| [16-implementation-gap-analysis.md](16-implementation-gap-analysis.md) | Requirement-by-requirement implementation audit | Active |
| [17-system-architecture.md](17-system-architecture.md) | Runtime, trust boundaries, deployment shape | Approved for implementation |
| [18-backend-architecture.md](18-backend-architecture.md) | Backend boundaries and enforcement rules | Approved for implementation |
| [19-frontend-architecture.md](19-frontend-architecture.md) | Frontend structure and quality rules | Approved for implementation |
| [20-implementation-roadmap.md](20-implementation-roadmap.md) | Milestones, gates and current evidence | Active |
| [36-local-development-guide.md](36-local-development-guide.md) | Reproducible container/native development and email testing | Active |
| [37-ci-cd-guide.md](37-ci-cd-guide.md) | Enforced CI gates, release use and promotion controls | Active |
| [38-deployment-guide.md](38-deployment-guide.md) | Container configuration, secrets and deployment validation | Active |
| [39-operations-runbook.md](39-operations-runbook.md) | Health, monitoring, incident and maintenance procedures | Active |
| [40-disaster-recovery-guide.md](40-disaster-recovery-guide.md) | RTO/RPO, protected state, restore and rehearsal procedure | Active |
| [43-dependency-security-policy.md](43-dependency-security-policy.md) | Automated dependency gates and the temporary ABP advisory mitigation | Active |
| [44-account-security-and-recovery.md](44-account-security-and-recovery.md) | Cookie/CSRF, CAPTCHA and password-recovery security boundary | Active |
| [45-identity-administration.md](45-identity-administration.md) | Scoped user, role, permission and lifecycle administration | Active |
| [46-master-catalogs.md](46-master-catalogs.md) | STT 08–18 master-catalog implementation and validation | Active |
| [47-business-product-management.md](47-business-product-management.md) | STT 19–20 business/product implementation and validation | Active |
| [48-self-declaration-management.md](48-self-declaration-management.md) | STT 21 self-declaration implementation and validation | Active |

| File | Nội dung | Trạng thái |
|------|----------|-----------|
| [01-functional-requirements.md](01-functional-requirements.md) | 57 chức năng chi tiết theo nhóm A/B/C/E/F | ✅ Hoàn thành |
| [02-domain-model.md](02-domain-model.md) | Domain entities, Value Objects, Aggregates, Domain Events | ✅ Hoàn thành |
| [03-database-schema.sql](03-database-schema.sql) | PostgreSQL DDL — 60 bảng tùy chỉnh + ABP built-in (~81 tổng) | ✅ v2.3 — DDL chạy thành công trên PostgreSQL 15 |
| [04-state-machines.md](04-state-machines.md) | 9 workflow state machines + domain events | ✅ Hoàn thành |
| [05-permission-matrix.md](05-permission-matrix.md) | Ma trận phân quyền 7 vai trò × tất cả chức năng | ✅ Hoàn thành |
| [06-api-contracts.md](06-api-contracts.md) | API endpoints cho tất cả modules | ✅ Hoàn thành |
| [07-non-functional-requirements.md](07-non-functional-requirements.md) | Bảo mật, hiệu năng, UI/UX, deployment | ✅ Hoàn thành |
| [08-database-requirement-traceability.md](08-database-requirement-traceability.md) | Ma trận truy xuất nguồn gốc: 57 STT → bảng DB + gap analysis | ✅ Hoàn thành |
| [09-database-data-dictionary.md](09-database-data-dictionary.md) | Data dictionary + v2.3 added/changed structures | ✅ Hoàn thành |
| [10-database-index-strategy.md](10-database-index-strategy.md) | Chiến lược index: BTRee/GIN/partial + partitioning recommendations | ✅ Hoàn thành |
| [11-database-security-and-data-scope.md](11-database-security-and-data-scope.md) | Kiểm soát bảo mật ATTT Cấp 2 ở tầng DB: RLS, encryption, masking | ✅ Hoàn thành |
| [12-database-history-and-audit-strategy.md](12-database-history-and-audit-strategy.md) | Chiến lược lịch sử trạng thái + ABP audit log retention | ✅ Hoàn thành |
| [13-database-integration-strategy.md](13-database-integration-strategy.md) | Data contracts cho tích hợp ngoài (Bộ YT, Sở NN, Sở CT) | ✅ Hoàn thành |
| [14-database-review-report.md](14-database-review-report.md) | Báo cáo audit tổng hợp đến v2.3 | ✅ Hoàn thành |
| [15-database-assumptions-and-open-questions.md](15-database-assumptions-and-open-questions.md) | Giả định/câu hỏi mở, gồm 9 nhóm câu hỏi từ findings partially accepted | ✅ Hoàn thành |
| [16-independent-database-review.md](16-independent-database-review.md) | 27 findings độc lập + evidence/resolution từng finding | ✅ Đã resolution |

---

## Kiểm tra Phủ sóng Chức năng (Coverage Check)

### Nhóm A — Quản trị Hệ thống
- [x] STT 1 — Quản lý Vai trò (Roles)
- [x] STT 2 — Quản lý Người dùng (Users)
- [x] STT 3 — Nhật ký kiểm soát (Audit Log)
- [x] STT 4 — Cấu hình hệ thống (Settings)
- [x] STT 5 — Phân quyền (Access Management)

### Nhóm B — Danh mục
- [x] STT 6 — Đơn vị Tổ chức (Organizations)
- [x] STT 7 — Tài khoản Đơn vị (Unit Accounts)
- [x] STT 8 — Quốc gia (Countries)
- [x] STT 9 — Vùng/Miền (Regions)
- [x] STT 10 — Tỉnh/Thành phố (Provinces)
- [x] STT 11 — Huyện/Quận + Xã/Phường (Districts & Communes)
- [x] STT 12 — Phân loại Cơ sở (Business Classification)
- [x] STT 13 — Nhóm Sản phẩm (Product Groups)
- [x] STT 14 — Loại hình Cơ sở (Business Types)
- [x] STT 15 — Loại hình Quảng cáo (Ad Types)
- [x] STT 16 — Cơ sở Kiểm nghiệm (Testing Centers)
- [x] STT 17 — Dịch vụ Kiểm nghiệm (Testing Services)
- [x] STT 18 — Loại Văn bản (Document Types)

### Nhóm C — Quản lý ATTP
- [x] STT 19 — Cơ sở SXKD (Businesses + Map)
- [x] STT 20 — Sản phẩm (Products)
- [x] STT 21 — Tự công bố (Self Declarations)
- [x] STT 22 — Đăng ký Công bố SP (DKCB / Product Registrations)
- [x] STT 23 — Đăng ký QC (Ad Registrations)
- [x] STT 24 — Cơ sở Đủ điều kiện (DDK / Eligibility Certificates)
- [x] STT 25 — CFS Certificates
- [x] STT 26 — Export Food Certificates
- [x] STT 27 — Kế hoạch Thanh Kiểm tra (Inspection Plans)
- [x] STT 28 — Kết quả Thanh Kiểm tra (Inspection Results)
- [x] STT 29 — Cảnh báo VSATTP (Alerts)
- [x] STT 30 — Tin tức, Hoạt động (News)
- [x] STT 31 — Ca Ngộ độc nhỏ lẻ (Food Poisoning Cases)
- [x] STT 32 — Vụ Ngộ độc (Food Poisoning Incidents)
- [x] STT 33 — Báo cáo NĐTP hàng tháng
- [x] STT 34 — Báo cáo Công tác ATTP (6 tháng/năm)
- [x] STT 35 — Báo cáo Tháng Hành động ATTP
- [x] STT 36 — Phân tích Mối nguy cơ (Risk Analysis)
- [x] STT 37 — Kết quả Kiểm nghiệm (Testing Results)
- [x] STT 38 — Văn bản Chỉ đạo (Documents)
- [x] STT 39 — Dashboard
- [x] STT 40 — Thống kê

### Nhóm E — Cổng Thông tin Công khai
- [x] STT 41 — Tra cứu Cơ sở
- [x] STT 42 — Tra cứu Sản phẩm
- [x] STT 43 — Tra cứu Giấy phép
- [x] STT 44 — Tra cứu Kết quả Kiểm nghiệm
- [x] STT 45 — Tra cứu Kết quả Thanh Kiểm tra
- [x] STT 46 — Tra cứu Cảnh báo
- [x] STT 47 — Tra cứu Phân tích Nguy cơ
- [x] STT 48 — Tra cứu Tin tức
- [x] STT 49 — Gửi Phản ánh (Public Alert Submission)

### Nhóm F — Tích hợp Dữ liệu
- [x] STT 50 — Đặc tả API (API Specs)
- [x] STT 51 — Lịch sử Chia sẻ Cảnh báo
- [x] STT 52 — Lịch sử Chia sẻ Kết quả TKT
- [x] STT 53 — Lịch sử Chia sẻ Ngộ độc
- [x] STT 54 — Lịch sử Chia sẻ Giấy phép
- [x] STT 55 — Lịch sử Chia sẻ Sản phẩm
- [x] STT 56 — Lịch sử Chia sẻ Tin tức
- [x] STT 57 — Lịch sử Chia sẻ Cơ sở

**Tổng: 57/57 chức năng ✅ — Không bỏ sót**

---

## Tóm tắt Database Schema (v2.3)

| Module | Bảng | Entities chính |
|--------|------|---------------|
| Organizations | **4** | organizations, app_user_profiles, password_history, **management_scope_assignments** |
| Catalogs | 12 | countries, regions, provinces, districts, communes, product_groups, business_types, business_classifications, ad_types, document_types, testing_centers, testing_services |
| BusinessManagement | 5 | businesses, business_product_groups, business_handlers, products, self_declarations |
| Licensing | 6 | product_registrations, advertisement_registrations, ad_reg_products, eligibility_certificates, cfs_certificates, export_food_certificates |
| Inspection | **5** | inspection_plans, inspection_plan_items, inspection_results, **inspection_result_inspectors**, inspection_violations |
| FoodPoisoning | 4 | food_poisoning_incidents, food_poisoning_cases, poisoning_case_error_reports, poisoning_incident_error_reports |
| Reporting | **9** | 3 report headers, 3 error-notification tables, **3 immutable submission tables** |
| AlertsAndTesting | **8** | public_alert_submissions, atp_alerts, atp_news, news_linked_alerts, risk_analyses, testing_results, testing_result_services, regulatory_documents |
| CrossCutting | 4 | **document_owners**, file_attachments, status_history, cached_dashboard_stats |
| DataIntegration | 3 | api_specs, data_sharing_histories, **data_sharing_attempts** |
| **Tổng** | **60** | v2.3 thêm 6 cấu trúc accepted; số liệu DDL-counted |

*+ ABP built-in: ~21 bảng (AbpUsers, AbpRoles, AbpAuditLogs, AbpPermissionGrants, AbpSettings, OpenIddict...)*  
*GRAND TOTAL: ~81 bảng*

---

## Tóm tắt Audit v2.1 Red-Team — Vấn đề bổ sung đã phát hiện & xử lý

> Đây là lần review thứ hai (adversarial red-team), thực hiện sau khi v2.0 tuyên bố READY.  
> **Kết quả: 5 Critical + 7 High + 3 Medium bổ sung → đã sửa toàn bộ. Critical=0, High=0.**

### Red-Team Critical (RT-C) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| RT-C1 | `organizations` không có FK thực tế cho `province_id`/`district_id` (chỉ có comment) | ALTER TABLE sau `cat_communes` — thêm FK đến `cat_provinces`/`cat_districts` |
| RT-C2 | `ndtp_reports` dùng inline UNIQUE — chặn tạo lại báo cáo sau soft-delete | Xóa inline UNIQUE, thêm partial index `WHERE is_deleted = FALSE` |
| RT-C3 | `action_month_reports` cùng vấn đề với RT-C2 | Cùng giải pháp với RT-C2 |
| RT-C4 | `cat_testing_services` không có UNIQUE trên `(testing_center_id, code)` | Thêm `CONSTRAINT uq_cat_testing_services_code UNIQUE (testing_center_id, code)` |
| RT-C5 | `food_poisoning_incidents.location_district_id`/`province_id` thiếu FK | ALTER TABLE thêm FK đến `cat_districts`/`cat_provinces` |

### Red-Team High (RT-H) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| RT-H1 | `file_attachments` dùng `deleted_at` — sai tên cột ABP ISoftDelete | Đổi thành `deletion_time`, thêm `deleter_id UUID NULL` |
| RT-H2 | `food_poisoning_cases.location_province_id` thiếu FK | ALTER TABLE thêm FK đến `cat_provinces` |
| RT-H3 | `public_alert_submissions.location_district_id` thiếu FK | ALTER TABLE thêm FK đến `cat_districts` |
| RT-H4 | `atp_alerts`: `source=2` không bắt buộc `public_submission_id` NOT NULL | Thêm `CONSTRAINT chk_alerts_source_submission CHECK (source != 2 OR public_submission_id IS NOT NULL)` |
| RT-H5 | Quan hệ conversion hai chiều có thể không nhất quán | **Superseded v2.3:** chỉ giữ UNIQUE `atp_alerts.public_submission_id` authoritative |
| RT-H6 | `testing_results.sample_code` không có UNIQUE per organization | Thêm partial UNIQUE index `(sample_code, organization_id) WHERE is_deleted = FALSE` |
| RT-H7 | `inspection_plans` thiếu `submitted_by_id`/`submitted_at` — không theo dõi ai submit kế hoạch | Thêm 2 cột `submitted_by_id UUID NULL`, `submitted_at TIMESTAMPTZ NULL` |

### Red-Team Medium (RT-M) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| RT-M1 | `businesses.suspension_reason` có comment "Required when status=3" nhưng không có CHECK | Thêm `CONSTRAINT chk_businesses_suspension CHECK (status != 3 OR suspension_reason IS NOT NULL)` |
| RT-M2 | `inspection_plans` không có CHECK `start_date <= end_date` | Thêm `CONSTRAINT chk_inspection_plans_dates` |
| RT-M3 | 4 bảng chứng nhận không có CHECK `issue_date <= expiry_date` | Thêm date range CHECK vào `eligibility_certificates`, `cfs_certificates`, `export_food_certificates`, `self_declarations` |

---

## Tóm tắt Audit v2.2 Independent Review — Vấn đề bổ sung đã phát hiện & xử lý

> Đây là lần review thứ ba (độc lập, không tin tuyên bố READY của v2.1).  
> **Kết quả: 0 Critical mới + 8 High + 11 Medium + 3 Low → đã sửa toàn bộ High. Critical=0, High=0.**

### High mới (B/C/D/G/J) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| B-01 | 
dtp_reports có CẢ inline UNIQUE lẫn partial index cùng tên — duplicate constraint | Xóa inline UNIQUE, giữ partial index |
| B-02 | ction_month_reports cùng vấn đề B-01 | Cùng giải pháp |
| B-03 | inspection_plans inline UNIQUE chưa được xóa (v2.1 chỉ thêm partial index, không xóa inline) | Xóa inline UNIQUE, thêm partial index |
| C-01 | ile_attachments DDL vẫn có deleted_at (v2.1 chỉ sửa comment, không sửa DDL) + thiếu deleter_id | Đổi deleted_at → deletion_time, thêm deleter_id UUID NULL |
| D-01 | cat_testing_centers thiếu FK cho ddress_commune/district/province_id | ALTER TABLE thêm 3 FK |
| G-01 | ood_poisoning_cases thiếu eported_by_id/eported_at | Thêm 2 cột audit |
| G-02 | ood_poisoning_incidents thiếu eported_by_id/eported_at | Thêm 2 cột audit |
| J-01 | public_alert_submissions.assigned_organization_id thiếu FK thực tế | ALTER TABLE thêm FK đến organizations |

### Medium mới — Đã sửa:
- **E-01**: self_declarations CHECK dùng cột effective_date không tồn tại → sửa thành declaration_date
- **E-02/E-03**: tp_alerts/tp_news thiếu CHECK status=3 → recall_reason IS NOT NULL
- **E-04**: 3 bảng báo cáo thiếu CHECK status=4(Returned) → return_reason IS NOT NULL
- **E-05**: 6 bảng giấy phép thiếu CHECK status=3(Revoked) → revoke_reason IS NOT NULL
- **H-01/H-02**: product_registrations/dvertisement_registrations thiếu date range CHECK
- **H-03**: egulatory_documents thiếu CHECK ordering issue ≤ effective ≤ expiry
- **I-01**: usiness_handlers thiếu date range CHECK + thiếu deletion_time/deleter_id
- **M-01**: ile_attachments thiếu organization_id → không thể scope file theo org
- **U-01**: public_alert_submissions dùng cột audit không chuẩn ABP + thiếu soft-delete

### Low mới — Đã sửa:
- **Q-01/Q-02**: 5 index bổ sung cho FK geography và FK product_id
- **T-01**: self_declarations unique index đổi scope từ global sang (business_id, declaration_number)

---
## Tóm tắt Audit v2.0 — Vấn đề đã phát hiện & xử lý

### Critical (C) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| C-01 | Không có bảng password_history | Thêm bảng `password_history` |
| C-02 | Thiếu UNIQUE trên `product_registrations.registration_number` | Thêm `uq_product_registrations_number` |
| C-03 | Thiếu UNIQUE trên `self_declarations.declaration_number` | Thêm `uq_self_declarations_number` |
| C-04 | Thiếu UNIQUE trên số chứng nhận (elic/cfs/export) | Thêm UNIQUE index trên 3 bảng |
| C-05 | `inspector_ids UUID[]` — không thể enforce FK | Tạo bảng `inspection_result_inspectors` |
| C-06 | `testing_results` thiếu FK đến `cat_testing_services` | Tạo bảng `testing_result_services` (M2M) |

### High (H) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| H-01 | atp_work_reports + action_month_reports thiếu error notification | Thêm 2 bảng error notification |
| H-02 | `file_attachments` thiếu: checksum, virus_scan, retention | Thêm 4 cột |
| H-03 | `data_sharing_histories` thiếu idempotency_key, next_retry_at | Thêm 3 cột |
| H-04 | Không có UNIQUE(plan_id, business_id) trong plan_items | Thêm constraint |
| H-05 | `food_poisoning_cases` thiếu FK đến incident | Thêm `incident_id` FK |
| H-06 | `businesses.tax_code` không có unique constraint | Thêm partial UNIQUE index |
| H-07 | `inspection_plans` thiếu `rejected_reason` | Thêm 3 cột rejection |

### Medium (M) — Đã sửa tất cả:
| Mã | Vấn đề | Giải pháp |
|----|--------|-----------|
| M-01 | `atp_alerts` không link về `public_alert_submissions` | Thêm FK `public_submission_id` |
| M-02 | `regulatory_documents` thiếu FTS index (STT 38) | Thêm `tsvector` + GIN index + trigger |
| M-03 | Thiếu index trên `businesses.tax_code`, `advertisement_registrations` | Thêm indexes |

---

## Phân tích Rủi ro Thiếu sót

### Đã xử lý (v2.0):
1. ✅ File attachments — polymorphic + checksum + virus scan + retention
2. ✅ Status history tracking — bảng status_history
3. ✅ Dashboard cache — bảng cached_dashboard_stats
4. ✅ Public submissions — bảng public_alert_submissions riêng (linked back to atp_alerts)
5. ✅ Error reports — bảng riêng cho TẤT CẢ 3 loại báo cáo + 2 loại ngộ độc
6. ✅ Bản đồ (Leaflet) — latitude/longitude trên businesses + poisoning incidents/cases
7. ✅ Workflow state machines — đủ trạng thái + transitions + rejection fields
8. ✅ DataIntegration — idempotency + retry + payload checksum
9. ✅ Multi-service testing — bảng M2M `testing_result_services`
10. ✅ Password reuse policy — bảng `password_history`
11. ✅ Full-text search — tsvector + GIN index + auto-trigger trên regulatory_documents
12. ✅ Inspector integrity — relational table thay UUID array

### Cân nhắc thêm (Phase 2+):
- **Notification system**: bảng `notifications` cho thông báo trong app (push + in-app)
- **Report templates**: lưu template word/excel cho các mẫu báo cáo
- **External system webhooks**: nhận data push từ Bộ Y tế
- **Mobile app API**: nếu có nhu cầu app di động

---

## Bước Tiếp theo

1. **Chạy invariant tests trên PostgreSQL 15** từ database schema đã thiết kế
2. **Phase 2**: Implement Organizations + Catalogs module (BE + FE)
3. **Phase 3**: Implement BusinessManagement module
4. **Phase 4**: Implement Licensing module
5. **Phase 5**: Implement Inspection module
6. **Phase 6**: Implement FoodPoisoning module
7. **Phase 7**: Implement Reporting module
8. **Phase 8**: Implement AlertsAndTesting module
9. **Phase 9**: Implement Dashboard + Statistics
10. **Phase 10**: Implement Public Portal
11. **Phase 11**: Implement DataIntegration module
12. **Phase 12**: Security hardening + /security-review


