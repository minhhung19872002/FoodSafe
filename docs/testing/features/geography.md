# F-005 — Geographic Catalogs

## Status: VERIFIED

- **Feature ID**: F-005 · **Verified Git commit**: (see registry) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/geography`
- **Endpoints**:
  - `GET /api/v1/app/geographic-catalog/provinces` → `ListResultDto<ProvinceDto>` (no totalCount)
  - `GET /api/v1/app/geographic-catalog/districts/{provinceId}` → `ListResultDto<DistrictDto>`
  - `GET /api/v1/app/geographic-catalog/communes/{districtId}` → `ListResultDto<CommuneDto>`

## Evidence

`e2e/geography-verification.spec.ts` — 6 tests:
1. Unauthenticated → 401
2. No-permission → 403
3. district.staff with `GeographicCatalogs.View` can list provinces → 200
4. All three geographic levels return seeded data (Quảng Ninh → Hạ Long → communes)
5. `activeOnly` flag filters correctly (all≥active)
6. UI: all three tabs load with correct column headers; provinces has data rows; districts/communes require selection

## Product defects found and fixed

1. **`useGeography.ts` sent `provinceId` and `districtId` as query string params** but ABP exposes them as route segments. `GET /districts?provinceId=...` returns 404; the correct call is `GET /districts/{provinceId}`. Fixed: changed `queryFn` to use path segments `districts/${provinceId}` and `communes/${districtId}`.

## Seeded IDs

| Name | ID |
|---|---|
| Quảng Ninh (province) | `e2e00000-0000-4000-8001-000000000001` |
| Hạ Long (district) | `e2e00000-0000-4000-8002-000000000001` |

## Checklist

| Check | Result |
|---|---|
| Unauthenticated → 401 | PASS |
| No-permission → 403 | PASS |
| district.staff view → 200 | PASS |
| Provinces seeded (Quảng Ninh present) | PASS |
| Districts by province (route segment) | PASS |
| Communes by district (route segment) | PASS |
| activeOnly flag | PASS |
| UI tabs and column headers | PASS |
| UI reload persists | PASS |

## ABP route segment convention

ABP generates route segments for ALL Guid parameters in method signatures — not just the conventional `id` parameter. `GetDistrictsAsync(Guid provinceId)` → `GET /districts/{provinceId}`. Tests must use route segments, not query strings. Verified via `GET /api/abp/api-definition`.

## Notes

- Geographic catalog endpoints return `ListResultDto<T>` (no pagination, no `totalCount` field). Tests must use `items.length` — not `totalCount`.
- Districts/communes tabs in UI require a province/district to be selected before the API fires (`enabled: provinceId.length > 0` condition in TanStack Query hook).

## Paths & dependencies

- FE: `src/features/geography/`, `src/hooks/useGeography.ts`, `src/lib/geographyApi.ts`
- BE: `FoodSafe.Application/Catalogs/GeographicCatalogAppService.cs`
- Depends on: Authentication (F-001)
- Used by: Business Management (F-006+) address pickers, org creation (F-003)
