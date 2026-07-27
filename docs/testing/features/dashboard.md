# F-022 — Dashboard (Trang chủ)

## Status: VERIFIED

- **Feature ID**: F-022 · **Verified Git commit**: `7316838` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/dashboard` (default redirect from `/`)
- **Endpoints**: `GET /api/v1/app/dashboard/stats`

## Evidence

- `e2e/dashboard.spec.ts` — UI smoke: greeting heading, stat cards, license breakdown table.
- `e2e/dashboard-verification.spec.ts` — 5 tests:
  1. Unauthenticated → 401/302
  2. `noperm` (authenticated, no permissions) → 200 (dashboard is `[Authorize]`-only)
  3. Admin receives well-formed DTO: all numeric fields present, arrays for licenseBreakdown and recentActivities; `totalBusinesses > 0` from prior test activity
  4. District staff receives scoped stats: 200 + `totalBusinesses ≥ 0` (org-scoped)
  5. UI: heading `/Xin chào/`, stat cards, license breakdown chart/table visible

## Checklist

| Check | Result |
|---|---|
| Unauthenticated | PASS (401) |
| Any authenticated user can access (no permission required) | PASS |
| Admin — full province-scoped stats | PASS |
| District staff — org-scoped stats | PASS |
| DTO contract (all fields present) | PASS |
| UI: heading, cards, breakdown table | PASS |

## Notes

- Dashboard is guarded by `[Authorize]` only — no `FoodSafe.*` permission constant is defined; any valid login can access.
- Data is scoped server-side via `ICurrentDataScopeProvider`; global admins see all records, district staff see only their org's data.

## Paths & dependencies

- FE `src/features/dashboard/**`; BE `Application/Dashboard/DashboardAppService.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `7316838` touching these paths
