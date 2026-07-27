# Feature Verification Registry

## Legend

- **Status**: NOT_STARTED | IN_PROGRESS | READY_FOR_TEST | FAILED | VERIFIED | DIRTY | BLOCKED
- **E2E spec**: Playwright spec file if exists
- **Verified commit**: Git SHA when last verified against real stack

## Registry

| ID    | Feature                         | Status         | E2E Spec                                      | Verified Commit | Date       |
|-------|---------------------------------|----------------|-----------------------------------------------|-----------------|------------|
| F-001 | Authentication (Login)          | READY_FOR_TEST | `e2e/auth.spec.ts`                            | —               | 2026-07-26 |
| F-002 | Password Management             | VERIFIED       | `e2e/password-management-verification.spec.ts` | `b2f13fb` | 2026-07-27 |
| F-003 | Organizations                   | READY_FOR_TEST | `e2e/organizations.spec.ts`                   | —               | 2026-07-26 |
| F-004 | Master Catalogs                 | READY_FOR_TEST | `e2e/catalogs.spec.ts`                        | —               | 2026-07-26 |
| F-005 | Geographic Catalogs             | READY_FOR_TEST | `e2e/geography.spec.ts`                       | —               | 2026-07-26 |
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
| F-017 | Testing Results                 | READY_FOR_TEST | `e2e/testing-results.spec.ts`                 | —               | 2026-07-26 |
| F-018 | Risk Analysis                   | READY_FOR_TEST | `e2e/risk-analysis.spec.ts`                   | —               | 2026-07-26 |
| F-019 | Data Integration                | READY_FOR_TEST | `e2e/data-integration.spec.ts`                | —               | 2026-07-26 |
| F-020 | Identity Administration         | READY_FOR_TEST | `e2e/identity-administration.spec.ts`         | —               | 2026-07-26 |
| F-021 | Audit Logs                      | READY_FOR_TEST | `e2e/audit-logs.spec.ts`                      | —               | 2026-07-26 |
| F-022 | Dashboard                       | READY_FOR_TEST | `e2e/dashboard.spec.ts`                       | —               | 2026-07-26 |
| F-023 | Statistics                      | READY_FOR_TEST | `e2e/statistics.spec.ts`                      | —               | 2026-07-26 |
| F-024 | Public Lookup — Business        | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-025 | Public Lookup — Self Declaration| READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-026 | Public Lookup — Product Reg.    | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-027 | Public Lookup — Eligibility     | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-028 | Public Lookup — CFS             | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-029 | Public Lookup — Export Food     | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-030 | Public Lookup — Ad Registration | READY_FOR_TEST | `e2e/public-lookups.spec.ts`                  | —               | 2026-07-26 |
| F-031 | Documents                       | READY_FOR_TEST | `e2e/documents.spec.ts`                       | —               | 2026-07-26 |
| F-032 | System Settings                 | READY_FOR_TEST | `e2e/system-settings.spec.ts`                 | —               | 2026-07-26 |

## Summary

- Total features: 32
- VERIFIED: **13** (F-002, F-006..F-016 — see `features/*.md`)
- READY_FOR_TEST: **19** (E2E specs pass against the real stack, but full verification checklist not yet executed per feature)
- FAILED: 0
- BLOCKED: 0 (F-002 unblocked — implementation existed; spec added and verified)
- NOT_STARTED: 0

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

