# F-020 — Identity Administration (Tài khoản và quyền)

## Status: VERIFIED

- **Feature ID**: F-020 · **Verified Git commit**: `d56eb2c` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/administration/identity` (tabs: Tài khoản / Vai trò và quyền)
- **Endpoints** (custom, not ABP identity built-ins):
  - `GET /api/v1/administration/users`
  - `GET /api/v1/administration/users/{id}`
  - `GET/POST /api/v1/administration/roles`
  - `GET/PUT/DELETE /api/v1/administration/roles/{id}`

## Evidence

- `e2e/identity-administration.spec.ts` — UI lifecycle: role create via dialog, edit description, delete with Popconfirm, user tab column header, user list non-empty.
- `e2e/identity-administration-verification.spec.ts` — 7 tests:
  1. Unauthenticated → 401/302 on both users and roles endpoints
  2. `noperm` → 403 on users and roles
  3. `district.staff` → 403 (SystemAdmin is province-level; district role has no `FoodSafe.SystemAdmin.*` permissions)
  4. Role CRUD lifecycle: create → GET (verify name + description + concurrencyStamp) → PUT with concurrencyStamp (verify updated description) → follow-up GET (persisted) → DELETE → GET returns 404
  5. Validation: missing role name → 400
  6. User list readable by admin: returns `{ items: [...], totalCount: N }`, seeded `admin` account present
  7. Persistence after reload + empty state (UI): create role → navigate to `/administration/identity` → roles tab → search → assert visible → reload → re-search → assert visible → search non-existent → assert antd Empty

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403) |
| District staff (no SystemAdmin permissions) | PASS — 403 at authorization layer |
| Role CRUD lifecycle | PASS |
| Optimistic concurrency (concurrencyStamp required on update) | PASS |
| Server-side validation | PASS |
| User list readable, contains seeded accounts | PASS |
| Persistence after reload, empty state (UI) | PASS |
| Org scope | Province-only access enforced via permission layer; district role denied before reaching data filter |

## Notes

- The feature uses **custom** API routes (`/api/v1/administration/...`), not ABP's built-in `/api/identity/...` endpoints.
- Role `PUT` requires `concurrencyStamp` from the preceding `GET` — optimistic concurrency control enforced at the DTO layer.
- User creation (POST /api/v1/administration/users) was not tested here because it triggers a password-reset email through Mailpit and requires complex `geographyScopes`/`roleNames` setup. Covered by the existing smoke spec.
- Static system roles (e.g. SystemAdmin) cannot be renamed or deleted — enforced in AppService business logic.

## Paths & dependencies

- FE `src/features/identity/**`; BE `Application/IdentityAdministration/IdentityAdministrationAppService.cs`, `HttpApi/IdentityAdministration/IdentityAdministrationController.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `d56eb2c` touching these paths
