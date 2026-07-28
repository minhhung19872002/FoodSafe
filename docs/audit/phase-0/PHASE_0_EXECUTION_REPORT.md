# Phase 0 — Baseline Stabilization: Execution Report

**Executed**: 2026-07-28 (16:26 → ~18:00 +07) · Branch `feat/integration-completion`
**Scope**: BASE-001..004 only. No P1 task (FUNC-INT-001, FUNC-COMMIT-001, FUNC-CIT-001, FUNC-STAT-001, TEST-001, SEC-004…) was started.
**Result**: **PHASE 0 PASS** — freeze commit `17149f6`, all exit criteria met (§L).

## L. Final verification from the committed state (Step 10)

Re-run **after** the freeze commit, from the committed sources:

| Check | Result |
|---|---|
| Backend build | 0 errors |
| Backend tests | all 4 projects Passed (663 total) |
| EF drift | none |
| FE type-check / lint | clean |
| FE unit tests | 116/116 |
| FE production build | ✓ |
| **Full Playwright from `17149f6`** | **292/292, 0 failed, 0 flaky, 0 skipped (5.2 m)** — matches the pre-commit run exactly |
| Concurrent modification during the working window | **none** — `git status`/HEAD compared at every step boundary; the only external commits (`5bc0d86`/`83ec103`/`6b6ff6a`) predate task start and are §A's material finding |
| Working tree after the bookkeeping commit | clean (see §H) |

---

## A. Initial baseline

| Item | Value |
|---|---|
| Branch | `feat/integration-completion` |
| Initial HEAD | `6b6ff6ab51d275804e924fffa60841282b0f9f28` (2026-07-28 16:05:58 +0700) |
| Initial dirty state | ` M .gitignore` (+1 line `screenshots`) + 9 untracked entries (audit/planning docs, PROJECT_IMPLEMENTATION_INVENTORY.md, testing/production-review/, test artifacts) — full capture in [PHASE_0_INITIAL_GIT_STATE.txt](PHASE_0_INITIAL_GIT_STATE.txt) |
| Safety snapshot | [pre-phase0-tracked.patch](pre-phase0-tracked.patch) (316 B), [pre-phase0-staged.patch](pre-phase0-staged.patch) (empty) |

### Concurrent-session check — MATERIAL FINDING

Between the planning audit (HEAD `aad87c1`, ~15:20) and this task's start (16:26), a **concurrent session committed the bulk of the originally planned BASE-001 payload**:

| Commit | Time | Content | Phase-0 mapping |
|---|---|---|---|
| `5bc0d86` | 15:54 | ApiSpecification feature — **atomic**: domain + validator + AppService + DTOs + controllers (admin + anonymous partner) + permissions + localization + DbContext/ModelCreatingExtensions + migration `20260728081422` + Designer + **snapshot** + FE tab/api/queries/mutations/types + e2e spec + BE tests + CurrentUserContext projection fix | BASE-001 feature payload |
| `83ec103` | 15:59 | `routePermissions.ts` single source + router/menu/PermissionRoute rewiring, tab view-gating, responsive fixes, `FoodPoisoningPage.test.tsx` fix, ui-audit suite under `testing/ui-audit/` | Part of BASE-001 + **BASE-003** |
| `6b6ff6a` | 16:05 | Registry row F-019g VERIFIED @ `5bc0d86`, feature doc, go/no-go note, regression log | Part of BASE-004 bookkeeping |

These commits happened **before** this task started (no mid-task interference), so execution continued in *verify-then-complete* mode: every claim of those commits was re-verified from scratch (sections C–G), the remaining gaps (BASE-002 permission entry, artifact hygiene, freeze verification + registry stamp) were closed by this session. `git status --short` was re-compared at every step boundary; **no unexpected change appeared during the working window** (details §H).

## B. File reconciliation

Full table: [PHASE_0_FILE_INVENTORY.md](PHASE_0_FILE_INVENTORY.md). Summary:

| File/group | Classification | Action | In freeze? | Reason |
|---|---|---|---|---|
| ApiSpecification feature (all layers) | Feature | none — already committed atomically at `5bc0d86` | already in history | verified complete: domain/enums/error-codes/DTOs/AppService/validator/controllers/permissions/localization/DbSet/EF-mapping/migration+Designer/snapshot/FE types-api-query-mutation/ApiSpecsTab/tab permission/BE tests/e2e spec — no missing layer; partner documentation committed earlier (`docs/integration/`, `aad87c1`) |
| `routePermissions.ts` | Route-permission refactor + **BASE-002 fix (this session: +ApiSpecs.View)** | edit | **Yes** | closes G-02 |
| `api-specification-management.spec.ts` | Required test (BASE-002) | +1 real-stack test | **Yes** | ApiSpecs-only route admission + tab exclusivity + BE 403 wall + noperm 403 page |
| `FoodPoisoningPage.test.tsx` | Required test correction | none — fixed at `83ec103` | already in history | verified green for the right reason (§D) |
| `.gitignore` | Local env → refined | replace bare `screenshots` with precise artifact ignores | **Yes** | precision per Step-6 mandate |
| audit/planning/phase-0 docs + PROJECT_IMPLEMENTATION_INVENTORY.md + testing/production-review/ | Documentation | commit | **Yes** | planning source + concurrent-session deliverables, secret-scanned |
| `test-results/`, `FoodSafe.FE/.results/`, `testing/ui-audit/screenshots/` | Generated artifacts | ignore, never staged | **No** | §F excluded list |
| `cookies.txt`, `prompt.txt` | Local environment | untouched, pre-ignored | **No** | user-local files |

## C. BASE-002 result

- **Permission source of truth**: `FoodSafePermissions.DataIntegration.ApiSpecs.View` = `"FoodSafe.DataIntegration.ApiSpecs.View"` (`FoodSafePermissions.cs:339-347`), registered in `FoodSafePermissionDefinitionProvider.cs`, projected to FE via `CurrentUserContextAppService` (regression-guarded by `CurrentUserContextPermissionContractTests`, committed at `5bc0d86`).
- **Gap confirmed before fix**: `ROUTE_PERMISSIONS.dataIntegration` listed only ApiEndpoints/CallHistory/Partners View — an ApiSpecs-only user hit the 403 page despite a valid permission (G-02 exactly as predicted).
- **FE route fix**: added `"FoodSafe.DataIntegration.ApiSpecs.View"` to `ROUTE_PERMISSIONS.dataIntegration` (`routePermissions.ts`). Router and menu both consume this single source, so route + sidebar stay consistent by construction.
- **Tab behavior**: `DataIntegrationPage.tsx:910-956` renders each tab only behind its own `hasPermission` check (`canViewApiSpecs` etc.) — an ApiSpecs-only user sees exactly one tab; users with existing endpoint/history/partner permissions keep their tabs (no visibility change for them — the array only gained an OR-term).
- **BE authorization**: `ApiSpecificationController` `[Authorize]` + per-operation permission checks in `ApiSpecificationAppService` (View/Create/Publish/Delete); anonymous surface is only the published-spec download (`PartnerApiSpecController`, 404 for unpublished). Direct HTTP cannot bypass the FE guard — verified by the spec's API-level assertions.
- **Tests**: new real-stack Playwright test in `api-specification-management.spec.ts` — creates (via real admin HTTP API, no interception) a role holding ONLY ApiSpecs.View + a user, completes the forced first-login password change, then asserts: route admits; only "Đặc tả API" tab renders; "Không có quyền truy cập" absent; `GET /api/v1/app/api-specification` 200 while sibling `GET /api/v1/app/api-endpoint` 403; contrast: seeded `noperm` user gets the 403 page and no tab; cleanup deletes user+role. No permission check was weakened.

## D. BASE-003 result

- **Root cause**: production change in `83ec103` made the "Ca ngộ độc" tab render only when the user holds `FoodSafe.FoodPoisoning.Cases.View` (part of the tab view-gating fix). The unit-test fixture granted only Create/Edit/Delete — an unrealistic permission set no real user has — so the tab never mounted and `CA-001` was absent. **The production UI is correct; the test expectation was stale.**
- **Correction (already in `83ec103`)**: fixture now includes `Cases.View` with a Vietnamese comment explaining that real users always hold View alongside action permissions. This asserts current stable user-visible behavior at the existing unit-test boundary — no assertion was loosened, no implementation detail asserted.
- **Result**: `npm test -- --run` → **59 files / 116 tests, 0 failed** (re-run by this session on the current tree).

## E. Migration verification

| Check | Result |
|---|---|
| Migration list | 30 migrations; last = `20260728081422_AddApiSpecification` (committed at `5bc0d86` together with model + snapshot) |
| Pending-model-change (drift) | `dotnet ef migrations has-pending-model-changes` → **"No changes have been made to the model since the last migration."** (exit 0) |
| Clean apply | All migrations → empty database `p0_clean` on the real PostgreSQL 15 container: **Done, exit 0** |
| Upgrade path | `p0_upgrade` → `20260728064640_AddPartnerInboundIntegration` (previous), then → latest: **Done, exit 0**; `di_api_specifications` table present with expected columns |
| Rollback | `database update 20260728064640…` from latest: **"Reverting migration '20260728081422_AddApiSpecification'. Done."** (exit 0) |
| Cleanup | both throwaway databases dropped; main `FoodSafe` DB untouched by these checks (migrator service re-run at stack restart applies pending migrations normally) |
| Regeneration | **not needed** — existing migration is consistent; nothing was regenerated |

## F. Commands and results

| Command | Result | Duration | Evidence |
|---|---|---|---|
| `git status/log/diff` captures | baseline recorded | s | PHASE_0_INITIAL_GIT_STATE.txt |
| `dotnet build` (BE) | **0 errors** | ~8 s | p0-be-build.log (local temp) |
| `dotnet test --no-build` (BE) | **663/663 passed** (Domain 215, HttpApi.Host 71, Application 357, EFCore 20) | ~12 s | p0-be-test log |
| `dotnet ef migrations has-pending-model-changes` | no drift | ~20 s | §E |
| `dotnet ef database update` (clean/upgrade/rollback ×3) | all exit 0 | ~1 min | §E |
| `npx tsc --noEmit` | 0 errors | ~30 s | p0-tsc.log |
| `npm run lint` (oxlint) | clean | ~5 s | p0-lint.log |
| `npm test -- --run` (Vitest) | **116/116** | ~90 s | p0-vitest.log |
| `npm run build` (tsc -b + vite) | success | — | p0-fe-build.log |
| `docker compose build frontend api` + `up -d migrator api frontend` | success; both healthy; FE=200, Swagger=200 | ~7 min | p0-docker-build.log |
| Targeted Playwright (api-specification-management, partner-openapi-contract, auth-verification, data-integration*, food-poisoning) | *see §G* | — | p0-e2e-targeted.log |
| Full Playwright suite | *see §G* | — | p0-e2e-full.log |

(Local temp logs are evidence for this session; not committed — they are generated artifacts.)

## G. Test summary

| Layer | Result | Comparison with previous baseline |
|---|---|---|
| Backend (`dotnet test`) | **663/663** (Domain 215, HttpApi.Host 71, Application 357, EFCore 20) | 635/635 at `6326af4` → +28 (ApiSpecification domain/validator/contract + projection tests) |
| Frontend unit (Vitest — not acceptance evidence) | **116/116** (was 115/116 on the pre-`83ec103` dirty tree) | matches the historical 116 count |
| Targeted E2E | 41 green: `api-specification-management` **5/5** (incl. the new BASE-002 scenario), `partner-openapi-contract` 1/1, `auth-verification`, all `data-integration*`, `food-poisoning` — 36 more | previous F-019g spec was 4/4 |
| **Full Playwright (pre-commit tree)** | **292 passed / 0 failed / 0 flaky / 0 skipped** in 5.2 m (workers=1, real Docker stack rebuilt from this tree, zero interception; includes the previously flaky `reporting-error-notifications`) | 286/286 at `6326af4` → +6 (5-test ApiSpec spec + BASE-002 scenario) — actual total **discovered**, not assumed |
| **Full Playwright (post-commit re-run from `17149f6`)** | **292 passed / 0 failed / 0 flaky / 0 skipped** (5.2 m) | identical to the pre-commit run — committed state reproducible |

New-test failure loop (documented per Step-7 rules — all three failures were in the **new test itself**, no product defect, no test weakened):
1. `permissions: [string]` → 400: server DTO is `RolePermissionUpdateDto {name, isGranted}` — fixed the body shape.
2. `Identity:0004` → business rule requires the parent permission chain granted with the child (matches the real permission-drawer payload) — grant `FoodSafe.DataIntegration` + `.ApiSpecs` + `.ApiSpecs.View`.
3. `login result=3` (NotAllowed) → ABP refuses login while `ShouldChangePasswordOnNextLogin` is set — completed the change via the real session-less `POST /api/v1/app/account-security/complete-initial-password-change` first, then logged in.

## H. Freeze commit

| Item | Value |
|---|---|
| Hash | `17149f6e1af41e62dbdb606a00fd866bfd399e31` |
| Message | `chore(baseline): freeze verified implementation baseline` |
| Staged (21 files, +5 702) | `.gitignore`, `routePermissions.ts`, `api-specification-management.spec.ts`, `docs/functional-audit/01` (addendum), `docs/audit/CURRENT_*` (2), `docs/audit/PROJECT_IMPLEMENTATION_INVENTORY.md`, `docs/planning/` (4), `testing/production-review/` (10) — staged explicitly by path, reviewed; no `git add -A` |
| Excluded (never staged) | `FoodSafe.BE/test-results/`, root `test-results/`, `FoodSafe.FE/.results/`, `testing/ui-audit/screenshots/` (all now gitignored); `cookies.txt`, `prompt.txt` (pre-existing ignores); local temp logs |
| Follow-up bookkeeping commit | registry freeze certification + regression-log entry + JSON baseline update + gap-analysis/matrix addenda + this phase-0 evidence folder (hash in §L) — needed because those documents must cite the freeze hash, which cannot exist before the freeze commit itself; mirrors the repo's established feature-commit + docs-commit pattern |
| `git status` after both commits | *(§L)* |

## I. Registry updates

- `docs/testing/01`: **F-019g** re-stamped to `17149f6` (spec grew to 5/5 with the BASE-002 scenario); new **"Freeze certification — 17149f6"** section recording the full gate; all other rows keep their historical stamps (their features unchanged since; the 292/292 freeze run is the re-exercise citation). Historical bottom sections explicitly marked superseded.
- `docs/testing/03-regression-log.md`: Phase-0 entry — additive Level-3 route-config change, nothing marked DIRTY, full gate results, BASE-003 root-cause note.
- `docs/functional-audit/01`: dated addendum retiring stale INT-03 / FR-50-05 / Batch F-1 rows (committed in the freeze commit itself).
- `docs/audit/CURRENT_REQUIREMENT_GAP_ANALYSIS.md` + `_TRACEABILITY_MATRIX.md`: Phase-0 addenda — G-01/G-02/G-03 closed, FR-50-05 → FULLY, post-freeze roll-up FULLY 401 / MOSTLY 30.
- `docs/planning/REMAINING_PLAN_SUMMARY.json`: baseline → freeze commit (`dirty: false`), `phase0` block (completed BASE tasks, closed gaps), post-freeze status counts (401/30/…), readiness 94.1% raw end-to-end + judgment ranges encoded (min/max), validation re-run: status sum 469, 49 unique tasks, all dependency IDs resolve, priorities P0 4 / P1 17 / P2 21 / P3 7.
- **Not rewritten**: doc-07's body (its existing POST-DECISION banner already points to §8), doc-08, historical registry stamps, prior regression entries.

## J. Remaining blockers (after Phase 0)

Phase 0 closed G-01, G-02, G-03 and promoted FR-50-05 to FULLY. Everything else in the plan is untouched:

1. **P1 functional**: G-04 inbound disposition workflow (FUNC-INT-001), G-08 commitment record (FUNC-COMMIT-001), G-09 citizen-moderation depth (FUNC-CIT-001), G-10 statistics outputs (FUNC-STAT-001).
2. **External (EXT-001)**: INT-02 TT 31/2026 schema or written deferral; INT-01 real ministry endpoint; M-6 templates; M-7 username ruling; I-2 real Turnstile keys.
3. **Quality gates**: E2E still not in CI (TEST-001), real-HTTP BE suite (TEST-002), credential rotation (SEC-004).
4. **Track D/E**: entire production-infrastructure and documentation tracks (OPS-001..009, DOC-001..006) — unchanged.

## K. Phase-1 readiness

**It is SAFE to begin Phase 1** (FUNC-INT-001, FUNC-COMMIT-001, FUNC-CIT-001, FUNC-STAT-001): the baseline is one clean verified commit, the registry cites it, the full suite is green and reproducible, migrations are drift-free with proven clean-apply/upgrade/rollback, and no P1 work was started during Phase 0. Recommended first move stays per the plan: send the EXT-001 disposition package in parallel with FUNC-INT-001. Caveat: concurrent sessions remain active on this repository — re-check `git status`/HEAD before each new batch, as this phase had to do.
