# 66 — Incomplete Functions

Effort scale: XS < ½ day · S ≈ 1 day · M ≈ 2–4 days · L ≈ 1–2 weeks · XL > 2 weeks (single senior dev, includes tests per project policy).

## CRITICAL

### C1 — Public portal group E (STT 41–49) largely missing
- **Status**: 9 STT at 0–29%. Only 7 exact-number lookups exist.
- **Exists**: `PublicBusiness/SelfDeclaration/ProductRegistration/AdRegistration/EligibilityCertificate/CfsCertificate/ExportFoodCertificate` AppServices + 7 FE pages.
- **Missing**: browsable public lists with filters; public product search (FR-41-03/04); warned-business lookup (STT 45); public news/alert listing + search (FR-48-01/02); **citizen alert submission** (FR-48-03); public legal-document lookup (STT 49); certificate view/print/download for all lookup types; public risk-analysis content (FR-36-07).
- **FE**: new public pages under `features/*/pages/Public*`; a public layout/home. **BE**: public list endpoints with paging + published-only filters; anonymous alert-submission endpoint (rate-limited, captcha); public file serving for certificate attachments. **DB**: none (schema sufficient; citizen submissions can use `atp_alerts.source=citizen`). **Perms**: anonymous + moderation queue uses existing `Alerts.*`. **Tests**: real e2e per policy.
- Effort: **XL**. Blocks staging: **Yes** (mandatory requirement group). Blocks production: **Yes**.

### C2 — Data integration engine (STT 50–57, INT-01..05) is structure-only
- **Status**: 15–79% per STT; INT ≈ 10%.
- **Exists**: `ApiEndpoint` CRUD, empty `di_api_call_logs` + viewer, excel exports.
- **Missing**: outbound sender to Bộ Y tế/Sở NN/Sở CT; inbound partner API + partner credential issuance (username/password/API address per §2.4); session establishment; call-log writing; per-data-type share flows (7 types); partner-facing API specification; TT 31/2026 compliance; idempotency/correlation/retry/failure handling.
- **FE**: share actions + per-type history tabs. **BE**: integration client + inbound controllers + partner auth (API keys/client credentials via OpenIddict) + logging middleware. **DB**: partner/credential table; per-type share-history or type-tagged log rows.
- Effort: **XL**. Blocks staging: **Yes**. Blocks production: **Yes**.

### C3 — Zero runtime verification (all 57 STT)
- **Status**: registry 0/32 VERIFIED; last real run: 8 pass / 25 fail (stale image, missing seed, selector bugs, 1 real export bug, 1 missing permission); e2e not in CI; no BE API integration tests.
- **Missing**: green full-stack run at current commit; production-mode seed strategy for organizations; registry updates with verified commits; permission/cross-org/persistence-negative coverage per policy; CI e2e job.
- Effort: **L–XL** (fix harness + rerun + fill negative coverage). Blocks staging: **Yes**. Blocks production: **Yes**.

### C4 — System settings module (STT 4) ≈ 5%
- **Exists**: static FE stub (`SystemSettingsPage.tsx` — hard-coded strings, no API).
- **Missing**: settings AppService over ABP SettingManagement (password length, lockout, SMTP, homepage info), logo/login-screen upload, FE editing UI.
- **DB**: `AbpSettings` (exists). **Perms**: `SystemAdmin.Settings` (exists, unused).
- Effort: **M–L**. Blocks staging: **Yes** (explicit STT). Blocks production: **Yes**.

## HIGH

### H1 — Statistics/report excel exports (STT 40: FR-40-02/04/06/08) — 4 exports missing; dashboard save/download (FR-39-09)
Effort: **M**. Blocks staging: Yes (explicit sub-functions). Production: Yes.

### H2 — Dashboard gaps (STT 39): report-compliance widgets (FR-39-03/04), time+unit filters (FR-39-02)
BE: aggregate report-submission status per child org/period. Effort: **M**. Blocks staging: Yes. Production: Yes.

### H3 — ATTP work report auto-calculation (FR-34-10)
All ~20 statistic fields manual; PDF requires self-computed figures. BE aggregation from businesses/licenses/inspections/poisoning per period+org tree. Effort: **M**. Blocks: staging Yes.

### H4 — Inspection plan/result attachments (FR-27-08/09, FR-28-05)
Attachment pipeline exists (MinIO/ClamAV/document_owners) — extend to inspection plans/results + FE modals. Effort: **S–M**. Blocks staging: Yes.

### H5 — Certificate/report document generation (FR-LIC-01, FR-42..47-03/04, FR-36-08, FR-38-07)
QuestPDF absent; no NĐ 15/2018 form templates; public print/download impossible. Effort: **L**. Blocks staging: Yes (public print requirements). Production: Yes.

### H6 — Citizen-submission moderation loop (FR-29-06, FR-30-07) — depends on C1
Effort: **M** (after C1). Blocks staging: Yes.

### H7 — Report roll-up aggregation (FR-33-02 tổng hợp; also affects 34/35)
City/province consolidation of lower-level reports. Effort: **M**. Blocks staging: Yes (workflow requirement).

### H7b — Report error-notification (báo cáo sai sót) unreachable (FR-33-05, 34-05, 35-05)
Domain method `BaseReport.AddErrorNotification`, DTOs and 3 DB tables exist, but no AppService method, endpoint, or FE UI for any report type (adversarial-pass finding). Add Get/Add error-notification endpoints + resolve action + FE modal per report tab. Effort: **S–M**. Blocks staging: Yes (explicit PDF workflow requirement).

### H8 — Missing excel exports: users (FR-02-13), audit log (FR-03-03), organizations (FR-06-06), testing services (FR-17-05)
Effort: **S–M** total (export infra exists). Blocks staging: Yes (explicit sub-functions).

### H9 — Committed dev secrets + DBS-06 (encrypted DB credentials)
`appsettings.json` carries `FoodSafe@Dev2026!` + `change-this-in-production`; rotate, purge, move to env/secret store; implement credential encryption per §3.2. Effort: **S**. Blocks production: Yes.

### H10 — IPv6 + TLS provisioning (IPV-01..06)
nginx `listen [::]`, compose IPv6 subnet, TLS termination, AAAA/DNS at deploy. Effort: **S** (software side) + ops. Blocks production: Yes.

## MEDIUM

- M1 — Documents feature bypasses document-type catalog (STT 38, hard-coded 8-value list); testing-center free-text in Testing Results (STT 37). Effort: XS each.
- M2 — Data-integration FE toggle-status URL bug (`/api/api/app/...`) — endpoint enable/disable broken. Effort: XS.
- M3 — Audit-log detail view (FR-03-02). Effort: S.
- M4 — Profile self-service editing + avatar (FR-05-04/05). Effort: S–M.
- M5 — User delete FE action (FR-02-05, BE exists); permission-based user search (FR-02-02). Effort: XS–S.
- M6 — AtpNews.Recall drops RecalledById/At (audit-trail inconsistency vs alerts). Effort: XS.
- M7 — Action-month date range free-text without validation (DT-08 defect). Effort: XS.
- M8 — Advanced business filters (FR-19-02): classification/type/area. Effort: S.
- M9 — Statistics breakdowns by region/area/managing unit (FR-40-07). Effort: M.
- M10 — Report "view as document" formatted rendering (FR-34-08/35-08). Effort: S.
- M11 — Backup/restore scripts + rehearsal (docs 39–40 describe, nothing exists). Effort: S–M. Blocks production: Yes.
- M12 — E2E depth: specs asserting headings only (dashboard, statistics, system-settings); no permission-denial/cross-org/persistence-negative coverage; AtpWork/ActionMonth/Return workflows untested. Effort: M–L (overlaps C3).
- M13 — Username charset rule (SEC-01): usernames are emails (violates letters/digits/underscore). Decide policy or align. Effort: S.
- M14 — SEC-05 reset-link 8h lifetime configuration + verification. Effort: XS.
- M15 — Result finalize/lock step (FR-28-03). Effort: S.

## LOW

- L1 — Six `Class1.cs` scaffold stubs. XS.
- L2 — `DataScope.All` global-bypass breadth + unaudited cross-org reads (design review). S.
- L3 — Dashboard/Statistics visible to any authenticated user (aggregate leak, low risk). XS.
- L4 — Contradictory stale docs (41, 55, group-E mapping in 01). XS–S.
- L5 — Playwright config Chromium-only (TECH-05 cross-browser evidence). S.

## Modules by completeness class

- **Missing entirely**: public warned-business lookup (45), public news/citizen alert (48), public document lookup (49), settings management (4, save a stub), integration engine (behavioral part of 50–57), PDF generation, MoH/TT31 integration (INT-01..03).
- **Partial**: audit log (3), access management self-service (5), inspection attachments (27/28), alerts/news citizen loop (29/30), work-report auto-calc (34), risk-analysis publication (36), documents (38), dashboard (39), statistics reports (40), public lookups (41–44, 46–47), API specs (50).
- **Shallow**: share-history viewers (51–57), settings page, INT-04 spec management.
- **Backend-only**: user delete (FR-02-05).
- **Frontend-only**: none found.
- **Complete but unverified (largest block)**: identity/roles (1), catalogs (8–18), businesses/products (19–20), licensing (21–26), inspection core (27–28 core), poisoning (31–32), reporting workflows (33–35 core), testing results (37), audit-worthy CRUD of alerts/news/risk (29/30/36 core).
- **Contradictory documentation**: docs 41 & 55 claim milestones not-started/missing that exist; registry claims 0 VERIFIED while commit messages claim "100% e2e coverage"; group-E mapping in docs/01 ≠ PDF.
