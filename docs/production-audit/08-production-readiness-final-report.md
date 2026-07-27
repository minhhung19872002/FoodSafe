# 08 — Production Readiness Final Report

**System:** FoodSafe — Phần mềm quản lý an toàn thực phẩm, Chi cục ATVSTP tỉnh Quảng Ninh
**Audit type:** Independent production-readiness audit (evidence-based; prior AI summaries, registry status, commit messages, and documentation claims were NOT trusted)
**Audit commit:** HEAD `fe3dbd2`
**Audit date:** 2026-07-27
**Auditor:** Independent Principal Software Auditor
**Supporting evidence:** docs 00–07 in this folder (each conclusion below is traceable to one of them)

---

## FINAL DECISION: **NO-GO**

The application's *feature behavior* is genuinely built and runtime-verified at HEAD — 34/34 authoritative acceptance specs pass against a real full stack with no API mocking. That is real and creditable.

But **production go-live is blocked by the deployment, database-operations, and security layers**, not the features. The production stack **physically cannot be built** (missing `Dockerfile.prod`), there is **no backup or restore capability**, **credentials committed to git history have not been rotated**, and there are **unmitigated SSRF, CAPTCHA-bypass, stored-XSS, and known-vulnerable-dependency** issues. (SSRF is now closed — B-5.) Any one of the first three is an independent hard blocker. Shipping now would put a Level-2 government information system into production with no disaster recovery and a physically unbuildable release artifact.

The correct classification per the decision scale is **NO-GO** — not "GO WITH CONDITIONS" — because the conditions include *the release artifact does not build* and *there is no way to recover the database*. Those are not conditions to satisfy in parallel with a launch; they must be resolved before a launch is even technically possible.

---

## Completion assessment

| Dimension | Figure | Basis |
|---|---|---|
| **Code-complete** (feature code exists & wired end-to-end) | **~85%** | Phase 1 matrix over 469 requirements; Phase 2 inventory (45 routes, 56 pages, ~58 controllers, 85 AppServices, 20 migrations, 52 DbSets). No functional stubs found. |
| **Runtime-verified** (real browser → API → PostgreSQL, no mocks) | **~53% of requirements**, but **34/34 (100%) of the designated feature acceptance specs** | Phase 3 + Phase 7 — full E2E run rebuilt from HEAD: 229 passed / 6 failed, the 6 isolated to legacy-smoke test fragility (AntD Select virtualization), zero product defects, zero console errors. |
| **Production-operable** (deployable, recoverable, monitored, secured for prod) | **NOT READY** | Phases 4, 5, 6 — prod stack unbuildable, no backups, no monitoring beyond liveness, security blockers open. |

The gap between "85% code-complete" and "not production-ready" is the point of this audit: **feature completeness is not production readiness.** The remaining ~15% of requirements plus the entire operational/security readiness surface is where the launch risk lives.

---

## Critical blockers (must be closed before any production deploy)

| # | Blocker | Severity | Evidence | Owner layer |
|---|---|---|---|---|
| **B-1** | **Production stack cannot be built** — `docker-compose.prod.yml` references `FoodSafe.FE/Dockerfile.prod`, which does not exist. HTTPS/TLS, HSTS, and the production nginx template are therefore **entirely unverified in runtime**. | CRITICAL | doc 06; doc 07 §5 | CI/CD / Deploy |
| **B-2** | **No database backup or restore capability** — no backup scripts, no scheduled dump, no restore rehearsal evidence. A Level-2 government system would launch with zero disaster recovery. | CRITICAL | doc 05 §Summary blocker 1; doc 06 | Database ops |
| ~~**B-3**~~ **RESOLVED (2026-07-28)** | ~~Credentials committed to git history~~ — full-history inventory proves **no real production secret was ever committed**: only commodity dev defaults (`postgres`/`postgres`), the `change-this-in-production` placeholder, a public Turnstile test key, and a Development-only seed password. Real secrets live only in the git-ignored `.env`/`appsettings.secrets.json`. Leaked defaults now **fail-fast at Production startup** (`CoreSecretsValidator`), the seed password is config-overridable, and a CI-gated scanner (`scripts/scan-committed-secrets.sh`) + 13 guard tests prevent recurrence. History rewrite deliberately not performed (nothing live to purge). | ~~CRITICAL~~ CLOSED | doc 09 (rotation & history) | Security |
| ~~**B-4**~~ **RESOLVED (2026-07-28)** | ~~Destructive migration~~ — `20260727104254_AddMissingForeignKeys` no longer deletes: nullable dangling FKs are repaired to NULL, NOT NULL orphans abort the migration (transaction rolls back, no row touched). CI-gated regression `scripts/verify-migration-nondestructive.sh` proves both paths on real Postgres. | ~~HIGH→blocker~~ CLOSED | doc 05 §4.2 (RESOLVED) | Database ops |
| ~~**B-5**~~ **RESOLVED (2026-07-28)** | ~~SSRF~~ — outbound data-integration URLs are now guarded by `FoodSafe.Security.OutboundUrlValidator`: a syntactic gate (absolute http/https, no embedded credentials, literal-IP hosts must be public) on create/update/test/share, **plus** a connect-time IP guard — both `ProbeClient` and `SharedClient` use a `SocketsHttpHandler.ConnectCallback` that resolves the host and connects only to validated public IPs (pinned; defeats DNS-rebinding). Blocks loopback, RFC-1918, CGNAT, link-local `169.254.169.254`, `::1`, `fc00::/7`, IPv4-mapped. 58 regression tests incl. real-socket loopback refusal. | ~~HIGH~~ CLOSED | doc 04 SEC-H-01 (RESOLVED); OutboundUrlValidator.cs | Security |
| **B-6** | **Known-vulnerable dependencies** — `AutoMapper 14.0.0` (High, GHSA-rvv3-g6hj-g44x) in every backend project; `Volo.Abp.Account.Web 9.3.7` (Moderate, GHSA-vfm5-cr22-jg3m) in the host; `react-router` (High, GHSA-qwww-vcr4-c8h2) on the frontend. | HIGH | `dotnet list package --vulnerable` (2026-07-27); doc 04 SEC-H-02 | Security |

## High-priority conditions (close before or immediately at launch)

| # | Condition | Severity | Evidence |
|---|---|---|---|
| C-1 | CAPTCHA bypass via malformed JSON body on the login endpoint. | MEDIUM | doc 04 SEC-M-01 |
| C-2 | Password expiry (90-day policy) is enforced **client-side only** — server does not reject an expired-password login. | MEDIUM | doc 04 SEC-M-03 |
| C-3 | Stored XSS via SVG upload in branding/logo. | MEDIUM | doc 04 SEC-M-04 |
| C-4 | Six certificate/registration UNIQUE indexes lack a `WHERE is_deleted = FALSE` partial filter — soft-deleted rows collide with new inserts. | HIGH | doc 05 |
| C-5 | Hardcoded test credential in a migration/seed path. | HIGH | doc 05 |
| C-6 | `.env.example` drift — `REDIS_PASSWORD` missing; a fresh clone following the example cannot start Redis. | MEDIUM | doc 07 §1 |
| C-7 | Health check is liveness-only; no readiness probe, no monitoring/alerting, no CODEOWNERS. | HIGH | doc 06 |
| C-8 | Hangfire dashboard exposure; `/statistics` route has no client permission guard (backend authz still applies — must be confirmed). | MEDIUM | doc 04 SEC-M-05; doc 03 A-2 |

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

**Phase A — Make it deployable & recoverable (unblocks GO-WITH-CONDITIONS)**
1. Add `FoodSafe.FE/Dockerfile.prod`; build the prod stack; verify HTTPS/TLS 1.2+, HSTS, IPv6 listen in runtime. (B-1)
2. Implement automated PostgreSQL backups + a documented, rehearsed restore. (B-2)
3. ~~Rotate every credential exposed in git history at the source.~~ **DONE (B-3)** — inventory shows no real secret leaked; leaked defaults now rejected at Production startup, config-overridable seed password, CI-gated recurrence scanner. See doc 09.
4. ~~Gate the orphan-DELETE migration behind a verified backup, or make it non-destructive / idempotent.~~ **DONE (B-4)** — made non-destructive/idempotent (repairs nullable orphans to NULL, aborts on NOT NULL orphans), CI-gated regression.

**Phase B — Close the security blockers**
5. ~~Add scheme + private-IP/DNS-rebinding validation to all data-integration outbound requests.~~ **DONE (B-5)** — `OutboundUrlValidator` syntactic gate + connect-time pinned-IP guard on both outbound clients; 58 regression tests.
6. Upgrade AutoMapper, Volo.Abp.Account.Web, react-router off the advisories. (B-6)
7. Fix CAPTCHA malformed-JSON bypass, server-side password expiry, and SVG-upload XSS. (C-1..C-3)

**Phase C — Data-integrity & operability conditions**
8. Add `WHERE is_deleted = FALSE` to the 6 soft-delete unique indexes; remove hardcoded test credential; fix `.env.example` drift. (C-4..C-6)
9. Add readiness probe + monitoring/alerting + CODEOWNERS. (C-7)

**Phase D — Requirement compliance for sign-off**
10. Implement TT 31/2026 interoperability mapping (INT-01..03); confirm certificate PDF against the official form; make documents catalog-driven; align username charset; produce the ATTT Level-2 security dossier + user/admin manuals.

Re-run the full acceptance suite and a prod-stack runtime drill after Phase A/B; only then does the decision move to **GO WITH CONDITIONS**, and to **GO** after Phase C/D.
