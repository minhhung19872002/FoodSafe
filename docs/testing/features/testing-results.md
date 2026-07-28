# F-017 — Testing Results (Kết quả kiểm nghiệm)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening + merge-regression recovery

Deep FE+BE inspection of `/testing-results`; re-proven on the rebuilt Docker
stack (no API interception). Doubles as the Level-2 retest owed by the sorting
DIRTY batch.

**Merge regression recovered (root cause: merge `363a70b`)**: the full
`TestingResultEditorModal` (sampled-business → product → related-inspection
cascading selects, built at `b6c5384`) had been orphaned — the page shipped an
inline modal without those fields, so `businessId`/`productId`/
`inspectionResultId` could never be set from the UI while the "Cơ sở lấy mẫu"
column and the api/query layer for the lookups still existed. The page now
uses the full editor again, plus the lost "Cơ sở lấy mẫu"/"Trung tâm kiểm
nghiệm" filter selects, combined with the newer sorting/page-size/RowActions
work.

| # | Defect | Fix |
|---|---|---|
| 1 | Editor lost business/product/inspection linkage (merge regression above) | Page rewired to `TestingResultEditorModal` + restored filters |
| 2 | BE accepted unvalidated references — bogus center/service GUIDs died as FK-violation **500s**; a business/product/inspection of another org could be attached (name leak via enrichment) | `EnsureReferencesAsync`: center exists+active (0003; `Guid.Empty` keeps contract 0002), service exists+active (0004), business in scope (0005), product belongs to the chosen business (0006), inspection belongs to the chosen business (0007) — vi/en localized |
| 3 | `CreateAsync` used `scope.OrganizationIds.First()` — a global user with no org profile → InvalidOperationException 500 | `HomeOrganizationId` first, then guarded fallback → localized `DataScope.OrganizationNotFound` |
| 4 | `CreateUpdateTestingResultDto` had no validation attributes | `[Required]`/`[StringLength]` added (400s with field errors instead of 500s) |
| 5 | ApplySorting had no Id tiebreaker (same defect class the F-008 pass found in the `4a4af68` sorting batch) | `.ThenBy(x => x.Id)` on every branch |
| 6 | Excel export dropped `Sorting`; page used static antd `message` (context warning), hardcoded error toasts, `isLoading` with `keepPreviousData` | Export copies `Sorting`; `App.useApp()` + `extractApiError` + `isFetching` |
| 7 | Spec clicked confirm `"OK"` | `/^(Xóa|Đồng ý|OK)$/` in dialog |
| — | Localization debt closed: `TestingResult:0002` and **all `SelfDeclaration:0001–0006`** codes had no vi/en entries (F-007 fallback showed ABP default text) | entries added |

- **Evidence run** (workers=1): `testing-results.spec.ts` +
  `testing-results-verification.spec.ts` → **6/6 passed** (validation spec
  re-confirmed contract 0002 for `Guid.Empty`). BE AlertsAndTesting tests
  **37/37**; FE Vitest testing-results **7/7**; BE build 0 errors; `tsc -b`
  clean.

- **Feature ID**: F-017 · **Verified Git commit**: `e00dfb1` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/testing-results`
- **Endpoints**: `GET/POST/PUT/DELETE /api/v1/app/testing-result(/{id})`, `GET .../excel/export`, `POST/DELETE /api/v1/app/master-catalog/testing-center` (fixture), `GET /api/v1/app/master-catalog/testing-centers|testing-services` (modal options)

## Evidence

- `e2e/testing-results.spec.ts` — UI lifecycle: create result selecting a real catalog testing center, Excel export, edit, delete; center fixture created/removed through the real catalog API.
- `e2e/testing-results-verification.spec.ts` — 5 tests: unauthenticated → 401; `noperm` → 403; district staff denied (403 — see N/A note); server validation (missing sample fields; `Guid.Empty` testing center → `FoodSafe:TestingResult:0002`); persistence after reload with center name rendered from the catalog join; empty state.

## Product defect found and fixed (commit `e00dfb1`)

**Testing center/service selection was silently dropped.** The editor modal collected free-text `testingCenterName`/`testingServiceName`, but `CreateUpdateTestingResultDto` only accepts catalog IDs — the typed names were discarded and `Guid.Empty` was stored as the center reference, so the list's "Cơ sở KN" column rendered blank for every UI-created record. Fixed: modal now uses catalog-backed searchable Selects, and the domain rejects `Guid.Empty` center IDs on create and update.

## Scenario notes

- **Cross-organization read isolation: N/A at list level for district staff** — `DistrictStaff` deliberately has no `AlertsAndTesting.TestingResults.*` permissions (testing results are a province-level function, STT 37), so cross-org access is blocked one layer earlier at authorization (403 asserted). Org scoping inside the service uses the same `ScopedQueryAsync`/`GetScopedAsync` pattern verified in F-006..F-015.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403 incl. district staff) |
| Validation (server, incl. empty catalog reference) | PASS after fix |
| CRUD + Excel export | PASS |
| Catalog integration (center/service) | PASS after fix |
| Persistence after reload, empty state | PASS |
| Org scope | PASS structurally + permission-layer denial (see note) |

## Paths & dependencies

- FE `src/features/testing-results/**`; BE `Application/AlertsAndTesting/TestingResultAppService.cs`, `Domain/AlertsAndTesting/TestingResult.cs`
- Depends on Master Catalog testing-centers/services (F-004), auth/scope/axios (Level 3)
- Invalid for commits after `e00dfb1` touching these paths
