# F-011 — CFS Certificates (Chứng nhận lưu hành tự do)

## Status: VERIFIED

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
