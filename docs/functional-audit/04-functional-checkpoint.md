# Functional Audit — Checkpoint (2026-07-28)

**Audit baseline**: `78322f2` + valid parallel-session working tree (doc 00)
**Batch F-1 evidence commit**: `71f35e2` (code + tests; these audit docs committed separately on top)

## 1. Test baseline (reproduced from the exact current state — no prior result accepted unverified)

| Command | Exit code | Passed | Failed | Skipped | Notes |
|---|---|---|---|---|---|
| `dotnet test` (FoodSafe.BE) | 1 → 0 | 615 → **618** | 3 → **0** | 0 | The 3 failures were **stale test assertions** (`GetFilter().ShouldBeNull()`) contradicting the intentional C-4 soft-delete-aware UNIQUE indexes (`8719f66`); assertions updated to pin the committed filter. Not a product defect. |
| `npx vitest run` (FoodSafe.FE) | 0 | 112 | 0 | 0 | Mocked — NOT acceptance evidence (policy), recorded for completeness |
| `npx tsc -b --noEmit` | 0 | — | — | — | Clean |
| `npx oxlint src` (project linter) | 0 | — | — | — | Clean (an initial `eslint` invocation failed with exit 2 — wrong tool, the project lints with oxlint) |
| `npm run build` (FE production) | 0 | — | — | — | Built in 8.8s |
| `npx playwright test` (full, no interception) | 1 | **278** | **1** | 0 | 418s. The 1 failure = `reporting-error-notifications` — a 120s click **timeout**, the exact environmental flake documented in doc 75 §3.5; **passes in isolation in 2.1s** (re-verified this session). First attempt of this run failed 169 tests purely because `E2E_ADMIN_PASSWORD` was not set (harness error thrown before any login; no product involvement). |

Baseline verdict: **product-green**; the suite retains its documented single-flake load-contention behavior (doc 77 P1-5, open).

## 2. Batch F-1 verification (STT 51–57 share completion)

All against the rebuilt live Docker stack (real PostgreSQL, real MinIO/ClamAV, real migrations — `20260728001241_AddApiCallLogRetryAttempts` confirmed applied via `\d di_api_call_logs`), **no API interception**:

| Evidence | Result |
|---|---|
| `dotnet test` after batch | **621/621** (adds 2 contract tests + 1 mapping test) |
| `e2e/data-integration-retry.spec.ts` (new) | **3/3** (6.4s) — (1) share pinned to a seeded alert: logged request body parses to the versioned envelope with `recordCount=1` and the REAL alert title, receiver reflection contains the record, SHA-256 checksum recorded; (2) failed share (postman-echo `/status/503`) retried via the real "Thử lại" button → warning toast, linked attempt row `#2` (correlationId = original, identical body + checksum, original untouched), detail modal shows attempt + checksum, date-range filter narrows the table, both rows persist after full reload; (3) guards — retry of a successful attempt → 403 `Chỉ có thể thử lại giao tiếp thất bại`, readonly user → 403 |
| Data-integration regression subset (credentials 6 + verification + page + share 3 + retry 3 + excel) | **20/20** (25.6s) |
| Cross-module smoke (businesses-verification + auth-verification) | **13/13** (9.5s) |
| FE unit (data-integration feature, mocked — non-acceptance) | 5/5 |
| Full suite post-batch | **282 passed / 0 failed / 0 flaky / 0 skipped** (306s) — see §3 |

**Regression found & fixed during the batch**: the typed payload enlarged the postman-echo reflection beyond the call-log's 4000-char response truncation, hiding the reflected auth headers that `data-integration-credentials.spec.ts` asserts on. Fixed in the spec's **setup** (each share now pins one seeded alert via `entityId`); every assertion is unchanged — the injection proof is identical.

## 3. Post-batch full-suite run

`npx playwright test` (json reporter, workers=1, no interception), rebuilt stack, E2E_ADMIN_PASSWORD set:

```
TOTAL: 282   PASSED: 282   FAILED: 0   FLAKY: 0   SKIPPED: 0   DURATION: ~306s
```

**First fully-green full-suite run on record** (baseline runs and doc 75's runs each carried exactly one load-contention timeout). 282 = the 279 pre-batch tests + 3 new Batch F-1 tests. This run also covers the impact-map "Migrations → Level 3: all features" obligation for the additive `di_api_call_logs` migration.

## 4. Registry actions

- `F-019` family: Batch F-1 rows added to `docs/testing/01-feature-verification-registry.md` (kept uncommitted alongside the parallel session's registry edits; evidence pinned to the F-1 commit).
- F-019c (credentials) re-verified at the F-1 commit (its spec setup changed; 6/6 green).
- No unrelated VERIFIED features invalidated: the batch touches only the DataIntegration module + one additive DB migration; impact-map Level-2 retest + cross-module smoke executed above.
