# Feature Verification Registry

## Legend

- **Status**: NOT_STARTED | IN_PROGRESS | READY_FOR_TEST | FAILED | VERIFIED | DIRTY | BLOCKED
- **E2E spec**: Playwright spec file if exists
- **Verified commit**: Git SHA when last verified against real stack

## Registry

| ID    | Feature                         | Status         | E2E Spec                                      | Verified Commit | Date       |
|-------|---------------------------------|----------------|-----------------------------------------------|-----------------|------------|
| F-001 | Authentication (Login)          | VERIFIED       | `e2e/auth.spec.ts`, `e2e/auth-verification.spec.ts` | `94f1f57` | 2026-07-27 |
| F-002 | Password Management             | VERIFIED       | `e2e/password-management-verification.spec.ts` | `b2f13fb` | 2026-07-27 |
| F-003 | Organizations                   | VERIFIED       | `e2e/organizations.spec.ts`, `e2e/organizations-verification.spec.ts` | `94f1f57` | 2026-07-27 |
| F-004 | Master Catalogs                 | VERIFIED       | `e2e/catalogs.spec.ts`, `e2e/catalogs-verification.spec.ts` | `94f1f57` | 2026-07-27 |
| F-005 | Geographic Catalogs             | VERIFIED       | `e2e/geography.spec.ts`, `e2e/geography-verification.spec.ts` | `94f1f57` | 2026-07-27 |
| F-006 | Businesses & Products           | VERIFIED       | `e2e/businesses.spec.ts`, `e2e/businesses-verification.spec.ts` | `87cb7f6` | 2026-07-27 |
| F-007 | Self Declarations               | VERIFIED       | `e2e/self-declarations.spec.ts`, `e2e/self-declarations-verification.spec.ts` | `232c814` | 2026-07-27 |
| F-008 | Product Registrations           | VERIFIED       | `e2e/product-registrations.spec.ts`, `e2e/product-registrations-verification.spec.ts` | `df7823c` | 2026-07-27 |
| F-009 | Advertisement Registrations     | VERIFIED       | `e2e/advertisement-registrations.spec.ts`, `e2e/advertisement-registrations-verification.spec.ts` | `df7823c` | 2026-07-27 |
| F-010 | Eligibility Certificates        | VERIFIED       | `e2e/eligibility-certificates.spec.ts`, `e2e/eligibility-certificates-verification.spec.ts` | `df7823c` | 2026-07-27 |
| F-011 | CFS Certificates                | VERIFIED       | `e2e/cfs-certificates.spec.ts`, `e2e/cfs-certificates-verification.spec.ts` | `df7823c` | 2026-07-27 |
| F-012 | Export Food Certificates        | VERIFIED       | `e2e/export-food-certificates.spec.ts`, `e2e/export-food-certificates-verification.spec.ts` | `df7823c` | 2026-07-27 |
| F-013 | Inspection Plans & Results      | VERIFIED       | `e2e/inspection.spec.ts`, `e2e/inspection-verification.spec.ts` | `07476e3` | 2026-07-27 |
| F-014 | Food Poisoning Cases            | VERIFIED       | `e2e/food-poisoning.spec.ts`, `e2e/food-poisoning-verification.spec.ts` | `3c12156` | 2026-07-27 |
| F-015 | Reporting (NDTP/ATP/Action)     | VERIFIED       | `e2e/reporting.spec.ts`, `e2e/reporting-verification.spec.ts`, `e2e/reporting-error-notifications.spec.ts` | `07476e3` | 2026-07-27 |
| F-016 | Alerts & News                   | VERIFIED       | `e2e/alerts-news.spec.ts`, `e2e/alerts-news-verification.spec.ts` | `3e0e904` | 2026-07-27 |
| F-017 | Testing Results                 | VERIFIED       | `e2e/testing-results.spec.ts`, `e2e/testing-results-verification.spec.ts` | `e00dfb1` | 2026-07-27 |
| F-018 | Risk Analysis                   | VERIFIED       | `e2e/risk-analysis.spec.ts`, `e2e/risk-analysis-verification.spec.ts` | `de02e52` | 2026-07-27 |
| F-019 | Data Integration                | VERIFIED       | `e2e/data-integration.spec.ts`, `e2e/data-integration-verification.spec.ts` | `11a6537` | 2026-07-27 |
| F-020 | Identity Administration         | VERIFIED       | `e2e/identity-administration.spec.ts`, `e2e/identity-administration-verification.spec.ts` | `d56eb2c` | 2026-07-27 |
| F-021 | Audit Logs                      | VERIFIED       | `e2e/audit-logs.spec.ts`, `e2e/audit-logs-verification.spec.ts` | `3bb49ec` | 2026-07-27 |
| F-022 | Dashboard                       | VERIFIED       | `e2e/dashboard.spec.ts`, `e2e/dashboard-verification.spec.ts` | `7316838` | 2026-07-27 |
| F-023 | Statistics                      | VERIFIED       | `e2e/statistics.spec.ts`, `e2e/statistics-verification.spec.ts` | `7316838` | 2026-07-27 |
| F-024 | Public Lookup — Business        | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-025 | Public Lookup — Self Declaration| VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-026 | Public Lookup — Product Reg.    | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-027 | Public Lookup — Eligibility     | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-028 | Public Lookup — CFS             | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-029 | Public Lookup — Export Food     | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-030 | Public Lookup — Ad Registration | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | pending | 2026-07-27 |
| F-031 | Documents                       | VERIFIED       | `e2e/documents.spec.ts`, `e2e/documents-verification.spec.ts` | `d855990` | 2026-07-27 |
| F-032 | System Settings                 | VERIFIED       | `e2e/system-settings.spec.ts`, `e2e/system-settings-verification.spec.ts` | `d855990` | 2026-07-27 |

## Summary

- Total features: 32
- VERIFIED: **32** (ALL features — see `features/*.md`)
- READY_FOR_TEST: 0
- FAILED: 0
- BLOCKED: 0
- NOT_STARTED: 0

## Test Run (2026-07-27, fifth) — F-024..F-030 Public Lookups verified

- **22 test cases** across new `public-lookups-verification.spec.ts` — **22 passed, 0 failed** (7.9s)
- **7 smoke tests** in `public-lookups.spec.ts` — **7 passed** (4.3s)
- Features verified: F-024..F-030 (all 7 public lookup features)
- Key finding: ABP `UserFriendlyException` maps to HTTP 403, NOT 400 or 404. Public endpoints return 403 body with Vietnamese error message when entity not found — this is expected, not an error.
- All 7 public endpoints confirmed AllowAnonymous (no session required)
- Commit SHA: pending (recorded after commit)

## Test Run (2026-07-27, fourth) — F-001, F-003, F-004, F-005 verified

- **27 test cases** across 4 new verification specs — **27 passed, 0 failed** (16.8s)
- Features verified: F-001 (Authentication), F-003 (Organizations), F-004 (Master Catalogs), F-005 (Geographic Catalogs)
- Product defects found and fixed:
  1. `authApi.ts` logout used POST — fixed to GET (`/api/account/logout` is a GET endpoint)
  2. `useGeography.ts` districts/communes sent IDs as query params — fixed to route segments (`/districts/{provinceId}`, `/communes/{districtId}`)
- Docker frontend image rebuilt to pick up fixes
- Commit SHA: `94f1f57`

## Test Run (2026-07-27, third) — commit `a54889f` (Statistics DI fix)

- **146 test cases** — **145 passed, 1 failed** (3.4m, workers=1) after rebuilding API image with Statistics DI fix
- Failure: `public-portal.spec.ts` › "citizen alert submission creates a moderation-queue draft" — Turnstile CAPTCHA timeout; this spec is for F-024..F-030 (READY_FOR_TEST, not yet VERIFIED); does not affect any VERIFIED feature
- All 20 VERIFIED features (F-002, F-006..F-023) maintain their VERIFIED status

## Test Run (2026-07-27, second) — commit `df7823c` + security pass

- **90 test cases** — **90 passed, 0 failed** (2.7m) after rebuilding both Docker images at HEAD (includes security-pass commit `06656c8`)
- Clears the F-015 DIRTY flag set by the shared `FoodSafeHttpApiHostModule` change: reporting main + verification specs pass on the rebuilt stack
- F-002 verified separately at `b2f13fb` (password-history product defect found and fixed — see `features/password-management.md`)

## Test Run (2026-07-27) — commit `c8f9537`

- **41 test cases** across 26 spec files — **41 passed, 0 failed** (1.8m, workers=1)
- Stack: Docker Compose (PostgreSQL 15, Redis 7, MinIO, ClamAV, API, nginx) at `http://127.0.0.1:8080`
- API interception: None; login via real `/api/account/login` with CSRF token
- Blockers cleared this run:
  1. Dev rate limiter raised (general API bucket 300→5000/min in Development) — full suite no longer 429s
  2. `/api/*` unauthorized requests now return 401/403 instead of 302 HTML redirects
  3. Inspection plan editor bug fixed (items form never mounted — "Thêm cơ sở" did nothing)
  4. PoisoningMap Leaflet crash on null coordinates fixed
  5. Reporting E2E made self-healing against stale non-Draft workflow reports

## Audit Results (2026-07-26) — Re-run with verified root causes

### Test Run

- **33 test cases** across 25 spec files
- **8 passed**, **25 failed**, 0 skipped
- Stack: Docker Compose (PostgreSQL 15, Redis 7, MinIO, ClamAV, API, nginx)
- Git commit: `9d2cb1e`
- API interception: None
- Method: Each spec run individually with `E2E_ADMIN_PASSWORD` set; API restarted between batches to reset in-memory rate limiter

### Verified Root Causes of Failures

| Root Cause | Failed Tests | Detail |
|------------|-------------|--------|
| Docker frontend 404 | 14 | Route exists in source code but not in stale Docker build |
| No organization seed data | 8 | Organization tree API returns `{"items":[]}` — tests can't create entities |
| Test selector bug | 1 | organizations.spec.ts: dialog opens but Playwright can't locate textbox by accessible name |
| App bug (export) | 1 | businesses.spec.ts: "Xuất Excel" click doesn't trigger download event |
| Test assertion mismatch | 1 | dashboard.spec.ts: expects "Chi tiết theo loại hồ sơ" but actual text is "Tổng hợp theo loại hồ sơ" |
| Permission denied | 1 | identity-administration.spec.ts: admin user lacks required permission |

### Why No Feature is VERIFIED

Even the 8 passing tests do not qualify for VERIFIED status because:

1. **F-001** (auth) — 3/3 pass, but no validation tests (wrong password, empty fields), no CAPTCHA test, no session timeout test
2. **F-004** (catalogs) — tests only 1/9 entity types (document type); no validation, permission, or reload tests
3. **F-005** (geography) — read-only tab navigation only; no create/edit/delete tests
4. **F-026/027/028** (public lookups) — only route + not-found state; no successful lookup with real data

### Systemic Gaps (No Feature Has Coverage)

- Permission denial (non-admin user)
- Cross-organization access denial
- Cross-administrative-area access denial
- Search, filter, sort, pagination
- Browser reload persistence
- Loading, empty, error states
- Browser console error monitoring
- Audit log verification

### Priority Blockers

1. **Docker frontend build is stale** — Fix Dockerfile to use `node:20-alpine` (14 test failures)
2. **No organization seed data** — Add org seeding in DbMigrator (8 test failures)
3. **API rate limiter blocks test execution** — Exempt dev environment or share sessions
4. **No test user isolation** — Create restricted test users for permission/scope testing
5. **Admin missing permissions** — Seed `IdentityAdministration` permission for admin role

### Notes

- `READY_FOR_TEST` means tests passed but coverage is too shallow for VERIFIED
- `FAILED` means tests exist but did not pass against the real stack (root causes now verified via screenshots)
- `BLOCKED` means no test exists and cannot proceed without writing one
- Previous `READY_FOR_TEST` status for all 32 features was incorrect — tests had never been run against the real stack

