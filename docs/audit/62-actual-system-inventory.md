# 62 — Actual System Inventory (Independent Enumeration)

Audited state: branch `codex/production-readiness`, last commit `9d2cb1e` **plus 53 uncommitted working-tree files** (+1168/−418 lines). Audit date 2026-07-27. Evidence gathered by direct file inspection; names were not trusted — behavior was verified in code.

---

## 1. Frontend (FoodSafe.FE)

### 1.1 Routes (src/app/router.tsx) — all lazy-loaded

**Public (anonymous):** `/login`, `/account/forgot-password`, `/account/reset-password`, `/account/complete-password-change`, and 7 public lookups: `/tra-cuu-co-so`, `/tra-cuu-tu-cong-bo`, `/tra-cuu-dang-ky-cong-bo`, `/tra-cuu-dang-ky-quang-cao`, `/tra-cuu-giay-du-dieu-kien`, `/tra-cuu-cfs`, `/tra-cuu-gcn-xuat-khau`.

**Private (PrivateRoute + PermissionRoute):** `/dashboard`, `/organizations`, `/geography`, `/catalogs`, `/businesses`, `/self-declarations`, `/product-registrations`, `/advertisement-registrations`, `/eligibility-certificates`, `/cfs-certificates`, `/export-food-certificates`, `/inspection`, `/alerts-news`, `/food-poisoning`, `/reporting`, `/risk-analysis`, `/testing-results`, `/documents`, `/data-integration`, `/statistics`, `/administration/identity`, `/administration/audit-logs`, `/administration/settings`, `/account/change-password`. Menu (AppLayout) is permission-filtered per route.

### 1.2 Feature verdicts (24 feature folders)

| Feature | Pages / capability | Verdict |
|---|---|---|
| auth | login (Turnstile captcha field), logout, forgot/reset password, forced initial change, change password — all real endpoints, cookie+CSRF auth | FULL_UI |
| dashboard | 8 stat cards + license breakdown from `GET /v1/app/dashboard/stats`; no static numbers | FULL_UI |
| organizations | list/tree/create/edit/delete, level filter, search, pagination; **no excel export** | FULL_UI |
| geography | 3-tab province/district/commune CRUD with cascading selects | FULL_UI |
| catalogs | 9 catalog kinds, tabbed CRUD + search (`/v1/app/master-catalog/*`); **no excel export** | FULL_UI |
| businesses | 2 tabs; business CRUD + Leaflet MapPicker + handlers CRUD + excel template/preview/confirm import + export; products CRUD + attachments + excel import/export; public business & self-declaration lookups | FULL_UI |
| self-declarations | CRUD, revoke, attachments, expiry filters, excel export | FULL_UI |
| product-registrations | CRUD, revoke, attachments, excel export, public lookup | FULL_UI |
| advertisement-registrations | CRUD (multi-product), revoke, attachments, excel export, public lookup | FULL_UI |
| eligibility-certificates | CRUD, revoke, attachments, excel export, public lookup | FULL_UI |
| cfs-certificates | CRUD, revoke, attachments, excel export, public lookup | FULL_UI |
| export-food-certificates | CRUD, revoke, attachments, excel export, public lookup | FULL_UI |
| inspection | plans tab: CRUD + submit/approve/reject/complete/cancel + excel export; results tab: CRUD + violation-remedied + follow-up + excel export; **no document attachments on plans** | FULL_UI |
| alerts-news | alerts CRUD + publish/recall + export; news CRUD + publish/recall + linked alerts + export | FULL_UI |
| food-poisoning | cases CRUD + submit/verify + error reports + export; incidents CRUD + submit/verify/conclude + error reports + export; Leaflet map tab | FULL_UI |
| reporting | 3 tabs (NĐTP, công tác ATTP, tháng hành động): CRUD (stats+narrative), submit/verify/return/complete/return-to-draft, excel export | FULL_UI |
| risk-analysis | CRUD + publish + excel export (publish terminal, no recall) | FULL_UI |
| testing-results | CRUD + excel export; testing center is **free text**, not catalog-linked; no attachments | FULL_UI (minor gap) |
| documents | CRUD + excel export; document type is a **hard-coded 8-value array**, ignores the document-type catalog; no attachments; no public exposure | PARTIAL_UI |
| statistics | 8 Recharts charts fed by `GET /v1/app/statistics?year=` with year filter | FULL_UI |
| audit-logs | read-only table with URL/method/date/error filters; **no excel export** | FULL_UI (minus export) |
| data-integration | endpoints CRUD + toggle + export; call-log list + detail + export; **toggle-status URL bug** (`/api/app/...` → doubles to `/api/api/app/...`); external-system list hard-coded (Bộ Y tế, Sở NN, Sở CT) | FULL_UI (with defect) |
| identity | users: CRUD, activate/deactivate, lock/unlock, password reset, activity drawer; roles: CRUD + permission tree editor | FULL_UI |
| settings | **STUB — 4 static cards of hard-coded strings, zero API calls, nothing editable** | STUB |

### 1.3 Public pages behavior (verified in code)

All 7 public lookups are **exact-identifier single-record lookups** (one keyword/number → one `Descriptions` card). Verified in `PublicEligibilityCertificateAppService.FindByNumberAsync` and `PublicBusinessAppService.FindByNameOrCodeAsync`: single DTO, `UserFriendlyException` when not found. **No list browsing, no filtering, no certificate file view/print/download, no map.**

**Missing entirely from the public surface** (verified by route + `[AllowAnonymous]` grep): public product search, warned-business list, public alert/news listing, citizen alert submission, public legal-document lookup, public risk-analysis content.

### 1.4 Cross-cutting FE facts

- axios `baseURL=/api`, `withCredentials`, XSRF cookie→`RequestVerificationToken` header; 401 interceptor clears store → `/login`.
- Auth store in-memory (Zustand, no persist); PrivateRoute rehydrates via `GET /v1/app/current-user-context`.
- No TODO/FIXME/"coming soon" strings in FE production code.
- PermissionRoute renders 403 Result; unauthenticated → redirect `/login`.

---

## 2. Database (FoodSafe.EntityFrameworkCore)

16 migrations, all dated 2026-07-25/26, ending `AddRemainingModules` (single migration covering Inspection-results follow-ups, AlertsAndTesting, FoodPoisoning, Reporting, DataIntegration).

Tables by module (from `FoodSafeDbContextModelCreatingExtensions.cs`):
- **Organizations**: `organizations` (3-level self-ref hierarchy, geographic compound FKs, unique code, soft delete).
- **Geography catalogs**: `cat_countries`, `cat_regions`, `cat_provinces`, `cat_districts` (composite PK id+province), `cat_communes` (composite PK id+district) — hierarchy enforced at DB level.
- **Master catalogs**: `cat_product_groups` (2-level), `cat_business_types`, `cat_business_classifications` (risk 1-3), `cat_advertisement_types`, `cat_document_types`, `cat_testing_centers`, `cat_testing_services`.
- **Security/scope**: `app_user_profiles` (FailedLoginCount, LockedUntil, PasswordExpiresAt, MustChangePassword), `password_history`, `management_scope_assignments` (4 scope types with exact-one-target CHECK).
- **BusinessManagement**: `businesses` (status CHECKs, coordinates, suspension-evidence CHECK, `HasVsattpCommitment` flag), `business_product_groups`, `business_handlers`, `products`.
- **Licensing** (shared revoke-evidence CHECK pattern): `self_declarations`, `product_registrations` (global unique number), `cfs_certificates`, `export_food_certificates`, `advertisement_registrations` (+ products join), `eligibility_certificates`.
- **Files**: `document_owners` (polymorphic), `file_attachments` (virus-scan status, retention, SHA-256 checksum, unique storage path).
- **Inspection**: `inspection_plans` (status 1-6 + submission/approval/cancellation evidence CHECKs), `inspection_plan_items`, `inspection_results` (+inspectors, +violations).
- **AlertsAndTesting**: `atp_alerts` (publish/recall evidence CHECKs), `atp_news`, `news_linked_alerts`, `risk_analyses`, `testing_results`, `administrative_documents`.
- **FoodPoisoning**: `food_poisoning_incidents`/`_cases` (report/verify/conclude evidence CHECKs, victim PII), `poisoning_case_error_reports`, `poisoning_incident_error_reports`.
- **Reporting**: `ndtp_reports`, `atp_work_reports`, `action_month_reports` (5-state workflow columns, unique (org, period) partial indexes) + 3 error-notification tables.
- **DataIntegration**: `di_api_endpoints`, `di_api_call_logs` (direction, request/response bodies, duration, success).
- **ABP**: full identity/permission/audit/OpenIddict/settings/background-jobs table set; Hangfire creates its own tables outside EF.

Seeding (DbMigrator): admin user (password from config, mandatory), VN country, 8 regions, 6+1 roles with permission matrices. **Dev-only** (`ASPNETCORE_ENVIRONMENT=Development`): Quảng Ninh province/district/commune, 3 organizations, 4 test users. **No production geography/organization seed.**

---

## 3. Backend (FoodSafe.BE) — see agent-verified detail in §5 of doc 63

(Summary populated from application-layer enumeration; per-service permission/scope verification recorded in the matrix, doc 63.)

- App services under `src/FoodSafe.Application`: Identity administration (users/roles), AccountSecurity, CurrentUserContext, Organization, GeographicCatalog, MasterCatalog, Business, Product, Business/Product/SelfDeclaration Excel services, SelfDeclaration, ProductRegistration, AdvertisementRegistration, EligibilityCertificate, CfsCertificate, ExportFoodCertificate, InspectionPlan, InspectionResult, AtpAlert, AtpNews, RiskAnalysis, TestingResult, AdministrativeDocument, FoodPoisoningCase, FoodPoisoningIncident, NdtpReport, AtpWorkReport, ActionMonthReport, ApiEndpoint, ApiCallLog, Dashboard, Statistics, AuditLog, 7 Public* lookup services, Captcha controller.
- Excel import exists only for Business and Product (+SelfDeclaration export controller); all list modules have ClosedXML-based excel export endpoints.
- File attachments: MinIO-backed with ClamAV scanning, document-owner registry; wired for products + 6 licensing modules only.
- Public (`[AllowAnonymous]`) services: exactly the 7 lookups + AccountSecurity flows + Captcha.

---

## 4. Infrastructure

- **docker-compose** (FoodSafe.BE/docker-compose.yml): postgres 15, redis 7, MinIO, ClamAV, mailpit (dev profile), migrator (one-shot), api (healthcheck `/health`), frontend (nginx-unprivileged). Secrets via env vars, not committed to compose. IPv4-only subnet; `ASPNETCORE_URLS=http://+:8080`; nginx listens IPv4 only → **no IPv6 anywhere**.
- **nginx**: CSP, X-Content-Type-Options, X-Frame-Options DENY, Referrer-Policy, Permissions-Policy. HSTS from backend (`UseHsts` non-dev).
- **CI** (.github/workflows/ci.yml): build+format+test (BE xUnit, FE Vitest), EF migration drift check against real PostgreSQL service, dependency vulnerability scripts, Trivy fs+image scans, docker builds. **No Playwright/E2E job. No deploy job.**
- **scripts/**: only 2 dependency-vulnerability scripts. **No backup/restore scripts** (docs 39–40 describe procedures only).
- **Committed dev secrets**: `appsettings.json` (Host + DbMigrator) contain `Password=FoodSafe@Dev2026!` and `StringEncryption.DefaultPassPhrase="change-this-in-production"`.

---

## 5. Test estate

- **Backend**: 5 test projects, ~129 tests. Domain.Tests = pure unit (all 8 modules). Application.Tests = reflection/contract tests (verify `[Authorize]` attributes exist — do **not** execute business logic). EF.Tests: 1 real-PostgreSQL Testcontainers class (`GeographicCatalogPostgreSqlTests`); rest mapping-level. HttpApi.Host.Tests: middleware/config unit. **Zero AppService→EF→PostgreSQL integration tests.**
- **Frontend unit**: 60 Vitest files (19 api contract + 41 page render) — all MSW-mocked; not acceptance evidence per policy.
- **Playwright**: 25 specs, all REAL_FULLSTACK design (no `page.route`/fulfill, no token injection; real login via `/api/account/login` with Turnstile test keys; `E2E_BASE_URL` default `127.0.0.1:8080`; no `webServer` — needs externally running stack). **Not run in CI.**
- **Verification registry** (docs/testing/01): 32 features — **0 VERIFIED**, 6 READY_FOR_TEST, 25 FAILED (stale Docker build ×14, missing org seed ×8, selector bug, export-download bug, heading mismatch, missing permission), 1 BLOCKED. No feature has a verified commit recorded.

---

## 6. Claims-vs-reality notes

- `docs/55-current-takeover-status.md` (2026-07-26) says STT 26+ "missing" — superseded by later same-day commits adding all remaining modules; neither state matches the registry's 0-VERIFIED reality.
- `docs/41-implementation-progress.md` marks milestones 4–7 "Not started" — also stale; code exists for them now.
- `docs/01-functional-requirements.md` group E deviates from the PDF (invents testing-result/inspection/risk-analysis public lookups; drops TCB/ĐKCB/warned-business lookups). The implemented public pages follow **neither** list exactly: they implement number-lookups for the 6 license types + business, and omit all news/alert/document/warned-business public functions.
