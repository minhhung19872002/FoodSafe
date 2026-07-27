# F-009 — Advertisement Registrations (Đăng ký quảng cáo)

## Status: VERIFIED

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
