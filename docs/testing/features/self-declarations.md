# F-007 — Self Declarations (Hồ sơ tự công bố)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening (working tree, after `dccac2e`)

Deep FE+BE inspection of `/self-declarations`; defects found and fixed, re-proven
on the rebuilt Docker stack (no API interception):

| # | Defect | Fix |
|---|---|---|
| 1 | Editor allowed changing the owning business when editing — the server always rejects it (`ProductMismatch`) behind a generic toast | Business select disabled in edit mode; when the record's business is outside the Active-500 options window its name (not a GUID) is injected as an option |
| 2 | Error toasts hardcoded — server reasons (duplicate number, invalid date range, cannot-modify-revoked, already-revoked, export-too-large) never reached the user | `extractApiError` adopted for save/delete/revoke/export |
| 3 | `loading` used `isLoading` with `keepPreviousData` — filter changes showed stale data with no indicator | switched to `isFetching` |
| 4 | Deleting a business left its self-declarations orphaned (list rows with empty business name) | F-006 delete guard extended: `FoodSafe:Business:0010` (renamed `BusinessInUse`) now blocks while products **or** self-declarations exist; vi/en messages updated |
| 5 | `self-declarations.spec.ts` clicked confirm button `"OK"` — RowActions confirm renders the antd vi_VN label ("Đồng ý") | spec clicks `/^(Xóa|Đồng ý|OK)$/` inside the dialog |

- **Evidence run** (workers=1): `self-declarations.spec.ts`,
  `self-declarations-verification.spec.ts`, `business-delete-guard.spec.ts`
  (extended with the self-declaration block/unblock scenario), plus the F-006
  Level-2 retest (`businesses`, `businesses-verification`,
  `business-list-filters`, `business-detail-tabs`) → **20/20 passed**.
- BE `FoodSafe.Application.Tests` BusinessManagement **35/35**; FE Vitest
  self-declarations **3/3**; `tsc -b` clean.
- Commit stamping deferred to the commit that lands this shared working tree.

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
