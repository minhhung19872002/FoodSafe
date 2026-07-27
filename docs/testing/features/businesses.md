# F-006 — Businesses & Products (Cơ sở và sản phẩm)

## Status: VERIFIED

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
