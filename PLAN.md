# FoodSafe — Trạng thái triển khai hiện tại

> Phần mềm quản lý an toàn thực phẩm — Chi cục ATVSTP tỉnh Quảng Ninh
> Branch: `codex/production-readiness`
> Cập nhật: 2026-07-27

---

## Tổng quan hệ thống

| Thành phần | Stack | Trạng thái |
|---|---|---|
| Backend | .NET 9 + ABP 9 + PostgreSQL 15 + Redis 7 | ✅ Hoạt động |
| Frontend | React 19 + TypeScript + Vite + Ant Design 5 | ✅ Hoạt động |
| Tests | 519 BE (xUnit) + 112 FE (Vitest) | ✅ Tất cả pass |
| Docker | docker-compose (PG, Redis, MinIO, BE, FE) | ✅ Cấu hình xong |
| EF Migrations | 18 migrations | ✅ Áp dụng xong |

---

## Kiến trúc Backend — 11 Domain Modules

### Organizations
- **Entities**: `Organization`, `OrganizationManager`, `OrganizationHierarchyRules`
- **AppServices**: `OrganizationAppService` (CRUD, tree, search, filter, paging), `OrganizationExcelAppService`
- **API**: Auto-mapped CRUD + `GET /api/v1/app/organization/excel`

### Catalogs
- **Entities**: `AdministrativeArea`, `MasterCatalog`
- **AppServices**: `GeographicCatalogAppService`, `MasterCatalogAppService`
- **Danh mục**: Country, Region, Province, District, Commune, BusinessType, BusinessClassification, ProductGroup, AdvertisementType, TestingCenter, TestingService, DocumentType

### Security & Identity
- **Entities**: `AppUserProfile`, `OrganizationHierarchyScope`, `IdentityAdministrationRules`
- **AppServices**: `AccountSecurityAppService`, `CurrentUserContextAppService`, `PasswordHistoryPolicy`
- **Middleware**: `LoginCaptchaMiddleware` (login + password reset), `PostgreSqlSslValidator`
- **Data scope**: `ICurrentDataScopeProvider` — org-scoped filtering ở AppService layer
- **IdentityAdministration**: CRUD users/roles, manage scope, lock, reset password, delete, Excel export

### BusinessManagement
- **Entities**: `Business`, `Product`, `BusinessHandler`, `BusinessProductGroup`, `SelfDeclaration`
- **AppServices**: `BusinessAppService`, `ProductAppService`, `SelfDeclarationAppService` + Excel + Public variants
- **File**: `ProductAttachmentAppService`, `SelfDeclarationAttachmentAppService`
- **Filters**: keyword, status, businessTypeId, businessClassificationId, organizationId

### Licensing (5 loại giấy phép)
- **Entities**: `ProductRegistration`, `AdvertisementRegistration`, `EligibilityCertificate`, `CfsCertificate`, `ExportFoodCertificate`
- **Mỗi loại có**: AppService CRUD + Excel export + Public lookup + Attachment + Expiry background job + Data scope checker
- **PDF**: `CertificatePdfAppService` (QuestPDF) cho giấy chứng nhận

### Inspection
- **Entities**: `InspectionPlan`, `InspectionPlanItem`, `InspectionResult`, `InspectionViolation`, `InspectionResultInspector`
- **AppServices**: `InspectionPlanAppService`, `InspectionResultAppService` + Excel exports
- **Permissions**: Plans (View/Create/Edit/Delete/Approve), Results (View/Create/Edit/Delete)

### FoodPoisoning
- **Entities**: `FoodPoisoningCase`, `FoodPoisoningIncident`, `PoisoningCaseErrorReport`, `PoisoningIncidentErrorReport`
- **AppServices**: `FoodPoisoningCaseAppService` (CRUD + verify), `FoodPoisoningIncidentAppService` (CRUD + verify + conclude) + Excel exports
- **Permissions**: Cases (Verify), Incidents (Verify, Conclude)

### Reporting (3 loại báo cáo)
- **Entities**: `BaseReport`, `NdtpReport`, `AtpWorkReport`, `ActionMonthReport` + ErrorNotification variants
- **Workflow**: Draft → Submitted → Verified | Returned → Completed
- **Permissions**: Submit, Verify, Return, Complete per report type
- **Excel**: 3 Excel export services

### AlertsAndTesting
- **Entities**: `AtpAlert`, `AtpNews`, `NewsLinkedAlert`, `RiskAnalysis`, `TestingResult`, `AdministrativeDocument`
- **AppServices**: 5 CRUD services + 5 Excel export services
- **Permissions**: Alerts/News/RiskAnalyses có Publish action

### DataIntegration
- **Entities**: `ApiEndpoint`, `ApiCallLog`
- **AppServices**: `ApiEndpointAppService`, `ApiCallLogAppService` + Excel exports

### Dashboard & Statistics
- **AppServices**: `DashboardAppService` (tổng hợp 13 metrics, filter by year + org), `StatisticsAppService` (8 chart datasets, filter by year + org), `AuditLogAppService` (list + detail)
- **Excel**: `StatisticsExcelAppService` (4-sheet workbook), `AuditLogExcelAppService`

---

## Kiến trúc Frontend — 25 Feature Folders

### Routes (42 tổng cộng)

**18 Public routes (không cần đăng nhập)**

| Route | Trang |
|---|---|
| `/login` | Đăng nhập (có CAPTCHA) |
| `/account/forgot-password` | Quên mật khẩu |
| `/account/reset-password` | Đặt lại mật khẩu |
| `/account/complete-password-change` | Đổi mật khẩu lần đầu |
| `/cong-thong-tin` | Trang chủ cổng thông tin |
| `/tra-cuu-chung` | Tra cứu chung |
| `/tra-cuu-giay-phep` | Tra cứu giấy phép |
| `/tra-cuu-giay-du-dieu-kien` | Tra cứu GCN đủ điều kiện |
| `/tra-cuu-cfs` | Tra cứu CFS |
| `/tra-cuu-gcn-xuat-khau` | Tra cứu GCN xuất khẩu |
| `/tra-cuu-dang-ky-cong-bo` | Tra cứu đăng ký công bố |
| `/tra-cuu-co-so` | Tra cứu cơ sở |
| `/tra-cuu-tu-cong-bo` | Tra cứu tự công bố |
| `/tra-cuu-dang-ky-quang-cao` | Tra cứu đăng ký quảng cáo |
| `/co-so-bi-canh-bao` | Cơ sở bị cảnh báo |
| `/tin-tuc` | Tin tức ATTP |
| `/tra-cuu-van-ban` | Văn bản pháp luật |
| `/gui-phan-anh` | Gửi phản ánh (người dân) |

**24 Private routes (yêu cầu đăng nhập)**

| Route | Trang | Permission |
|---|---|---|
| `/dashboard` | Tổng quan | — |
| `/statistics` | Thống kê tổng hợp (8 charts + Excel export + org filter) | — |
| `/organizations` | Đơn vị hành chính | Organizations.View |
| `/geography` | Danh mục địa lý | GeographicCatalogs.View |
| `/catalogs` | Danh mục dùng chung | Catalogs.View |
| `/businesses` | Cơ sở & sản phẩm (filter: type, classification, status) | BusinessManagement.*.View |
| `/self-declarations` | Tự công bố sản phẩm | BusinessManagement.SelfDeclarations.View |
| `/product-registrations` | Đăng ký công bố | Licensing.ProductRegistrations.View |
| `/advertisement-registrations` | Đăng ký quảng cáo | Licensing.AdRegistrations.View |
| `/eligibility-certificates` | Giấy ĐĐK ATTP | Licensing.EligibilityCertificates.View |
| `/cfs-certificates` | Chứng nhận CFS | Licensing.CfsCertificates.View |
| `/export-food-certificates` | GCN xuất khẩu | Licensing.ExportCertificates.View |
| `/inspection` | Thanh kiểm tra | Inspection.Plans.View |
| `/alerts-news` | Cảnh báo & tin tức | AlertsAndTesting.Alerts.View |
| `/food-poisoning` | Ngộ độc thực phẩm | FoodPoisoning.Cases.View |
| `/reporting` | Báo cáo (NĐTP, ATTP, Tháng hành động) | Reporting.NdtpReports.View |
| `/risk-analysis` | Phân tích nguy cơ | AlertsAndTesting.RiskAnalyses.View |
| `/testing-results` | Kết quả kiểm nghiệm | AlertsAndTesting.TestingResults.View |
| `/documents` | Văn bản chỉ đạo | AlertsAndTesting.Documents.View |
| `/data-integration` | Tích hợp dữ liệu | DataIntegration.ApiEndpoints.View |
| `/administration/identity` | Quản lý tài khoản & vai trò | SystemAdmin |
| `/administration/audit-logs` | Nhật ký hoạt động | SystemAdmin.AuditLogs |
| `/administration/settings` | Cài đặt hệ thống | SystemAdmin.Settings |
| `/account/change-password` | Đổi mật khẩu | — |

### Shared Components

| Component | Mô tả |
|---|---|
| `PageHeader` | Header trang với title, subtitle, actions |
| `StatusBadge` | Badge màu theo trạng thái |
| `ExpiryTag` | Tag hiển thị ngày hết hạn |
| `RevokeModal` | Modal thu hồi giấy phép |
| `EmptyState` | Trạng thái trống |

### Design Patterns đã áp dụng

- **Container/Presenter**: `*Page.tsx` (container) + `*View.tsx` (presenter)
- **Custom Hook**: `use*()` hooks trong `api/` folders
- **TanStack Query**: `useQuery` + `useMutation` + queryKey invalidation
- **Adapter**: DTO → ViewModel transform ở api layer
- **Zod schema**: Form validation với `react-hook-form` + `@hookform/resolvers`

---

## Permissions (27 groups, ~100 actions)

| Module | Groups | Đặc biệt |
|---|---|---|
| Organizations | 1 | View/Create/Edit/Delete |
| GeographicCatalogs | 1 | View/Manage |
| Catalogs | 1 | View/Create/Edit/Delete |
| BusinessManagement | 3 | Businesses, Products, SelfDeclarations + Import |
| Licensing | 5 | ProductReg, AdReg, Eligibility, CFS, Export |
| Inspection | 2 | Plans (+ Approve), Results |
| AlertsAndTesting | 5 | Alerts, News, RiskAnalyses (+ Publish), TestingResults, Documents |
| FoodPoisoning | 2 | Cases (+ Verify), Incidents (+ Verify, Conclude) |
| Reporting | 3 | NDTP, ATP, ActionMonth (+ Submit/Verify/Return/Complete) |
| SystemAdministration | 2 | Users (9 actions), Roles (4 actions) + AuditLogs, Settings |
| DataIntegration | 2 | ApiEndpoints, CallHistory |
| DataScope | 1 | All (cross-org override) |

---

## Database — 18 EF Migrations

| # | Migration | Ngày |
|---|---|---|
| 1 | InitialFoodSafe | 2026-07-25 |
| 2 | AddGeographicCatalogs | 2026-07-25 |
| 3 | AddDataScope | 2026-07-25 |
| 4 | AddPasswordHistory | 2026-07-25 |
| 5 | UpgradeAbp937 | 2026-07-25 |
| 6 | AddMasterCatalogs | 2026-07-25 |
| 7 | AddBusinessManagement | 2026-07-25 |
| 8 | AddFileAttachments | 2026-07-25 |
| 9 | AddSelfDeclarations | 2026-07-25 |
| 10 | AddProductRegistrations | 2026-07-25 |
| 11 | AddAdvertisementRegistrations | 2026-07-25 |
| 12 | AddEligibilityCertificates | 2026-07-25 |
| 13 | AddCfsCertificates | 2026-07-25 |
| 14 | AddExportFoodCertificates | 2026-07-26 |
| 15 | AddInspectionModule | 2026-07-26 |
| 16 | AddRemainingModules | 2026-07-26 |
| 17 | AddNewsRecallAudit | 2026-07-27 |
| 18 | AddMissingForeignKeys | 2026-07-27 |

---

## Security đã triển khai

| Hạng mục | Trạng thái |
|---|---|
| Password policy (8 ký tự, chữ + số + đặc biệt, hết hạn 90 ngày) | ✅ |
| Password history (không dùng lại 5 mật khẩu gần nhất) | ✅ |
| CAPTCHA trên login + forgot password | ✅ |
| Session timeout | ✅ |
| CSRF protection (ABP built-in) | ✅ |
| Audit log (ABP AuditingModule) | ✅ |
| Data scope filtering (org-level) | ✅ |
| Swagger gated behind IsDevelopment() | ✅ |
| Password reset token lifetime = 8h | ✅ |
| PostgreSQL SSL validation (reject Prefer/Disable in Production) | ✅ |
| Redis requirepass | ✅ |
| MinIO SSL configurable | ✅ |
| nginx IPv6 + HSTS (HTTPS block only) | ✅ |
| File malware scanning (ClamAV integration) | ✅ |
| FK integrity (9 missing FKs added) | ✅ |

---

## Tests

```
BE HttpApi.Host.Tests:    53 passed
BE Application.Tests:    251 passed
BE Domain.Tests:         197 passed
BE EntityFrameworkCore:   18 passed
BE Total:                519 passed / 0 failed

FE Vitest:               112 passed / 0 failed
FE TypeScript:           0 errors
```

55 BE test files + 56 FE test files = 111 test files tổng cộng.

---

## Docker

| File | Vị trí | Nội dung |
|---|---|---|
| `docker-compose.yml` | `FoodSafe.BE/` | Dev: PostgreSQL 15, Redis 7, MinIO, Backend |
| `docker-compose.prod.yml` | `FoodSafe.BE/` | Production overrides |
| `Dockerfile` | `FoodSafe.BE/` | .NET 9 multi-stage build |
| `Dockerfile` | `FoodSafe.FE/` | Node build + nginx serve |

---

## Tiến độ triển khai chức năng

### ✅ Đã hoàn thành (Batches A–F, session 2026-07-27)

| Batch | FR IDs | Mô tả |
|---|---|---|
| A | FR-03-02, FR-03-03 | Audit log detail drawer + Excel export |
| B | FR-02-05, FR-02-13 | User delete + user list Excel export |
| C | FR-06-06 | Organization Excel export |
| D | FR-39-02 | Dashboard year + org filter |
| E | FR-40-02/04/06/08, FR-40-07 | Statistics Excel export (4-sheet) + org breakdown |
| F | FR-19-02 | Business type + classification search filters |

### 🔲 P1 còn lại

| Batch | FR IDs | Mô tả | Effort |
|---|---|---|---|
| G | FR-19-11..16 | Per-business detail tabs (inspections, certs, testing) | ~6h |
| H | FR-38-03/04 | Document type catalog integration | ~1.5h |

### 🔲 P2 (sessions sau)

| Batch | Mô tả | Effort |
|---|---|---|
| P2-A | System settings full backend + UI | 16h |
| P2-B | User profile editing + avatar | 6h |
| P2-C | Inspection plan attachments | 4h |
| P2-D | Inspection result finalize + attachments | 4h |
| P2-E | Citizen alert moderation queue | 6h |
| P2-F | Citizen news submission channel | 8h |
| P2-G | NDTP report roll-up | 12h |
| P2-H | Formatted report views + auto-aggregation | 18h |
| P2-I | Dashboard compliance widgets + chart/map | 8h |
| P2-J | Public portal certificate document view | 8h |
| P2-K | QuestPDF certificate generation enhancements | 16h |
| P2-L | API specification domain model + test connection | 8h |
| P2-M | Per-entity integration history screens | 16h |

### 🔲 P3 (phụ thuộc đối tác)

| Batch | Mô tả | Phụ thuộc |
|---|---|---|
| P3-A | API tích hợp Bộ Y tế | API spec từ Bộ Y tế |
| P3-B | API tích hợp Sở Nông nghiệp | API spec từ Sở NN |
| P3-C | API tích hợp Sở Công thương | API spec từ Sở CT |

---

## DEFERRED_INFRASTRUCTURE (không triển khai trong code)

- Production TLS / HTTPS deployment
- DNS / DNSSEC
- PostgreSQL server-side SSL certificates
- Live IPv6 testing
- pg_hba.conf configuration
- Redis / MinIO production provisioning
- Server firewall / monitoring / hosting
