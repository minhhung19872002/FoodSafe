# 67 — Full Project Completion Audit (FoodSafe)

Audit date: 2026-07-27 · Audited state: branch `codex/production-readiness`, commit `9d2cb1e` + 53 uncommitted files · Source of truth: `docs/Mẫu số 03. YCKT (1).pdf` (read in full, 42 pages) · Method: docs 61 (requirement inventory, 469 items), 62 (system inventory), 63 (traceability matrix), 64 (calculation), 65 (STT summary), 66 (incomplete functions). All prior progress documents were treated as claims and re-verified against source; several were found stale or contradictory.

## Executive summary

| Metric | Value |
|---|---|
| **Overall weighted software completion** | **64.53%** |
| Functional implementation (STT 1–57) | 66.37% |
| Runtime-verified | **0.00%** |
| Total extracted requirements | 469 (452 software + 17 non-software) |
| Complete & runtime verified | 0 |
| Complete but NOT runtime verified | 284 |
| Partially implemented | 85 |
| Backend only | 1 |
| Frontend only | 0 |
| Database only | 3 |
| Placeholder/shallow | 26 |
| Mock/hard-coded | 0 |
| Not implemented | 53 |
| Blocked | 0 |
| Ambiguous (excluded) | 0 (assumptions documented in doc 61) |
| Non-software deliverables | 17 (≈2% evidenced) |

The codebase is a genuinely substantial, largely non-fake implementation: 65 backend app services with real logic, guarded workflow state machines, 107 enforced permissions, real organization/administrative-area data scoping, real MinIO+ClamAV file pipeline, real ClosedXML import/export, real Turnstile CAPTCHA, and a 16-migration PostgreSQL schema with evidence-column CHECK constraints. **However**: three whole requirement areas are missing or hollow (public portal ≈21%, data integration ≈24–26%, system settings ≈5%), several explicit sub-functions are absent (statistics exports, report auto-calculation, plan attachments, report error-notifications, PDF/certificate output), and **not one feature has passed the project's own real-runtime acceptance bar** (registry: 0/32 VERIFIED; last full-stack e2e run: 25 of 33 tests failed).

## Implementation summary

| Area | % | Basis |
|---|---|---|
| Frontend | 73.56% | doc 64 §3 |
| Backend | 74.06% | doc 64 §3 |
| Database | 90.00% | full-module schema, constraints; minor deviations |
| Security & data scope | 59.03% | SEC 74.2%, DBS 23.0%, L2 40% |
| Data scope enforcement (app layer) | strong — 27 services scoped, verified | |
| Workflow | 62.62% | machines real; error-notification + citizen loops missing |
| Dashboard | 51% (STT 39) | report-compliance widgets, filters, downloads missing |
| Public portal | 21.4% | 7 number-lookups only |
| Integration | 24.2% | (F 8.95 + INT 0.50)/39 — no engine |
| Infrastructure | 55% | compose+CI strong; backup/deploy/IPv6/TLS/monitoring absent |
| Testing/acceptance | 15% | real e2e suite exists but red; 0 VERIFIED; no BE API tests |
| Documentation | 60% | rich but partly stale; no user/admin manual |

## STT 1–57

Full table: doc 65. Distribution: ≥85% ("code-complete, unverified"): STT 1, 8–16, 18, 20–26, 31, 32, 37 (21 STT) · 68–83%: STT 2, 3(48%), 5, 6, 7, 17, 19, 27–30, 33–36, 38 · ≤51%: STT 4 (5%), 39 (51%), 40 (38%), 41–49 (0–29%), 51–57 (15%).

## Fully completed functions (code-complete; NONE runtime verified)

Roles & permission management (STT 1); master + geographic catalogs (STT 8–16, 18); products with import/export/attachments (STT 20); all six licensing modules with CRUD, revoke, attachments, excel export and internal lookups (STT 21–26); poisoning cases & incidents with declare/verify/conclude, error reports, map, export (STT 31–32); testing results (STT 37). Evidence: service/page/table triples in docs 62–63; every claim re-opened during the adversarial pass.

## Partially completed (exact gaps in docs 63/66)

Users (no excel export, delete BE-only) · audit log (no export/detail) · access management (no profile edit/avatar) · organizations (no export) · businesses (advanced filters) · inspection (no attachments, no finalize) · alerts/news (no citizen loop; publish reaches no public page) · reports ×3 (no auto-calc, no roll-up, error-notify unreachable) · risk analysis (publication reaches no portal) · documents (hard-coded type list, no print/attachment) · dashboard & statistics (missing widgets/filters/exports) · public lookups (single-record only, no certificate view/print) · API specs (no partner-facing spec; FE toggle URL bug).

## Missing functions

Settings management (STT 4 — 6 sub-functions); statistics excel exports ×4 (STT 40); dashboard report-tracking + chart download (STT 39); public product search (41); warned-business lookup (45); public news/alert list + search + **citizen alert submission** (48); public document lookup (49); certificate view/print/download for 42–44/46–47; share/send flows for all 7 integration data types (51–57); MoH/Sở NN/Sở CT connectivity, partner accounts, TT 31/2026 (INT-01..03); PDF generation; plan/result attachments (27/28); IPv6 (IPV-02..05); DB firewall/DAM (DBS-10).

## Shallow or misleading implementations

1. **SystemSettingsPage** — static hard-coded strings posing as live configuration; its e2e and unit tests assert those same literals (cannot fail).
2. **Share-history viewers (STT 51–57)** — UI + tables that no code path ever populates.
3. **Report error notifications** — DB tables + domain methods with no endpoint/UI (looks done from schema).
4. **Documents type list & external-system list** — hard-coded arrays bypassing existing catalogs.
5. **Data-integration toggle-status** — broken URL (`/api/api/app/...`).
6. **Heading-only e2e specs** (dashboard, statistics, system-settings, parts of others) — pass with an empty or broken backend.
7. Contradictory docs: 41/55 say later milestones "not started" while code exists; commit `eb3151a` claims "100% e2e coverage" while the registry shows 25 failures; docs/01 group E deviates from the PDF.

## Runtime verification gaps

Everything. Registry (docs/testing/01): 0/32 VERIFIED, 25 FAILED at commit `9d2cb1e` (stale frontend image ×14, missing org seed ×8 — prod-mode stack has **no organization/geography seed at all**, selector bug, real export-download bug, dashboard heading mismatch, admin missing identity permission), 1 BLOCKED. Playwright suite (25 specs) is correctly interception-free but not green anywhere and absent from CI. Backend has zero AppService→PostgreSQL integration tests (Application.Tests are `[Authorize]`-attribute reflection checks; one Testcontainers class covers geography FKs only). No load test for NFR-01..06.

## Critical blockers

**Staging**: (1) 0 runtime-verified features + red e2e suite; (2) public portal group E missing; (3) integration engine missing; (4) settings module missing; (5) explicit sub-functions missing (statistics exports, auto-calc, plan attachments, error notifications, certificate output); (6) no production seed path for organizations/geography.
**Production (additional)**: committed dev secrets (rotate + purge history); plaintext DB credentials (DBS-06); no backup/restore implementation; no IPv6/TLS provisioning; no monitoring; level-2 dossier absent; no user/admin manuals; training/handover obligations unstarted.

## Recommended implementation order

1. **Foundations**: production seed strategy (orgs/geography/roles); fix stale-image + e2e harness; green the existing 25 specs; add e2e to CI.
2. **Security/data-scope defects**: rotate & purge committed secrets; DBS-06 credential handling; SEC-01 username policy decision; captcha action/hostname in staging.
3. **Incomplete mandatory modules**: settings (STT 4); statistics exports + dashboard widgets (39–40); report error-notification endpoints/UI + auto-calc + roll-up (33–35); inspection attachments (27–28); user/audit/org exports; PDF/certificate generation.
4. **Workflows**: citizen submission + moderation (29/30/48); result finalize (28).
5. **Public portal**: list-based lookups, certificate viewing/printing, warned-business list, public news/documents/risk pages (41–49).
6. **Integration**: partner auth + inbound/outbound engine + call logging + per-type share flows + partner spec docs (50–57, INT-01..05).
7. **Runtime verification**: full registry pass to VERIFIED per policy, including permission/cross-org/persistence negatives; backend API integration tests; load test.
8. **Infrastructure/ops**: backup/restore scripts + rehearsal, TLS, IPv6, monitoring, deploy pipeline.
9. **Documentation & handover**: user manual, admin manual, level-2 dossier, training, acceptance dossier.

## Final readiness classification

**NOT READY** — for staging or production. The internal administrative core is code-complete at good quality, but zero runtime verification, three missing/hollow requirement groups, and unmet security/ops obligations mean the system cannot yet demonstrate contract compliance (§5 acceptance requires functional, integration, stability and security verification plus user/admin documentation).
