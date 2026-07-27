# F-010 — Eligibility Certificates (Giấy chứng nhận đủ điều kiện ATTP)

## Status: VERIFIED

- **Feature ID**: F-010 · **Verified Git commit**: `df7823c` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `district.staff@foodsafe.local`, `noperm@foodsafe.local`
- **Frontend route**: `/eligibility-certificates`
- **Endpoints**: `GET/POST /api/v1/app/eligibility-certificate`, `GET/PUT/DELETE .../{id}`, `POST .../{id}/revoke`

## Evidence

- `e2e/eligibility-certificates.spec.ts` — UI lifecycle: certificate, public lookup, cache and retention rules.
- `e2e/eligibility-certificates-verification.spec.ts` (shared suite) — 5 tests: unauthenticated → 401; `noperm` → 403; cross-org hidden + GET blocked; revoke/double-revoke/duplicate/missing-number; persistence after reload + empty state.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission / org scope / area scope | PASS |
| Validation, duplicate certificateNumber prevention | PASS |
| Revoke workflow incl. invalid transition | PASS |
| Persistence after reload, empty state | PASS |
| Public lookup, expiry cache | PASS (main spec) |

## Paths & dependencies

- FE `src/features/eligibility-certificates/**`; BE `Application/Licensing/EligibilityCertificateAppService.cs`
- Depends on Business (F-006), auth/scope/axios (Level 3)
- Invalid for commits after `df7823c` touching these paths
