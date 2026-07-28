# Current Requirement Gap Analysis

> **WORKFLOW-BATCH ADDENDUM (2026-07-28, on top of `b31cc11`):** the two remaining approval
> workflows are now built and verified against the real stack, closing **G-04** (inbound
> submission disposition — `MarkProcessed()`/`Reject()` now have real call sites, permissions,
> endpoints, UI and audit fields) and the moderation half of **G-09** (citizen submissions are
> refused with a persisted reason instead of hard-deleted; `AtpAlert`/`AtpNews` gained a
> `Rejected` status). Registry rows **F-019h** and **F-016b**; plan and evidence in
> [`../implementation/78-workflow-completion-plan.md`](../implementation/78-workflow-completion-plan.md).
> Gate at this tree: BE 690/690, EF drift none, tsc/oxlint clean, **full Playwright 304/304**.
> Every workflow in `docs/04-state-machines.md` (10 including INT-03) is now implemented.
> Residual from G-09: the business-link selector in the alert editor (form convenience only).

> **PHASE-0 ADDENDUM (2026-07-28, freeze commit `17149f6`):** the tables below are the audit snapshot at `aad87c1` + dirty tree. Phase 0 (BASE-001..004, report: `docs/audit/phase-0/PHASE_0_EXECUTION_REPORT.md`) has since closed **G-01** (baseline frozen; ApiSpecification feature landed at `5bc0d86`/`83ec103` via the concurrent session and the remainder committed at `17149f6` with the full gate green: BE 663/663, full Playwright **292/292**, drift none, Vitest 116/116), **G-02** (ApiSpecs.View added to the route map + real-stack spec), and **G-03** (test fixed at `83ec103`, re-verified). Consequently **FR-50-05 is now FULLY_IMPLEMENTED** — post-freeze roll-up: FULLY 401 / MOSTLY 30 / PARTIAL 5 / NOT_IMPLEMENTED 28 / EXTERNALLY_BLOCKED 2 / N-A 3; FR subset 350/20/2. `REMAINING_PLAN_SUMMARY.json` carries the post-freeze figures.

**Type**: Evidence-based re-audit of the current repository against the customer requirement document.
**Scope**: Analysis and planning only — no application source code was modified by this audit.
**Companion documents**:
- [CURRENT_REQUIREMENT_TRACEABILITY_MATRIX.md](CURRENT_REQUIREMENT_TRACEABILITY_MATRIX.md)
- [../planning/REMAINING_IMPLEMENTATION_PLAN.md](../planning/REMAINING_IMPLEMENTATION_PLAN.md)
- [../planning/REMAINING_TASK_BACKLOG.md](../planning/REMAINING_TASK_BACKLOG.md)
- [../planning/UAT_AND_PRODUCTION_READINESS_GATES.md](../planning/UAT_AND_PRODUCTION_READINESS_GATES.md)
- [../planning/REMAINING_PLAN_SUMMARY.json](../planning/REMAINING_PLAN_SUMMARY.json)

---

## A. Audit baseline

| Item | Value |
|---|---|
| Branch | `feat/integration-completion` |
| HEAD commit | `aad87c175c664ca5d45f3c96a616720616b60992` |
| HEAD timestamp | 2026-07-28 15:09:29 +0700 — `docs(FR-50-05): publish partner API spec + OpenAPI, verified by executable contract test` |
| Working tree | **DIRTY** — 47 entries: 28 modified tracked files + 19 untracked entries (see §A.1) |
| Staged files | none |
| Audit date/time | 2026-07-28 (afternoon, +0700) |
| Runtime environment | Windows 11 Pro, Docker Compose stack **running and healthy**: `foodsafe-api-1`, `foodsafe-frontend-1`, `foodsafe-postgres-1` (PostgreSQL 15), `foodsafe-redis-1`, `foodsafe-minio-1`, `foodsafe-clamav-1`, `foodsafe-mailpit-1`. Frontend 200 at `http://localhost:8080/`, Swagger 200 at `http://localhost:5000/swagger/v1/swagger.json`. |
| Requirement source | `docs/Mẫu số 03. YCKT (1).pdf` (42 pages) — full text re-extracted with `pdftotext` during this audit and cross-checked against `docs/audit/60-customer-requirement-baseline.md` (469 atomic items — extraction confirmed faithful; ID scheme reused). |
| Prior inventory | `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md` (untracked, 440 KB, generated at HEAD `a853674`, registry stamp `8be91bc`) |

### A.1 Dirty working-tree contents (reconciled)

Uncommitted work forms **one coherent in-progress feature plus collateral**:

1. **API Specification management feature (FR-50-05 in-app half) — UNCOMMITTED but functionally complete** (verified by source inspection this audit):
   - Untracked: `ApiSpecification.cs` (domain), `ApiSpecificationAppService.cs`, `OpenApiSpecValidator.cs`, `ApiSpecificationDtos.cs`, `ApiSpecificationController.cs`, `PartnerApiSpecController.cs` (anonymous published-spec download), migration `20260728081422_AddApiSpecification` (+Designer), FE `ApiSpecsTab.tsx`, `e2e/api-specification-management.spec.ts`, tests `ApiSpecificationContractTests.cs`, `OpenApiSpecValidatorTests.cs`, `FoodSafe.Domain.Tests/DataIntegration/`.
   - Modified tracked files belonging to the same feature: `FoodSafeDbContext.cs`, `FoodSafeDbContextModelCreatingExtensions.cs`, `FoodSafeDbContextModelSnapshot.cs`, `FoodSafePermissions.cs`, `FoodSafePermissionDefinitionProvider.cs`, `DataIntegrationEnums.cs`, `PartnerConsts.cs`, `FoodSafeDomainErrorCodes.cs`, `en.json`/`vi.json`, DataIntegration FE api/types/page files.
   - **Consequence**: pushing the tracked modifications without the untracked migration would fail the CI `dotnet ef migrations has-pending-model-changes` drift gate. These files must be committed together (task BASE-001).
2. **FE route-permission refactor**: new untracked `src/app/routePermissions.ts` + modified `router.tsx`, `PermissionRoute.tsx`, `AppLayout.tsx` — single-source route permission map that **fixes** the three previously reported route/sidebar mismatches (verified consistent this audit, §H).
3. **UI polish**: modified pages (`MasterCatalogPage`, `DashboardPage`, `FoodPoisoningPage`, `GeographicCatalogPage`, `ReportingPage`, `StatisticsPage`, `index.css`, several `*Queries.ts`). One mocked unit test broke against these changes (§A.3).
4. **Generated local artifacts (should not be committed)**: `FoodSafe.BE/test-results/`, `FoodSafe.FE/.results/`, root `test-results/`, root `testing/`; `.gitignore` modified.
5. **Untracked report**: `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md` (the prior inventory itself).

### A.2 Commands executed by this audit (all non-destructive)

| Command | Result |
|---|---|
| `git status` / `git log` / `git diff --stat` / `git diff --name-only a853674..HEAD` | Baseline above; 59 files changed a853674→HEAD (all INT-03 + SSRF regression caps + docs + partner spec) |
| `dotnet build` (FoodSafe.BE, dirty tree) | **0 errors** |
| `dotnet test --no-build` (all 4 test projects, dirty tree) | **662/662 passed** (Domain 215, Application 356, HttpApi.Host 71, EFCore 20) — note: 27 more tests than the 635 recorded at `6326af4`, the delta being the uncommitted ApiSpecification tests |
| `npx tsc --noEmit` (FoodSafe.FE) | **0 errors** |
| `npm run lint` (oxlint) | **pass** |
| `npm test -- --run` (Vitest, mocked — not acceptance evidence) | **115/116 passed, 1 failed**: `FoodPoisoningPage.test.tsx` "renders cases tab…" cannot find `CA-001` — broken by uncommitted working-tree UI changes |
| Swagger discovery | `GET :5000/swagger/v1/swagger.json` → 200 |
| Playwright full suite | **NOT re-run by this audit** (see §A.3) |

### A.3 E2E status and why the full suite was not re-run

The most recent full Playwright run is recorded in `docs/production-audit/08-final-production-go-no-go.md`: **286/286 passed, 0 flaky, 0 skipped** (76 spec files, workers=1, zero API interception grep-confirmed) at HEAD `6326af4` — 4 commits behind the current HEAD, but the 4 subsequent commits are docs/tests-only except `adb30eb` (covered by its own re-certification) and `0776230` (adds 2 test files only). The api container currently running was rebuilt after HEAD (created ~7 minutes before probing; newer than the HEAD commit timestamp — no stale-container hazard for runtime probes, but note a **parallel working session appears active** on this repository (frontend container rebuilt within minutes; `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md` itself records analysis-window contamination).

**Effect on confidence**: modules not re-E2E-tested in this audit session inherit their evidence from the 286/286 run at `6326af4` plus this audit's fresh 662/662 backend run on the dirty tree. The uncommitted ApiSpecification feature has an e2e spec (`api-specification-management.spec.ts`) whose execution is **not certified anywhere** — it must be run at the freeze commit (BASE-004). Confidence is HIGH for committed features, MEDIUM for the uncommitted feature and for the dirty-tree UI changes (1 broken mocked test proves at least the FE render contract moved).

### A.4 Documents used

`docs/Mẫu số 03. YCKT (1).pdf` (re-extracted); `docs/audit/60/61/63` (requirement baseline + cross-check); `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md`; `docs/functional-audit/00–04`; `docs/testing/00–05` incl. feature verification registry + load test results; `docs/production-audit/08-final-production-go-no-go.md` (+07 and addendum); `docs/integration/*` (partner API spec, OpenAPI 3.0.3, onboarding, examples); `.github/workflows/ci.yml`; direct source inspection of `FoodSafe.BE/src/**` and `FoodSafe.FE/src/**` (evidence citations in §D).

---

## B. Reconciliation with the previous inventory

The inventory (`PROJECT_IMPLEMENTATION_INVENTORY.md`, HEAD `a853674`) is broadly accurate but several findings are already stale, and a few claims were over- or under-stated:

| Previous finding | Previous status | Current evidence (this audit) | Current status | Changed since inventory? | Related files |
|---|---|---|---|---|---|
| INT-F024/F025 — process/reject inbound submission | NOT_IMPLEMENTED | Confirmed still true: `MarkProcessed()`/`Reject()` at `InboundSubmission.cs:78-85` have **zero call sites**; `IPartnerAccountAppService` exposes only Get methods; `InboundSubmissionsTab.tsx:82-88` is read-only | Still NOT_IMPLEMENTED (gap G-04) | No | `PartnerAccountDtos.cs:122-137`, `InboundSubmissionsTab.tsx` |
| WF-14 Phase 2 ingestion into domain tables | EXTERNALLY_BLOCKED (TT 31/2026) | Confirmed: `InboundSubmission.cs:9` documents verbatim-JSON storage pending official field map | Still EXTERNALLY_BLOCKED (G-05) | No | `InboundSubmission.cs` |
| API specification management | Not covered (arrived after analysis window) | Full end-to-end feature exists **uncommitted**: domain + validator + org-scoped CRUD + publish/unpublish + anonymous partner download + 4 permissions + migration + FE tab + e2e spec | NEW — uncommitted, unverified (G-01) | **Yes — new** | §A.1 item 1 |
| `/statistics`, `/dashboard` lack PermissionRoute; `/food-poisoning`, `/reporting` sidebar/route mismatch | MEDIUM findings | Working tree introduces `routePermissions.ts` single-source map; `/food-poisoning` and `/reporting` now consistent (sidebar = route = OR-of-view-permissions); `/statistics` + `/dashboard` deliberately open to any authenticated user at all three layers | Mismatches FIXED (uncommitted); openness of statistics is now a *policy decision* to confirm (G-22) | **Yes — fixed in working tree** | `routePermissions.ts`, `AppLayout.tsx:96-97`, `router.tsx:234,418` |
| Global search + notification bell placeholders (O7-P1/P2) | LOW | Confirmed still present: `AppLayout.tsx:453-459` input with no handler; `AppLayout.tsx:461-474` hard-coded red-dot badge, no backend | Still present (G-15) | No | `AppLayout.tsx` |
| `appName: "Angular"` (O7-06) | LOW-MEDIUM, "may break reset links" | Verified: it is ABP's SPA client registration key; `ConfigureUrls` registers the React client under `Applications["Angular"]`, so reset URLs are **correct**. Maintainability smell only | Downgraded to LOW cosmetic (G-24) | No (assessment corrected) | `IdentityAdministrationAppService.cs:998`, `FoodSafeHttpApiHostModule.cs:145-148` |
| Redis declared but unused (R-12 subset) | LOW note | Confirmed and sharpened: `docker-compose.yml` makes api `depends_on: redis (healthy)` while zero Redis usage exists in `FoodSafe.BE/src` — an unused **hard startup dependency** | Confirmed (G-23) | No | `docker-compose.yml:47-67,169` |
| Vitest 116/116 pass | Claimed pass | Current dirty tree: **115/116** — `FoodPoisoningPage.test.tsx` broken by uncommitted UI changes | Regressed on dirty tree (G-03) | **Yes** | `FoodPoisoningPage.test.tsx` |
| BE 635 tests | 635/635 | 662/662 on dirty tree (27 new uncommitted ApiSpecification tests) | Improved | **Yes** | untracked test files |
| Excel import: IMPLEMENTED (section E) vs PARTIAL (section M.2) | Internally contradictory | Import preview/confirm browser-verified per registry F-006 and functional-audit doc 73 evidence | IMPLEMENTED — inventory §M.2 is the stale claim | Assessment corrected | registry F-006 |
| E2E not in CI (N-05) | HIGH | Confirmed: `ci.yml` has no Playwright job | Still true (G-25) | No | `.github/workflows/ci.yml` |
| Zero real-HTTP BE tests (N-01) | HIGH | Confirmed (all 662 are in-process/structural; probes doc-74 were manual) | Still true (G-26) | No | test projects |
| Partner endpoint `[AllowAnonymous]` + shared rate bucket (R-04) | MEDIUM | Confirmed by design (API-key auth inside), hardening still open | Still open (G-18) | No | `PartnerInboundController.cs` |
| Citizen moderation "out of scope / missing" | Ambiguous in inventory | Moderation **exists**: citizen submissions stored Draft+`Source=PublicReport`, officer queue = AlertsNewsPage source filter, publish/delete verified by `citizen-moderation.spec.ts`. Depth gaps remain (reject-with-comment, business-link in editor, public-visibility E2E) | PARTIAL → corrected upward with residual G-09 | Assessment corrected | `CitizenAlertReportAppService.cs`, `AlertsNewsPage.tsx` |
| Registry commit stamps | 34/34 VERIFIED at `8be91bc` | Registry not re-stamped after the clean 286/286 run at `6326af4` (doc-08 issue D-3); stale by 2+ commits and silent about the dirty tree | Stale bookkeeping (G-01/BASE-004) | Yes | `docs/testing/01` |

**Stale/contradictory claims in older audit docs** (superseded, kept for traceability): `docs/functional-audit/01` still lists INT-03 NOT_IMPLEMENTED and FR-50-05 PARTIAL (both since closed at `52d35c1` / `0776230`); `docs/production-audit/07` body contradicts its own §8 addendum (doc-08 issue D-1); `docs/audit/63-requirement-implementation-matrix.md` (state at `9d2cb1e`, registry then 0 VERIFIED) predates ~30 subsequent fix/verify commits and must not be used for current status.

---

## C. Requirement summary

Denominator: **469 atomic requirements** (doc-60 extraction, confirmed against the re-extracted PDF). Statuses per §F rules of the audit mandate; per-item detail in the traceability matrix.

| Category | Total | Fully | Mostly | Partial | Missing (not impl.) | Externally blocked | Not applicable | Insufficient evidence |
|---|---|---|---|---|---|---|---|---|
| Functional (FR, STT 1–57 + LIC) | 372 | 349 | 21 | 2 | 0 | 0 | 0 | 0 |
| Integration (INT-01..05) | 5 | 2 | 0 | 1 | 0 | 2 | 0 | 0 |
| Performance (NFR-01..06) | 6 | 0 | 6 | 0 | 0 | 0 | 0 | 0 |
| IPv6/TLS/DNSSEC (IPV-01..06) | 6 | 0 | 1 | 0 | 5 | 0 | 0 | 0 |
| App security (SEC-01..25) | 25 | 22 | 2 | 1 | 0 | 0 | 0 | 0 |
| DB security (DBS-01..10) | 10 | 1 | 0 | 1 | 8 | 0 | 0 | 0 |
| UI/UX (UI-01..10) | 10 | 9 | 1 | 0 | 0 | 0 | 0 | 0 |
| Data tolerance (DT-01..12) | 12 | 12 | 0 | 0 | 0 | 0 | 0 | 0 |
| Technology (TECH-01..05) | 5 | 5 | 0 | 0 | 0 | 0 | 0 | 0 |
| ATTT level 2 (L2-01) | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Support (SUP-01..04) | 4 | 0 | 0 | 0 | 4 | 0 | 0 | 0 |
| Training (TRN-01) | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 |
| Ownership (OWN-01..04) | 4 | 0 | 0 | 0 | 2 | 0 | 2 | 0 |
| Handover (HND-01..02) | 2 | 0 | 0 | 0 | 1 | 0 | 1 | 0 |
| Acceptance (ACC-01..06) | 6 | 0 | 0 | 0 | 6 | 0 | 0 | 0 |
| **Total** | **469** | **400** | **31** | **5** | **28** | **2** | **3** | **0** |

Notes: “Missing” for IPV/DBS/SUP/TRN/ACC is dominated by **deployment/operational work that has no production environment yet** — it is not missing application code. Functional “Missing” is zero: every YCKT functional item has at least a mostly-working implementation. The two PARTIAL functional items are FR-19-17 (commitment record depth, G-08) and FR-40 report-status-by-organization output (G-10).

---

## D. Detailed gap register

Severity: how badly acceptance/security is affected. Priority: computed by the mandated formula (business×3 + acceptance×3 + security×2 + dependency×2 + regression − effort); banded P0–P3. Task IDs refer to [REMAINING_TASK_BACKLOG.md](../planning/REMAINING_TASK_BACKLOG.md).

| Gap | Req IDs | Requirement | Current behavior | Missing behavior | Status | Sev | Pri | Evidence | Recommended solution → tasks |
|---|---|---|---|---|---|---|---|---|---|
| G-01 | FR-50-05 (+all) | Stable, verified baseline | ApiSpecification feature complete but uncommitted; tracked model changes + untracked migration split; registry stamped at older commits; local artifacts polluting tree | Single frozen commit with green gates; registry re-stamp | BROKEN_OR_BLOCKED (process) | HIGH | **P0** | §A.1; snapshot modified + migration untracked | Commit feature atomically, clean artifacts, re-run gates → BASE-001, BASE-004 |
| G-02 | SEC-14/15 | Route permission consistency | New `ApiSpecs.*` permissions absent from `ROUTE_PERMISSIONS.dataIntegration`: a user holding only `ApiSpecs.View` is blocked from `/data-integration` despite valid BE permission | Add ApiSpecs.View to route map + verify tab gating | PARTIALLY_IMPLEMENTED | MED | **P0** (rides baseline) | `routePermissions.ts` vs `ApiSpecificationAppService.cs` | BASE-002 |
| G-03 | (quality gate) | FE unit suite green | `FoodPoisoningPage.test.tsx` 1 test fails against working-tree UI | Fix test to match current UI | BROKEN_OR_BLOCKED (test) | LOW | **P0** (rides baseline) | vitest run this audit 115/116 | BASE-003 |
| G-04 | FR-51..57 inbound; STT 51–57 | Inbound submissions must be manageable (view ✓, disposition ✗) | Submissions stored, listed, detail-viewable; `MarkProcessed`/`Reject` dead code; status stays `Received` forever; no reviewer action in UI | Approve/mark-processed + reject-with-reason API, permissions, FE actions, audit trail | PARTIALLY_IMPLEMENTED | HIGH | **P1** | `InboundSubmission.cs:78-85` zero callers; `InboundSubmissionsTab.tsx:82-88` | FUNC-INT-001 |
| G-05 | INT-02, FR-51..57 ingestion | Inbound data converted into real domain records per TT 31/2026 | Raw JSON stored verbatim only | Mapping into Alert/Business/… + link-back + idempotent transaction — blocked on official partner field map | EXTERNALLY_BLOCKED | HIGH | P1 (external) / prep P2 | `InboundSubmission.cs:9` | EXT-001 (disposition) + FUNC-INT-003 (prep design) |
| G-06 | FR-50/51 partner contract | Partner can learn submission outcome | Synchronous receipt only; no status polling endpoint or webhook | `GET /api/v1/partner/submissions/{id}` status endpoint + spec update | PARTIALLY_IMPLEMENTED | MED | P2 | `PartnerInboundAppService.cs:264-331` | FUNC-INT-002 |
| G-07 | INT-01 | Bộ Y tế connectivity + resilient outbound | Outbound engine + auth proven vs real receiver; no retry/circuit-breaker policy; real ministry endpoint unavailable (external) | Polly resilience + health probe; real endpoint = external | PARTIALLY_IMPLEMENTED + external | MED | P2 | `DataSharingAppService.cs` (no Polly refs) | FUNC-INT-004 + EXT-001 |
| G-08 | FR-19-17 (+ FR-19 attachment list) | “Xác nhận cơ sở đã nộp bản cam kết đảm bảo VSATTP” with record/attachment | Boolean `Business.HasVsattpCommitment` only (`Business.cs:29`); no date, confirming user, status, or attachment slot; YCKT explicitly lists “giấy xác nhận bản cam kết” among business attachments | Commitment record: date/user/org/status + attachment + confirm action + visibility | PARTIALLY_IMPLEMENTED | HIGH | **P1** | `Business.cs:29,144`; migration `20260725124518` | FUNC-COMMIT-001 |
| G-09 | FR-29-06/08, FR-30-07 | Citizen alert/news moderation: duyệt/thu hồi with traceability | Submit (CAPTCHA-gated real endpoints) ✓, queue via source filter ✓, publish ✓, recall ✓, delete ✓ — but reject = delete with **no reviewer comment**; business-link not settable in editor UI; no submit→approve→public-portal E2E | Reject-with-comment (persisted), business-link selector, moderation audit fields, full-chain E2E | MOSTLY_IMPLEMENTED | MED | **P1** | `citizen-moderation.spec.ts`; `AlertEditorModal.tsx:1-80`; `AtpAlertDto` fields | FUNC-CIT-001 |
| G-10 | FR-40-01..08, FR-39 | Dedicated statistics reports with filters, org scope, Excel, print | 4 dedicated report tabs + 4 Excel endpoints exist; but `ReportStatisticsFilterDto` has Year only (no OrganizationId); “report status by organization” exists only as dashboard table (no export); no printable output | Org filter on report tables/exports; report-status-by-org Excel; print output | PARTIALLY_IMPLEMENTED | HIGH | **P1** | `ReportStatisticsSection.tsx`; `StatisticsExcel` endpoints; `ReportStatisticsFilterDto` | FUNC-STAT-001 |
| G-11 | FR-42..47-03/04, FR-49, FR-23 | Public view/print/download of documents & attachments | Anonymous certificate **PDF** download works for 5 types (F-034); ad-registration has no PDF; all `*AttachmentController` are `[Authorize]` → attached scanned originals not publicly downloadable; legal-document lookup shows metadata only; no print buttons | Ad-registration PDF; public attachment access policy + implementation; print affordance | MOSTLY_IMPLEMENTED | MED | P2 | `CertificatePdfController`; `EligibilityCertificateAttachmentController.cs:13`; `PublicDocumentsPage.tsx` | FUNC-PUB-001 |
| G-12 | FR-03-02, FR-05-04/05, FR-34-08, FR-35-08, FR-40-08 | Built features lacking executed evidence | Implemented; no executed spec | Executed browser specs | MOSTLY_IMPLEMENTED (evidence) | LOW | P2 | functional-audit 01 §1 | FUNC-EVID-001 |
| G-13 | FR-LIC-01 (M-6) | Certificate PDFs match official NĐ 15/2018 forms | PDFs generate/download; layout not the official template | Customer template + layout fidelity | MOSTLY_IMPLEMENTED | MED | P2 (needs customer input) | doc-08 M-6 | FUNC-LIC-001 + EXT-001 |
| G-14 | FR-38-03/04 | Document types from catalog | Hard-coded list (works) | Catalog integration | MOSTLY_IMPLEMENTED | LOW | P3 | functional-audit 01 | FUNC-DOC-001 |
| G-15 | UI-01/22 (consistency) | No dead controls | Header global-search input with no handler; bell with hard-coded red dot, no backend | Wire or remove both | BROKEN_OR_BLOCKED (placeholder) | LOW | P3 | `AppLayout.tsx:453-474` | FUNC-UX-001 |
| G-16 | INT config | External-system list maintainable | `EXTERNAL_SYSTEMS` hard-coded in FE (`DataIntegrationPage.tsx:75`); BE free-text | Catalog/enum-backed select | MOSTLY_IMPLEMENTED | LOW | P3 | ibid. | FUNC-INT-005 |
| G-17 | SEC-08 (I-2) | CAPTCHA with real keys on staging | Enforcement middleware proven (400 on missing/invalid token) with test keys; `CaptchaConfiguration.Validate` forbids test keys in Production | One staging probe with real Turnstile keys | MOSTLY_IMPLEMENTED | MED | **P1** | doc-08 I-2; `LoginCaptchaMiddleware.cs` | SEC-001 |
| G-18 | SEC-15/16 hardening (R-04) | Partner endpoint abuse resistance | API-key auth, replay ±300s, idempotency ✓; shared IP rate bucket; no per-partner rate limit or IP allowlist | Per-partner rate bucket (+optional allowlist) | MOSTLY_IMPLEMENTED | MED | P2 | `PartnerInboundController.cs` | SEC-002 |
| G-19 | SEC hardening (R-06) | Strict CORS | `SetIsOriginAllowedToAllowWildcardSubdomains()` | Enumerate exact origins for prod | MOSTLY_IMPLEMENTED | LOW | P2 | host module | SEC-003 |
| G-20 | SEC ops (R-02) | No known credentials in prod | E2E password `Admin@2026!` in git history; seeding guarded by `EnableE2eData` | Rotate staging/prod seeds; assert flag off in prod config | MOSTLY_IMPLEMENTED | MED | **P1** | inventory R-02 | SEC-004 |
| G-21 | SEC-01 (M-7) | Username charset per YCKT | ABP default charset in effect | Customer ruling; enforce if literal | EVIDENCE_INSUFFICIENT → ruling | LOW | P2 | doc-08 M-7 | SEC-005 + EXT-001 |
| G-22 | SEC-16 | Data-scope on aggregates | `/statistics`, `/dashboard` open to all authenticated users (by design, consistent at all 3 layers); breakdown Excel exports are province-wide (no org filter) | Decide + either scope or document the openness; org filter ties into G-10 | EVIDENCE_INSUFFICIENT (policy) | MED | P2 | agent verification §C | SEC-006 (with FUNC-STAT-001) |
| G-23 | TECH/ops | No unused hard dependency | Redis in compose, api `depends_on` healthy Redis; zero Redis usage in BE | Wire ABP distributed cache to Redis **or** drop dependency | BROKEN_OR_BLOCKED (latent ops risk) | LOW | P3 | `docker-compose.yml:47-67,169` | SEC-007 |
| G-24 | maintainability | Correct SPA client naming | ABP client key literally `"Angular"` (works; reset links correct) | Rename key consistently | MOSTLY_IMPLEMENTED | LOW | P3 | `IdentityAdministrationAppService.cs:998` | SEC-008 |
| G-25 | ACC/test policy | E2E regression in CI | Playwright absent from `ci.yml`; acceptance runs manual-only | CI job vs compose stack (workers=1, secrets) | NOT_IMPLEMENTED (gate) | HIGH | **P1** | `.github/workflows/ci.yml` | TEST-001 |
| G-26 | test policy | Real-HTTP BE acceptance tests | All BE tests in-process; doc-74 probes were manual one-offs | WebApplicationFactory + Testcontainers suite porting doc-74 probes | NOT_IMPLEMENTED (suite) | MED | P2 | inventory N-01 | TEST-002 |
| G-27 | test policy | EF mapping tests all modules | Missing for Licensing, Inspection, FoodPoisoning, Reporting, AlertsAndTesting | Add mapping tests | TEST gap | LOW | P2 | inventory N-02 | TEST-003 |
| G-28 | DT-04/workflow | Concurrency behavior verified | Optimistic concurrency present; no dedicated spec | Concurrent-update spec | TEST gap | LOW | P2 | functional-audit 01 §4 | TEST-004 |
| G-29 | test infra | Deterministic full-suite | `reporting-error-notifications` times out under full-suite load only | Harden or shard | TEST gap | LOW | P3 | memory/doc 75 §3.5 | TEST-005 |
| G-30 | CI quality | Reliable FE unit gate | Vitest gate green ≠ acceptance; jsdom timeout flakes reported in CI context | Stabilize or quarantine; keep policy separation explicit | TEST gap | LOW | P2 | doc-08 note; §A.2 | TEST-006 |
| G-31 | IPV-06, SEC-12 | Production HTTPS/TLS ≥1.2 + Secure cookies | Code ready (HSTS, redirect, HttpOnly; PostgreSqlSslValidator); no production TLS deployment to verify against | Deploy TLS, verify Secure flag + ciphers | NOT_IMPLEMENTED (deploy) | HIGH | **P1** (Track D) | inventory infra section | OPS-001 |
| G-32 | IPV-01..05 + DNSSEC | IPv6 end-to-end + AAAA + DNSSEC | No production DNS/hosting exists yet; software layer (Kestrel) dual-stack capable but unverified | ISP/DNS coordination, AAAA, DNSSEC, listener config | NOT_IMPLEMENTED (deploy) | MED | **P1** (Track D) | — | OPS-002 |
| G-33 | NFR-01..06 | Performance on production hardware | k6 local run PASSES all thresholds (30 VUs, 0% fail, avg 31 ms, API CPU avg ~54%) — developer hardware only | Re-run on production hardware with CPU capture | MOSTLY_IMPLEMENTED | MED | **P1** (Track D) | `docs/testing/05-load-test-results.md` | OPS-003 |
| G-34 | DBS-01..08 | DB hardening (accounts, patches, IP restrict, audit log 3+6 months, non-OS-admin service) | Local compose only; least-privilege connection + encrypted partner credentials done (DBS-04 ✓, part of 06) | Production DB hardening checklist execution | NOT_IMPLEMENTED (deploy) | HIGH | **P1** (Track D) | doc-60 DBS list | OPS-004 |
| G-35 | DBS-09/10 | Encryption at rest, masking, third-party DAM/DB firewall | Not present (requires infra/procurement) | Deploy/procure solutions | NOT_IMPLEMENTED (deploy) | MED | P2 (Track D) | — | OPS-005 |
| G-36 | DBS/ops | Production backup/restore | CI rehearses restore (B-2) — good; no production procedure/drill | Prod runbook + drill | PARTIALLY (infra) | MED | **P1** (Track D) | `scripts/rehearse-restore.sh`, ci.yml | OPS-006 |
| G-37 | NFR/ops | Production monitoring/alerting | None provisioned | CPU/uptime/error alerting | NOT_IMPLEMENTED (deploy) | MED | P2 (Track D) | — | OPS-007 |
| G-38 | ops | Production SMTP + secrets | Mailpit local; secrets via env | Prod SMTP + secret store | NOT_IMPLEMENTED (deploy) | MED | P2 (Track D) | compose | OPS-008 |
| G-39 | SUP-01..04 | 24×7 support, ≥2 channels, 48 h recovery SLA | No process established | Support process + channels + SLA commitment | NOT_IMPLEMENTED (ops) | MED | P2 (Track E/D) | doc-60 SUP | OPS-009 |
| G-40 | L2-01 (M-8) | ATTT level-2 dossier (NĐ 85/2016, TT 12/2022, QĐ 742) | Absent from tree (confirmed go/no-go G10) | Produce dossier | NOT_IMPLEMENTED (doc) | HIGH | **P1** (Track E) | doc-08 M-8 | DOC-001 |
| G-41 | ACC (manuals) | User manual (VN) | Absent | Write | NOT_IMPLEMENTED (doc) | HIGH | **P1** | doc-08 M-8 | DOC-002 |
| G-42 | ACC (manuals) | Admin manual (VN) | Absent | Write | NOT_IMPLEMENTED (doc) | HIGH | **P1** | doc-08 M-8 | DOC-003 |
| G-43 | ACC-01..06 | UAT scenarios + acceptance checklist per NĐ 224/2026 | Not prepared | Scenario suite mapped to STT 1–57 + NFRs | NOT_IMPLEMENTED (doc) | HIGH | **P1** | PDF §5 | DOC-004 |
| G-44 | TRN-01 | Training: 1 class, 1 day, 120 attendees | Not prepared | Materials + delivery plan | NOT_IMPLEMENTED (ops) | MED | P2 | PDF §3.6 | DOC-005 |
| G-45 | OWN-01/02, HND-01 | Data ownership handover + export procedure | DB dumps + Excel exports exist as capability; no documented procedure | Handover/export procedure document | NOT_IMPLEMENTED (doc) | MED | P2 | PDF §3.8/3.9 | DOC-006 |
| G-46 | INT-02/INT-01 disposition | Official partner schema / customer written deferral | Software ready up to the envelope; ministry schema + endpoint unavailable | Customer decision (deliver vs phased deferral) + template (M-6) + ruling (M-7) | EXTERNALLY_BLOCKED | HIGH | **P1** (external) | doc-08 §blockers | EXT-001 |
| G-47 | FR-02/04, STT 7 | Configurable lockout via settings; org-account concept | Lockout works (5 attempts/30 min); settings-driven configurability unverified this audit; STT 7 “tài khoản đơn vị” realized by convention (`AppUserProfile.OrganizationId`), not a distinct type | Verify/implement configurable lockout; document STT-7 equivalence for customer sign-off | MOSTLY_IMPLEMENTED / EVIDENCE_INSUFFICIENT | LOW | P2 | agent verification §B | FUNC-USER-001 |

---

## E. Confirmed remaining functional gaps (evidence-confirmed only)

1. **G-04 inbound disposition workflow** — the single largest committed-code functional gap: dead domain methods, no reviewer action path.
2. **G-08 commitment record** — YCKT names both a confirmation action (FR-19-17) and an attachable “giấy xác nhận bản cam kết”; current model is one boolean.
3. **G-10 statistics outputs** — org filter absent from report tables/exports; report-status-by-organization not exportable; no print output.
4. **G-09 citizen moderation depth** — reject-with-comment, business linking from editor, full-chain E2E.
5. **G-01 uncommitted FR-50-05 in-app feature** — complete but unverified and uncommitted (with G-02 route-permission wiring gap).
6. **G-11 public attachment/print access** — policy + implementation for originals; ad-registration PDF.
7. **G-06 partner status polling**, **G-07 outbound resilience**, and the P3 polish items (G-14/15/16).

## F. Confirmed non-functional gaps

**Application-level**: G-17 CAPTCHA staging probe; G-18 partner rate/IP hardening; G-19 CORS; G-20 credential rotation; G-21 username ruling; G-22 aggregate-scope policy; G-23 Redis dependency; G-25/26/27/28/30 test gates.
**Infrastructure-level** (no production environment exists yet — all of Track D): G-31 TLS/Secure-cookie, G-32 IPv6/AAAA/DNSSEC, G-33 prod load test, G-34 DB hardening, G-35 encryption-at-rest/DAM, G-36 backup drill, G-37 monitoring, G-38 SMTP/secrets, G-39 support process.

## G. External blockers

| Blocker | What is blocked | Preparatory work still possible |
|---|---|---|
| Official TT 31/2026/TT-BCT partner field map + signing profile (INT-02) | Inbound ingestion into domain tables (G-05); exact outbound field mapping | Canonical DTO + mapping skeleton + idempotent ingest design (FUNC-INT-003); disposition workflow (FUNC-INT-001) is independent and unblocked |
| Real Bộ Y tế / Sở NN / Sở CT endpoints + credentials (INT-01) | Live connectivity test | Resilience hardening (FUNC-INT-004); engine already proven vs real HTTP receiver |
| Customer decisions: M-6 official NĐ15 template, M-7 username rule, phased-delivery deferral for INT-01/02 | PDF fidelity; identity rule; production go | Collect in one written disposition package (EXT-001) |
| Production infrastructure (servers, domain, DNS hosting, TLS cert, SMTP) | All of Track D (G-31..G-38) | Runbooks/checklists (docs 38/39 exist — refresh at freeze) |
| Staging Turnstile keys (I-2) | G-17 probe | Config prepared; probe is minutes once keys exist |

## H. Contradictions and uncertainty

1. Registry stamps (`8be91bc`) vs clean 286/286 gate run (`6326af4`) — re-stamp owed (doc-08 D-3) → BASE-004.
2. `docs/production-audit/07` body vs its §8 addendum (INT-03 status) — doc-08 D-1 → BASE-004 refresh.
3. `docs/functional-audit/01` predates Batches F-1/F-2 closure — stale rows for retry/INT-03/FR-50-05 → refresh at BASE-004.
4. Inventory internal contradiction on Excel import (§B row) — resolved in favor of registry evidence.
5. CI green (Vitest) vs testing policy (Vitest not acceptance evidence) — G-25/G-30; no CI mechanism enforces the real acceptance policy today.
6. Parallel working sessions are active on this repo (container rebuilds mid-audit; inventory’s own contamination note). Any figure in this report is valid **only** for the recorded HEAD + dirty-tree state; the freeze (BASE-001) is the fix.
7. Statistics openness (G-22) is deliberate in code but never signed off as policy — flagged, not assumed.

## I. Revised completion figures

No single percentage is meaningful; six separate figures, each with formula and assumptions. Weights: FULLY=1.0, MOSTLY=0.85, PARTIAL=0.5, else 0. Excluded from software denominators: NOT_APPLICABLE (3) and EXTERNALLY_BLOCKED (2) where noted.

| # | Measure | Formula | Raw | Score | Confidence |
|---|---|---|---|---|---|
| 1 | Functional requirement coverage (any working implementation) | FR items ≥PARTIAL / 372 | 372/372 | **100%** | HIGH |
| 2 | Functional end-to-end completion | FULLY / 372 (weighted: (349+21×0.85+2×0.5)/372) | 349/372 | **93.8% raw / 98.9% weighted** | HIGH (committed) / MEDIUM (uncommitted FR-50-05 half) |
| 3 | Application-level NFR completion | software non-FR excl. infra-deferred & external (denom 64 = 80−5 IPV−8 DBS−1 L2−2 EXT) | 51 FULLY /64 | **79.7% raw / 95.3% weighted** | HIGH |
| 4 | UAT readiness | Gate 1–4 sub-criteria met (see gates doc) — blocked only by baseline freeze + CI E2E + UAT scenario suite | — | **≈ 85–90%** | MEDIUM-HIGH |
| 5 | Production readiness | Gate 1–8; Track D not started; M-8 absent; INT-02 disposition open | — | **≈ 55–60%** | MEDIUM |
| 6 | Full customer acceptance readiness | + manuals, training, UAT execution, acceptance records per NĐ 224/2026 | — | **≈ 50%** | MEDIUM |

Assumptions: registry + doc-73/74/75 + go/no-go evidence accepted for committed features (cross-checked, not re-executed, except this audit’s fresh 662/662 BE run); dirty-tree feature counted at 0.85 (built, spec exists, unexecuted); non-software deliverables excluded from #1–3 and dominate the drop in #5–6. Confidence ranges reflect the parallel-session hazard (§H.6).
