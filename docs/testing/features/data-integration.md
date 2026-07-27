# F-019 — Data Integration (Tích hợp dữ liệu)

## Status: VERIFIED

- **Feature ID**: F-019 · **Verified Git commit**: `11a6537` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/data-integration` (tabs: Cấu hình API / Lịch sử gọi API)
- **Endpoints**:
  - `GET/POST /api/v1/app/api-endpoint`
  - `GET/PUT/DELETE /api/v1/app/api-endpoint/{id}`
  - `POST /api/v1/app/api-endpoint/{id}/toggle-status`
  - `GET /api/v1/app/api-call-log`
  - `GET /api/v1/app/api-call-log/{id}`

## Evidence

- `e2e/data-integration.spec.ts` — UI lifecycle: endpoint creation via dialog (name, URL, method, system, auth), delete, call-history tab navigation.
- `e2e/data-integration-verification.spec.ts` — 7 tests:
  1. Unauthenticated → 401/302
  2. `noperm` → 403 on endpoint list
  3. `district.staff` → 403 on both endpoint list and call-log list (DataIntegration is a province-level function)
  4. Full CRUD lifecycle: create → GET by id (verify fields) → update (name, method, system) → toggle-status Active→Inactive→Active → delete → GET returns 404
  5. Server-side validation: missing Name, missing URL, missing HttpMethod, missing ExternalSystem each → 400
  6. Call history readable by admin: GET /api/v1/app/api-call-log → 200, returns `{ items: [], totalCount: N }`
  7. Persistence after reload + empty state (UI): create fixture → search on `/data-integration` → assert visible → reload → re-search → assert visible → search non-existent → assert antd Empty

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| District staff (no DataIntegration permissions) | PASS — 403 at authorization layer |
| Full CRUD lifecycle | PASS |
| Toggle-status Active↔Inactive | PASS |
| Server-side validation | PASS |
| Call history readable | PASS |
| Persistence after reload, empty state (UI) | PASS |
| Org scope | PASS structurally — same `ScopedQueryAsync`/`GetScopedAsync` pattern as F-006..F-018; province-only access enforced via permission layer for district role |

## Notes

- DataIntegration is a province-level capability — district staff are denied at the permission check before reaching org-scope filtering, identical to F-017 (TestingResults).
- `ToggleStatusAsync` returns `void` (204 No Content) — the test verifies the new status by issuing a follow-up `GET`.
- No duplicate-name constraint exists in the AppService; duplicates are allowed by design.
- UI search placeholder on the Cấu hình API tab is `"Tên, URL, hệ thống"` (not a generic "Tìm kiếm...").

## Paths & dependencies

- FE `src/features/data-integration/**`; BE `Application/DataIntegration/ApiEndpointAppService.cs`, `Application/DataIntegration/ApiCallLogAppService.cs`, `Domain/DataIntegration/ApiEndpoint.cs`, `Domain/DataIntegration/ApiCallLog.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `11a6537` touching these paths
