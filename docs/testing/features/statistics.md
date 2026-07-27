# F-023 — Statistics (Thống kê tổng hợp)

## Status: VERIFIED

- **Feature ID**: F-023 · **Verified Git commit**: `7316838` (defect fixed in build before this commit) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/statistics`
- **Endpoints**: `GET /api/v1/app/statistics?year={int}`

## Evidence

- `e2e/statistics-verification.spec.ts` — 5 tests:
  1. Unauthenticated → 401/302
  2. `noperm` (authenticated) → 200 (`[Authorize]`-only gate)
  3. Admin with `year=2026` → 200, all 8 response arrays present
  4. Year param respected: `year=2026` and `year=2025` both return valid 200 responses with correct array shapes
  5. UI: heading "Thống kê tổng hợp" visible, year selector Select visible, Recharts container rendered

## Product defect found and fixed (before this commit)

**`StatisticsAppService` injected `IRepository<MasterCatalog, Guid>`** which is unresolvable because `MasterCatalog` is an abstract base class with no `DbSet` in the DbContext. This caused every call to `/api/v1/app/statistics` to return 500 (Autofac `DependencyResolutionException`).

**Fix**: replaced `IRepository<MasterCatalog, Guid>` with `IRepository<BusinessType, Guid>` (the concrete type the service actually queries to resolve business type labels). Field renamed `_catalogs` → `_businessTypes` throughout.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated | PASS (401) |
| Any authenticated user can access (no permission required) | PASS |
| Admin — full stats with year filter | PASS after fix |
| DTO contract (all 8 stat arrays present) | PASS |
| Year parameter respected | PASS |
| UI: heading, year selector, charts | PASS |

## Notes

- Statistics is guarded by `[Authorize]` only — no `FoodSafe.*` permission constant; any authenticated user can access.
- Data is scoped server-side via `ICurrentDataScopeProvider`.
- Charts use Recharts (`recharts-responsive-container`), not Ant Design charts.

## Paths & dependencies

- FE `src/features/statistics/**`; BE `Application/Dashboard/StatisticsAppService.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after this fix touching these paths
