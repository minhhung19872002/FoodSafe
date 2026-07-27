# F-007 — Self Declarations (Hồ sơ tự công bố)

## Status: VERIFIED

- **Feature ID**: F-007
- **Feature name**: Self Declarations
- **Status**: VERIFIED
- **Verified Git commit**: `232c814`
- **Verification date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080`
- **Real database used**: Yes — PostgreSQL 15 in Docker
- **API interception used**: **No**
- **Test accounts used**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/self-declarations`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/self-declaration`
  - `GET/PUT/DELETE /api/v1/app/self-declaration/{id}`
  - `POST /api/v1/app/self-declaration/{id}/revoke`
  - `POST /api/v1/app/business`, `POST /api/v1/app/product` (fixtures)

## Evidence — spec files (all passing at `232c814`)

- `FoodSafe.FE/e2e/self-declarations.spec.ts` — full UI lifecycle: declaration create, attachment upload, revocation, retention rules.
- `FoodSafe.FE/e2e/self-declarations-verification.spec.ts` — 6 tests:
  1. Unauthenticated → 401.
  2. `noperm` → 403.
  3. Cross-organization: province declaration invisible to district list; direct GET blocked.
  4. Workflow: duplicate declarationNumber per business rejected; revoke without reason → 400; revoke succeeds (status → Revoked/3); double revoke rejected (`AlreadyRevoked`).
  5. Server-side validation: missing declarationNumber → 400.
  6. Persistence after reload via search; empty state ("Trống").

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS |
| Database persistence | PASS |
| Validation (server) | PASS |
| Functional permission | PASS |
| Organization scope | PASS |
| Administrative-area scope | PASS via org hierarchy |
| Workflow (revoke lifecycle) | PASS |
| Duplicate prevention | PASS (unique number per business) |
| Attachments | PASS (main spec uploads and verifies) |
| Empty state | PASS |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Related source paths

- Frontend: `FoodSafe.FE/src/features/self-declarations/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/BusinessManagement/SelfDeclarationAppService.cs`, `FoodSafe.BE/src/FoodSafe.Domain/BusinessManagement/SelfDeclaration.cs`

## Shared dependencies

- Business/Product entities (F-006) — fixture dependency
- Cookie auth, data scope, axios (Level 3)

## Conditions requiring retest

- Changes under related source paths (Level 2); auth/scope changes (Level 3)
- Registry entry invalid for commits after `232c814` touching the above paths
