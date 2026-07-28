# Production Readiness Review — Testing Quality

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a`

## 1. Inventory

| Layer | Volume | Character | Verdict |
|---|---|---|---|
| BE unit/contract (xUnit) | 54 files / ~356 tests → **662/662 green** at the latest run (incl. ApiSpecification additions) | Domain guard tests (state machines, invariants — e.g. `Approve_should_reject_draft`, reversed-date guards), authorization/data-scope contract tests, EF mapping tests | **ADEQUATE-STRONG** for domain logic |
| BE real-database | 1 Testcontainers class (`GeographicCatalogPostgreSqlTests` — real postgres:15, FK-level assertions) | Everything else runs on SQLite in-memory via ABP TestBase | **WEAK** as a layer (see gap T-A) |
| FE unit (Vitest) | 59 files / 116 tests green | Mostly two patterns per feature: renders-with-mocked-data + hides-controls-for-readonly; API-shape tests; almost no user-interaction/mutation coverage | **WEAK** — but *by explicit policy* these are not acceptance evidence |
| E2E (Playwright) | 78 spec files / 286 tests | Real stack, real login, real PostgreSQL/MinIO/ClamAV; **grep-proven zero API interception**; per-feature pairs: workflow spec + `-verification` spec (security/permission/validation probes) | **STRONG** — this is the system's real safety net |
| UI/responsive audit suite | 4 specs / 323 checks (`testing/ui-audit/`) | Route health, console/network cleanliness, 6-viewport overflow, role flows | STRONG complement |
| Load | k6 scenario, 30 VUs / 2 min, real login | NFR-01..06 thresholds green (avg 31ms, 0% failures) | ADEQUATE (dev hardware) |

## 2. Are the tests meaningful? — Spot-check verdicts

- `reporting.spec.ts`: full draft→submit→verify→complete with DOM-asserted status transitions + server-enforced return reason + Excel `PK` magic bytes. **Real outcomes, not rendering.**
- `inspection-verification.spec.ts`: 401 unauthenticated, 403 no-permission, cross-org denial, invalid transition rejected with the specific error code at HTTP level, 400 server validation. **Exactly what the policy demands.**
- `password-management-verification.spec.ts`: wrong current password, weak password, password-history reuse re-checked after re-login. **Edge-case depth.**
- The whole estate passed as one clean run (286/286, 0 flaky, 0 skipped) in the independent gate — with the interception-grep making mocking provably absent.

## 3. Gaps (ranked)

| ID | Severity | Gap |
|---|---|---|
| T-A | **High** | **No real-HTTP backend regression suite** — all 662 BE tests are in-process; middleware-order/authz/pipeline enforcement evidence lives only in Playwright + one-off manual probes (doc 74). A `WebApplicationFactory`+Testcontainers suite porting those probes is the standing P2 that should become P1 before long-term maintenance (G-26/I-5) |
| T-B | **High** | **E2E not in CI** — the 286-test acceptance suite runs manually only; CI gates on build/unit/migrations/scans but a regression can merge green (G-25) |
| T-C | Medium | ATP-work and Action-month report types lack full lifecycle e2e walks (NĐTP has one; these two are contract-tested only) |
| T-D | Medium | No dedicated concurrency spec (two editors, stamp conflict) — pairs with the W-5 product gap (G-28) |
| T-E | Medium | Application-layer business rules never run against real PostgreSQL outside the one geography class; EF mapping tests missing for 5 modules (G-27) |
| T-F | Low | FE unit layer has no mutation/interaction coverage (accepted by policy; note for maintenance) |
| T-G | Low | Known load-contention flake (`reporting-error-notifications` under full-suite load) — zero occurrences in the latest clean run; keep workers=1 discipline (G-29). Plus this review's discovery: **E2E fantasy-year data accumulates** (completed reports uncleanable by spec cleanup) and broke `reporting.spec.ts` after ~15 runs — hygiene performed, cleanup fix recommended (regression log 2026-07-28) |

## 4. Verdict

The **acceptance layer is genuinely strong and policy-honest** — real stack, no mocks, negative paths, and an independent clean full run. The weaknesses are structural rather than content: acceptance depends on one manually-run suite (T-B) and the backend has no real-HTTP net of its own (T-A). Those two determine whether today's quality *stays* true after the team stops hand-running gates — they are the testing items worth paying for before production.
