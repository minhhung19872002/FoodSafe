# F-004 — Master Catalogs

## Status: VERIFIED

- **Feature ID**: F-004 · **Verified Git commit**: (see registry) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/catalogs`
- **Endpoints**:
  - `GET /api/v1/app/master-catalog/countries` — list countries
  - `GET /api/v1/app/master-catalog/regions` — list regions
  - `GET /api/v1/app/master-catalog/document-types` — list document types
  - `POST /api/v1/app/master-catalog/document-types` — create
  - `PUT /api/v1/app/master-catalog/document-types/{id}` — update
  - `DELETE /api/v1/app/master-catalog/document-types/{id}` — delete

## Evidence

`e2e/catalogs-verification.spec.ts` — 7 tests:
1. Unauthenticated → 401
2. No-permission user → 403
3. district.staff with `Catalogs.View` can GET seeded catalog types → 200
4. district.staff without `Catalogs.Create` cannot POST → 403
5. Admin full CRUD on DocumentType
6. Multiple seeded catalog types have data (`countries` and `regions` are seeded by `MasterCatalogDataSeedContributor`)
7. UI: catalog management page loads with data

## Seeded data clarification

`MasterCatalogDataSeedContributor` seeds: **Countries** and **Regions** only.
`business-types`, `product-groups`, and `document-types` are NOT seeded — tests use Countries and Regions to verify seeded data presence.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated → 401 | PASS |
| No-permission → 403 | PASS |
| district.staff view → 200 | PASS |
| district.staff create → 403 | PASS |
| Admin CRUD (DocumentType) | PASS |
| Multiple catalog types seeded | PASS |
| UI page loads | PASS |

## Notes

- `Catalogs.View` permission is granted to `district.staff` role.
- `Catalogs.Create`, `Catalogs.Edit`, `Catalogs.Delete` are NOT granted to `district.staff` — staff can only read.
- Returned lists are `PagedResultDto<T>` (has `totalCount`).

## Paths & dependencies

- FE: `src/features/catalogs/`
- BE: `FoodSafe.Application/Catalogs/`
- Depends on: Authentication (F-001)
