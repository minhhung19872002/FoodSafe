# F-021 — Audit Logs (Nhật ký hoạt động)

## Status: VERIFIED

- **Feature ID**: F-021 · **Verified Git commit**: `3bb49ec` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/administration/audit-logs`
- **Endpoints**: `GET /api/v1/app/audit-log` (custom AppService wrapping ABP's `IAuditLogRepository`)

## Evidence

- `e2e/audit-logs.spec.ts` — UI smoke: page loads, table columns visible, URL filter produces results, pagination total visible.
- `e2e/audit-logs-verification.spec.ts` — 7 tests:
  1. Unauthenticated → 401/302
  2. `noperm` → 403
  3. `district.staff` → 403 (AuditLogs is a province SystemAdmin function)
  4. Admin list → 200, `totalCount > 0` (prior E2E test activity populates entries)
  5. URL filter: entries returned all contain the filter string in their URL
  6. httpMethod filter: `POST` filter returns only POST entries
  7. UI: heading visible, table rows visible, pagination summary, URL filter search, empty state for non-existent URL

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| District staff denied (no SystemAdmin.AuditLogs permission) | PASS |
| List accessible to admin, totalCount > 0 | PASS |
| URL filter | PASS |
| httpMethod filter | PASS |
| UI table, pagination, search, empty state | PASS |
| Read-only — no create/update/delete | N/A (by design) |

## Notes

- Audit logs are read-only by design — ABP automatically records every HTTP request in the `AbpAuditLogs` table.
- Prior E2E test runs generate sufficient entries for filter tests (no seed fixture needed).
- Permission: `FoodSafe.SystemAdmin.AuditLogs` (child of SystemAdmin group).

## Paths & dependencies

- FE `src/features/audit-logs/**`; BE `Application/Dashboard/AuditLogAppService.cs`
- Depends on auth/scope/axios (Level 3), ABP AuditLogging module
- Invalid for commits after `3bb49ec` touching these paths
