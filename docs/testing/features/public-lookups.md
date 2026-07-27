# F-024..F-030 — Public Lookup Features

## Status: VERIFIED

- **Feature IDs**: F-024, F-025, F-026, F-027, F-028, F-029, F-030
- **Verified Git commit**: `06e4b1c` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Authentication**: None required (AllowAnonymous endpoints)

## Features covered

| ID | Feature | Route | Public Endpoint |
|---|---|---|---|
| F-024 | Business Lookup | `/tra-cuu-co-so` | `GET /api/v1/public/businesses?keyword=` |
| F-025 | Self-Declaration Lookup | `/tra-cuu-tu-cong-bo` | `GET /api/v1/public/self-declarations?number=` |
| F-026 | Product Registration Lookup | `/tra-cuu-dang-ky-cong-bo` | `GET /api/v1/public/product-registrations?number=` |
| F-027 | Eligibility Certificate Lookup | `/tra-cuu-giay-du-dieu-kien` | `GET /api/v1/public/eligibility-certificates?number=` |
| F-028 | CFS Certificate Lookup | `/tra-cuu-cfs` | `GET /api/v1/public/cfs-certificates?number=` |
| F-029 | Export Food Certificate Lookup | `/tra-cuu-gcn-xuat-khau` | `GET /api/v1/public/export-food-certificates?number=` |
| F-030 | Ad Registration Lookup | `/tra-cuu-dang-ky-quang-cao` | `GET /api/v1/public/advertisement-registrations?number=` |

## Evidence

- `e2e/public-lookups.spec.ts` — 7 smoke tests: each page loads, renders heading, accepts input, shows not-found state
- `e2e/public-lookups-verification.spec.ts` — 22 tests:
  - **F-024**: anonymous access allowed (not 401), found by code, not-found, UI round-trip
  - **F-025**: found by declaration number, not-found, UI round-trip (creates business+product+declaration)
  - **F-026**: found by registration number, not-found, UI smoke
  - **F-027**: found by certificate number, not-found, UI smoke
  - **F-028**: found by certificate number (with seeded country), not-found, UI smoke
  - **F-029**: found by certificate number, not-found, UI smoke
  - **F-030**: found by registration number (with product), not-found, UI smoke

## Test data setup

Each test creates its own data via admin API (authenticated), then verifies it via the anonymous public API:
1. Admin logs in via `signInAsAdmin(page)`
2. Admin creates entity (business, product, certificate/registration) via `POST /api/v1/app/*`
3. Test calls `GET /api/v1/public/*` without session cookie
4. Asserts entity returned, business name matches
5. Cleanup deletes created entities

## Key behaviors discovered

1. **AllowAnonymous confirmed**: Public endpoints return the error body (not 401) when data isn't found. Anonymous access works without session.
2. **ABP `UserFriendlyException` → HTTP 403**: When not found, ABP returns 403 (not 400 or 404). The body contains `{"error":{"message":"Không tìm thấy..."}}`. Tests must not expect 401.
3. **Business lookup searches by Code or TaxCode (exact, uppercase)**: NOT by name. The UI placeholder "Tên cơ sở hoặc mã số" is misleading — the backend only matches on `Code == normalized || TaxCode == normalized`.
4. **CFS certificate requires a country ID**: Fetched from `GET /api/v1/app/master-catalog/countries` (seeded).
5. **All lookups normalize to uppercase**: Input is `.Trim().ToUpperInvariant()` before matching.

## Checklist

| Check | Result |
|---|---|
| All 7 lookup pages accessible without authentication | PASS |
| Not-found returns appropriate error (403, not 401) | PASS |
| Business found by exact code | PASS |
| Self-declaration found by number | PASS |
| Product registration found by number | PASS |
| Eligibility certificate found by number | PASS |
| CFS certificate found by number | PASS |
| Export food certificate found by number | PASS |
| Ad registration found by number | PASS |
| UI shows not-found state | PASS (7/7 routes) |
| Data created via admin API, read via public API | PASS |

## Notes

- Public lookups are read-only, no CSRF required.
- All public controllers annotated with `[AllowAnonymous]` — no session needed.
- Data persists immediately after creation (no async processing or approval needed).
- F-024 general public search (`/tra-cuu-chung`) uses a different endpoint covered in `public-portal.spec.ts`.

## Paths & dependencies

- FE: `src/features/public-portal/pages/` (PublicBusinessLookupPage, etc.)
- BE: `FoodSafe.HttpApi/BusinessManagement/PublicBusinessController.cs`, `PublicSelfDeclarationController.cs`; `FoodSafe.HttpApi/Licensing/Public*.cs`
- BE services: `FoodSafe.Application/BusinessManagement/Public*.cs`, `FoodSafe.Application/Licensing/Public*.cs`
- Depends on: Business data (F-006), Licensing data (F-007..F-012)
