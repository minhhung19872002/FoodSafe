# F-003 — Organization Management

## Status: VERIFIED

- **Feature ID**: F-003 · **Verified Git commit**: `94f1f57` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/organizations`
- **Endpoints**:
  - `GET /api/v1/app/organization` — list (paged)
  - `POST /api/v1/app/organization` — create
  - `PUT /api/v1/app/organization/{id}` — update
  - `DELETE /api/v1/app/organization/{id}` — delete

## Evidence

`e2e/organizations-verification.spec.ts` — 7 tests:
1. Unauthenticated API access → 401
2. User without `Organizations.View` → 403
3. district.staff with `Organizations.View` → 200 scoped list
4. Admin full CRUD (create → read → update → delete)
5. Duplicate org code → 400
6. Org scope isolation: district.staff cannot see admin-created E2E org (scoped filter)
7. UI: seeded organizations visible, persist after reload

## Organization scope enforcement

- Admin has `DataScope.All` → sees all organizations (global).
- district.staff has scoped access → `OrganizationAppService` filters to `allowedIds` (the org hierarchy the user belongs to).
- Verified: district.staff GET returns a list that does NOT include the admin-created E2E org (`e2e-org-code` / `E2E Tổ Chức Test`).

## Checklist

| Check | Result |
|---|---|
| Unauthenticated → 401 | PASS |
| No-permission → 403 | PASS |
| district.staff scoped view → 200 | PASS |
| Admin create/read/update/delete | PASS |
| Duplicate code → 400 | PASS |
| Org scope isolation | PASS |
| UI persistence after reload | PASS |

## Notes

- Seeded province ID used for org creation: `e2e00000-0000-4000-8001-000000000001` (Quảng Ninh).
- Seeded org (CCATVSTP-QN) is visible to district.staff. Admin-created orgs are scoped out.
- DataScope is enforced in `OrganizationAppService.GetListAsync` — not in the controller.

## Paths & dependencies

- FE: `src/features/organizations/`
- BE: `FoodSafe.Application/Organizations/OrganizationAppService.cs`
- Depends on: Authentication (F-001), Geographic Catalogs (F-005) for address dropdowns
