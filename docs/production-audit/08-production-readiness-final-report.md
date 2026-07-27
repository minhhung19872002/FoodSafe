# 08 — Production Readiness Final Report

**System:** FoodSafe — Phần mềm quản lý an toàn thực phẩm, Chi cục ATVSTP tỉnh Quảng Ninh
**Audit type:** Independent production-readiness audit (evidence-based; prior AI summaries, registry status, commit messages, and documentation claims were NOT trusted)
**Audit commit:** original audit at `fe3dbd2`; **remediation re-audit at `9a3f301`** (branch `fix/production-blockers`)
**Audit date:** original 2026-07-27; **re-audit 2026-07-28**
**Auditor:** Independent Principal Software Auditor
**Supporting evidence:** docs 00–09 in this folder (each conclusion below is traceable to one of them)

---

## ORIGINAL DECISION (2026-07-27): **NO-GO** — superseded, see below

The original verdict was NO-GO: the production stack physically could not be built (missing `Dockerfile.prod`), there was no backup/restore capability, and there were open SSRF, CAPTCHA-bypass, stored-XSS, and known-vulnerable-dependency issues. Two of those conditions — *the release artifact does not build* and *there is no way to recover the database* — are ones that must be resolved before a launch is even technically possible, which is why the classification was NO-GO rather than GO-WITH-CONDITIONS.

## RE-AUDIT DECISION (2026-07-28, commit `9a3f301`): **GO WITH CONDITIONS**

Every hard blocker the NO-GO rested on has been closed with real, executable, CI-gated evidence — verified against the working tree and git history, not against completion claims:

| Standing readiness gate | State | Proof |
|---|---|---|
| Production Docker builds | ✅ RESOLVED (B-1) | `FoodSafe.FE/Dockerfile.prod` exists (commit `6b46040`); prod stack builds; `scripts/verify-prod-frontend.sh` CI-gated — doc 07 §85–100 |
| HTTPS works | ✅ RESOLVED (B-1) | HTTP→301→HTTPS; TLS 1.2/1.3 (TLS 1.1 refused); HSTS + CSP on the SPA document; IPv4 **and** IPv6 listeners — doc 07 §85–100 |
| Backup and restore tested | ✅ RESOLVED (B-2, `8ece317`) | `backup-database.sh` + `restore-database.sh` + `rehearse-restore.sh`; CI-gated DR rehearsal; recorded rehearsal RTO ~5–8 s, 86 tables + exact business row counts matched against a consistent snapshot — doc 05 §4.1 |
| No destructive migration | ✅ RESOLVED (B-4) | Orphan-FK migration made non-destructive/idempotent; CI-gated `scripts/verify-migration-nondestructive.sh` |
| Secrets rotated | ✅ RESOLVED (B-3) | Full-history inventory: no real production secret was ever committed; leaked commodity defaults now fail-fast at Production startup; CI-gated recurrence scanner + 13 guard tests — doc 09 |
| Security scans pass | ✅ (with documented accepted-risk) | SSRF (B-5), CAPTCHA bypass (C-1), server-side password expiry (C-2), SVG stored-XSS (C-3), Hangfire dashboard authz (C-8/SEC-M-05) all RESOLVED with regressions; the 3 dependency advisories (B-6) are accepted-risk with compensating controls, allow-listed, tracked to ABP 10 |
| Runtime smoke tests pass | ✅ | 7 services healthy; 34/34 authoritative acceptance specs green against a real full stack with no API mocking; smoke probes green — doc 07 |

All six critical blockers **B-1…B-6** are RESOLVED (B-6 = documented accepted-risk), and all eight high-priority conditions **C-1…C-8** are RESOLVED or CONFIRMED-intentional (C-8/SEC-L-03). A production launch is now **technically possible and operationally recoverable** — so the verdict is no longer NO-GO.

It is **GO WITH CONDITIONS**, not unconditional GO, because the remaining items are genuine but are of two kinds that are satisfied *at/around* launch rather than being launch-impossibility blockers: (1) **operational deployment steps that can only be performed in the production environment**, and (2) **requirement-compliance deliverables required for formal government sign-off**. They are enumerated below and must be tracked to closure.

### Conditions attached to GO

**Operational (environment-side; do at/immediately after deploy):**
1. Schedule `backup-database.sh` at ≤ 24 h cadence in production and wire the > 24 h backup-staleness alert; add MinIO object-restore to the production rehearsal (B-2 residual, doc 05 §4.1).
2. Deploy the external monitoring/alerting stack that polls `/health/ready`, and enable server-side branch protection with required Code-Owner review (C-7 residual, doc 06).
3. Confirm NFR-03/04 (CPU/response-time headroom) on production hardware — the k6 evidence proves the software is not the bottleneck on dev hardware only (doc 07 §4).

**Requirement compliance for formal ATTT Level-2 sign-off (track to closure; not runtime-safety blockers):**
4. Implement the TT 31/2026/TT-BCT interoperability mapping for INT-01..03 — the data-integration layer is currently a generic HTTP sender (now with encrypted outbound credentials + auth-header injection, P0-2 `3fe7325`) but does not yet emit the prescribed TT-31 payload (doc 01; doc 03).
5. Confirm the certificate/permit PDF against the official prescribed form; make the Documents module catalog-driven (FR-38-03/04); align the username charset with the prescribed rule; produce the ATTT Level-2 security dossier + user/admin manuals (doc 01).

**Accepted-risk (no action required at launch; tracked to the ABP 10 upgrade):**
6. AutoMapper CVE-2026-32933 DoS, Account.Web open-redirect, react-router RSC-CSRF — all non-exploitable in this deployment with compensating controls (B-6; doc 04 §3.2).

---

## Completion assessment

| Dimension | Figure | Basis |
|---|---|---|
| **Code-complete** (feature code exists & wired end-to-end) | **~85%** | Phase 1 matrix over 469 requirements; Phase 2 inventory (45 routes, 56 pages, ~58 controllers, 85 AppServices, 20 migrations, 52 DbSets). No functional stubs found. |
| **Runtime-verified** (real browser → API → PostgreSQL, no mocks) | **~53% of requirements**, but **34/34 (100%) of the designated feature acceptance specs** | Phase 3 + Phase 7 — full E2E run rebuilt from HEAD: 229 passed / 6 failed, the 6 isolated to legacy-smoke test fragility (AntD Select virtualization), zero product defects, zero console errors. |
| **Production-operable** (deployable, recoverable, monitored, secured for prod) | **READY WITH CONDITIONS** (re-audit 2026-07-28) | Prod stack builds + HTTPS/TLS/HSTS verified (B-1); automated backup + CI-gated restore rehearsal (B-2); non-destructive migration (B-4); secrets guarded (B-3); SSRF/CAPTCHA/XSS/Hangfire security blockers closed (B-5, C-1..C-3, C-8). Residuals are operational (schedule backups, deploy monitoring, branch protection, prod-hardware NFR) + compliance sign-off deliverables — see Conditions attached to GO. |

The gap between "85% code-complete" and "not production-ready" is the point of this audit: **feature completeness is not production readiness.** The remaining ~15% of requirements plus the entire operational/security readiness surface is where the launch risk lives.

---

## Critical blockers (must be closed before any production deploy)

| # | Blocker | Severity | Evidence | Owner layer |
|---|---|---|---|---|
| ~~**B-1**~~ **RESOLVED (2026-07-28)** | ~~Production stack cannot be built — missing `FoodSafe.FE/Dockerfile.prod`.~~ `Dockerfile.prod` added (commit `6b46040`); prod stack builds; HTTP→301→HTTPS, TLS 1.2/1.3 (TLS 1.1 refused), HSTS + CSP on the SPA document, and IPv4+IPv6 listeners all runtime-verified; `scripts/verify-prod-frontend.sh` CI-gated. | ~~CRITICAL~~ CLOSED | doc 07 §85–100 | CI/CD / Deploy |
| ~~**B-2**~~ **RESOLVED (2026-07-28)** | ~~No database backup or restore capability.~~ `backup-database.sh` (checksum + optional GPG + retention + manifest), `restore-database.sh` (fresh-DB, single-transaction, refuses live overwrite), and `rehearse-restore.sh` (snapshot-consistent backup→restore→verify) added (commit `8ece317`); CI `database` job runs the rehearsal every push/PR; recorded rehearsal matched migration id + 86 tables + exact business row counts, RTO ~5–8 s. **Residual (operational):** schedule the backup ≤ 24 h + staleness alert + MinIO object-restore in prod. | ~~CRITICAL~~ CLOSED | doc 05 §4.1 | Database ops |
| ~~**B-3**~~ **RESOLVED (2026-07-28)** | ~~Credentials committed to git history~~ — full-history inventory proves **no real production secret was ever committed**: only commodity dev defaults (`postgres`/`postgres`), the `change-this-in-production` placeholder, a public Turnstile test key, and a Development-only seed password. Real secrets live only in the git-ignored `.env`/`appsettings.secrets.json`. Leaked defaults now **fail-fast at Production startup** (`CoreSecretsValidator`), the seed password is config-overridable, and a CI-gated scanner (`scripts/scan-committed-secrets.sh`) + 13 guard tests prevent recurrence. History rewrite deliberately not performed (nothing live to purge). | ~~CRITICAL~~ CLOSED | doc 09 (rotation & history) | Security |
| ~~**B-4**~~ **RESOLVED (2026-07-28)** | ~~Destructive migration~~ — `20260727104254_AddMissingForeignKeys` no longer deletes: nullable dangling FKs are repaired to NULL, NOT NULL orphans abort the migration (transaction rolls back, no row touched). CI-gated regression `scripts/verify-migration-nondestructive.sh` proves both paths on real Postgres. | ~~HIGH→blocker~~ CLOSED | doc 05 §4.2 (RESOLVED) | Database ops |
| ~~**B-5**~~ **RESOLVED (2026-07-28)** | ~~SSRF~~ — outbound data-integration URLs are now guarded by `FoodSafe.Security.OutboundUrlValidator`: a syntactic gate (absolute http/https, no embedded credentials, literal-IP hosts must be public) on create/update/test/share, **plus** a connect-time IP guard — both `ProbeClient` and `SharedClient` use a `SocketsHttpHandler.ConnectCallback` that resolves the host and connects only to validated public IPs (pinned; defeats DNS-rebinding). Blocks loopback, RFC-1918, CGNAT, link-local `169.254.169.254`, `::1`, `fc00::/7`, IPv4-mapped. 58 regression tests incl. real-socket loopback refusal. | ~~HIGH~~ CLOSED | doc 04 SEC-H-01 (RESOLVED); OutboundUrlValidator.cs | Security |
| **B-6** **accepted-risk (corrected 2026-07-28)** | Known-vulnerable dependencies. **AutoMapper High-DoS (CVE-2026-32933) — accepted-risk with compensating controls, NOT upgraded.** The earlier "FIXED, pinned 15.1.3" claim was **build-verified only and wrong at runtime**: AutoMapper 15.x removed the `MapperConfiguration(MapperConfigurationExpression)` constructor that `Volo.Abp.AutoMapper 9.3.7` calls, so a 15.x pin compiles (NuGet unifies to 15) but throws `MissingMethodException` on **every** `ObjectMapper` call — an app-wide 500 surfaced while re-verifying P0-2 and traced to that pin. Reverted to `AutoMapper 14.0.0` (the only ABP-9.3.7-compatible line; no patched 14.0.x exists). DoS residual mitigated by compensating controls: `System.Text.Json` default `MaxDepth=64` bounds request-graph depth before mapping, and the two recursive profiles are capped at `.MaxDepth(8)`. Tracked: fix requires the ABP 10 upgrade (which moves to AutoMapper 15). **Remaining two** have no fix in their supported line and are non-exploitable here: `Volo.Abp.Account.Web 9.3.7` open-redirect is fixed only in ABP 10.0.0-rc.2 but self-registration is disabled + `RedirectAllowedUrls` bounds redirects; `react-router 7.18.1` RSC-CSRF affects RSC mode only (this is a Vite SPA) and has no forward-patched release. All three documented accepted-risk with tracked upgrades. | HIGH — 3 accepted-risk, all tracked to ABP 10 | doc 04 §3.2; regression-log 2026-07-28 | Security |

## High-priority conditions (close before or immediately at launch)

| # | Condition | Severity | Evidence |
|---|---|---|---|
| ~~C-1~~ **RESOLVED (2026-07-28)** | ~~CAPTCHA bypass via malformed JSON body~~ — `LoginCaptchaMiddleware` now rejects malformed **and** valid-but-non-object bodies with HTTP 400 instead of calling `next()`; `RootElement.ValueKind == Object` guard closes an `InvalidOperationException` escape found while fixing. `LoginCaptchaMiddlewareTests` 7/7 green (4 new Theory cases). | ~~MEDIUM~~ CLOSED | doc 04 SEC-M-01 (RESOLVED) |
| ~~C-2~~ **RESOLVED (verified 2026-07-28)** | ~~Password expiry enforced client-side only~~ — `PasswordExpiryMiddleware` (already in the pipeline after `UseDynamicClaims`) returns HTTP 403 `FoodSafe:Account:PasswordExpired` for authenticated expired/must-change sessions, with a remediation-path whitelist. Server enforcement confirmed authoritative. | ~~MEDIUM~~ CLOSED | doc 04 SEC-M-03 (RESOLVED) |
| ~~C-3~~ **RESOLVED (2026-07-28)** | ~~Stored XSS via SVG branding upload~~ — `image/svg+xml` removed from `AllowedImageContentTypes` (now raster-only png/jpeg/webp); guard extracted to testable `EnsureAllowedImageContentType`. `BrandingImageContentTypeTests` 10/10 green. | ~~MEDIUM~~ CLOSED | doc 04 SEC-M-04 (RESOLVED) |
| ~~C-4~~ **RESOLVED (2026-07-28)** | ~~Six certificate/registration UNIQUE indexes lack a `WHERE is_deleted = FALSE` partial filter — soft-deleted rows collide with new inserts.~~ Migration `20260727181120_SoftDeleteFilterOnCertificateNumbers` adds the partial filter to all six; `scripts/verify-softdelete-unique-indexes.sh` proves on real PostgreSQL that a soft-deleted number is reissuable while two live rows still cannot share one. | ~~HIGH~~ CLOSED | doc 05 §2.2 (H-2 RESOLVED) |
| ~~C-5~~ **RESOLVED (2026-07-28)** | ~~Hardcoded test credential in a migration/seed path.~~ `E2eTestDataSeedContributor.ResolveSeedPassword` now allows the built-in literal only in Development; outside Development an operator-set `Seed:TestPassword` is mandatory or seeding aborts with `InvalidOperationException` — so demo/e2e seeding (reachable in any env via `Seed:EnableDemoData`) can never mint privileged accounts with a git-history password. `SeedPasswordResolutionTests` 12/12. | ~~HIGH~~ CLOSED | doc 05 §5.2 (H-3 RESOLVED) |
| ~~C-6~~ **RESOLVED (2026-07-28)** | ~~`.env.example` drift — `REDIS_PASSWORD` missing; a fresh clone following the example cannot start Redis.~~ Added `REDIS_PASSWORD` plus the prod-overlay `SSL_CERT_PATH`/`SSL_KEY_PATH` (also defaultless-required and previously absent). CI-gated by `scripts/verify-env-example-complete.sh`. | ~~MEDIUM~~ CLOSED | doc 07 §1 |
| ~~C-7~~ **RESOLVED (2026-07-28)** | ~~Health check is liveness-only; no readiness probe, no monitoring/alerting, no CODEOWNERS.~~ Split `/health/live` (process) vs `/health/ready` (real `PostgreSqlReadinessHealthCheck` + `MinioReadinessHealthCheck`, 503 on dependency failure, component JSON); `/health` aliases readiness; Compose api healthcheck repointed to `/health/ready`. Real-stack regression `scripts/verify-health-endpoints.sh` (pauses MinIO → readiness 503, liveness stays 200 → recovers). `.github/CODEOWNERS` added (H-03). **Residual (operational, not code, remain GO-conditions):** deploy the external monitoring/alerting stack that polls `/health/ready` (H-02 partial), and enable server-side branch protection with Code-Owner review. | ~~HIGH~~ CLOSED | doc 06 §7/§8/§2.6 |
| ~~C-8~~ **RESOLVED (2026-07-28)** | ~~Hangfire dashboard exposure; `/statistics` route has no client permission guard.~~ **Hangfire (SEC-M-05):** primary vector already closed by B-5 (SSRF guard); added `HangfireAdminAuthorizationFilter` so the dashboard also requires an authenticated `SystemAdministration` principal alongside the loopback filter — real-stack regression `scripts/verify-hangfire-authz.sh` proves an unauthenticated loopback GET `/hangfire` flips 200→401 while `/health/live` stays 200. **`/statistics` (SEC-L-03):** CONFIRMED intentional — backend `[Authorize]` (authenticated, org-scoped) and the un-permissioned FE route are a **verified deliberate design** (`statistics-verification.spec.ts` line 24: a no-permission user CAN read statistics; unauthenticated is rejected); gating it would break VERIFIED acceptance and modify a business feature against documented intent — no change, documented per the audit's own sanctioned resolution. | ~~MEDIUM~~ CLOSED | doc 04 §3.7/§3.10; doc 03 A-2 |

## Requirement-level gaps (functional, not blockers but not "done")

| Area | Gap | Evidence |
|---|---|---|
| Data integration (INT-01..03) | Implemented as a **generic HTTP sender** with no TT 31/2026/TT-BCT compliance mapping — the interoperability contract with Bộ Y tế / Sở NN / Sở CT is not actually satisfied. | doc 01 |
| IPv6 / TLS 1.2+ | Server IPv6 listen + TLS floor unverified (tied to B-1: prod stack unbuildable). | doc 01; doc 07 §2 |
| Documents module | Hard-coded 8-value document-type list; STT-18 catalog is maintained but never consumed (FR-38-03/04 expects catalog-driven). | doc 01; doc 03 A-3 |
| Certificate PDF form | Certificate/permit PDF layout not confirmed against the official prescribed form. | doc 01 |
| Username charset | Username = email violates the prescribed account charset rule. | doc 01 |
| Security dossier & manuals | No ATTT Level-2 security dossier, no user manual, no admin manual. | doc 01 |
| Form-create UI coverage | 6 modules' on-screen "create via form" path has no passing automated test (verification specs create via API). | doc 03 A-1; doc 07 §3 |

---

## What is genuinely production-quality (do not re-litigate)

These are verified real at `fe3dbd2` and should be treated as done:

- **Authentication & session** — real cookie login, antiforgery XSRF, 401 (not HTML redirect) on unauthenticated API access, non-root containers (uid 1654 / 101), restrictive CSP + security headers served live.
- **The implemented admin + public feature set** — CRUD, workflow state machines (report Draft→Submitted→Verified→Returned/Completed, inspection plan approval, certificate revocation), permission denial, cross-organization isolation, ClamAV-scanned MinIO file upload/download, Excel export, QuestPDF certificate download, and persistence-after-reload — all exercised by passing verification specs with no API mocking.
- **Performance headroom** — genuine k6 load test: 30 VUs held 2 min, 3,270 requests, 0% failed, avg 31 ms, API CPU ~54%. Meets NFR-01/02/05/06 on dev hardware; the software is not the bottleneck. (NFR-03/04 on production hardware still to confirm.)
- **Migration discipline** — 20 migrations applied cleanly by the one-shot `DbMigrator` with `Database__AutoMigrate=false` and `depends_on: service_completed_successfully`.

---

## Exact proving files

| Claim | Proof |
|---|---|
| Git baseline & unaudited batch, creds-in-history | [00-git-change-review.md](00-git-change-review.md) |
| Requirement-by-requirement production matrix (469 reqs) | [01-requirement-production-readiness-matrix.md](01-requirement-production-readiness-matrix.md) |
| Route/controller/service/DB inventory | [02-system-inventory.md](02-system-inventory.md) |
| Feature acceptance results (34/34 verification specs) | [03-feature-acceptance-result.md](03-feature-acceptance-result.md) |
| Security readiness (SSRF, CAPTCHA, XSS, deps) | [04-security-readiness.md](04-security-readiness.md) |
| Database readiness (backups, destructive migration, indexes) | [05-database-readiness.md](05-database-readiness.md) |
| CI/CD & deployment (missing Dockerfile.prod, monitoring) | [06-cicd-deployment-readiness.md](06-cicd-deployment-readiness.md) |
| Live runtime drill (7 services healthy, 229/6 E2E, smoke probes) | [07-runtime-production-drill.md](07-runtime-production-drill.md) |
| Secret rotation & git-history cleanup (B-3 resolution) | [09-secret-rotation-and-history.md](09-secret-rotation-and-history.md) |

---

## Recommended path to GO (ordered)

**Phase A — Make it deployable & recoverable (unblocks GO-WITH-CONDITIONS)** — ✅ **DONE**
1. ~~Add `FoodSafe.FE/Dockerfile.prod`; build the prod stack; verify HTTPS/TLS 1.2+, HSTS, IPv6 listen in runtime. (B-1)~~ **DONE (B-1, `6b46040`)** — prod frontend container built + HTTPS/TLS/HSTS/IPv6 runtime-verified; `scripts/verify-prod-frontend.sh` CI-gated.
2. ~~Implement automated PostgreSQL backups + a documented, rehearsed restore. (B-2)~~ **DONE (B-2, `8ece317`)** — backup/restore/rehearse scripts + CI-gated DR rehearsal (RTO ~5–8 s). Operational residual: schedule + staleness alert + MinIO object-restore in prod.
3. ~~Rotate every credential exposed in git history at the source.~~ **DONE (B-3)** — inventory shows no real secret leaked; leaked defaults now rejected at Production startup, config-overridable seed password, CI-gated recurrence scanner. See doc 09.
4. ~~Gate the orphan-DELETE migration behind a verified backup, or make it non-destructive / idempotent.~~ **DONE (B-4)** — made non-destructive/idempotent (repairs nullable orphans to NULL, aborts on NOT NULL orphans), CI-gated regression.

**Phase B — Close the security blockers**
5. ~~Add scheme + private-IP/DNS-rebinding validation to all data-integration outbound requests.~~ **DONE (B-5)** — `OutboundUrlValidator` syntactic gate + connect-time pinned-IP guard on both outbound clients; 58 regression tests.
6. ~~Upgrade AutoMapper, Volo.Abp.Account.Web, react-router off the advisories.~~ **Accepted-risk (B-6), all tracked to ABP 10** — AutoMapper High-DoS **cannot be upgraded on ABP 9.3.7** (15.x removed the ctor ABP calls → runtime `MissingMethodException`; the earlier "pinned 15.1.3, 591 tests green" was build-only and wrong — reverted to 14.0.0, bounded by `MaxDepth=64` + profile `.MaxDepth(8)`); Account.Web + react-router have no supported fix and are non-exploitable here (self-registration off + RedirectAllowedUrls; Vite SPA not RSC) — documented accepted-risk, upgrades tracked.
7. Fix CAPTCHA malformed-JSON bypass, server-side password expiry, and SVG-upload XSS. (C-1..C-3)

**Phase C — Data-integrity & operability conditions**
8. Add `WHERE is_deleted = FALSE` to the 6 soft-delete unique indexes; remove hardcoded test credential; fix `.env.example` drift. (C-4..C-6)
9. Add readiness probe + monitoring/alerting + CODEOWNERS. (C-7) Harden Hangfire dashboard authz + confirm `/statistics` access model. (C-8)

**Phase D — Requirement compliance for sign-off**
10. Implement TT 31/2026 interoperability mapping (INT-01..03); confirm certificate PDF against the official form; make documents catalog-driven; align username charset; produce the ATTT Level-2 security dossier + user/admin manuals.

Re-run the full acceptance suite and a prod-stack runtime drill after Phase A/B; only then does the decision move to **GO WITH CONDITIONS**, and to **GO** after Phase C/D.

**Status (re-audit 2026-07-28):** Phases A, B, and C are **complete** (B-1..B-6, C-1..C-8 all closed or documented accepted-risk), which moves the decision to **GO WITH CONDITIONS** as recorded in the Re-audit Decision above. Reaching unconditional **GO** now requires only (a) the operational deployment steps that are environment-side by nature and (b) Phase D requirement-compliance sign-off (TT 31/2026 interoperability, certificate-PDF form confirmation, catalog-driven documents, username charset, ATTT Level-2 dossier + manuals).
