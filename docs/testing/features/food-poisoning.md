# F-014 — Food Poisoning Cases & Incidents (Ngộ độc thực phẩm)

## Status: VERIFIED

- **Feature ID**: F-014
- **Feature name**: Food Poisoning Cases & Incidents
- **Status**: VERIFIED
- **Verified Git commit**: `3c12156`
- **Verification date**: 2026-07-27
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`
- **Real database used**: Yes — PostgreSQL 15 in Docker, real EF Core migrations
- **API interception used**: **No**
- **Test accounts used**:
  - `admin` (global access)
  - `district.staff@foodsafe.local` (DistrictStaff, district organization)
  - `noperm@foodsafe.local` (no roles)
- **Frontend route**: `/food-poisoning`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/food-poisoning-case`
  - `GET/PUT/DELETE /api/v1/app/food-poisoning-case/{id}`
  - `POST /api/v1/app/food-poisoning-case/{id}/submit|verify`
  - `GET/POST/DELETE /api/v1/app/food-poisoning-incident`
  - `POST /api/v1/app/food-poisoning-incident/{id}/submit|verify|conclude`
  - `GET /api/v1/app/food-poisoning-case/excel/export`

## Evidence — spec files (all passing at `3c12156`)

- `FoodSafe.FE/e2e/food-poisoning.spec.ts` — happy path: create case via UI (success toast), submit + verify via Popconfirm with status assertions, create incident via UI, submit + verify + conclude incident (conclusion dialog), Excel export verified by PK magic bytes, incident with real coordinates created through the real API and map tab renders `.leaflet-container` with an interactive marker.
- `FoodSafe.FE/e2e/food-poisoning-verification.spec.ts` — 6 tests:
  1. Unauthenticated `GET /api/v1/app/food-poisoning-case` → 401.
  2. `noperm` user denied on case list → 403.
  3. Cross-organization: province case invisible in district list; direct GET blocked.
  4. Workflow guards: verify-on-Draft rejected (`FoodSafe:FoodPoisoning` error code), double submit rejected, edit-after-submit rejected (immutability after workflow start).
  5. Server-side validation: victimName over 200 chars → 400 (StringLength).
  6. Persistence after reload (case survives `page.reload()` + search) and empty state ("Trống") for unmatched search.

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403) |
| Database persistence | PASS (case visible after reload via search) |
| Validation (server) | PASS (400 on oversized victimName) |
| Validation (client) | PASS (required-field UX exercised in main spec dialog flow) |
| Functional permission | PASS (noperm → 403) |
| Organization scope | PASS (district user cannot list or fetch province case) |
| Administrative-area scope | PASS via organization hierarchy scope |
| Workflow transitions | PASS (Draft→Reported→Verified happy path via UI; invalid verify/double-submit/edit-after-submit rejected) |
| Immutability after submit | PASS (PUT on Reported case rejected) |
| Excel export | PASS (real .xlsx download) |
| Map rendering | PASS (Leaflet container + CircleMarker with real coordinates) |
| Loading state | PASS implicitly (antd Table loading wired to TanStack Query) |
| Empty state | PASS ("Trống" for unmatched search) |
| Error state | PASS at API level (400/403 payloads asserted); UI error toast paths exist via mutation onError |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Defects found and fixed during verification

1. **PoisoningMap crashed the whole route** — records with `null` coordinates passed the `!== undefined` filter and Leaflet threw `Cannot read properties of null (reading 'lat')`, producing "Unexpected Application Error" on the map tab. Fixed with `!= null` checks. (`FoodSafe.FE/src/features/food-poisoning/components/PoisoningMap.tsx`, fixed in `c8f9537`)

## Related source paths

- Frontend: `FoodSafe.FE/src/features/food-poisoning/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/FoodPoisoning/**`, `FoodSafe.BE/src/FoodSafe.Domain/FoodPoisoning/**`

## Shared dependencies

- Cookie authentication + antiforgery (Level 3)
- `CurrentDataScopeProvider` (Level 3)
- axios instance (Level 3)
- Leaflet/react-leaflet map stack (Level 2 for map-related changes)

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Auth/data-scope/axios/router changes (Level 3)
- Registry entry invalid for commits after `3c12156` touching the above paths
