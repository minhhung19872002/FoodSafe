# F-012 — Export Food Certificates (GCN thực phẩm xuất khẩu)

## Status: VERIFIED

- **Feature ID**: F-012 · **Verified Git commit**: xem registry (hardening commit sau `819b803`) · **Date**: 2026-07-28
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/export-food-certificates` (+ public `/tra-cuu-gcn-xuat-khau`)
- **Endpoints**: `GET/POST /api/v1/app/export-food-certificate`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`, `GET .../excel/export`, `GET /api/v1/public/export-food-certificates`

## Hardening 2026-07-28 (production-readiness pass)

Defects found by the vi-VN real-browser audit and fixed:

1. **500 on every create/update from a vi-VN browser** — `[Range(typeof(decimal), "0", "999999999.999")]` on `Quantity` parsed its string limits with the request culture; vi-VN threw `FormatException` → 500 until an en-US request warmed the validator cache (per DTO type). E2E had missed it because Playwright defaults to en-US. Fix: `ParseLimitsInInvariantCulture = true`. **Re-verified on a cold-cache (freshly restarted) api container: first vi-VN POST → 200, PUT → 200.**
2. Editor allowed changing the owning business on edit but `UpdateAsync` always rejects it — business select now disabled on edit + fallback name option when the business is outside the 500-option list; vi message 0003 clarified.
3. Excel export dropped `Sorting` — now passed through.
4. `ApplySorting` lacked the `.ThenBy(Id)` paging tiebreaker — added.
5. API accepted default `0001-01-01` IssueDate — domain guard `InvalidIssueDate` (code `FoodSafe:ExportFoodCertificate:0007`, localized) — verified via direct API: 403 + localized message.
6. Hardcoded error toasts → `extractApiError` (BE-localized messages now surface, e.g. duplicate number).
7. `isLoading` → `isFetching` (spinner during refetch with `keepPreviousData`).
8. Certificate-number search was case-sensitive (numbers stored uppercase) — filter now uppercased server-side.
9. Table `scroll.x` 1600 → 1300 (status/date columns were pushed out of view at 1280px).
10. Spec confirm click `name: "OK"` → `/^(Xóa|Đồng ý|OK)$/` (antd vi_VN renders "Đồng ý").

## Evidence (2026-07-28 hardening run)

Real Playwright browser (locale vi-VN), real login, no FoodSafe API interception; scripted checks 12/14 PASS + the 2 toast-read misses re-proven by a MutationObserver DOM probe (captured `ant-message-notice-error` with "Số giấy chứng nhận xuất khẩu đã tồn tại."):

- Create (vi-VN, cold validator cache) → POST 200; lowercase-input number normalized to uppercase.
- Lowercase search finds the uppercase-stored number (1 row).
- Duplicate number → localized BE toast.
- Edit: business select disabled; notes update PUT 200 (vi-VN).
- API POST without issueDate → 403 `FoodSafe:ExportFoodCertificate:0007` "Ngày cấp không hợp lệ."
- Excel export with `Sorting=issueDate asc` → 200.
- Revoke → persists after reload; revoked row menu reduced to Xóa; StatusBadge "Đã thu hồi".
- Public lookup shows the certificate incl. revoked state; not-found shows a clear vi message.
- `noperm` API → 403 + route shows "Không có quyền truy cập"; unauthenticated → 401.
- Delete via "Đồng ý" confirm → record gone (verified by follow-up API query = 0 rows).
- Browser console: no unexpected errors.
- Legacy suites: `e2e/export-food-certificates.spec.ts`, `e2e/export-food-certificates-verification.spec.ts` (5 tests) remain the regression suites.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS |
| Validation, duplicate certificateNumber prevention (localized toast) | PASS |
| vi-VN culture create/update (cold cache) | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Persistence after reload, empty state | PASS |
| Public lookup, attachments | PASS |

## Paths & dependencies

- FE `src/features/export-food-certificates/**`; BE `Application/Licensing/ExportFoodCertificate*.cs`, `Domain/Licensing/ExportFoodCertificate.cs`, `Application.Contracts/Licensing/ExportFoodCertificateDtos.cs`
- Shared (dùng, không sửa): `ProductRegistrationAttachmentsModal`, `@/lib/apiError`, StatusBadge/ExpiryTag/RowActions/RecordDetailDrawer
- Depends on Business (F-006), auth/scope/axios (Level 3)
- Invalid for later commits touching these paths
