# F-009 — Advertisement Registrations (Đăng ký quảng cáo)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening

Deep FE+BE inspection of `/advertisement-registrations`; fixes re-proven on the
rebuilt Docker stack (no API interception). Doubles as the Level-2 retest owed
by the sorting DIRTY batch (default order `CreationTime desc` + sortable
"Ngày cấp" column exercised through the real UI spec).

| # | Defect | Fix |
|---|---|---|
| 1 | Editor allowed changing the owning business when editing — server always rejects (`ProductMismatch`) behind a generic toast | Business select disabled in edit mode + name-not-GUID fallback option when the record's business is outside the Active-500 options window |
| 2 | Error toasts hardcoded — server reasons (duplicate number, products-required/mismatch, invalid date range, already-revoked, export-too-large) never reached the user | `extractApiError` for save/delete/revoke/export |
| 3 | `loading` used `isLoading` with `keepPreviousData` | switched to `isFetching` |
| 4 | BE Excel export dropped `Sorting` → exported order never matched the on-screen order | `Sorting` copied into the export paging input |
| 5 | Spec clicked confirm button `"OK"` (RowActions renders antd vi_VN "Đồng ý") | spec clicks `/^(Xóa|Đồng ý|OK)$/` inside the dialog |

- **Evidence run** (workers=1): `advertisement-registrations.spec.ts` +
  `advertisement-registrations-verification.spec.ts` → **6/6 passed**.
  BE `FoodSafe.Application.Tests` Licensing **48/48**; FE Vitest ads **4/4**;
  `tsc -b` clean.
- **Known architecture debt (pre-existing, unchanged)**: this page (and
  cfs/eligibility/export-food certificates) imports
  `ProductRegistrationAttachmentsModal` across feature folders — violates the
  no-cross-feature-import rule; the component is generic and should move to
  `src/components/`. Deferred: moving it touches 5 features mid-flight.

- **Feature ID**: F-009 · **Verified Git commit**: `df7823c` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/advertisement-registrations`
- **Endpoints**: `GET/POST /api/v1/app/advertisement-registration`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`; fixtures via business + product (registration requires `productIds` min 1 — verified server-side)

## Evidence

- `e2e/advertisement-registrations.spec.ts` — UI lifecycle: multi-product registration, file, revocation, retention rules.
- `e2e/advertisement-registrations-verification.spec.ts` (shared suite `e2e/helpers/licensing.ts`) — 5 tests: unauthenticated → 401; `noperm` → 403; cross-org hidden + GET blocked; revoke/double-revoke/duplicate/missing-number; persistence after reload + empty state.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS |
| Validation (incl. `productIds` min length server rule), duplicate prevention | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Persistence after reload, empty state | PASS |
| Attachments, multi-product | PASS (main spec) |

## Paths & dependencies

- FE `src/features/advertisement-registrations/**`; BE `Application/Licensing/AdvertisementRegistrationAppService.cs`
- Depends on Business/Product (F-006), auth/scope/axios (Level 3)
- Invalid for commits after `df7823c` touching these paths
