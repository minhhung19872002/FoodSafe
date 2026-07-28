# F-008 — Product Registrations (Đăng ký công bố sản phẩm)

## Status: VERIFIED

- **Feature ID**: F-008 · **Verified Git commit**: `8e7840e` · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` (api + frontend rebuilt from this tree) · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/product-registrations`
- **Endpoints**: `GET/POST /api/v1/app/product-registration`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`, `.../{id}/attachments*`, `.../excel/export`, `/api/v1/public/product-registrations` (+ `/{id}/pdf`), fixtures via `/api/v1/app/business`, `/api/v1/app/product`

## Hardening pass (2026-07-28, `8e7840e`) — same defect series as F-006/F-007/F-009/F-011

- **BE**: `ApplySorting` Id tiebreaker (stable paging across pages of equal RegistrationDate — verified via API paging 18 same-date rows in chunks of 5, zero dupes/misses); Excel export honours `Sorting`; domain guard rejects `default(DateTime)` RegistrationDate (`FoodSafe:ProductRegistration:0006` + domain test).
- **BE**: vi/en localization added for `FoodSafe:ProductRegistration:0001–0006` — duplicate number now surfaces as "Số đăng ký công bố đã tồn tại." instead of ABP's "internal error" text (real-browser toast asserted).
- **FE**: business select disabled on edit + name fallback option; `extractApiError` on all mutation toasts; `isFetching` table loading; search placeholder includes nhà sản xuất; column widths reduced (scroll.x 1250→960) so Hết hạn + Trạng thái are visible at 1280px; attachments empty text "Chưa có tệp đính kèm".
- **Spec**: `product-registrations.spec.ts` confirm-click fixed to `/^(Xóa|Đồng ý|OK)$/`.

## Evidence (run at `8e7840e` tree, workers=1, no interception)

- `e2e/product-registrations.spec.ts` + `e2e/product-registrations-verification.spec.ts` — **6/6**: DKCB lifecycle, public lookup, attachments, retention; 401 unauthenticated; 403 `noperm`; cross-org hidden + GET blocked; revoke + double-revoke rejected; duplicate number rejected; missing number → 400; persistence after reload + empty state.
- Throwaway verification spec (real login, then deleted): duplicate toast shows the specific vi message; edit-mode business select has `ant-select-disabled`; Trạng thái header in viewport at 1280×720; attachments empty text visible; API sort asc/desc ordering correct; paged union == single-shot set (tiebreaker).
- BE: Domain ProductRegistration tests **4/4** (incl. new default-date guard), Application Licensing contract tests **48/48**. FE: Vitest product-registrations **3 files / 4 tests** pass; `tsc -b` clean; oxlint clean.
- Level-1 smoke for shared-modal consumer routes (`/cfs-certificates`, `/advertisement-registrations`, `/export-food-certificates`, `/eligibility-certificates`): all load, no page errors (attachments-modal emptyText change).

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS (401 / 403 / hidden+blocked / via org hierarchy) |
| Validation, duplicate prevention (specific vi message) | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Sorting direction + stable pagination (tiebreaker) | PASS |
| Persistence after reload, empty state, loading (isFetching) | PASS |
| Attachments, public lookup, PDF, Excel (sorted) | PASS |
| Expiry/Status columns visible at 1280px | PASS |

## Paths & dependencies

- FE `src/features/product-registrations/**`; BE `Application/Licensing/ProductRegistration*.cs`, `Domain/Licensing/ProductRegistration.cs`, `Domain.Shared` error codes + localization
- Depends on Business/Product (F-006), auth/scope/axios/apiError (Level 3)
- `ProductRegistrationAttachmentsModal` is cross-imported by F-009/F-011/F-012/F-013 pages (pre-existing debt — promote to `src/components/`); changes to it need Level-1 smoke on those routes
- Invalid for commits after `8e7840e` touching these paths
