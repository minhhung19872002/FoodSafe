# Playwright E2E Quality Audit — FoodSafe

**Date:** 2026-07-27
**Auditor:** Independent acceptance audit (Claude)
**Scope:** All 55 Playwright E2E spec files in `FoodSafe.FE/e2e/*.spec.ts` plus helpers in `FoodSafe.FE/e2e/helpers/`
**Method:** Full source-code read of every file. No trust given to existing test-registry documentation. Judgment based solely on test code behavior as read. Zero test runs performed — this is a static quality audit.

---

## 1. Executive Summary

| Classification | Count | % |
|---|---|---|
| STRONG_E2E — browser-heavy UI | 19 | 35% |
| STRONG_E2E — API-heavy with browser tail | 27 | 49% |
| MODERATE_E2E — borderline | 3 | 5% |
| WEAK_E2E — superficial UI check | 6 | 11% |
| NOT_REAL_E2E — mocked or tautological | 0 | 0% |
| **Total** | **55** | **100%** |

**Zero disqualifiers found.** No file uses `page.route()`, `route.fulfill()`, `route.abort()`, `test.skip`, `test.fixme`, MSW interception, `vi.mock()`, hard-coded tokens, or fake API responses. Every file exercises a real live stack.

**Overall verdict:** The suite is structurally sound and far above the minimum bar for real integration testing. The 6 weak files are the only genuine gap. The 27 API-heavy verification specs reliably verify server behavior but provide limited browser-rendering coverage on their own.

---

## 2. Disqualifier Scan Results

Searched all 55 files for:
- `page.route(` — **0 hits**
- `route.fulfill(` — **0 hits**
- `route.abort(` — **0 hits**
- `test.skip` — **0 hits**
- `test.fixme` — **0 hits**
- `vi.mock(` — **0 hits**
- `localStorage.setItem` for fake auth — **0 hits**
- `msw` imports — **0 hits**

All authentication is performed through the real `/api/account/login` endpoint via `signInAsAdmin()` or `signIn()` in `helpers/auth.ts`.

---

## 3. Helper Files Summary

### `FoodSafe.FE/e2e/helpers/auth.ts`
Real authentication helper. `signIn()` fetches an XSRF cookie via `GET /abp/Swashbuckle/SetCsrfCookie`, then POSTs to `/api/account/login` with the `RequestVerificationToken` header. `captchaToken` is `"XXXX.DUMMY.TOKEN.XXXX"` — a dev-mode bypass that must be enabled in `appsettings.Development.json`. `signInAsAdmin()` reads `E2E_ADMIN_PASSWORD` from environment. The helper asserts `result === 1` to confirm real authentication succeeded. **This is genuine authentication with no shortcuts.**

**Gap:** The dev-mode CAPTCHA bypass means CAPTCHA logic itself is never tested end-to-end in this suite. Production CAPTCHA failure behavior is untested.

### `FoodSafe.FE/e2e/helpers/licensing.ts`
Factory function `defineLicensingVerificationSuite(config)` that generates 5 standardized tests for licensing modules:
1. Unauthenticated API → 401/302
2. No-permission user → 403
3. Cross-org isolation (admin creates at province, district.staff cannot see/get)
4. Revoke workflow + duplicate number + validation
5. UI persistence after reload + empty state via `page.goto`

Used by: `eligibility-certificates-verification.spec.ts`, `cfs-certificates-verification.spec.ts`, `export-food-certificates-verification.spec.ts`, `advertisement-registrations-verification.spec.ts`. A defect in this factory silently breaks all 4 modules' verification.

---

## 4. Per-File Classification Table

Criteria columns: (1) Browser UI, (2) Multi-role auth, (3) Real workflow, (4) Persistence, (5) Authorization, (6) Negatives, (7) Edge cases, (8) Error handling
Rating: Y = Yes / P = Partial / N = No

| File | Classification | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `auth.spec.ts` | WEAK_E2E | Y | N | N | N | P | N | N | N | 3 tests: login form visual check, admin login via API then page.goto("/") heading, unauth redirect. No logout, no wrong-password via browser, no CSRF test. |
| `auth-verification.spec.ts` | STRONG_E2E (mixed) | Y | Y | P | Y | Y | Y | P | Y | 6 tests: login form elements, wrong password → result≠1, CSRF header omitted → rejected, successful login → API+UI access, logout → redirect to /login, session persists across navigation. Real browser logout tested here. |
| `audit-logs.spec.ts` | MODERATE_E2E | Y | N | N | N | N | N | N | N | 1 test: column headers visible, first row visible, pagination text regex, URL filter shows rows. No specific record verified. No auth test. Admin only. Shallow assertions. |
| `audit-logs-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | N | Y | Y | P | P | Y | 5 tests: unauth 401, noperm 403, district.staff 403, admin list totalCount>0, URL filter validates all items contain filter string, httpMethod=POST filter check, UI loads+filter+empty state. No mutation tested (audit logs are read-only by nature). |
| `businesses.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: Excel export (PK bytes), template download, import validation (invalid GUID, biz not found), create, edit, handler, product Excel/import, add product, attachment with EICAR rejection + valid PDF upload/download/delete, product delete, business delete. Admin only in browser. |
| `businesses-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401/302, noperm 403, org bypass (district→province 403, district→own 200), cross-org isolation (admin creates → district cannot list/get, org change 403), duplicate code + server validation (missing name=400, bad email=400, lat>90=400), UI persistence+reload+empty state. 3 roles. |
| `catalogs.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | N | 1 test: browser UI CRUD for document type catalog. Create → toast → row name, edit → updated name, delete → row count=0. Admin only. No negative tests. |
| `catalogs-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, district.staff can read (totalCount is number), district.staff denied create (403), admin full CRUD via API with persistence (list→create→list→update→delete→list shows gone), seeded countries/regions check, UI reload + 2 cells visible. 3 roles. |
| `certificate-pdf-verification.spec.ts` | STRONG_E2E (API-heavy) | P | N | Y | Y | P | Y | P | Y | 8 tests: 5 PDF endpoints return valid application/pdf bytes and `%PDF` magic (eligibility, self-declaration, product-registration, CFS, export-food), unknown ID → not 200, UI shows "Tải PDF" link for eligibility cert with correct href, ad-registrations tab has no PDF link. Uses shared `adminPage` context (beforeAll). Admin only. No cross-org or permission test for PDF endpoints. |
| `cfs-certificates.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: country options from API, business via API, create CFS via browser UI (biz+country combos, number, certifying authority), Excel export, file upload+download+delete, public lookup (clearCookies → /tra-cuu-cfs → finds cert+business), revoke (dialog+reason), post-revoke attachment block, delete, duplicate rejected. Admin only. |
| `cfs-certificates-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | Uses `defineLicensingVerificationSuite(F-011)` with `fetchExtras` to get `destinationCountryId` from catalog. 5 tests: unauth 401, noperm 403, cross-org isolation, revoke+duplicate+validation, UI persistence+reload+empty state. 3 roles. |
| `dashboard.spec.ts` | WEAK_E2E | Y | N | N | N | N | N | N | N | 1 test: page.goto("/"), heading visible, 3 text labels visible. No data assertions, no API verification, no authorization test. Admin only. |
| `dashboard-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | N | N | Y | N | P | Y | 5 tests: unauth 401, noperm CAN access (authentication-only gate, 200), admin stats response has all required fields (number type checks, totalBusinesses>0), district.staff receives scoped stats (≥0), UI loads with heading+cards. 3 roles. No mutation tested (read-only dashboard). |
| `data-integration.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | Y | 1 test: creates API endpoint via browser UI (name, URL, method, system, auth type), endpoint appears in list, deletes via popover confirm, endpoint gone, switches to call history tab. Admin only. No negative tests. |
| `data-integration-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 6 tests: unauth 401, noperm 403, district.staff 403 for both endpoint list+call log, full CRUD with status toggle (Active→Inactive→Active both directions verified), server validation (missing name/url/method/system), call history readable, UI persistence+reload+empty state. 3 roles. |
| `documents.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | N | 1 test: creates via browser UI (type, number, title, date), Excel export, delete via popover. Admin only. No negative tests. |
| `documents-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, district.staff 403, full CRUD via API (creates doc-type fixture, then doc, GET→UPDATE isPublic→DELETE→GET after delete fails), server validation (missing title, missing docNumber), UI persistence+reload+empty state. 3 roles. |
| `eligibility-certificates.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: business via API, create cert via browser UI, hasEligibilityCertificate=true API check, file upload+download+delete, public lookup (clearCookies → /tra-cuu-giay-du-dieu-kien → finds cert), revoke (verifies hasEligibilityCertificate=false), post-revoke attachment block, delete, duplicate rejected. Admin only. |
| `eligibility-certificates-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | Uses `defineLicensingVerificationSuite(F-010)`. 5 tests: unauth 401, noperm 403, cross-org (district cannot list/get province cert), revoke+duplicate+validation (status=Revoked|3, double revoke fails, missing number=400), UI persistence+reload+empty state. 3 roles. |
| `export-food-certificates.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: business via API, goto /export-food-certificates, Excel export (PK bytes), create via browser UI (biz combo, cert number, lot number, quantity, unit), file upload+download+delete, public lookup (clearCookies → /tra-cuu-gcn-xuat-khau → finds businessName+lotNumber+quantity+unit), revoke (dialog with reason), post-revoke attachment block, delete, duplicate rejected. Admin only. |
| `export-food-certificates-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | Uses `defineLicensingVerificationSuite(F-012)`. 5 tests from factory. 3 roles. |
| `advertisement-registrations.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: advertisement-type fixture created if not seeded, business+2 products via API, Excel export (filename regex checked), create registration with multi-product select, file upload+download+delete, many-to-many update via API (products[1] only), reload verifies first product gone + second product remains, revoke, post-revoke attachment block, delete, duplicate rejected. Admin only. Most thorough M2M lifecycle in suite. |
| `advertisement-registrations-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | Uses `defineLicensingVerificationSuite(F-009)` with `needsProduct: true`. 5 tests from factory. 3 roles. |
| `food-poisoning.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: create case (form fill), submit (popover), verify (popover), create incident, submit, verify, conclude (dialog with reason). Creates geo-mapped incident via API → reloads → verifies leaflet-container and leaflet-interactive path visible (map rendering verified). Admin only. |
| `food-poisoning-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, cross-org isolation, invalid workflow (verify before submit fails with FoodSafe:FoodPoisoning error code, double submit fails, edit after submit fails), oversized name (201 chars → 400), UI persistence+reload+empty state. 3 roles. |
| `geography.spec.ts` | WEAK_E2E | Y | N | N | N | N | N | N | N | 1 test: loads /geography, heading visible, 2 column headers, first row visible, navigates district/commune tabs checking "Loại" header. No API verification, no data assertion beyond rows existing. Admin only. |
| `geography-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | N | Y | Y | N | P | Y | 5 tests: unauth 401, noperm 403, district.staff can read provinces (200, items array), seeded data (known IDs PROVINCE_QN_ID and DISTRICT_HL_ID validated via API), activeOnly filter check, UI tab navigation+reload. 3 roles. No mutation (geography data is admin-managed seeded data). |
| `identity-administration.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | N | 1 test: /administration/identity, user column header, switch to roles tab, create role via dialog, edit description, delete role (row gone), switch back to accounts tab, non-empty user table. Admin only. No negative tests. |
| `identity-administration-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 6 tests: unauth 401 for users+roles, noperm 403 for both, district.staff 403, role CRUD with concurrency stamp (create→GET→UPDATE with stamp→GET after update→DELETE→GET after delete fails), server validation (missing name), user list (contains admin, totalCount>0), UI persistence+empty state. 3 roles. |
| `inspection.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: business via API, /inspection, Excel export (PK bytes), create plan via dialog (code, name, type, year, adds business), "Nháp" status, submit (popover → "Đã gửi duyệt."), approve (popover → "Đã phê duyệt.", "Đã duyệt" in row), records inspection result via Kết quả tab. Admin only. Full 3-step workflow. |
| `inspection-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, cross-org (admin creates at province, district cannot list/get), invalid workflow (approve before submit fails, submit without business → 403 with FoodSafe:Inspection:0004), server validation (missing planCode → 400), UI client validation (missing fields → Vietnamese error messages, duplicate → error toast, persistence after reload × 2, delete persistence). 3 roles. |
| `alerts-news.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 test: create alert (dialog: title, category, level, content), publish (confirm), recall (dialog with reason, verifies "Đã thu hồi" in row), news tab check. Admin only. |
| `alerts-news-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 4 tests: unauth 401 for both endpoints, noperm 403, publish/recall workflow (recall before publish fails, double publish fails, edit published fails, recall without reason fails, recall with reason OK → verifies recalledById/recalledAt/recallReason, double recall fails), server validation (missing title=400, source=0=400), UI persistence+reload+empty state. Admin only (no cross-org because alerts are province-level). |
| `organizations.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | Y | N | 2 tests: (1) lists seeded orgs via browser UI checking specific codes (CCATVSTP-QN, PYT-HL, TYT-BD) and full org name. (2) API create → browser sees org in table → browser edit via dialog → updated in table → reload (persists) → browser delete → verified removed. Admin only. |
| `organizations-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, district.staff scoped read (totalCount is number), admin full CRUD + GET by id + UPDATE + DELETE + scope isolation (admin's new org invisible to district.staff via list filter), duplicate code rejected, UI seeded org visible+reload. 3 roles. |
| `password-management-verification.spec.ts` | STRONG_E2E (mixed) | P | Y | Y | Y | Y | Y | Y | Y | 2 tests: unauth 401/302/400. Full lifecycle: admin creates throwaway user, user logs in, wrong current password rejected (FoodSafe error code), weak password rejected (400), same-as-current rejected, successful change, old password login fails, new password login works, password history (old reuse rejected). Multiple roles. Most thorough auth lifecycle test in suite. |
| `public-lookups.spec.ts` | WEAK_E2E | Y | N | N | N | N | N | N | N | 7 tests across 7 routes. Each: heading visible, placeholder visible, button visible, fill non-existent value, assert "Không tìm thấy". No real data creation, no found-case test. Anonymous access. Proves lookup UI renders but not that it actually finds records. |
| `public-lookups-verification.spec.ts` | STRONG_E2E (API-heavy) | P | N | Y | Y | P | Y | Y | Y | F-024..F-030. Each feature: anon access allowed (not 401), found by number (admin creates → public API lookup → field assertions), not-found returns error (not 401/302), UI: lookup page with found+not-found assertions. Self-declaration, product-registration, CFS, advertisement-registration create full business+product fixtures. 28 tests. Anonymous access (no multi-role auth, appropriate for public endpoints). |
| `public-portal.spec.ts` | STRONG_E2E (browser) | Y | Y | Y | Y | Y | Y | Y | Y | 5 tests: portal home link check (6 hrefs), public business search (admin creates → anon browser searches → finds name), published vs draft news (admin creates+publishes + draft → anon API confirms published visible+draft hidden → anon browser finds published), citizen alert submission (anon browser form fill → waitForResponse → success message → admin verifies source=2 status=1), submission without captcha rejected, warned businesses + documents pages. Most multi-role browser test in suite (admin creates, anon browses). |
| `public-portal-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | Large file covering FR-41..FR-49. Anon API search for business/product, eligibility cert, self-declaration, product registration, CFS. Admin creates alerts (businessId), publishes, anon checks warned-businesses list. News: published+isPublic in anon list, draft not, viewCount check, citizen submission (source=2 status=1 verified), CAPTCHA rejection. Public docs vs private docs (admin creates both, anon list shows only public). UI smoke tests for all routes. Multiple roles including anonymous. |
| `reporting.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: cleans stale test reports, finds free period from reserved years (2090-2099), creates NDTP report via dialog (virtualized month picker with retry+scroll logic), edits (fills Số ca), submits, verifies, completes. Full Draft→Submit→Verified→Complete state machine in browser. ATTP and Tháng hành động tabs existence checked. Admin only. |
| `reporting-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, cross-org isolation (VERIFICATION_YEAR=2089), workflow guards (verify draft fails, complete draft fails, double submit fails, delete submitted fails, return without reason→400, return with reason→OK, return-to-draft→OK, delete draft→OK, GET after delete→not found), server validation (month=13→400), UI persistence+empty state via year filter. 3 roles. |
| `reporting-error-notifications.spec.ts` | STRONG_E2E (mixed) | P | Y | Y | Y | Y | Y | Y | Y | 2 tests. Test 1: full error-notification lifecycle — cannot report errors while Draft (400/403), submit→add notification (status=1 Pending), empty fields rejected (400), acknowledge (status=2), respond (status=3), persistence via separate retrieval (1 item, status=3, response contains "trả lại"), **UI: page.goto("/reporting") → click "Sai sót" button → verify notification details visible**. Test 2: noperm user cannot add or read notifications (401/403). Admin + noperm roles. |
| `risk-analysis.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | N | 1 test: create analysis via browser UI (title, category, level, content), publish via popover, verifies "Đã xuất bản" in row. Admin only. Minimal negative tests. |
| `risk-analysis-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 4 tests: unauth 401, noperm 403, publish workflow (publish OK → status=Published/2, publishedById set, publishedAt set, double publish fails, edit published fails, delete published fails), server validation (missing title), UI persistence+reload+empty state. Admin only (no cross-org for risk analysis). |
| `self-declarations.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: business+product via API, Excel export, add declaration via browser UI (combos for biz+product, declaration number, auto-fills product name), attachment upload (PDF), download (checks %PDF magic), delete attachment, revoke (dialog with reason, verifies "Đã thu hồi" in row), post-revoke attachment block, delete declaration, duplicate number rejected. Admin only. |
| `self-declarations-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, cross-org isolation, workflow (duplicate fails, revoke without reason=400, revoke once OK status=Revoked/3, double revoke fails with SelfDeclaration error code), server validation (missing declaration number=400), UI persistence+reload+empty state. 3 roles. |
| `product-registrations.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | Y | Y | Y | 1 large test: biz+product via API, Excel export, create registration via browser UI (biz+product combos, registration number, receipt number), file upload, public lookup (clearCookies → /tra-cuu-dang-ky-cong-bo → finds product+business name), re-signs in admin, revokes (dialog with reason), post-revoke attachment block, delete, duplicate rejected. Admin only. |
| `product-registrations-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | Y | Y | Y | Y | Y | Y | 5 tests: unauth 401, noperm 403, cross-org isolation, revoke workflow + duplicate + validation (missing number=400), UI persistence+reload+empty state. 3 roles. |
| `statistics.spec.ts` | WEAK_E2E | Y | N | N | N | N | N | N | N | 1 test: loads /statistics, heading + 2 text labels + year combobox visible. No data assertions. Admin only. |
| `statistics-verification.spec.ts` | MODERATE_E2E | P | Y | N | N | Y | N | Y | Y | 4 tests: unauth 401, noperm CAN access (authentication-only, 200), admin stats response validates all 8 array fields, year parameter respected (2026 vs 2025 both return valid shapes), UI with recharts container visible. No mutation (read-only). No cross-org test (statistics is authentication-gated, not permission-gated by design). |
| `system-settings.spec.ts` | WEAK_E2E | Y | N | N | N | N | N | N | N | 1 test: loads /administration/settings, heading + 5 text labels visible. No mutation, no API verification, no authorization. Admin only. |
| `system-settings-verification.spec.ts` | MODERATE_E2E | Y | Y | N | N | Y | N | P | Y | 5 tests: unauth → redirect to /login (real browser test), noperm user → heading NOT visible (FE permission check), district.staff → heading NOT visible, admin → all sections + "Lưu cấu hình" button visible, API settings populated in form (smtpHost cross-checked if present). No mutation tested. 3 roles. |
| `testing-results.spec.ts` | STRONG_E2E (browser) | Y | N | Y | Y | N | N | N | N | 1 test: testing center via API, goto /testing-results, Excel export (PK bytes), create result via browser UI (code, name, center combobox, date, result=Đạt), result appears, delete via popover, center deleted. Admin only. |
| `testing-results-verification.spec.ts` | STRONG_E2E (API-heavy) | P | Y | N | Y | Y | Y | Y | Y | 4 tests: unauth 401, noperm 403, district.staff 403 for list+detail (blocked at authorization not scope), server validation (missing sample code, empty center → FoodSafe:TestingResult:0002), UI persistence+reload+edit+empty state (center name visible in row). 3 roles. No cross-org (testing is province-level). |

---

## 5. Cross-Cutting Findings

### 5.1 Admin-only browser UI tests

Every main `*.spec.ts` file (non-verification) uses `signInAsAdmin(page)` exclusively. The browser rendering path is only ever tested from the admin perspective. Non-admin role behavior in the UI is delegated entirely to the API-heavy `*-verification.spec.ts` counterparts, and even there the browser tests within verification specs use admin.

**Consequence:** If a bug causes the UI to render different content for `district.staff` (e.g., wrong filtered data, missing error state, incorrect empty state), no test will catch it. The API level correctly verifies scoping but the rendered result for non-admin roles is never browser-verified.

### 5.2 Verification specs are API-heavy — browser rendering is a thin tail

The 27 `*-verification.spec.ts` files collectively provide the authorization, validation, and workflow coverage. However, 4 of the 5 tests in a typical verification spec use `page.context().request` (APIRequestContext) not `page.goto`. The browser UI test is always the last test, and it typically only verifies:
- the page heading or a search result appears
- an empty state appears for a non-existent filter
- persistence after reload shows a previously-created item

This means business validation error messages, workflow status transitions, and authorization denial messages are verified at the HTTP level but never verified as they appear in the browser UI.

### 5.3 No browser console error or page error monitoring

No spec file installs `page.on('console', handler)` or `page.on('pageerror', handler)`. A React error boundary that catches a render exception and shows a fallback UI instead of the real content would pass all UI assertions that only check heading visibility. Uncaught promise rejections in the browser are invisible to the test suite.

### 5.4 Cross-org denial is API-only, never browser-verified

Org-scope isolation tests exist in every applicable verification spec, but they operate entirely via `APIRequestContext`. No test:
1. Logs in `district.staff` via a real browser session
2. Navigates to a feature route (e.g., `/businesses`)
3. Verifies that province-level data does not appear in the rendered table

The isolation is confirmed to work at the server level; it is not confirmed to work at the UI rendering level.

### 5.5 Shared factory in helpers/licensing.ts introduces single point of failure

Four modules (`eligibility-certificates`, `cfs-certificates`, `export-food-certificates`, `advertisement-registrations`) delegate their entire verification suite to `defineLicensingVerificationSuite()`. A bug introduced in that factory — wrong status code expectation, wrong field name, wrong API path pattern — would silently break all four modules simultaneously without any indication in the individual module test files.

### 5.6 CAPTCHA is always bypassed

`signInAsAdmin()` and `signIn()` use `captchaToken: "XXXX.DUMMY.TOKEN.XXXX"`. This token is accepted only when `appsettings.Development.json` enables dev-mode CAPTCHA bypass. The CAPTCHA system's effectiveness in blocking bots, the lockout behavior after failures, and the CAPTCHA UI rendering are never tested. `public-portal.spec.ts` tests "submission without captcha rejected" but tests the case of a completely absent token, not an incorrect real token.

### 5.7 No session timeout or token refresh testing

The test suite verifies that logout redirects to `/login` and that sessions persist across navigation within a single test. No test verifies:
- what happens when a session token expires mid-test
- that the refresh-token flow silently renews the session
- that an expired session redirects to login rather than showing an API error

### 5.8 File attachment verification is incomplete for non-admin roles

Attachment endpoints are tested for the post-revoke block (correct). However, no test verifies:
- that `district.staff` can upload attachments to records within their own org
- that `district.staff` cannot download attachments from records in another org
- the malware (EICAR) rejection path for any role other than admin (only tested in `businesses.spec.ts`)

### 5.9 Excel export content is format-verified but not data-verified

Excel exports are verified to have the correct file extension and PK magic bytes (valid ZIP/XLSX). No test reads the Excel content to verify that the correct number of rows, correct column headers, or correct cell values are present. An empty Excel with only a header row would pass all export assertions.

### 5.10 Leaflet map rendering is the only non-Ant-Design UI verification

`food-poisoning.spec.ts` verifies that `leaflet-container` and `leaflet-interactive` elements are visible after creating a geo-mapped incident. This is the only test verifying map functionality. No test verifies marker positioning, popup content, or map interactions.

---

## 6. Verdict Inputs

### 6.1 Files whose passing constitutes genuine browser acceptance evidence

These files verify real user behavior through a real browser rendering path with meaningful business assertions:

| File | Why it qualifies |
|---|---|
| `auth-verification.spec.ts` | Real browser login form, logout, session navigation |
| `businesses.spec.ts` | Full browser lifecycle including EICAR rejection, import validation, CRUD |
| `catalogs.spec.ts` | Browser CRUD with result verification |
| `cfs-certificates.spec.ts` | Full browser lifecycle with public lookup via clearCookies |
| `data-integration.spec.ts` | Browser create+delete with tab navigation |
| `documents.spec.ts` | Browser create+export+delete |
| `eligibility-certificates.spec.ts` | Full lifecycle including hasEligibilityCertificate API cross-check |
| `advertisement-registrations.spec.ts` | M2M update via API + browser reload verification of rendered products |
| `export-food-certificates.spec.ts` | Full lifecycle with public lookup and lot/quantity/unit UI verification |
| `food-poisoning.spec.ts` | Full workflow with map rendering check |
| `identity-administration.spec.ts` | Browser role CRUD with row verification |
| `inspection.spec.ts` | Full 3-step workflow in browser |
| `organizations.spec.ts` | Browser edit + persist + delete with seeded data check |
| `password-management-verification.spec.ts` | Full auth lifecycle: wrong password, weak password, history reuse, old-fails new-works |
| `product-registrations.spec.ts` | Full lifecycle with public lookup |
| `public-portal.spec.ts` | Multi-role: admin creates, anon browses, citizen submits |
| `reporting.spec.ts` | Full Draft→Submit→Verified→Complete in browser |
| `reporting-error-notifications.spec.ts` | Full error-notification lifecycle + browser "Sai sót" modal verification |
| `risk-analysis.spec.ts` | Publish workflow in browser |
| `self-declarations.spec.ts` | Full lifecycle with attachment PDF magic check |
| `testing-results.spec.ts` | Browser create+delete |

### 6.2 Files that provide strong server evidence but limited browser evidence

These files are valuable for server correctness but their passing alone does not confirm that the UI renders correctly for real users:

All `*-verification.spec.ts` files except those listed in §6.1 and §6.3. They confirm the API contract, authorization, validation, workflow guards, and persistence via real HTTP. The browser UI test within each is a minimal smoke check (heading + one result visible), not a full business flow.

### 6.3 Files that do not constitute browser acceptance evidence

A passing result from these files does not prove the feature works for real users:

| File | Reason |
|---|---|
| `auth.spec.ts` | No authentication scenario tested through browser form; no negative path |
| `dashboard.spec.ts` | Only verifies heading and 3 text labels; no data, no auth |
| `geography.spec.ts` | Only verifies heading, column headers, first row exists; no data assertion |
| `public-lookups.spec.ts` | Only tests not-found case; never proves the lookup actually finds real records through the browser |
| `statistics.spec.ts` | Only verifies heading and combobox visible; no data verification |
| `system-settings.spec.ts` | Only verifies heading and 5 labels; no mutation, no API verification |
| `audit-logs.spec.ts` | Shallow: column headers + pagination regex + URL filter row visible; no record-level verification |
| `statistics-verification.spec.ts` | No mutation; only schema structure and year parameter; no cross-org; read-only endpoint |
| `system-settings-verification.spec.ts` | No mutation tested; authorization-denial is verified via heading absence (FE route guard) not HTTP 403 |
| `certificate-pdf-verification.spec.ts` | 6/8 tests are API-only PDF byte checks; browser tests check "Tải PDF" link visible but not that downloading it works through the browser |

---

## 7. Compact Summary

```
TOTAL_FILES: 55
DISQUALIFIERS_FOUND: 0
PAGE_ROUTE_INTERCEPTS: 0
TEST_SKIP_OR_FIXME: 0

BY_CLASSIFICATION:
  STRONG_E2E_browser_heavy: 19
  STRONG_E2E_api_heavy_with_browser_tail: 27
  MODERATE_E2E: 3
  WEAK_E2E: 6
  NOT_REAL_E2E: 0

WEAK_E2E_FILES:
  - auth.spec.ts
  - dashboard.spec.ts
  - geography.spec.ts
  - public-lookups.spec.ts
  - statistics.spec.ts
  - system-settings.spec.ts

MODERATE_E2E_FILES:
  - audit-logs.spec.ts
  - statistics-verification.spec.ts
  - system-settings-verification.spec.ts

TOP_5_QUALITY_GAPS:
  1. Admin-only browser UI — non-admin role rendering never browser-verified
  2. Cross-org isolation verified via API only — never verified through browser rendering
  3. No browser console/pageerror monitoring — silent JS errors are invisible
  4. Excel export content not verified — format-only (PK bytes), rows/columns untested
  5. Licensing factory is single point of failure for 4 modules (eligibility-certs, cfs-certs, export-food-certs, advertisement-registrations)
```
