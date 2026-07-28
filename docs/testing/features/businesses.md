# F-006 — Businesses & Products (Cơ sở và sản phẩm)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening (HEAD `dccac2e` + working tree)

Deep FE+BE inspection of `/businesses`; 7 defects found and fixed, all
re-proven on the freshly rebuilt Docker stack (api + frontend images built
from this working tree; no API interception):

| # | Defect | Fix |
|---|---|---|
| 1 | BE `BusinessExcelAppService.ExportAsync` dropped `ProvinceId`/`DistrictId`/`CommuneId`/`Sorting` → exported file ignored geographic filters | Copy all filters + sorting into the paged input |
| 2 | FE export button sent only `filter`+`status` (dropped type/classification/province/district/sorting) | Pass every active filter |
| 3 | Deleting a business soft-deleted it but left its products active (orphans in the product list) | New guard `FoodSafe:Business:0010` (vi+en localized): delete refused while products exist |
| 4 | Delete/save toasts were hardcoded ("Không thể xóa cơ sở đang được sử dụng") — server business-rule reasons (duplicate code/tax code, guard) never reached the user | `extractApiError` adopted for business/product/handler create-update-delete |
| 5 | Map view marker click opened the **edit modal** regardless of Edit permission | Marker click now opens the detail drawer |
| 6 | `DateTime` values from BE (`2020-01-01T00:00:00`) rendered blank in `<input type="date">` when editing (business establishedDate + 4 handler dates) | Normalize to `YYYY-MM-DD` on form reset |
| 7 | UX gaps: coordinates could never be cleared once set; handler expiry-before-issue dates only failed server-side with a generic toast; stale/no loading indicator (`isLoading` + cross-tab OR with `keepPreviousData`) | "Xóa tọa độ" button; zod `superRefine` date-order messages on the handler form; per-tab `isFetching` |

- **New spec**: `e2e/business-delete-guard.spec.ts` (2 tests, `locale: vi-VN`) —
  API + real-UI proof of the delete guard (403 + `FoodSafe:Business:0010`,
  Vietnamese toast from the server, delete succeeds after removing the product)
  and export-honours-filter proof (no-match `ProvinceId` workbook strictly
  smaller than the unfiltered one; both valid xlsx).
- **Evidence run** (Docker stack rebuilt from this tree, workers=1):
  `businesses.spec.ts`, `businesses-verification.spec.ts`,
  `business-list-filters.spec.ts`, `business-detail-tabs.spec.ts`,
  `business-delete-guard.spec.ts` → **13/13 passed**. BE
  `FoodSafe.Application.Tests` (BusinessManagement filter) **35/35**; FE Vitest
  businesses **13/13**; `tsc -b` clean.
- **Note**: `businesses.spec.ts` confirm-dialog clicks updated to accept any of
  `Xóa|Đồng ý|OK` — the RowActions confirm modal renders the antd-locale
  default label ("Đồng ý" under vi_VN), while ~20 other in-flight specs from
  the concurrent UI-refactor session still click `"OK"` and will fail the same
  way until updated.
- Commit stamping deferred to the commit that lands this shared working tree
  (concurrent session owns unrelated dirty files).

- **Feature ID**: F-006
- **Feature name**: Businesses & Products
- **Status**: VERIFIED
- **Verified Git commit**: `87cb7f6`
- **Verification date**: 2026-07-27
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`
- **Real database used**: Yes — PostgreSQL 15 in Docker, real EF Core migrations
- **API interception used**: **No**
- **Test accounts used**:
  - `admin` (global access)
  - `district.staff@foodsafe.local` (DistrictStaff — has Businesses.Create, scoped to district org)
  - `noperm@foodsafe.local` (no roles)
- **Frontend route**: `/businesses`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/business`
  - `GET/PUT/DELETE /api/v1/app/business/{id}`
  - handlers/products endpoints via main lifecycle spec

## Evidence — spec files (all passing at `87cb7f6`)

- `FoodSafe.FE/e2e/businesses.spec.ts` — full business/handler/product lifecycle through the UI.
- `FoodSafe.FE/e2e/businesses-verification.spec.ts` — 6 tests:
  1. Unauthenticated `GET /api/v1/app/business` → 401.
  2. `noperm` user denied → 403.
  3. **Client-supplied organizationId cannot bypass server scope**: `district.staff` POST with province `organizationId` → 403 (`EnsureOrganizationAccessAsync`); same POST with own district org succeeds — proving the denial is scope-based, not permission-based.
  4. Cross-organization isolation: province business absent from district list; direct GET blocked; changing `organizationId` on update rejected ("Changing the owning organization is not supported").
  5. Duplicate business code rejected; server-side validation: missing name → 400, invalid email → 400, latitude 91 → 400.
  6. Persistence after reload (search finds business after `page.reload()`); empty state ("Trống") for unmatched search.

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403) |
| Database persistence | PASS |
| Validation (server) | PASS (Required, EmailAddress, Range attributes enforced) |
| Functional permission | PASS (noperm → 403) |
| Organization scope (read) | PASS (district cannot list/fetch province business) |
| Organization scope (write) | PASS (org-bypass create → 403; own-org create → 200) |
| Org reassignment guard | PASS (update with different organizationId → 403) |
| Administrative-area scope | PASS via organization hierarchy scope |
| Duplicate prevention | PASS (code uniqueness) |
| Lifecycle (create/edit/products/handlers) | PASS (main spec UI flow) |
| Empty state | PASS |
| Error state | PASS at API level |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Related source paths

- Frontend: `FoodSafe.FE/src/features/businesses/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/BusinessManagement/**`, `FoodSafe.BE/src/FoodSafe.Domain/BusinessManagement/**`

## Shared dependencies

- Cookie authentication + antiforgery (Level 3)
- `CurrentDataScopeProvider` / `EnsureOrganizationAccessAsync` (Level 3)
- axios instance (Level 3)
- Business entity is a dependency of Inspection (F-013), Self Declarations (F-007), Certificates (F-010..F-012) — business schema changes trigger Level 3 regression on those

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Auth/data-scope changes (Level 3)
- Registry entry invalid for commits after `87cb7f6` touching the above paths
