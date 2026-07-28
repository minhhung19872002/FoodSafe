# FoodSafe — Production Readiness: Final Report

**Date:** 2026-07-28 · **HEAD reviewed:** `6b6ff6a` (branch `feat/integration-completion`) · **Review role:** Solution Architect + QA Lead + Security Reviewer + Release Manager
**Method:** independent assessment built on fresh code inspection (5 targeted evidence sweeps with file:line citations), live-stack verification, and the project's executed evidence base (34/34 feature registry, 286/286 zero-mock Playwright gate, 662/662 backend tests, k6 NFR run, 323-check UI audit) — with every load-bearing prior claim spot-re-verified, several **refuted**, and new findings added. Details: the eight sibling documents in this folder.

---

## Production readiness score

| Dimension | Score | One-line rationale |
|---|---|---|
| **Business** (functionality + requirement coverage) | **88/100** | Every one of 372 functional requirements implemented, 34/34 features real-stack VERIFIED; deductions for the inbound-disposition dead-end (W-1), statutory statistics outputs (G-10), commitment record (G-08), and two externally blocked integrations |
| **Security** | **84/100** | Application layer is production-grade *with executed adversarial evidence* (authN/RBAC/scope/CSRF/CAPTCHA/SSRF/upload/rate-limit); deductions for the staging CAPTCHA test-key fallback, verify-chain policy, PII-masking policy, git-history credentials, unproven real-TLS/real-CAPTCHA environment |
| **Quality** (code + testing) | **82/100** | Disciplined ABP + React codebase; strongest-in-class E2E acceptance layer; deductions for the case-code race, ~25 unlocalized error codes, missing concurrency round-trip, no real-HTTP BE suite, E2E not in CI |
| **Performance** | **88/100** | Measured: avg 31ms vs 10,000ms budget at 30 VUs, 0% failures, CPU in bounds; deduction only for prod-hardware re-run owed and growth-proofing items |
| **Operations** | **55/100** | Excellent CI and capability scripts — but **no scheduled backups, no monitoring/alerting, no log persistence, no deploy approval/rollback, no production environment provisioned**; unsafe cloud-overlay defaults |
| **Overall (weighted, ops-capped)** | **≈79/100** | The product is ready; the *operation* of the product is not |

---

# Verdict: **NOT READY FOR PRODUCTION**

**Ready for UAT immediately** — consistent with, and independently re-confirming, the standing gate (`docs/production-audit/08`). The judgment standard was "can a real customer safely use this system in production": today the software would serve users correctly and securely, but the customer could **lose data irrecoverably** (no scheduled backups, no MinIO backup), **fly blind** (no monitoring, ephemeral logs), **cannot legally accept it** (no ATTT Level-2 dossier, no manuals, acceptance paperwork absent), and two mandatory integrations await the customer's own disposition. None of the blockers is architectural; most are provisioning and paperwork measured in days.

**What did NOT block the verdict (verified strengths):** zero red tests anywhere; zero known exploitable app-layer security holes in the intended production configuration; requirement coverage at 100% touched / ~94% fully-done; performance with two orders of magnitude of headroom; a UI measured clean across 46 routes × 6 viewports.

---

## P0 — Must fix before production

| ID | Category | Severity | Location | Problem | Impact | Recommendation | Effort |
|---|---|---|---|---|---|---|---|
| P0-A | Operations | Critical | prod host (scripts exist: `scripts/backup-database.sh`, `rehearse-restore.sh`) | **No scheduled backups; MinIO blobs never backed up** | Any data-loss event is unrecoverable → unacceptable for government records | Schedule DB backup ≤24h + staleness alert; add MinIO mirror/versioning; run one restore drill on the prod host | 1–2 days |
| P0-B | Operations | Critical | — (nothing provisioned) | **No monitoring, alerting, or error tracking; logs die with the container** (`Program.cs:11-24`) | Outages and errors invisible; post-incident forensics impossible | Uptime check on `/health/ready`; persist logs (volume or shipper); add error tracking (e.g. Sentry-class) and basic CPU/disk alerts; add Redis to readiness if kept | 1–3 days |
| P0-C | Operations | High | `.github/workflows/deploy.yml:74-133` | Push-to-main **auto-deploys with no approval and no rollback step** | Change-management failure for a Level-2 system; slow recovery | GitHub environment protection (manual approval) + documented image-tag rollback job + runbook | 0.5–1 day |
| P0-D | Security/Ops | High | `deploy/docker-compose.cloud.yml:19-38,141,197-198` | Cloud overlay defaults: Staging env (validators silent), **CAPTCHA falls back to always-pass test key**, Postgres SSL off, HTTPS metadata off, empty DataProtection cert, IPv4-only Caddy | A mis-set staging/pilot ships with no effective CAPTCHA and weak transport | Remove test-key fallback; make unsafe values fail-fast regardless of environment name; fix Caddy IPv6; then run the **real-Turnstile staging probe (I-2)** | 0.5 day + probe |
| P0-E | Data integrity | High | `FoodPoisoningCaseAppService.cs:197-205` | Case code = COUNT+1, **no DB unique constraint** → concurrent creates silently duplicate official case identifiers | Corrupt surveillance records | Partial unique index `(organization_id, case_code) WHERE is_deleted=false` + conflict retry | 0.5 day |
| P0-F | UX/Acceptance | High | `en.json`/`vi.json` vs `FoodSafeDomainErrorCodes` | **~25 error codes unlocalized** (Organization, Business, SelfDeclaration, ProductRegistration, AdRegistration, Eligibility, DataScope, DataIntegration…) — users see `FoodSafe:Organization:0001` | Routine duplicate-code errors display machine codes; fails "thông báo lỗi rõ ràng" | Add the missing entries (+3 inline codes → constants); spot-check in browser | 0.5–1 day |
| P0-G | Security | High | git history (pre-`06656c8`); repo root | Dev DB password + seed password in git history; stray `cookies.txt` with a live dev session on disk | Credential material persists forever once public | `git filter-repo` purge + rotate all dev-era secrets before any external hosting; delete `cookies.txt` | 0.5 day |
| P0-H | Compliance | Critical | absent from tree | **ATTT Level-2 dossier (NĐ 85/2016), user manual, admin manual, UAT/acceptance records** do not exist | Customer legally cannot accept or operate the system | Produce dossier + both manuals + UAT scenario suite (G-40..43); start now — they gate acceptance, not code | 1–2 weeks (writing) |
| P0-I | Business scope | High | external | **INT-01/INT-02** — ministry connectivity + TT 31/2026 mapping await the customer's written disposition (deliver vs phased deferral) | Mandatory liên thông scope open | Obtain the single written disposition package (also covering M-6 PDF template + M-7 username ruling) | customer meeting |
| P0-J | Workflow | High (conditional) | `InboundSubmission.cs:78-85` (zero callers), `InboundSubmissionsTab.tsx` | **Inbound partner submissions can never be processed/rejected** — dead-end state | The moment a real partner submits, officers cannot act | Build disposition API + permissions + UI + audit trail (G-04). **P0 if partner integration is live at launch; P1 under a phased-deferral disposition** | 2–3 days |

## P1 — Should fix before production

| ID | Category | Severity | Location | Problem → Recommendation | Effort |
|---|---|---|---|---|---|
| P1-A | Authorization | Medium | `BaseReport.cs:42-50`, `NdtpReportAppService.cs:111-118` | Verify/approve not pinned to `SubmittedToOrganizationId` (province can verify commune's district-addressed report) → get business ruling; if chain is strict, assert it in AppService | 0.5 day |
| P1-B | Authorization/FE | Medium | `routePermissions.ts:48-52` | `ApiSpecs.View` missing from route map — spec-only users locked out of `/data-integration` → add + tab-gate | 1 hour |
| P1-C | Data integrity | Medium | edit DTOs across Business/Licensing/Reporting/Inspection/FoodPoisoning | ConcurrencyStamp not round-tripped → silent last-write-wins; implement `IHasConcurrencyStamp` round-trip + conflict toast + one e2e (pairs with T-D) | 2–3 days |
| P1-D | API guard | Medium | list endpoints | No server-side `MaxResultCount` ceiling → clamp globally (ABP option) | 2 hours |
| P1-E | FE polish | Medium | `AppLayout.tsx:453-474` | Dead global-search + fake notification bell on every page → wire or remove before UAT | 0.5–2 days |
| P1-F | Requirement | High | `Business.cs:29` | VSATTP commitment is a bare boolean; YCKT wants record + attachment (G-08) → commitment entity + confirm action | 1–2 days |
| P1-G | Requirement | High | `ReportStatisticsFilterDto`, `StatisticsExcel*` | Statistics org filter + report-status-by-org export + print output (G-10) | 2–3 days |
| P1-H | Testing/CI | High | `.github/workflows/ci.yml` | Playwright acceptance suite not in CI (T-B) → compose-based job, workers=1 | 1–2 days |
| P1-I | Workflow | Medium | citizen moderation | Reject-with-reason persisted + moderation audit + full-chain e2e (G-09) | 1–2 days |
| P1-J | Security | Medium | `DataSharingAppService` persistence | Scrub credential patterns from stored `request_url`/payloads (R-05) | 0.5 day |
| P1-K | Security (policy) | Medium | DTO layer | PII-masking policy for ID-card/victim/reporter fields below DistrictAdmin (SEC-F3) — decide with customer, then implement | ruling + 1–2 days |
| P1-L | Operations | Medium | compose files; docs | Container resource limits; incident/rollback/migration runbooks (O-6/O-7) | 1 day |
| P1-M | Acceptance | Medium | — | Training materials + delivery plan (G-44); data-handover procedure (G-45) | 2–3 days |

## P2 — Can fix after release

| ID | Item | Effort |
|---|---|---|
| P2-A | Real-HTTP backend regression suite (WebApplicationFactory + Testcontainers) porting the doc-74 probes (T-A) | 3–5 days |
| P2-B | Batch Excel-import inserts; page expiry-job queries; batch/cached dashboard counts (B-4/B-7/B-5) | 1–2 days |
| P2-C | Attachment/blob orphan-cleanup job (B-8) | 1 day |
| P2-D | Redis: wire ABP distributed cache or drop the dependency (G-23/O-9) | 0.5–1 day |
| P2-E | Partner status-polling endpoint + outbound resilience (Polly) (G-06/G-07) | 1–2 days |
| P2-F | ATP-work + Action-month lifecycle e2e walks; concurrency spec; EF mapping tests for 5 modules (T-C/T-D/T-E) | 2–3 days |
| P2-G | Public attachments/print policy + ad-registration PDF (G-11); document-type catalog wiring (G-14); `EXTERNAL_SYSTEMS` catalog (G-16) | 2–3 days |
| P2-H | UI-audit Low items: card heights, mobile rail, 403 reload, maxLength counter, Turnstile retry affordance (UIA-008..012) | 1–2 days |
| P2-I | `Range(0,…)` on report-stats DTO; partner-code race → coded 409; key-version metadata on encrypted credentials (R-08); attributable job writes (R-09) | 1 day |
| P2-J | Statistics-openness sign-off (G-22); `"Angular"` client-key rename (G-24); Firefox manual smoke record | 0.5 day |

---

## Sequence to READY FOR PRODUCTION

1. **This week (engineering):** P0-E, P0-F, P0-G, P0-D config half, P1-B, P1-D — small, sharp risk-retirers.
2. **In parallel (documents/customer):** P0-H dossier+manuals+UAT suite; P0-I disposition package (decides P0-J's priority).
3. **Provisioning week:** production environment + P0-A backups, P0-B monitoring/logs, P0-C deploy gate; then at-deploy items — real-TLS Secure-cookie check, staging CAPTCHA probe (I-2), prod-hardware k6 (I-3), DB-host hardening (G-34).
4. **Run UAT now** on the current build — nothing above blocks UAT, and UAT time is when P1-A/P1-K rulings and M-6/M-7 land naturally.
5. Re-gate: with P0 closed and UAT signed, this verdict converts to **READY FOR PRODUCTION**.

*Review documents: [system-overview](system-overview.md) · [requirement-matrix](requirement-matrix.md) · [business-flow-audit](business-flow-audit.md) · [security-audit](security-audit.md) · [backend-quality](backend-quality.md) · [frontend-quality](frontend-quality.md) · [testing-quality](testing-quality.md) · [performance-review](performance-review.md) · [operations-readiness](operations-readiness.md)*
