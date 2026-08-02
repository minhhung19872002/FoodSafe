# F-032 — System Settings (Cấu hình hệ thống)

## Status: DIRTY

- **Feature ID**: F-032 · **Verified Git commit**: `5444001` · **Date**: 2026-07-27
- **DIRTY 2026-08-02**: thêm setting `FoodSafe.Documents.IssuingAgency` (tên cơ quan ban hành in trên PDF — thay hard-code ở 6 PdfAppService) + field mới trên SystemSettingsPage. Retest Level 2: lưu/đọc setting, PDF in đúng tên cơ quan đã cấu hình.
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: N/A (static page) · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/administration/settings`
- **Endpoints**: None — the page is fully static with no backend API calls

## Evidence

- `e2e/system-settings.spec.ts` — UI smoke: heading, password policy labels visible.
- `e2e/system-settings-verification.spec.ts` — 5 tests:
  1. Unauthenticated → redirected to `/login` (PrivateRoute)
  2. `noperm` → settings heading NOT visible (PermissionRoute blocks with `FoodSafe.SystemAdmin.Settings`)
  3. `district.staff` → settings heading NOT visible (same permission gate)
  4. Admin sees full page: heading "Cấu hình hệ thống", system info (.NET 9), password policy (90 ngày, chữ hoa, chữ số), session (Session timeout), security (CAPTCHA đăng nhập, Audit logging)
  5. Static page assertion: no `/api/v1/app/` or `/settings/` API calls fired during page load (confirmed via Playwright request listener)

## Checklist

| Check | Result |
|---|---|
| Unauthenticated → login redirect | PASS |
| `noperm` → permission denied (no heading) | PASS |
| `district.staff` → permission denied | PASS |
| Admin sees all sections (system info, password policy, session, security) | PASS |
| No backend API calls (static page) | PASS |

## Notes

- The page displays read-only configuration values hardcoded in the component — no `ABP SettingManagement` API is called.
- Permission: `FoodSafe.SystemAdmin.Settings` (child of `FoodSafe.SystemAdmin` group).
- Being a pure display component, no CRUD lifecycle, persistence, or empty state applies.

## Paths & dependencies

- FE `src/features/settings/pages/SystemSettingsPage.tsx`; BE: none
- Depends on auth/scope/axios (Level 3 — only for session cookie authentication)
- Invalid for commits after `5444001` touching these paths
