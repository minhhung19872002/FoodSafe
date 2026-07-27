# F-008 — Product Registrations (Đăng ký công bố sản phẩm)

## Status: VERIFIED

- **Feature ID**: F-008 · **Verified Git commit**: `9af99ba` (re-confirmed at `df7823c`) · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/product-registrations`
- **Endpoints**: `GET/POST /api/v1/app/product-registration`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`, fixtures via `/api/v1/app/business`, `/api/v1/app/product`

## Evidence

- `e2e/product-registrations.spec.ts` — UI lifecycle: DKCB create, public lookup, file attachment, retention rules.
- `e2e/product-registrations-verification.spec.ts` — 5 tests: unauthenticated → 401; `noperm` → 403; cross-org hidden + GET blocked; revoke succeeds (status Revoked/3), double revoke rejected, duplicate registrationNumber rejected, missing number → 400; persistence after reload + empty state.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS (401 / 403 / hidden+blocked / via org hierarchy) |
| Validation, duplicate prevention | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Persistence after reload, empty state | PASS |
| Attachments, public lookup | PASS (main spec) |

## Paths & dependencies

- FE `src/features/product-registrations/**`; BE `Application/Licensing/ProductRegistrationAppService.cs`, `Domain/Licensing/ProductRegistration.cs`
- Depends on Business/Product (F-006), auth/scope/axios (Level 3)
- Invalid for commits after `df7823c` touching these paths
