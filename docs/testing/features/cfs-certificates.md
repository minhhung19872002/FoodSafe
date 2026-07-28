# F-011 — CFS Certificates (Chứng nhận lưu hành tự do)

## Status: VERIFIED

## Re-verification 2026-07-28 — production-readiness hardening

Deep FE+BE inspection of `/cfs-certificates`; fixes re-proven on the rebuilt
Docker stack (no API interception). Doubles as the Level-2 retest owed by the
sorting DIRTY batch (default `CreationTime desc` + sortable "Ngày cấp" column
exercised through the real UI spec).

| # | Defect | Fix |
|---|---|---|
| 1 | Editor allowed changing the owning business when editing — server always rejects (`ProductMismatch`) behind a generic toast | Business select disabled in edit mode + name-not-GUID fallback option when the record's business is outside the Active-500 options window |
| 2 | Error toasts hardcoded — server reasons (duplicate number, product mismatch, invalid date range, country-not-found, already-revoked, export-too-large) never reached the user | `extractApiError` for save/delete/revoke/export |
| 3 | `loading` used `isLoading` with `keepPreviousData` | switched to `isFetching` |
| 4 | BE Excel export dropped `Sorting` → exported order never matched the on-screen order | `Sorting` copied into the export paging input |
| 5 | Spec clicked confirm button `"OK"` (RowActions renders antd vi_VN "Đồng ý") | spec clicks `/^(Xóa|Đồng ý|OK)$/` inside the dialog |

- **Evidence run** (workers=1): `cfs-certificates.spec.ts` (lifecycle + public
  lookup + attachments + retention) + `cfs-certificates-verification.spec.ts`
  → **6/6 passed**. FE Vitest cfs **4/4**; BE Application build 0 errors;
  `tsc -b` clean.
- Same cross-feature `ProductRegistrationAttachmentsModal` import debt as
  F-009 (documented there).

- **Feature ID**: F-011 · **Verified Git commit**: `df7823c` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/cfs-certificates`
- **Endpoints**: `GET/POST /api/v1/app/cfs-certificate`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`, `GET .../country-options` (real destination country fixture)

## Evidence

- `e2e/cfs-certificates.spec.ts` — UI lifecycle: CFS create with destination country, public lookup, attachments, retention rules.
- `e2e/cfs-certificates-verification.spec.ts` (shared suite) — 5 tests: unauthenticated → 401; `noperm` → 403; cross-org hidden + GET blocked; revoke/double-revoke/duplicate/missing-number; persistence after reload + empty state.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS |
| Validation, duplicate certificateNumber prevention | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Persistence after reload, empty state | PASS |
| Destination-country requirement, public lookup, attachments | PASS (main spec + fixture) |

## Paths & dependencies

- FE `src/features/cfs-certificates/**`; BE `Application/Licensing/CfsCertificateAppService.cs`
- Depends on Business (F-006), Country catalog, auth/scope/axios (Level 3)
- Invalid for commits after `df7823c` touching these paths
