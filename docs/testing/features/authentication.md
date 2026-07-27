# F-001 — Authentication (Login)

## Status: VERIFIED

- **Feature ID**: F-001 · **Verified Git commit**: (see commit after this file) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/login`
- **Endpoints**:
  - `GET /api/abp/application-configuration` — CSRF token initialization
  - `POST /api/account/login` — session login
  - `GET /api/account/logout` — session logout

## Evidence

- `e2e/auth.spec.ts` — smoke: login page loads, admin login works, unauthenticated redirect.
- `e2e/auth-verification.spec.ts` — 7 tests:
  1. Login page elements visible (username, password, button)
  2. Wrong password → HTTP 200 but `result != 1` (not authenticated)
  3. POST without CSRF header → rejected (400 or non-2xx)
  4. Correct credentials → `result=1`, dashboard API + UI accessible
  5. Logout → `GET /api/account/logout` → protected route redirects to `/login`
  6. Session persists across page navigation without re-login
  7. Unauthenticated access → redirects to `/login`

## Product defects found and fixed

1. **`authApi.ts` used POST for logout but ABP exposes `GET /api/account/logout`** (405 Method Not Allowed). Fixed: changed `api.post("/account/logout")` to `api.get("/account/logout")`. Also removed unnecessary CSRF initialization before logout (GET doesn't need CSRF).

## Checklist

| Check | Result |
|---|---|
| Unauthenticated redirect | PASS |
| Login page elements | PASS |
| Wrong password rejected | PASS |
| CSRF enforcement | PASS |
| Successful login → API + UI access | PASS |
| Logout clears session | PASS |
| Session persistence across navigation | PASS |

## Notes

- ABP returns HTTP 200 for both successful and failed login; `result: 1` = success.
- The CSRF pattern: `GET /api/abp/application-configuration` sets the `XSRF-TOKEN` cookie; all POST/PUT/DELETE mutations must include `RequestVerificationToken: decodeURIComponent(xsrfCookie.value)` header.
- Logout uses GET (no CSRF required). The ABP web controller handles session sign-out.

## Paths & dependencies

- FE `src/features/auth/api/authApi.ts`, `src/features/auth/pages/LoginPage.tsx`
- BE: ABP built-in Account controller (`/api/account/login`, `/api/account/logout`)
- Depends on session cookie, CSRF middleware (Level 3 — all other features depend on auth)
