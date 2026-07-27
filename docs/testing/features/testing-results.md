# F-017 — Testing Results (Kết quả kiểm nghiệm)

## Status: VERIFIED

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
