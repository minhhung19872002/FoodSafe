# 03 — Feature Acceptance Result

Audit date: 2026-07-27 | Commit: HEAD `fe3dbd2`
Evidence basis: full real-stack Playwright run (229 passed / 6 failed, no API interception — see doc 07), live smoke probes, and source inspection of the post-audit batch.

## 1. Acceptance method

Every feature was checked against the real path: real browser → React → nginx → ASP.NET Core API → auth/authz → EF Core → real PostgreSQL. The authoritative acceptance tests are the 34 `*-verification.spec.ts` specs, which exercise (per feature, as applicable): unauthenticated rejection, permission denial, cross-organization isolation, workflow transitions, validation, persistence after reload, and empty/loading/error states.

## 2. Result by feature (from the HEAD E2E run)

| ID | Feature | Verification spec | Result at HEAD |
|---|---|---|---|
| F-001 | Authentication | auth-verification | ✅ PASS |
| F-002 | Password management | password-management-verification | ✅ PASS |
| F-003 | Organizations | organizations-verification | ✅ PASS |
| F-004 | Master catalogs | catalogs-verification | ✅ PASS |
| F-005 | Geographic catalogs | geography-verification | ✅ PASS |
| F-006 | Businesses & products | businesses-verification | ✅ PASS |
| F-007 | Self declarations | self-declarations-verification | ✅ PASS (form-create path: see gap) |
| F-008 | Product registrations | product-registrations-verification | ✅ PASS (form-create path: see gap) |
| F-009 | Advertisement registrations | advertisement-registrations-verification | ✅ PASS (form-create path: see gap) |
| F-010 | Eligibility certificates | eligibility-certificates-verification | ✅ PASS (form-create path: see gap) |
| F-011 | CFS certificates | cfs-certificates-verification | ✅ PASS |
| F-012 | Export food certificates | export-food-certificates-verification | ✅ PASS (form-create path: see gap) |
| F-013 | Inspection plans & results | inspection-verification | ✅ PASS (form-create path: see gap) |
| F-014 | Food poisoning cases | food-poisoning-verification | ✅ PASS |
| F-015 | Reporting (NDTP/ATP/Action) | reporting-verification (+ error-notifications) | ✅ PASS |
| F-016 | Alerts & news | alerts-news-verification | ✅ PASS |
| F-017 | Testing results | testing-results-verification | ✅ PASS |
| F-018 | Risk analysis | risk-analysis-verification | ✅ PASS |
| F-019 | Data integration | data-integration-verification | ✅ PASS (SSRF resolved — B-5, doc 04 SEC-H-01) |
| F-020 | Identity administration | identity-administration-verification | ✅ PASS |
| F-021 | Audit logs | audit-logs-verification | ✅ PASS |
| F-022 | Dashboard | dashboard-verification | ✅ PASS |
| F-023 | Statistics | statistics-verification | ✅ PASS (route lacks permission guard — see below) |
| F-024..F-030 | Public lookups (7) | public-lookups-verification | ✅ PASS |
| F-031 | Documents | documents-verification | ✅ PASS (hard-coded type list — see below) |
| F-032 | System settings | system-settings-verification | ✅ PASS |
| F-033 | Public portal FR-41..49 | public-portal-verification | ✅ PASS |
| F-034 | Certificate PDF download | certificate-pdf-verification | ✅ PASS |

**All 34 authoritative verification specs pass against a stack rebuilt from HEAD.** This clears the single biggest gap the requirement reconciliation flagged (the post-audit batch `8fe0320..fe3dbd2` had not been re-verified on a rebuilt stack). It is now verified at commit `fe3dbd2`.

## 3. Acceptance-level defects & gaps found

| # | Severity | Feature(s) | Finding | Evidence |
|---|---|---|---|---|
| A-1 | LOW (coverage) | F-007/008/009/010/012/013 | The **form-based create UI path** (open modal → pick business from the virtualized combobox → save) has no passing automated test. The verification specs create records via API; the 6 legacy smoke specs that drive the form fail on AntD Select virtualization (`.last()` click without typed filter). Not a product defect — `showSearch` works — but this on-screen path is outside the green evidence. | doc 07 §3 |
| A-2 | MEDIUM | F-023 Statistics | `/statistics` route has no `PermissionRoute` guard — any authenticated user reaches the statistics page regardless of role (backend AppService authorization still applies to the data calls; verify the API side denies unprivileged callers). | Phase 2 inventory |
| A-3 | MEDIUM | F-031 Documents | Documents module uses a hard-coded 8-value document-type list; the STT 18 "Danh mục loại văn bản" catalog is maintained in the system but never consumed here. Customer requirement FR-38-03/04 expects catalog-driven types. | Phase 1 matrix (gap #8) |
| ~~A-4~~ RESOLVED (B-5) | (tracked in doc 04) | F-019 Data integration | ~~Server-side `TestConnection`/data-sharing issues HTTP requests to any stored URL with no private-IP/scheme guard (SSRF).~~ **Fixed**: `OutboundUrlValidator` syntactic gate + connect-time pinned-IP guard on both outbound clients. | doc 04 SEC-H-01 (RESOLVED) |

## 4. What is genuinely accepted

For the **implemented admin + public feature set**, runtime acceptance is real and current at `fe3dbd2`: CRUD, workflow state machines (report Draft→Submitted→Verified→Returned/Completed, inspection plan approval, certificate revocation), permission denial, cross-organization isolation, file upload/download (ClamAV-scanned, MinIO-backed), Excel export, QuestPDF certificate download, and persistence after reload are all exercised by passing verification specs with no API mocking.

The gaps above are real but bounded; none of A-1..A-3 is a hard production blocker on its own. The production blockers live in the deployment, database-ops, and security layers (docs 04/05/06), not in the application feature behavior.
