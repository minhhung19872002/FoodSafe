# Feature Test Coverage Matrix

**Audit date:** 2026-07-26
**Git commit:** `9d2cb1e` (branch: `codex/production-readiness`)
**Auditor:** Automated audit via Claude Code
**Stack tested:** Docker Compose (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx+React frontend)

---

## Test Run Summary

| Metric                | Value                |
|-----------------------|----------------------|
| Total Playwright specs | 25 files             |
| Total test cases      | 33                   |
| Passed                | **8**                |
| Failed                | **25**               |
| Skipped               | 0                    |
| Services used         | PostgreSQL, Redis, MinIO, ClamAV, API, Frontend (Docker) |
| Database              | Real PostgreSQL 15 (Docker) |
| API interception      | None (verified: zero `page.route()` calls) |

### Failure Root Causes (verified via screenshots and individual re-runs)

| Root Cause | Count | Affected Specs |
|------------|-------|----------------|
| **Docker frontend 404** — route doesn't exist in stale Docker build | 14 | audit-logs, statistics, system-settings, documents, data-integration, risk-analysis, testing-results, reporting, alerts-news, food-poisoning, 4× public-lookups |
| **No organization seed data** — `/api/v1/app/organization/tree` returns `{"items":[]}` | 8 | self-declarations, product-registrations, eligibility-certificates, cfs-certificates, export-food-certificates, advertisement-registrations, inspection (confirmed via `firstOrganization()` returning `undefined`) |
| **Test selector bug** — Playwright locator doesn't match actual DOM | 1 | organizations (dialog opens correctly but `getByRole('textbox', { name: 'Tên đơn vị' })` times out) |
| **Excel export not triggering download** | 1 | businesses (page loads, table renders, `waitForEvent("download")` times out after clicking Xuất Excel) |
| **Test assertion mismatch** | 1 | dashboard (expects text "Chi tiết theo loại hồ sơ" but actual UI shows "Tổng hợp theo loại hồ sơ") |
| **Permission denied** | 1 | identity-administration (route exists, app layout renders, admin user lacks `IdentityAdministration` permission) |

### Docker Build Status

| Component | Status |
|-----------|--------|
| Backend (API) | Running, healthy, responds correctly to API calls |
| Frontend (nginx) | Built from **older commit** — missing ~12 feature routes added after build |
| Frontend Dockerfile | **FAILS on current code** — `node:22-alpine` causes TS errors in `ReportingPage.tsx` and `StatisticsPage.tsx` |

### Routes present in Docker frontend build (verified via screenshots)

| Present (sidebar visible, page renders) | Missing (404 Not Found) |
|--------------------------------------|----------------------|
| `/dashboard`, `/organizations`, `/geography`, `/catalogs`, `/businesses` | `/administration/audit-logs`, `/administration/settings`, `/administration/identity` |
| `/self-declarations`, `/product-registrations`, `/advertisement-registrations` | `/statistics`, `/documents`, `/reporting`, `/alerts-news` |
| `/eligibility-certificates`, `/cfs-certificates` | `/food-poisoning`, `/risk-analysis`, `/testing-results`, `/data-integration` |
| `/tra-cuu-dang-ky-cong-bo`, `/tra-cuu-giay-du-dieu-kien`, `/tra-cuu-cfs` | `/tra-cuu-co-so`, `/tra-cuu-tu-cong-bo`, `/tra-cuu-gcn-xuat-khau`, `/tra-cuu-dang-ky-quang-cao` |

---

## Individual Test Results

All results verified via individual spec runs with `E2E_ADMIN_PASSWORD` set and API restarted between batches to reset in-memory rate limiter.

| # | Spec File | Test Name | Result | Failure Reason (verified) |
|---|-----------|-----------|--------|---------------------------|
| 1 | auth.spec.ts | login page loads and real admin login works | **PASS** | — |
| 2 | auth.spec.ts | admin can sign in via API and access dashboard | **PASS** | — |
| 3 | auth.spec.ts | unauthenticated access redirects to login | **PASS** | — |
| 4 | catalogs.spec.ts | creates, edits, and deletes a document type | **PASS** | — |
| 5 | geography.spec.ts | loads province, district and commune tabs with data | **PASS** | — |
| 6 | organizations.spec.ts | creates, edits and deletes an organization | **FAIL** | Selector bug: dialog opens but `getByRole('textbox', { name: 'Tên đơn vị' })` can't find the field (screenshot shows it visible) |
| 7 | businesses.spec.ts | completes the business, handler, and product lifecycle | **FAIL** | Page loads, table renders, but "Xuất Excel" click doesn't trigger download event (60s timeout) |
| 8 | self-declarations.spec.ts | completes declaration, attachment, revocation and retention rules | **FAIL** | No org data: `firstOrganization()` returns `undefined` (org tree empty) |
| 9 | product-registrations.spec.ts | completes DKCB, public lookup, file and retention rules | **FAIL** | No org data (same pattern) |
| 10 | advertisement-registrations.spec.ts | completes multi-product, file, revocation and retention rules | **FAIL** | No org data (same pattern) |
| 11 | eligibility-certificates.spec.ts | completes certificate, public lookup, cache and retention rules | **FAIL** | No org data (same pattern) |
| 12 | cfs-certificates.spec.ts | completes CFS lifecycle, public lookup, attachments and retention rules | **FAIL** | No org data (same pattern) |
| 13 | export-food-certificates.spec.ts | completes GCN XK lifecycle, public lookup, attachments and retention rules | **FAIL** | No org data (same pattern) |
| 14 | inspection.spec.ts | creates plan, submits, approves, records result, exports excel | **FAIL** | No org data (has `firstOrganization` dependency) |
| 15 | food-poisoning.spec.ts | creates case, submits, verifies, creates incident, concludes, exports | **FAIL** | Docker 404: route `/food-poisoning` not in stale build |
| 16 | reporting.spec.ts | creates NDTP report, full workflow draft→submit→verify→complete, exports excel | **FAIL** | Docker 404: route `/reporting` not in stale build |
| 17 | alerts-news.spec.ts | creates alert, publishes, recalls, deletes, and verifies news tab | **FAIL** | Docker 404: route `/alerts-news` not in stale build |
| 18 | testing-results.spec.ts | creates testing result, exports excel, edits and deletes | **FAIL** | Docker 404: route `/testing-results` not in stale build |
| 19 | risk-analysis.spec.ts | creates analysis, publishes, edits and deletes | **FAIL** | Docker 404: route `/risk-analysis` not in stale build |
| 20 | data-integration.spec.ts | manages API endpoints and views call history | **FAIL** | Docker 404: route `/data-integration` not in stale build |
| 21 | identity-administration.spec.ts | manages roles and views user list | **FAIL** | Permission denied: admin user lacks `IdentityAdministration` permission (screenshot: "Không có quyền truy cập") |
| 22 | audit-logs.spec.ts | loads audit log table with real data and filters | **FAIL** | Docker 404: route `/administration/audit-logs` not in stale build |
| 23 | dashboard.spec.ts | loads stat cards and license breakdown table | **FAIL** | Assertion mismatch: test expects "Chi tiết theo loại hồ sơ" but UI shows "Tổng hợp theo loại hồ sơ" |
| 24 | statistics.spec.ts | loads charts with year selector | **FAIL** | Docker 404: route `/statistics` not in stale build |
| 25 | system-settings.spec.ts | displays system configuration sections | **FAIL** | Docker 404: route `/administration/settings` not in stale build |
| 26 | documents.spec.ts | creates document, exports excel and deletes | **FAIL** | Docker 404: route `/documents` not in stale build |
| 27 | public-lookups.spec.ts | /tra-cuu-co-so renders and handles not-found | **FAIL** | Docker 404: route not in stale build |
| 28 | public-lookups.spec.ts | /tra-cuu-tu-cong-bo renders and handles not-found | **FAIL** | Docker 404: route not in stale build |
| 29 | public-lookups.spec.ts | /tra-cuu-dang-ky-cong-bo renders and handles not-found | **PASS** | — |
| 30 | public-lookups.spec.ts | /tra-cuu-giay-du-dieu-kien renders and handles not-found | **PASS** | — |
| 31 | public-lookups.spec.ts | /tra-cuu-cfs renders and handles not-found | **PASS** | — |
| 32 | public-lookups.spec.ts | /tra-cuu-gcn-xuat-khau renders and handles not-found | **FAIL** | Docker 404: route not in stale build |
| 33 | public-lookups.spec.ts | /tra-cuu-dang-ky-quang-cao renders and handles not-found | **FAIL** | Docker 404: route not in stale build |

---

## STT 1–57 Implementation Mapping

Source of truth: actual source code inspection, not documentation.

### Group A: System Administration (STT 1–5)

| STT | Requirement | BE Implemented | FE Implemented | E2E Test | Test Result | Status |
|-----|-------------|:-:|:-:|:-:|:-:|--------|
| 1 | Phân quyền truy cập | Yes (`IdentityAdministrationAppService`, role-permission matrix) | Yes (`/administration/identity`) | `identity-administration.spec.ts` | FAIL (permission denied) | Implemented, untested |
| 2 | Quản lý tài khoản | Yes (ABP Identity + `CurrentUserContextAppService`) | Yes (user list in admin page) | `identity-administration.spec.ts` (partial) | FAIL | Implemented, untested |
| 3 | Nhật ký hệ thống | Yes (`AuditLogAppService`) | Yes (`/administration/audit-logs`) | `audit-logs.spec.ts` | FAIL (404) | Implemented, untested |
| 4 | Cấu hình hệ thống | **Partial** (FE only — static hardcoded page, no BE service) | Yes (`/administration/settings`) | `system-settings.spec.ts` | FAIL (404) | FE stub only |
| 5 | Quản lý đơn vị | Yes (`OrganizationAppService`, org tree, cascading CRUD) | Yes (`/organizations`) | `organizations.spec.ts` | FAIL (selector bug) | Implemented, untested |

### Group B: Catalogs (STT 6–18)

| STT | Requirement | BE Implemented | FE Implemented | E2E Test | Test Result | Status |
|-----|-------------|:-:|:-:|:-:|:-:|--------|
| 6 | Quản lý đơn vị (repeat of 5) | Yes | Yes | Same as STT 5 | FAIL | Implemented, untested |
| 7 | Quản lý tài khoản đơn vị | Yes (view from STT 2) | Yes | Same as STT 2 | FAIL | Implemented, untested |
| 8 | Quốc gia/vùng lãnh thổ | Yes (`MasterCatalogAppService` — Country) | Yes (`/catalogs` tab) | `catalogs.spec.ts` (not this entity) | PASS (other entity) | Implemented, test exists but doesn't cover this entity |
| 9 | Vùng/miền | Yes (Region) | Yes | Same | PASS (other) | Same |
| 10 | Tỉnh/Thành phố | Yes (`GeographicCatalogAppService`) | Yes (`/geography` tab) | `geography.spec.ts` | **PASS** | Superficial (read-only) |
| 11 | Huyện/Quận | Yes | Yes | `geography.spec.ts` | **PASS** | Superficial (read-only) |
| 12 | Xã/Phường | Yes | Yes | `geography.spec.ts` | **PASS** | Superficial (read-only) |
| 13 | Ngành nghề kinh doanh | Yes (BusinessClassification) | Yes | `catalogs.spec.ts` (not this) | PASS (other) | Untested for this entity |
| 14 | Nhóm sản phẩm | Yes (ProductGroup) | Yes | Same | PASS (other) | Same |
| 15 | Loại hình kinh doanh | Yes (BusinessType) | Yes | Same | PASS (other) | Same |
| 16 | Loại quảng cáo | Yes (AdvertisementType) | Yes | Same | PASS (other) | Same |
| 17 | Đơn vị kiểm nghiệm | Yes (TestingCenter) | Yes | Same | PASS (other) | Same |
| 18 | Dịch vụ kiểm nghiệm | Yes (TestingService) | Yes | Same | PASS (other) | Same |

### Group C: ATTP Management (STT 19–40)

| STT | Requirement | BE Implemented | FE Implemented | E2E Test | Test Result | Status |
|-----|-------------|:-:|:-:|:-:|:-:|--------|
| 19 | Quản lý cơ sở SXKD | Yes (`BusinessAppService`, Excel import/export, attachments) | Yes (`/businesses`) | `businesses.spec.ts` | FAIL (download bug) | Implemented, test runs but fails |
| 20 | Quản lý sản phẩm | Yes (`ProductAppService`, Excel, attachments) | Yes (`/businesses` tab Sản phẩm) | `businesses.spec.ts` | FAIL | Implemented, untested |
| 21 | Tự công bố sản phẩm | Yes (`SelfDeclarationAppService`, Excel, attachments) | Yes (`/self-declarations`) | `self-declarations.spec.ts` | FAIL (no org data) | Implemented, untested |
| 22 | Đăng ký công bố SP | Yes (`ProductRegistrationAppService`, Excel, attachments) | Yes (`/product-registrations`) | `product-registrations.spec.ts` | FAIL (no org data) | Implemented, untested |
| 23 | Đăng ký quảng cáo | Yes (`AdvertisementRegistrationAppService`, Excel, attachments) | Yes (`/advertisement-registrations`) | `advertisement-registrations.spec.ts` | FAIL (no org data) | Implemented, untested |
| 24 | Giấy đủ ĐK ATTP | Yes (`EligibilityCertificateAppService`, expiry job, attachments) | Yes (`/eligibility-certificates`) | `eligibility-certificates.spec.ts` | FAIL (no org data) | Implemented, untested |
| 25 | Chứng nhận CFS | Yes (`CfsCertificateAppService`, expiry job, attachments) | Yes (`/cfs-certificates`) | `cfs-certificates.spec.ts` | FAIL (no org data) | Implemented, untested |
| 26 | GCN xuất khẩu | Yes (`ExportFoodCertificateAppService`, expiry job, attachments) | Yes (`/export-food-certificates`) | `export-food-certificates.spec.ts` | FAIL (no org data) | Implemented, untested |
| 27 | Thanh kiểm tra | Yes (`InspectionPlanAppService`, `InspectionResultAppService`, approval workflow) | Yes (`/inspection`) | `inspection.spec.ts` | FAIL (no org data) | Implemented, untested |
| 28 | Kết quả thanh tra | Yes (same as 27) | Yes | Same | FAIL | Implemented, untested |
| 29 | Cảnh báo VSATTP | Yes (`AtpAlertAppService`) | Yes (`/alerts-news`) | `alerts-news.spec.ts` | FAIL (404) | Implemented, untested |
| 30 | Tin tức ATTP | Yes (`AtpNewsAppService`) | Yes (`/alerts-news` tab) | `alerts-news.spec.ts` | FAIL (404) | Implemented, untested |
| 31 | Ngộ độc thực phẩm nhỏ lẻ | Yes (`FoodPoisoningCaseAppService`, workflow) | Yes (`/food-poisoning`) | `food-poisoning.spec.ts` | FAIL (404) | Implemented, untested |
| 32 | Vụ ngộ độc thực phẩm | Yes (`FoodPoisoningIncidentAppService`, workflow) | Yes (same page) | Same | FAIL (404) | Implemented, untested |
| 33 | Báo cáo NĐTP | Yes (`NdtpReportAppService`, 5-state workflow) | Yes (`/reporting`) | `reporting.spec.ts` | FAIL (404) | Implemented, untested |
| 34 | Báo cáo công tác ATTP | Yes (`AtpWorkReportAppService`, 5-state workflow) | Yes (same page, tab) | Same | FAIL (404) | Implemented, untested |
| 35 | Báo cáo tháng hành động | Yes (`ActionMonthReportAppService`, 5-state workflow) | Yes (same page, tab) | Same | FAIL (404) | Implemented, untested |
| 36 | Phân tích nguy cơ | Yes (`RiskAnalysisAppService`) | Yes (`/risk-analysis`) | `risk-analysis.spec.ts` | FAIL (404) | Implemented, untested |
| 37 | Kết quả kiểm nghiệm | Yes (`TestingResultAppService`) | Yes (`/testing-results`) | `testing-results.spec.ts` | FAIL (404) | Implemented, untested |
| 38 | Tài liệu | Yes (`AdministrativeDocumentAppService`) | Yes (`/documents`) | `documents.spec.ts` | FAIL (404) | Implemented, untested |
| 39 | Bảng điều khiển | Yes (`DashboardAppService`) | Yes (`/dashboard`) | `dashboard.spec.ts` | FAIL (assertion mismatch) | Implemented, test runs but fails |
| 40 | Thống kê | Yes (`StatisticsAppService`) | Yes (`/statistics`) | `statistics.spec.ts` | FAIL (404) | Implemented, untested |

### Group E: Public Portal (STT 41–49)

| STT | Requirement | BE Implemented | FE Implemented | E2E Test | Test Result | Status |
|-----|-------------|:-:|:-:|:-:|:-:|--------|
| 41 | Tra cứu cơ sở | Yes (`PublicBusinessAppService`) | Yes (`/tra-cuu-co-so`) | `public-lookups.spec.ts` | FAIL (404) | Implemented, untested |
| 42 | Tra cứu sản phẩm | **No** | **No** | **No** | — | **Not implemented** |
| 43 | Tra cứu giấy phép | Yes (6 separate public AppServices for each license type) | Yes (6 lookup routes) | `public-lookups.spec.ts` | 3 PASS / 4 FAIL (404) | Partially tested |
| 44 | Tra cứu kiểm nghiệm | **No** | **No** | **No** | — | **Not implemented** |
| 45 | Tra cứu thanh kiểm tra | **No** | **No** | **No** | — | **Not implemented** |
| 46 | Cảnh báo VSATTP | **No** | **No** | **No** | — | **Not implemented** |
| 47 | Phân tích nguy cơ | **No** | **No** | **No** | — | **Not implemented** |
| 48 | Tin tức | **No** | **No** | **No** | — | **Not implemented** |
| 49 | Gửi cảnh báo | **No** | **No** | **No** | — | **Not implemented** |

### Group F: Data Integration (STT 50–57)

| STT | Requirement | BE Implemented | FE Implemented | E2E Test | Test Result | Status |
|-----|-------------|:-:|:-:|:-:|:-:|--------|
| 50 | Quản lý API | Yes (`ApiEndpointAppService`, `ApiCallLogAppService`) | Yes (`/data-integration`) | `data-integration.spec.ts` | FAIL (404) | Implemented, untested |
| 51 | Chia sẻ cơ sở SXKD | **Partial** (generic call log only, no per-entity integration) | Partial | `data-integration.spec.ts` | FAIL | Partially implemented |
| 52 | Chia sẻ sản phẩm | **Partial** (same) | Partial | Same | FAIL | Partially implemented |
| 53 | Chia sẻ giấy phép | **Partial** | Partial | Same | FAIL | Partially implemented |
| 54 | Chia sẻ thanh tra | **Partial** | Partial | Same | FAIL | Partially implemented |
| 55 | Chia sẻ ngộ độc | **Partial** | Partial | Same | FAIL | Partially implemented |
| 56 | Chia sẻ kiểm nghiệm | **Partial** | Partial | Same | FAIL | Partially implemented |
| 57 | Chia sẻ cảnh báo | **Partial** | Partial | Same | FAIL | Partially implemented |

---

## Summary Counts

### Implementation Status (STT 1–57)

| Category | Count | STTs |
|----------|-------|------|
| **Fully implemented** (BE + FE) | 42 | 1–3, 5–28, 29–41, 43, 50 |
| **Partially implemented** | 8 | 4 (FE stub), 51–57 (generic call log) |
| **Not implemented** | 7 | 42, 44, 45, 46, 47, 48, 49 |

### Test Status (all 33 test cases)

| Category | Count |
|----------|-------|
| **PASSED** | 8 |
| **FAILED — Docker 404** (stale frontend build) | 14 |
| **FAILED — No org seed data** | 8 |
| **FAILED — Test/app bug** | 4 (organizations selector, businesses download, dashboard assertion, identity-admin permission) |
| **No test exists** | 1 (password management) |

### Verification Status

| Status | Count | Detail |
|--------|-------|--------|
| **VERIFIED** | **0** | No feature meets all verification criteria |
| **READY_FOR_TEST** | **5** | auth (3 tests pass), catalogs (1/9 types), geography (read-only), 3 public lookups (route+not-found only) |
| **FAILED** | **26** | All other tested features |
| **BLOCKED** | **1** | Password management (no test exists) |
| **NOT_STARTED** | **7** | STT 42, 44–49 (not implemented) |

---

## Cross-Cutting Test Gaps (Apply to ALL Features)

| Dimension | Status | Detail |
|-----------|--------|--------|
| **Permission denial** (non-admin user) | NOT_TESTED | All tests run as admin; no test creates a restricted user |
| **Cross-organization denial** | NOT_TESTED | No organization data seeded; org tree returns `{"items":[]}` |
| **Cross-administrative-area denial** | NOT_TESTED | No area-scoped test exists |
| **Loading state** (spinner/skeleton) | NOT_TESTED | No test checks loading indicators |
| **Error state** (API error boundary) | NOT_TESTED | No test forces an API error and checks UI response |
| **Empty state** (no data) | PARTIAL | Only `public-lookups.spec.ts` checks "Không tìm thấy" |
| **Browser console errors** | NOT_TESTED | No test monitors `console.error` |
| **Audit log verification** | NOT_TESTED | No test checks if actions produce audit entries |
| **Persistence after reload** | PARTIAL | Only `advertisement-registrations.spec.ts` uses `page.reload()` |
| **Search/filter/sort** | NOT_TESTED | No test exercises list filtering, sorting, or search |
| **Pagination** | NOT_TESTED | No test navigates between pages |

---

## Systemic Blockers (prioritized)

### 1. Docker frontend build is stale (CRITICAL)

The nginx container serves JavaScript built from a commit that predates ~12 feature additions. **14 of 25 test failures** are caused by this — the route exists in source code but the Docker build returns 404.

**Root cause:** `FoodSafe.FE/Dockerfile` uses `node:22-alpine` but the current code only compiles cleanly on Node 20. The Docker image was last successfully built when fewer features existed.

**Fix:** Change Dockerfile to `node:20-alpine` or fix the 3 TS errors that appear under Node 22.

### 2. No organization seed data (CRITICAL)

The organization tree API returns `{"items":[]}`. **8 of 25 test failures** are caused by this — tests can't create businesses, products, or certificates because they all require an `organizationId`.

**Fix:** Add organization seed data in `FoodSafeDbMigrationService` or `FoodSafePermissionDataSeedContributor`.

### 3. API rate limiter blocks test execution

`FixedWindow("login:{ip}", 10, 5 minutes)` uses in-memory storage. Running more than 10 tests in 5 minutes blocks all subsequent login attempts with `FoodSafe:RateLimit:0001`.

**Workaround:** Restart API container between test batches (resets in-memory store). **Real fix:** Exempt development/test environment from rate limiting, or implement session sharing in test setup.

### 4. No test user isolation

All tests use the same `admin` account. This prevents testing:
- Permission denial (admin has all permissions)
- Organization scope isolation (admin has system-wide scope)
- Administrative-area scope isolation

### 5. Admin user missing permissions

The seeded admin user lacks `FoodSafe.SystemAdministration.IdentityAdministration` permission. This blocks the identity-admin test.

---

## Test Code Quality Issues

| Issue | Spec File | Detail |
|-------|-----------|--------|
| **Misleading test name** | `testing-results.spec.ts` | Name says "edits and deletes" but NO edit action is coded |
| **Misleading test name** | `risk-analysis.spec.ts` | Name says "edits and deletes" but NO edit action is coded |
| **Incomplete entity coverage** | `catalogs.spec.ts` | Tests 1 of 9 catalog entity types |
| **Incomplete report coverage** | `reporting.spec.ts` | Tests NDTP only; ATP Work and Action Month reports untested |
| **Incomplete identity coverage** | `identity-administration.spec.ts` | Tests roles only; user CRUD, permissions untested |
| **No edit tests** in most CRUD features | Multiple | Many features test create + delete but skip edit |
