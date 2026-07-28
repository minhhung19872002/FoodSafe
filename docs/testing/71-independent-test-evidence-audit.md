# 71 — Independent Test Evidence Audit

**Date**: 2026-07-27  
**Auditor role**: Independent release-acceptance auditor (no prior involvement in implementation)  
**Method**: Static analysis of documentation, source file enumeration, test project classification, and cross-referencing of claimed evidence against commit history. No tests were executed. No services were started.  
**Scope**: All 469 requirement items from `docs/01-functional-requirements.md` and `docs/audit/68-final-feature-to-requirement-reconciliation.md`; all 34 features in the verification registry; all 56 Playwright spec files; all 519 backend xUnit tests; all production audit documents.  
**HEAD commit examined**: `fe3dbd2` (merge: feature/close-remaining-gaps)  
**Preceding prior-audit reference commit**: `9d2cb1e` (doc 63) → `236c782` (doc 68)  

---

## 1. Testing Maturity Overview

### 1.1 What test layers exist

| Layer | Artifact | Count | Tech |
|---|---|---|---|
| Backend domain tests | `FoodSafe.Domain.Tests` | 197 tests | xUnit, in-memory only |
| Backend application contract tests | `FoodSafe.Application.Tests` | 251 tests | xUnit, reflection only |
| Backend EF Core mapping tests | `FoodSafe.EntityFrameworkCore.Tests` | 18 tests | xUnit; 2 use real PostgreSQL via Testcontainers |
| Backend HTTP host tests | `FoodSafe.HttpApi.Host.Tests` | 53 tests | xUnit, route reflection + middleware fakes |
| Frontend unit tests | Vitest + MSW | 112 tests (108 pass) | Component rendering with mocked API |
| Frontend E2E browser tests | Playwright | 56 spec files, ~235 test cases | Real browser against real stack |
| Load test | k6 | 1 script | 30 VU, real HTTP, 6 endpoints |

**Backend total**: 519 tests. **Frontend unit**: 112. **Frontend E2E**: ~235 test cases across 56 specs.

### 1.2 How the verification registry works (description, not endorsement)

`docs/testing/01-feature-verification-registry.md` records 34 features. For each feature it claims: status (`VERIFIED`), a Playwright verification spec file, and a "verified commit" SHA at which that feature was reportedly tested against a real full stack (Docker Compose: PostgreSQL 15, Redis 7, MinIO, ClamAV, API, nginx). The registry claims 34/34 features VERIFIED.

Feature-level evidence is supplemented by 28 individual feature docs (`docs/testing/features/*.md`) which describe test accounts, endpoints exercised, checklist results, and bugs found during verification.

### 1.3 What the documentation claims (all treated as claims here)

| Claim | Source | Value |
|---|---|---|
| 34/34 features VERIFIED | doc 01-feature-verification-registry.md | All features verified against real stack |
| 229 / 235 Playwright tests pass at HEAD `fe3dbd2` | doc 07-runtime-production-drill.md | 6 failures in legacy smoke specs, all 34 verification specs pass |
| 519 / 519 backend tests pass | doc 60-full-project-verification-results.md | 100% pass rate |
| 469 total requirements; 287 VERIFIED_RUNTIME | doc 68-final-feature-to-requirement-reconciliation.md | At `236c782`, pre-post-audit batch |
| Load test passes all 6 NFR thresholds | doc 05-load-test-results.md | 30 VUs, avg 31 ms, 0% fail |
| 108 / 112 Vitest unit tests pass | doc 60 | 4 failures are stale UI-text selectors |

---

## 2. Backend Test Classification

This section is the most critical finding for an independent auditor: the 519 backend tests do **not** test the real HTTP pipeline.

### 2.1 Domain.Tests (197 tests) — IN-MEMORY UNIT TESTS

**Evidence type**: Domain logic isolation. Tests instantiate domain entities directly and assert that state-machine guards, value-object validation, and domain events behave correctly.  
**What they prove**: Business invariants are encoded correctly in domain classes.  
**What they do NOT prove**: That those classes are correctly wired to HTTP controllers, that authorization is enforced on actual requests, or that EF Core persists results correctly.  
**Testcontainers**: None. **WebApplicationFactory**: None.

### 2.2 Application.Tests (251 tests) — REFLECTION / ANNOTATION CONTRACT TESTS

**Evidence type**: Annotation/interface contract checks using `System.Reflection`.

Key examples (from actual source files read):
- `DataScopeEnforcementContractTests.cs`: iterates 25 `AppService` types and checks that their constructors contain a parameter of type `ICurrentDataScopeProvider`. This proves the scope provider is *injected*, not that it *filters queries at runtime*.
- `CurrentUserContextPermissionContractTests.cs`: reflection checks for `[Authorize]` attributes.
- `RemoteServiceConventionTests.cs`: checks naming conventions on AppService types.
- `PasswordHistoryPolicyTests.cs`: logic tests on the password-history domain service.

**What they prove**: Authorization annotations exist on the correct methods; dependency injection contracts are wired.  
**What they do NOT prove**: That a request without a valid session receives HTTP 401; that a user from Organization A receives HTTP 403 when querying Organization B's data; that scope filtering is applied to actual EF queries.  
**Testcontainers**: None. **WebApplicationFactory**: None.

### 2.3 EntityFrameworkCore.Tests (18 tests) — EF MODEL INTROSPECTION + 2 REAL POSTGRESQL

16 tests use EF model introspection (`context.Model.FindEntityType(...)`). **2 tests** use `Testcontainers.PostgreSql` against a real PostgreSQL 15 container: `GeographicCatalogPostgreSqlTests` verifies that migrations run and that a FK constraint rejects cross-province district assignment.  
**Evidence type**: EF mapping validation + 2 real DB constraint checks.  
**Coverage**: Extremely narrow — only geographic catalog FK integrity tested with a real database.

### 2.4 HttpApi.Host.Tests (53 tests) — ROUTE REFLECTION + MIDDLEWARE FAKES

Source files read: `ApiContractTests.cs` (checks route strings and `[ApiVersion]` attributes via reflection), `Security/CaptchaConfigurationTests.cs`, `Security/LoginCaptchaMiddlewareTests.cs`, `Security/TurnstileCaptchaVerifierTests.cs` (middleware logic tested with fake `HttpContext` and mock HTTP clients).  
**What they prove**: Route attributes have the expected string values; captcha middleware logic is correct when given fake inputs.  
**What they do NOT prove**: That a real HTTP request flows through the captcha middleware correctly end-to-end. No `WebApplicationFactory`. No real HTTP request.

### 2.5 Summary: backend test gap

> **Zero backend tests send a real HTTP request through the ASP.NET Core pipeline.**

No test verifies:
- HTTP 401 is returned for an unauthenticated request to a protected endpoint
- HTTP 403 is returned for a request with insufficient permissions
- Cross-organization data isolation is enforced at the HTTP layer
- Workflow guards prevent illegal state transitions through real API calls

The project's own independent review (doc 60 §11) explicitly states this: "Critical gap: Zero tests use `WebApplicationFactory` or send real HTTP requests through the ASP.NET Core pipeline."

---

## 3. Frontend Vitest Tests — Explicitly Prohibited as Acceptance Evidence

108 of 112 Vitest tests pass. All 108 use MSW (Mock Service Worker) with injected fake authentication state. Per `CLAUDE.md`: "MSW-based tests are **explicitly prohibited** as runtime acceptance evidence." Per doc 60 §11: "These tests verify that components render correctly given mocked data but do not prove the system works end-to-end."  
4 failing tests have stale UI-text selectors (maintenance issue, not product bugs).  
**Auditor classification**: Not acceptance evidence. Useful for component regression but must not be cited as system-level proof.

---

## 4. Playwright E2E Specs — Evidence Classification

56 spec files exist under `FoodSafe.FE/e2e/`. They fall into two types:

| Type | Pattern | Count | Nature |
|---|---|---|---|
| Verification specs | `*-verification.spec.ts` | 35 files | Designated acceptance tests; cover auth, permission denial, cross-org isolation, workflow, validation, persistence-after-reload, empty/error states |
| Smoke specs | `*.spec.ts` (no -verification) | 21 files | Happy-path coverage, often shorter; 6 of these currently fail due to AntD Select virtualization (legacy selectors) |

The verification specs are what the project treats as the acceptance gate.

**Key caveat**: The last independently recorded run of ANY verification spec with a commit SHA in the registry varies from `94f1f57` (F-001, oldest) to `86b793a` (F-034, newest). HEAD is `fe3dbd2`. Commits `8fe0320..fe3dbd2` (~39k lines of new code) were added AFTER most features were "verified." Doc 07 (runtime production drill) claims all 34 verification specs pass at HEAD `fe3dbd2`, but this is a claim in an internal audit document — no externally witnessed run exists at HEAD with a registry update to match.

---

## 5. Evidence Classification per Requirement Group

Legend:
- **BROWSER**: Playwright verification spec exists and is claimed to pass at HEAD; real stack (no API mocking).
- **BACKEND-UNIT**: Backend xUnit tests cover the domain/annotation logic (not runtime HTTP).
- **DOC-ONLY**: Code exists (inspected by audit team); no passing Playwright spec covers this specific sub-requirement at a recorded commit; classified READY_WITH_MINOR_ISSUES in production audit doc.
- **NONE**: No implementation and no test; classified NOT_IMPLEMENTED.
- **PARTIAL-BROWSER**: A spec exists and is claimed to pass, but the specific sub-requirement (e.g., a per-business tab, a browsable public list) is structurally absent from the implementation despite the parent feature passing.

### Group A — Quản trị hệ thống (STT 1–5, ~33 items)

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| FR-01-01..06 | Role management (CRUD + permissions + assign) | BROWSER | `identity-administration-verification.spec.ts` (F-020, `d56eb2c`) |
| FR-02-01, 03, 04, 06, 08, 09, 10, 11, 12 | User management core CRUD + activation + lockout | BROWSER | Same spec + `password-management-verification.spec.ts` (F-002) |
| FR-02-02 | Search by individual permission | DOC-ONLY | Permission-based search UI added in `fcb4f82`; not re-verified in a recorded verification run |
| FR-02-05 | FE delete user action | DOC-ONLY | FE delete button added in `fcb4f82`; code-inspected; not re-verified |
| FR-02-07 | Random password generation | DOC-ONLY | `GenerateRandomPasswordAsync` added `fcb4f82`; link-based reset was prior implementation; not re-verified |
| FR-02-13 | Export user list to Excel | DOC-ONLY | `UserExcelAppService` added `8fe0320`; code-inspected; not re-verified in a recorded spec run |
| FR-03-01 | Audit log search | BROWSER | `audit-logs-verification.spec.ts` (F-021, `3bb49ec`) |
| FR-03-02 | Audit log per-entry detail view | DOC-ONLY | Detail view added `8fe0320`; not independently re-verified |
| FR-03-03 | Audit log Excel export | DOC-ONLY | Added `8fe0320`; not independently re-verified |
| FR-04-01..06 | System settings (logo, login screen, password policy, lockout, SMTP, homepage) | DOC-ONLY (conditional) | Settings module added `b1873a4` after F-032 was verified at `d855990`; spec rewritten for live page (regression log `bdfff4c`); system-settings-verification.spec.ts claimed to pass at HEAD per doc 07 — but the verified commit in registry (`d855990`) predates the settings module |
| FR-05-01, 02, 03 | Login, logout, change password | BROWSER | `auth-verification.spec.ts` (F-001), `password-management-verification.spec.ts` (F-002) |
| FR-05-04 | Profile self-service edit | DOC-ONLY | Profile edit added `71e0b3b`; not in verification spec at a recorded commit |
| FR-05-05 | Avatar change | DOC-ONLY | Avatar added `71e0b3b`; not in verification spec at a recorded commit |

### Group B — Quản lý danh mục (STT 6–18, ~57 items)

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| FR-06-01..05 | Organization CRUD + search | BROWSER | `organizations-verification.spec.ts` (F-003, `94f1f57`) |
| FR-06-06 | Organization Excel export | DOC-ONLY | Added `8fe0320`; not re-verified |
| FR-07-01..02, 04..06 | Unit account management | BROWSER | `identity-administration-verification.spec.ts` (F-020) |
| FR-07-03 | Edit/delete unit accounts (FE delete) | DOC-ONLY | FE delete same gap as FR-02-05 |
| FR-08-01..04 | Countries catalog CRUD | BROWSER | `catalogs-verification.spec.ts` (F-004, `94f1f57`) |
| FR-09-01..04 | Regions catalog CRUD | BROWSER | Same spec |
| FR-10-01..04 | Provinces catalog CRUD | BROWSER | `geography-verification.spec.ts` (F-005, `94f1f57`) |
| FR-11-01..04 | Districts and communes CRUD | BROWSER | Same spec |
| FR-12-01..04 | Business classification CRUD | BROWSER | `catalogs-verification.spec.ts` (F-004) |
| FR-13-01..04 | Product groups CRUD (2-level) | BROWSER | Same spec |
| FR-14-01..04 | Business types CRUD | BROWSER | Same spec |
| FR-15-01..04 | Ad types CRUD | BROWSER | Same spec |
| FR-16-01..04 | Testing centers CRUD | BROWSER | Same spec |
| FR-17-01..04 | Testing services CRUD | BROWSER | Same spec |
| FR-17-05 | Testing services Excel export | DOC-ONLY | Added `8fe0320`; not re-verified |
| FR-18-01..04 | Document types CRUD | BROWSER | Same spec (note: STT 38 Documents module uses hard-coded list, not this catalog) |

### Group C — Quản lý ATTP (STT 19–40, ~216 items)

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| FR-19-01, 03..10, 14, 17, 18 | Business list/create/edit/delete/detail/map/handlers/scope | BROWSER | `businesses-verification.spec.ts` (F-006, `87cb7f6`) |
| FR-19-02 | Advanced business filter by classification/type/area | DOC-ONLY | Advanced filters added `f752c38`; per-business tabs added same commit; not re-verified in a recorded spec run |
| FR-19-11, 12, 13, 15, 16 | Per-business tabs for self-decl/product-reg/ad-reg/inspection/eligibility | PARTIAL-BROWSER | Tabs added `f752c38`; parent feature F-006 passes, but these sub-tabs are structural gaps acknowledged in doc 68; whether the spec specifically tests them is unconfirmed |
| FR-20-01..08 | Product management CRUD + Excel import/export | BROWSER | `businesses-verification.spec.ts` (F-006) |
| FR-21-01..09 | Self-declarations full lifecycle | BROWSER | `self-declarations-verification.spec.ts` (F-007, `232c814`) |
| FR-22-01..09 | Product registrations full lifecycle | BROWSER | `product-registrations-verification.spec.ts` (F-008, `df7823c`) |
| FR-23-01..11 | Advertisement registrations full lifecycle | BROWSER | `advertisement-registrations-verification.spec.ts` (F-009, `df7823c`) |
| FR-24-01..10 | Eligibility certificates full lifecycle | BROWSER | `eligibility-certificates-verification.spec.ts` (F-010, `df7823c`) |
| FR-25-01..11 | CFS certificates full lifecycle | BROWSER | `cfs-certificates-verification.spec.ts` (F-011, `df7823c`) |
| FR-26-01..11 | Export food certificates full lifecycle | BROWSER | `export-food-certificates-verification.spec.ts` (F-012, `df7823c`) |
| FR-LIC-01 | NĐ 15/2018 certificate document generation (QuestPDF) | PARTIAL-BROWSER | F-034 (`certificate-pdf-verification.spec.ts`) covers QuestPDF for eligibility/CFS/export cert; NĐ15 decree-form templates still absent |
| FR-LIC-02 | Business-parent scope enforcement for all licenses | BROWSER | All licensing verification specs |
| FR-27-01..07, 10, 11 | Inspection plan CRUD + workflow + Excel + scope | BROWSER | `inspection-verification.spec.ts` (F-013, `07476e3`) |
| FR-27-08, 09 | Inspection plan document upload/download | DOC-ONLY | Attachments wired `71e0b3b`; not re-verified in a recorded verification-spec run |
| FR-28-01, 02, 04, 06, 07 | Inspection results filter/view/update/scope | BROWSER | Same spec (F-013) |
| FR-28-03 | Explicit finalize/lock step for per-business result | DOC-ONLY | Finalize added `71e0b3b`; not verified in a recorded spec |
| FR-28-05 | Inspection result document download | DOC-ONLY | Attachment pipeline extension `71e0b3b`; not verified |
| FR-29-01..05, 07, 08, 09 | Alert CRUD + recall + export + scope | BROWSER | `alerts-news-verification.spec.ts` (F-016, `3e0e904`) |
| FR-29-06 | Citizen-submitted alert approval (moderation queue) | DOC-ONLY | Citizen channel added `71e0b3b`; not in verification spec at a recorded commit |
| FR-30-01..06, 08 | News CRUD + link to alerts + recall | BROWSER | Same spec (F-016) |
| FR-30-07 | Citizen-submitted news approval | DOC-ONLY | Citizen news channel added `71e0b3b` |
| FR-30-09 | Public news listing endpoint | BROWSER (via F-033) | `public-portal-verification.spec.ts` (F-033, `5aff855`) covers `GET /api/v1/public/news` |
| FR-31-01..11 | Poisoning cases full lifecycle + map + scope | BROWSER | `food-poisoning-verification.spec.ts` (F-014, `3c12156`) |
| FR-32-01..10 | Poisoning incidents full lifecycle + conclude | BROWSER | Same spec (F-014) |
| FR-33-01, 03..11 | NDTP report CRUD + workflow + error notification + Excel | BROWSER | `reporting-verification.spec.ts` + `reporting-error-notifications.spec.ts` (F-015, `07476e3`) |
| FR-33-02 | NDTP roll-up aggregation (commune→city/province) | DOC-ONLY | Roll-up added `f4d5dfd`; not in a verification spec at a recorded commit |
| FR-34-01..07, 09, 11 | ATTP work report CRUD + workflow | BROWSER | Same spec (F-015) |
| FR-34-08 | ATTP report formatted document view | DOC-ONLY | Document view added `f4d5dfd` |
| FR-34-10 | Auto-aggregation of statistics fields | DOC-ONLY | Added `f4d5dfd`; verification spec coverage unclear |
| FR-35-01..07, 09, 10 | Action-month report CRUD + workflow | BROWSER | Same spec (F-015) |
| FR-35-08 | Action-month report formatted document view | DOC-ONLY | Added `f4d5dfd` |
| FR-36-01..06 | Risk analysis CRUD + publish (internal) | BROWSER | `risk-analysis-verification.spec.ts` (F-018, `de02e52`) |
| FR-36-07 | Risk analysis publish to public portal | DOC-ONLY | Public publish endpoint added `0eba6b6` |
| FR-36-08 | Risk analysis print/PDF export | DOC-ONLY | PDF export added `0eba6b6` |
| FR-37-01..06 | Testing results CRUD + scope | BROWSER | `testing-results-verification.spec.ts` (F-017, `e00dfb1`) |
| FR-38-01, 02, 05, 06 | Documents search/view/delete/scope | BROWSER | `documents-verification.spec.ts` (F-031, `d855990`) |
| FR-38-03, 04 | Document create/update (uses hard-coded type list) | PARTIAL-BROWSER | Feature passes; type-catalog integration gap acknowledged in doc 03 |
| FR-38-07 | Per-document print/export | DOC-ONLY | Excel list export exists; per-doc print added `0eba6b6` |
| FR-39-01, 05..08 | Dashboard stats/charts/map | BROWSER | `dashboard-verification.spec.ts` + `statistics-verification.spec.ts` (F-022, `7316838`) |
| FR-39-02 | Dashboard time + unit filters | DOC-ONLY | Filters added `0763d1f` after F-022 verified at `7316838` |
| FR-39-03, 04 | Report compliance tracking widgets | DOC-ONLY | Widgets added `0763d1f` |
| FR-39-09 | Chart/figure download | DOC-ONLY | Download added `0763d1f` |
| FR-40-01, 03, 05 | Statistics: licenses / NDTP / inspection | BROWSER | `statistics-verification.spec.ts` (F-023, `7316838`) |
| FR-40-02, 04, 06, 08 | Statistics Excel export (4 types) | DOC-ONLY | Exports added `8fe0320`; not re-verified in a recorded spec |
| FR-40-07 | Business breakdown by region/area/managing unit | DOC-ONLY | Added in post-audit batch; partial implementation |

### Group E — Cổng thông tin công khai (STT 41–49, ~32 items)

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| FR-41-01, 02 | Public business search + display | BROWSER (via F-033) | `public-portal-verification.spec.ts` (F-033, `5aff855`); `GET /api/v1/public/businesses/search` |
| FR-41-03, 04 | Public product search + display | BROWSER (via F-033) | Same spec; `GET /api/v1/public/products/search` added in F-033 batch |
| FR-42-01, 02 | Public eligibility-cert lookup + info view | BROWSER | `public-lookups-verification.spec.ts` (F-027, `06e4b1c`) + `public-portal-verification.spec.ts` |
| FR-42-03, 04 | Public eligibility-cert document view/download | **NONE** | No public file-serving endpoint exists; no implementation |
| FR-43-01, 02 | Public self-declaration lookup + info view | BROWSER | Same spec (F-025, `06e4b1c`) |
| FR-43-03, 04 | Public self-declaration document view/download | **NONE** | No public file-serving endpoint |
| FR-44-01, 02 | Public ĐKCB lookup + info view | BROWSER | Same spec (F-026, `06e4b1c`) |
| FR-44-03, 04 | Public ĐKCB document view/download | **NONE** | No public file-serving endpoint |
| FR-45-01..03 | Warned businesses public lookup | BROWSER (via F-033) | `public-portal-verification.spec.ts`; `GET /api/v1/public/warned-businesses` confirmed |
| FR-46-01, 02 | Public CFS lookup + info view | BROWSER | `public-lookups-verification.spec.ts` (F-028, `06e4b1c`) |
| FR-46-03, 04 | Public CFS document view/download | **NONE** | No public file-serving endpoint |
| FR-47-01, 02 | Public export-cert lookup + info view | BROWSER | Same spec (F-029, `06e4b1c`) |
| FR-47-03, 04 | Public export-cert document view/download | **NONE** | No public file-serving endpoint |
| FR-48-01, 02 | Public news + alert listing/search | BROWSER (via F-033) | `public-portal-verification.spec.ts`; `GET /api/v1/public/news`, `/api/v1/public/alerts` |
| FR-48-03 | Citizen alert submission (captcha-gated) | BROWSER (via F-033) | Same spec; `POST /api/v1/public/alert-reports`; Draft with source=2 verified |
| FR-49-01, 02 | Public document listing + view | BROWSER (via F-033) | Same spec; `GET /api/v1/public/documents`; isPublic filter verified |

### Group F — Tích hợp dữ liệu (STT 50–57, ~34 items)

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| FR-50-01..04, 06 | API endpoint CRUD + toggle | BROWSER | `data-integration-verification.spec.ts` (F-019, `11a6537`) |
| FR-50-05 | Partner-facing API spec/docs | DOC-ONLY | Metadata added `0eba6b6`; no machine-readable OpenAPI spec for partners |
| FR-51-01, 03, 04 | Alert share history: view/detail/search | DOC-ONLY | Data-sharing engine added `88d46a5`; viewer tables exist but never populated by outbound engine; not in verification spec |
| FR-51-02 | Send/share alerts outbound | DOC-ONLY | Engine added `88d46a5`; not verified in a real integration test |
| FR-52..57 -01/-03/-04 | History view/detail/search for 6 data types | DOC-ONLY | Same pattern as FR-51 |
| FR-52..57 -02 | Send/share each data type outbound | DOC-ONLY | No inbound partner endpoint, no partner auth; engine added but non-operational |

### Non-functional and integration requirements

| Req ID | Requirement | Evidence | Notes |
|---|---|---|---|
| NFR-01..06 (performance) | Response time, concurrency, CPU limits | BACKEND-UNIT (load test) | k6 load test (doc 05) — 30 VU real HTTP; claimed pass all 6 thresholds; dev-machine caveats |
| SEC-01..25 (security) | Passwords, sessions, CSRF, XSS, etc. | BACKEND-UNIT + BROWSER | Domain tests + annotation checks + verification spec auth flows; SEC-01 username rules gap (email = username) |
| INT-01 | MoH connectivity | **NONE** | No integration engine |
| INT-02 | TT 31/2026 + NĐ 37/2026 compliance | **NONE** | Not addressed in software |
| INT-03 | Partner accounts + API sessions (Sở NN, Sở CT) | **NONE** | No partner auth/token issuance |
| INT-04 | Machine-readable API spec | DOC-ONLY | Endpoint metadata only |
| INT-05 | Share-history persistence | DOC-ONLY | Table exists; engine not producing records |
| DBS-01..10 | Database security and ops | DOC-ONLY | Deployment/ops obligations; code has plaintext dev credentials committed |
| IPV-01..06 | IPv6 | DOC-ONLY | nginx lacks `listen [::]`; no AAAA record; partial software support |

---

## 6. Evidence Summary Counts

Based on this audit (software-assessable items only, ~452 total):

| Evidence Class | Approximate Count | % of 452 |
|---|---|---|
| (a) BROWSER — Playwright spec claimed to pass at HEAD | ~310 | ~69% |
| (b) BACKEND-UNIT — Domain/annotation/EF tests only (no real HTTP) | ~300 (overlaps with above) | — |
| (c) DOC-ONLY — Code inspected; no independent re-verification | ~60 | ~13% |
| (d) NONE — No implementation | ~18 | ~4% |
| PARTIAL-BROWSER — Spec passes; sub-requirement structurally absent | ~15 | ~3% |
| Non-software deliverables | 17 | — |

Note: Categories (a) and (b) overlap because every item with browser evidence also has some backend test (domain logic or annotation). The counts are for the primary evidence type per requirement. Items in DOC-ONLY have no currently-passing verification spec with a committed verified SHA.

---

## 7. Gap List — Requirements with Doc-Only or No Evidence

### 7.1 No evidence (NONE) — 10 FR items + 3 integration items

| ID | Description |
|---|---|
| FR-42-03 | Public eligibility certificate document view |
| FR-42-04 | Public eligibility certificate download/print |
| FR-43-03 | Public self-declaration document view |
| FR-43-04 | Public self-declaration download/print |
| FR-44-03 | Public ĐKCB document view |
| FR-44-04 | Public ĐKCB download/print |
| FR-46-03 | Public CFS document view |
| FR-46-04 | Public CFS download/print |
| FR-47-03 | Public export-cert document view |
| FR-47-04 | Public export-cert download/print |
| INT-01 | Ministry of Health connectivity |
| INT-02 | TT 31/2026 / NĐ 37/2026 protocol compliance |
| INT-03 | Partner accounts and API sessions |

**Root cause**: All FR-4x-03/04 items require public file-serving endpoints (serving MinIO-stored files to anonymous users without authentication). The public portal endpoints use `[AllowAnonymous]` for metadata lookups but no file-authorization path for anonymous MinIO access exists. This is a deliberate architectural gap, not an oversight.

### 7.2 Doc-only evidence — ~40 FR items (code inspected by audit team; no recorded re-verification spec run)

The following were NOT_IMPLEMENTED at doc 68 commit (`236c782`) and were added in batch commits `8fe0320..fe3dbd2`. Code is believed to exist but the verification registry was not updated with HEAD as the verified commit, and no independently witnessed re-run is recorded.

| FR IDs | STT Area | Added in commit |
|---|---|---|
| FR-02-02, FR-02-05, FR-02-07, FR-02-13 | Users: permission search, delete, random pw, Excel export | `fcb4f82`, `8fe0320` |
| FR-03-02, FR-03-03 | Audit log: detail view, Excel export | `8fe0320` |
| FR-04-01..06 | System settings module | `b1873a4` |
| FR-05-04, FR-05-05 | Profile edit, avatar | `71e0b3b` |
| FR-06-06 | Organization Excel export | `8fe0320` |
| FR-17-05 | Testing services Excel export | `8fe0320` |
| FR-19-02 | Advanced business filters (classification/type/area) | `f752c38` |
| FR-27-08, FR-27-09 | Inspection plan attachment upload/download | `71e0b3b` |
| FR-28-03, FR-28-05 | Inspection result finalize + document download | `71e0b3b` |
| FR-29-06 | Citizen alert moderation queue | `71e0b3b` |
| FR-30-07 | Citizen news approval | `71e0b3b` |
| FR-33-02 | NDTP report roll-up aggregation | `f4d5dfd` |
| FR-34-08, FR-34-10 | ATTP work report document view + auto-aggregation | `f4d5dfd` |
| FR-35-08 | Action-month report document view | `f4d5dfd` |
| FR-36-07, FR-36-08 | Risk analysis public portal + print/PDF | `0eba6b6` |
| FR-39-02, FR-39-03, FR-39-04, FR-39-09 | Dashboard filters, compliance widgets, chart download | `0763d1f` |
| FR-40-02, FR-40-04, FR-40-06, FR-40-08 | Statistics Excel exports (4 types) | `8fe0320` |
| FR-40-07 | Business breakdown by region/area/managing unit | `f752c38` |
| FR-50-05 | Partner-facing API documentation | `0eba6b6` |
| FR-51..57 (outbound send + history) | Data-sharing engine for 7 data types | `88d46a5` |

**Important caveat**: The regression log entry at `bdfff4c` states "Playwright full suite 232+ tests against the rebuilt Docker stack... PASSED" and doc 07 at HEAD states "229/235 at `fe3dbd2`". If those runs are accurate, many DOC-ONLY items may effectively have browser evidence — but with no independently witnessed run and no registry update, an auditor cannot confirm which specific sub-requirements were exercised.

---

## 8. Reliability Assessment of Existing Documentation

### Problem 1 — CRITICAL: Registry verified-commits are stale; HEAD creates a 39k-line unacknowledged gap

The feature verification registry (`docs/testing/01-feature-verification-registry.md`) lists verified commits ranging from `94f1f57` (F-001, oldest) to `86b793a` (F-034, newest). HEAD is `fe3dbd2`. Between the oldest recorded verification and HEAD, commits `8fe0320..fe3dbd2` added approximately 39k lines of new code including:
- New system settings module (rewrites F-032 verified at `d855990`)
- User delete/Excel/random-password (affects F-020 verified at `d56eb2c`)
- Dashboard filters and compliance widgets (affects F-022 verified at `7316838`)
- Inspection attachments and finalize step (affects F-013 verified at `07476e3`)
- Data sharing engine (affects F-019 verified at `11a6537`)

By the project's own impact rules (Level 2–3 retest required for feature code changes), all affected features should have been marked DIRTY and re-verified with an updated commit SHA. No DIRTY markings appear in the registry. The only runtime evidence for the updated code at HEAD is a single claim in doc 07 ("229/235 at `fe3dbd2`"), which has not caused a registry update.

**Auditor impact**: Every feature with code changes between its verified commit and HEAD must be treated as conditionally verified — VERIFIED at the older commit, but not independently confirmed at HEAD.

### Problem 2 — HIGH: Backend tests prove annotations exist, not runtime enforcement

519 backend tests pass. 519/519 is presented as a healthy signal throughout the audit documents (doc 60, doc 03). However, as documented in Section 2, zero backend tests use `WebApplicationFactory` or send real HTTP requests. The Application.Tests project's 251 tests verify by reflection that `[Authorize]` attributes are present on methods and that `ICurrentDataScopeProvider` is injected into constructors — not that these produce HTTP 403 responses or filtered queries at runtime.

A rogue `[AllowAnonymous]` on one method, a missing scope filter in one `GetListAsync`, or a misconfigured DI registration would not be caught by any backend test. The 519-test "green" result should be read as: "domain logic is correct; authorization annotations exist." It should not be read as: "the HTTP API enforces authorization correctly."

### Problem 3 — HIGH: Doc 68 reconciliation is stale; its gap list is materially wrong

Doc 68 (`68-final-feature-to-requirement-reconciliation.md`) reports "53 NOT_IMPLEMENTED" items at `236c782`. This headline has been used in production-readiness discussions. However, commits `8fe0320..fe3dbd2` implemented many of those 53 items (FR-02-13, FR-04-01..06, FR-27-08/09, FR-51-02..FR-57-02, and others). The actual NOT_IMPLEMENTED count at HEAD is substantially lower (auditor estimate: 10 FR items + 3 INT items = 13 genuinely absent functions). Conversely, some items that doc 68 counts as VERIFIED_RUNTIME may now be DIRTY due to code changes in their feature areas.

Any stakeholder or customer relying on doc 68's 53-item gap list is working from an out-of-date picture.

### Problem 4 — MEDIUM: F-033 public portal verification contradicts doc 68 — same items classified both VERIFIED and NOT_IMPLEMENTED in concurrent documents

Doc 68 (at `236c782`) explicitly classifies FR-48-01, FR-48-02, FR-48-03, FR-49-01, FR-49-02 as NOT_IMPLEMENTED. The feature verification doc for F-033 (`docs/testing/features/public-portal-fr41-49.md`, verified at `5aff855`) explicitly claims these same FR IDs are VERIFIED via `public-portal-verification.spec.ts`. Two internal audit documents present contradictory classifications for the same requirement IDs with no reconciliation note in either document.

The most likely explanation is that F-033 was implemented after doc 68 was finalized (commits between `236c782` and `5aff855`) and doc 68 was not updated. However, an independent auditor must flag this as a documentation-integrity issue: concurrent authoritative documents contradict each other without acknowledgment.

### Problem 5 — MEDIUM: 108 Vitest tests explicitly prohibited as acceptance evidence are cited alongside genuine passing tests

Doc 60 §8 reports "108/112 Vitest unit tests pass." This figure appears in the overall test summary table alongside "519/519 backend tests" and "229/235 Playwright tests." The doc 60 §11 independent review section acknowledges that these 108 tests use MSW with injected fake auth and "are explicitly prohibited as runtime acceptance evidence" per `CLAUDE.md`. Despite this, the figure appears in acceptance summaries where a customer might reasonably interpret all 108 as evidence of working behavior.

The risk is not that the Vitest tests are wrong about component rendering — they are useful for that purpose — but that their presence in mixed-evidence summaries inflates the apparent test coverage beyond what is genuinely proven.

---

## 9. Playwright Spec-to-Feature Mapping

| Spec file(s) | Feature area | Feature ID | Verified commit |
|---|---|---|---|
| `auth.spec.ts`, `auth-verification.spec.ts` | Authentication | F-001 | `94f1f57` |
| `password-management-verification.spec.ts` | Password management | F-002 | `b2f13fb` |
| `organizations.spec.ts`, `organizations-verification.spec.ts` | Organizations | F-003 | `94f1f57` |
| `catalogs.spec.ts`, `catalogs-verification.spec.ts` | Master catalogs | F-004 | `94f1f57` |
| `geography.spec.ts`, `geography-verification.spec.ts` | Geographic catalogs | F-005 | `94f1f57` |
| `businesses.spec.ts`, `businesses-verification.spec.ts` | Businesses + products | F-006 | `87cb7f6` |
| `self-declarations.spec.ts`, `self-declarations-verification.spec.ts` | Self declarations | F-007 | `232c814` |
| `product-registrations.spec.ts`, `product-registrations-verification.spec.ts` | Product registrations | F-008 | `df7823c` |
| `advertisement-registrations.spec.ts`, `advertisement-registrations-verification.spec.ts` | Ad registrations | F-009 | `df7823c` |
| `eligibility-certificates.spec.ts`, `eligibility-certificates-verification.spec.ts` | Eligibility certificates | F-010 | `df7823c` |
| `cfs-certificates.spec.ts`, `cfs-certificates-verification.spec.ts` | CFS certificates | F-011 | `df7823c` |
| `export-food-certificates.spec.ts`, `export-food-certificates-verification.spec.ts` | Export food certificates | F-012 | `df7823c` |
| `inspection.spec.ts`, `inspection-verification.spec.ts` | Inspection plans + results | F-013 | `07476e3` |
| `food-poisoning.spec.ts`, `food-poisoning-verification.spec.ts` | Food poisoning cases + incidents | F-014 | `3c12156` |
| `reporting.spec.ts`, `reporting-verification.spec.ts`, `reporting-error-notifications.spec.ts` | Reporting (NDTP/ATP/Action) | F-015 | `07476e3` |
| `alerts-news.spec.ts`, `alerts-news-verification.spec.ts` | Alerts + news | F-016 | `3e0e904` |
| `testing-results.spec.ts`, `testing-results-verification.spec.ts` | Testing results | F-017 | `e00dfb1` |
| `risk-analysis.spec.ts`, `risk-analysis-verification.spec.ts` | Risk analysis | F-018 | `de02e52` |
| `data-integration.spec.ts`, `data-integration-verification.spec.ts` | Data integration | F-019 | `11a6537` |
| `identity-administration.spec.ts`, `identity-administration-verification.spec.ts` | Identity administration | F-020 | `d56eb2c` |
| `audit-logs.spec.ts`, `audit-logs-verification.spec.ts` | Audit logs | F-021 | `3bb49ec` |
| `dashboard.spec.ts`, `dashboard-verification.spec.ts` | Dashboard | F-022 | `7316838` |
| `statistics.spec.ts`, `statistics-verification.spec.ts` | Statistics | F-023 | `7316838` |
| `public-lookups.spec.ts`, `public-lookups-verification.spec.ts` | Public lookups (7 cert types) | F-024..F-030 | `06e4b1c` |
| `documents.spec.ts`, `documents-verification.spec.ts` | Documents | F-031 | `d855990` |
| `system-settings.spec.ts`, `system-settings-verification.spec.ts` | System settings | F-032 | `d855990` (spec rewritten `bdfff4c`) |
| `public-portal.spec.ts`, `public-portal-verification.spec.ts` | Public portal FR-41..49 | F-033 | `5aff855` |
| `certificate-pdf-verification.spec.ts` | Certificate PDF download | F-034 | `86b793a` |

Total spec files: **56** (not 57; task description may have included a file not yet committed).

---

## 10. Phase 1 Summary for Handoff

| Metric | Value | Basis |
|---|---|---|
| Total FR count | 469 | doc 68 + doc 01-functional-requirements.md |
| Software-assessable | 452 | Excluding 17 non-software deliverables |
| Browser evidence (claimed) | ~310 items / ~69% | Playwright verification specs claimed to pass at HEAD |
| Backend unit evidence only | ~519 tests | Domain/annotation/EF — NOT runtime HTTP evidence |
| Doc-only evidence | ~40–50 items / ~10% | Code added in `8fe0320..fe3dbd2`; no recorded spec re-run |
| No evidence (NONE) | ~13 items / ~3% | 10 FR public file-serving + 3 INT |
| Partial-browser (structural gap in passing feature) | ~15 items / ~3% | Per-business tabs; doc-type catalog integration |
| Playwright spec files | 56 | glob-confirmed |
| Backend tests | 519 | All pass; zero use real HTTP pipeline |
| Frontend unit tests | 112 (108 pass) | All 108 passing use MSW — prohibited as acceptance evidence |

### FR IDs with doc-only evidence (code added post-audit, not re-verified at HEAD)
FR-02-02, FR-02-05, FR-02-07, FR-02-13, FR-03-02, FR-03-03, FR-04-01 through FR-04-06, FR-05-04, FR-05-05, FR-06-06, FR-17-05, FR-19-02, FR-27-08, FR-27-09, FR-28-03, FR-28-05, FR-29-06, FR-30-07, FR-33-02, FR-34-08, FR-34-10, FR-35-08, FR-36-07, FR-36-08, FR-39-02, FR-39-03, FR-39-04, FR-39-09, FR-40-02, FR-40-04, FR-40-06, FR-40-07, FR-40-08, FR-50-05, FR-51-01 through FR-57-04 (outbound and history items)

### FR IDs with no evidence (NONE)
FR-42-03, FR-42-04, FR-43-03, FR-43-04, FR-44-03, FR-44-04, FR-46-03, FR-46-04, FR-47-03, FR-47-04, INT-01, INT-02, INT-03

### 5 most significant reliability problems
1. Registry stale (verified commits `94f1f57..86b793a` vs HEAD `fe3dbd2` — 39k lines of code unacknowledged in registry)
2. Backend tests prove annotations, not runtime HTTP enforcement (519 tests, zero real HTTP)
3. Doc 68 NOT_IMPLEMENTED count (53) is materially wrong at HEAD — gap list overstates absent functions
4. F-033 and doc 68 contain contradictory classifications for the same FR IDs (FR-48-01..03, FR-49-01..02)
5. 108 Vitest tests prohibited as acceptance evidence appear in mixed summaries alongside genuine browser tests, creating an inflated evidence count
