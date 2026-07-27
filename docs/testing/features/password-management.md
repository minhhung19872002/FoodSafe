# F-002 — Password Management (Quản lý mật khẩu)

## Status: VERIFIED

- **Feature ID**: F-002 · **Verified Git commit**: `b2f13fb` · **Date**: 2026-07-27
- Previous status was BLOCKED ("no Playwright spec exists"). Inspection showed the feature IS fully implemented (BE `AccountSecurityAppService` with change/initial-change/reset + password history + 90-day validity; FE `/account/change-password` route with forced-redirect in `PrivateRoute`), so a verification spec was written and the status moved directly through READY_FOR_TEST to VERIFIED.
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin` (fixture management only) plus a **throwaway user created through the real `/api/identity/users` API per run** — shared accounts are never mutated.
- **Endpoints**: `POST /api/v1/app/account-security/change-password`, `POST /api/account/login`, `POST/DELETE /api/identity/users`

## Evidence — `e2e/password-management-verification.spec.ts` (passing at `b2f13fb`)

1. Unauthenticated change-password rejected.
2. Full lifecycle on a throwaway user:
   - wrong current password → business error;
   - weak password (< 8 chars) → 400;
   - reuse of current password → rejected;
   - successful change → **login with old password fails (ABP `result != 1`), login with new password succeeds**;
   - after re-login, changing back to the previous password → rejected (history reuse prevention).

## Product defect found and fixed (commit `b2f13fb`)

**Password history recorded the wrong hash.** `FinalizePasswordChangeAsync` inserted `user.PasswordHash` *after* the change (the new hash), so the replaced password never entered history — users could always revert to their previous password, and the initial password was never retained. Both `ChangePasswordAsync` and `ResetPasswordAsync` now capture the pre-change hash and store that. Verified by the lifecycle spec's final step, which failed before the fix and passes after.

**Test-infrastructure hardening:** ABP `/api/account/login` returns HTTP 200 with `{result: 2}` for invalid credentials, so `response.ok()` proves nothing. The shared `signIn` helper now asserts `result === 1` for every E2E login.

## Checklist results

| Check | Result |
|---|---|
| Unauthenticated access | PASS |
| Validation (min length via DTO) | PASS (400) |
| Wrong current password | PASS (rejected) |
| Reuse prevention (current + history) | PASS (after fix) |
| Old password invalidated after change | PASS (real login attempt) |
| New password works | PASS (two real logins) |
| Forced initial change / expiry redirect | N/A in this spec — implemented in `PrivateRoute.tsx` (unit-tested); creating an expired-password state requires DB manipulation, deliberately excluded from the no-fixture-injection policy |
| Permission / org scope | N/A — change-password is inherently self-scoped (`CurrentUser.GetId()`); no cross-user surface exists on these endpoints |

## Paths & dependencies

- BE `Application/Security/AccountSecurityAppService.cs`, `Domain/Security/PasswordHistory*`; FE `src/features/auth/**`, `src/app/PrivateRoute.tsx`
- Level 3 shared dependency for all features (authentication) — changes here dirty everything
- Invalid for commits after `b2f13fb` touching these paths
