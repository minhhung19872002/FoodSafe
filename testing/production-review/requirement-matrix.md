# Production Readiness Review — Requirement Coverage Matrix

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · **Requirement source:** YCKT (Mẫu số 03, 42 pp.) → 469 atomic requirements (extraction `docs/audit/60`, re-confirmed by `pdftotext` re-extraction in `docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md`).
**Method:** requirement ⟷ implementation ⟷ evidence, reconciled from four independent sources — the executed browser coverage matrix (docs/testing/73/75), the 34/34 VERIFIED feature registry (real-stack Playwright, zero interception), the independent go/no-go gate (`docs/production-audit/08`, BE 635/635 + E2E 286/286 at `6326af4`), and the 469-item re-audit at `aad87c1` — then **updated for the five commits since** (`5bc0d86` FR-50-05 in-app feature VERIFIED, `83ec103` UI/permission fixes, registry re-certifications). Statuses use the requested scale: **DONE** (implemented + tested + production-acceptable), **PARTIAL**, **MISSING**.

## 1. Coverage summary (469 atomic requirements)

| Category | Total | DONE | PARTIAL | MISSING | Externally blocked | N/A |
|---|---|---|---|---|---|---|
| Functional (STT 1–57 + licensing) | 372 | 349 fully + 21 mostly = **370** | 2 | 0 | 0 | 0 |
| Integration INT-01..05 | 5 | 2 | 1 | 0 | 2 (INT-01/02) | 0 |
| Performance NFR-01..06 | 6 | 6 (dev-hardware evidence; prod re-run owed) | 0 | 0 | 0 | 0 |
| IPv6 / TLS / DNSSEC (IPV) | 6 | 1 | 0 | 5 (deploy-time) | 0 | 0 |
| App security SEC-01..25 | 25 | 22 | 3 | 0 | 0 | 0 |
| DB security DBS-01..10 | 10 | 1 | 1 | 8 (prod-host work) | 0 | 0 |
| UI/UX + data tolerance + technology | 27 | 26 | 1 | 0 | 0 | 0 |
| ATTT Level-2 dossier (L2-01) | 1 | 0 | 0 | 1 | 0 | 0 |
| Support / training / ownership / handover / acceptance | 17 | 0 | 0 | 12 | 0 | 5 |
| **Total** | **469** | **≈428 (91%)** | **8** | **26** | **2** | **3** |

**Reading:** every *functional software* requirement is implemented and almost all carry executed real-stack test evidence. The MISSING mass is concentrated in **non-code deliverables** — production-host operations (IPV/DBS), the Level-2 dossier, manuals, training, support processes and acceptance paperwork — plus two externally blocked integrations. That is exactly what separates "the software works" from "a customer can accept and operate it".

## 2. Non-DONE requirements in detail

Severity = production impact if shipped as-is. G-refs = gap register (`docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md` §D), independently re-verified for this review where marked ✓.

### 2.1 Functional PARTIAL

| Requirement | Status | Evidence | Missing | Severity |
|---|---|---|---|---|
| FR-19-17 — Confirm business VSATTP commitment (bản cam kết) with record + attachment | PARTIAL | `Business.HasVsattpCommitment` boolean only (`Business.cs:29`); toggle works in UI | Date/confirming-user/status record, attachment slot ("giấy xác nhận bản cam kết" named in YCKT), confirm action audit trail (G-08) | **High** (acceptance-relevant record-keeping) |
| FR-40 — Report-status-by-organization statistics output | PARTIAL | Dashboard compliance table exists; 4 report tabs + 4 Excel exports (`StatisticsExcel*`) | Org filter on report statistics (`ReportStatisticsFilterDto` has Year only), report-status-by-org Excel export, printable output (G-10) | **High** (statutory reporting outputs) |
| FR-51..57 inbound — reviewer disposition of received partner submissions | PARTIAL | Submissions received, stored, listed, viewable (F-019f VERIFIED); `MarkProcessed()`/`Reject()` exist on `InboundSubmission.cs:78-85` | **Zero call sites** — no approve/reject API, permission, or UI action; status stays `Received` forever (G-04) ✓ | **High** (inbound data can never be dispositioned) |
| FR-29/30 — citizen submission moderation depth | PARTIAL (mostly done) | Submit→queue→publish/recall/delete verified (`citizen-moderation.spec.ts`) | Reject-with-comment persisted for the citizen trail, business-link selector in editor, full submit→approve→public E2E (G-09) | Medium |
| FR-42..47/49 — public view/print/download of attached originals | PARTIAL (mostly done) | Anonymous certificate **PDF** download for 5 types verified (F-034) | Ad-registration PDF; all `*AttachmentController` are `[Authorize]` so scanned originals aren't publicly downloadable (policy undecided); no print buttons (G-11) | Medium |
| FR-38-03/04 — document types from STT-18 catalog | PARTIAL (works) | Document CRUD verified (F-031) | Type list hard-coded (8 values) instead of catalog-driven (G-14 / M-5) | Low |
| FR-50/51 — partner learns submission outcome | PARTIAL | Synchronous receipt envelope verified | No status-polling endpoint / webhook (G-06) | Medium |
| SEC-14/15 — route↔permission consistency for the new ApiSpecs surface | PARTIAL | `routePermissions.ts` single-source map fixed 3 drifts (`83ec103`) | **`FoodSafe.DataIntegration.ApiSpecs.View` absent from `ROUTE_PERMISSIONS.dataIntegration`** — a user holding only ApiSpecs.View is menu-hidden and 403-blocked from a page they may use (G-02, re-verified ✓ at `routePermissions.ts:48-52` vs `FoodSafePermissions.cs:339`) | Medium |

### 2.2 Integration

| Requirement | Status | Evidence | Missing | Severity |
|---|---|---|---|---|
| INT-01 — real Bộ Y tế / Sở NN / Sở CT connectivity | BLOCKED (external) | Outbound engine + auth proven against a real HTTP receiver; SSRF-guarded | Ministry endpoints/credentials do not exist for the team; also no retry/circuit-breaker policy yet (G-07) | **High** — requires customer's written phased-delivery disposition |
| INT-02 — TT 31/2026 per-partner field mapping + signing | BLOCKED (external) | Inbound stored verbatim by design (`InboundSubmission.cs:9`) | Official partner schema; then mapping/ingestion into domain tables (G-05) | **High** — same disposition package |
| INT-04 — machine-readable API spec | DONE | `docs/integration/` (OpenAPI 3.0.3, Redocly-valid) + in-app spec management with anonymous download, contract test 1/1 + e2e 4/4 (F-019g @ `5bc0d86`) | — | — |
| INT-05 — call history incl. inbound | DONE | Outbound logs + retry attempts (F-019e); inbound submissions persisted with correlation (F-019f) | — | — |

### 2.3 Security / infrastructure requirements not closable in dev

| Requirement | Status | Evidence | Missing | Severity |
|---|---|---|---|---|
| SEC-08 — CAPTCHA effective in real conditions | PARTIAL | Enforcement middleware proven (400 without token; malformed body rejected); prod config validation forbids test keys | One staging probe with **real** Turnstile keys (I-2/G-17); also the cloud compose Staging fallback to the all-pass test key must be removed (security agent finding) | **High** (gate before UAT/prod) |
| SEC-12 — Secure cookie under TLS | PARTIAL | `__Host-` prefix + `SecurePolicy=Always` in prod code | Confirmation on a real TLS host (at-deploy) | Medium |
| IPV-01..05 — IPv6 end-to-end, AAAA, DNSSEC | MISSING (deploy) | nginx prod template listens `[::]:8080/8443` (verified in drill); Kestrel dual-stack | Production DNS/hosting doesn't exist; cloud Caddy path binds IPv4-only (ops agent) | High (ops) |
| IPV-06 — HTTPS/TLS ≥1.2 | PARTIAL | Prod nginx TLS1.2/1.3-only + HSTS runtime-verified in the drill | Real certificate + domain on the production host | High (at-deploy) |
| DBS-01..09 — DB hardening: patch schedule, backup schedule, restore drill on prod, least-privilege split, pg audit logging, IP restrictions, at-rest encryption | MISSING (prod host) | Backup/restore **scripts exist and are CI-rehearsed every build** (`scripts/backup-database.sh`, `rehearse-restore.sh`); least-privilege connection + encrypted partner credentials done | No scheduler on any production host, no MinIO backup at all, no prod hardening executed (G-34/35/36; ops agent risk #1) | **High** |
| DBS-06 — credential hygiene | PARTIAL | Tracked config carries no secrets; startup validators reject known dev defaults in Production | Dev DB password + `Admin@2026!` remain in git history — purge + rotate before prod (G-20) | Medium |
| L2-01 — ATTT Level-2 dossier + approval (NĐ 85/2016) | MISSING | Technical controls largely delivered | The dossier itself + competent-authority approval record (M-8/G-40) | **Critical for legal acceptance** |

### 2.4 Acceptance / handover deliverables

| Requirement | Status | Missing | Severity |
|---|---|---|---|
| ACC-01..06 — UAT scenario suite + acceptance records (NĐ 224/2026) | MISSING | Scenario suite mapped to STT 1–57 + NFRs; acceptance checklist (G-43) | High |
| User manual (HDSD) + Admin manual | MISSING | Both documents (G-41/42, part of M-8) | High |
| TRN-01 — training (1 day, 120 attendees) | MISSING | Materials + delivery plan (G-44) | Medium |
| SUP-01..04 — support process, 2 channels, 48h SLA | MISSING | Process + commitments (G-39) | Medium |
| OWN/HND — data ownership + handover procedure | MISSING | Procedure doc; export capability already exists (G-45) | Medium |
| M-6 — certificate PDF matches official NĐ 15/2018 template | PARTIAL | Customer must supply the official template; layout fidelity then confirmed/adjusted | Medium (UAT) |
| M-7 — username charset rule | PARTIAL | Customer ruling; small identity change only if literal | Low (UAT) |

## 3. DONE evidence anchor (why the 91% is credible)

- **34/34 registry features VERIFIED** against the real stack (registry re-certified 2026-07-28; latest rows at `adb30eb`/`5bc0d86`/`83ec103`).
- Independent gate re-ran everything at `6326af4`: **Playwright 286/286** (76 specs, real login, grep-proven zero interception) + **BE 635/635**; the 469-item re-audit added a fresh **662/662** BE run including the new ApiSpecification tests.
- Post-gate additions each carry their own executed evidence: INT-03 400-guard fix re-certified, FR-50-05 contract test 1/1 + e2e 4/4, UI/permission fix batch 323/323 UI-audit suite + feature-spec retests (`testing/ui-audit/fix-report.md`).
- Doc-73/75 map each STT group to executed browser evidence; doc-77 corrected earlier over-stated MISSING verdicts.

**Continuity note:** older documents (`docs/audit/63`, `docs/functional-audit/01`, doc 68) predate the closure batches and still show stale NOT_IMPLEMENTED rows for INT-03/FR-50-05/retry — they are superseded; do not quote them for current status (doc-08 issue D-1).
