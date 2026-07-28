# F-014 — Food Poisoning Cases & Incidents (Ngộ độc thực phẩm)

## Status: VERIFIED

- **Feature ID**: F-014
- **Feature name**: Food Poisoning Cases & Incidents
- **Status**: VERIFIED
- **Verified Git commit**: `71d0e46` (production-readiness hardening batch)
- **Verification date**: 2026-07-28
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`, images rebuilt from the hardened tree, migration `20260728124853_AddFoodPoisoningCodeUniqueIndexes` applied by the migrator container
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

## Hardening batch landed at `71d0e46` (2026-07-28)

Defects found by full review (browser run + API probes + code review) and fixed:

1. **L1 (nghiêm trọng)** — Server accepted completely empty cases/incidents (proven at runtime: `POST {}` → 200). Now `VictimName` + `LocationDescription` required on cases, `OccurrenceDate` + `LocationDescription` required on incidents, `[Range(0,150)]` on VictimAge, `[Range(0,1_000_000)]` on incident statistics (negatives were silently clamped before).
2. **L2 (nghiêm trọng)** — COUNT-based code generation reissued codes after deleting a Draft (soft-delete shrinks the count) and raced under concurrency. Generation now takes max numeric suffix including soft-deleted rows (`IDataFilter.Disable<ISoftDelete>`), enforced by filtered unique indexes `uq_fpc_org_code` / `uq_fpi_org_code` (`is_deleted = false`).
3. **L3 (trung bình)** — Editing a case wiped its `incidentId`; UI had no way to link a case to an incident (incident `CaseCount` was dead at 0). Case editor now has a "Thuộc vụ ngộ độc" select (shown only with `Incidents.View`) and preserves the link on edit.
4. **L4/L5 (nhỏ)** — Error-report lookups threw `CaseNotFound`/`IncidentNotFound`; now dedicated `FoodSafe:FoodPoisoning:0007` (ErrorReportNotFound). `Acknowledge`/`MarkCorrected` now guard status (`0008` ErrorReportAlreadyProcessed) and `MarkCorrected` rejects blank responses.
5. **L6 (nhỏ)** — `DeleteAsync` aligned to `autoSave: true` pattern.
6. **U1 (trung bình)** — 10 generic toasts ("Thao tác thất bại…") replaced with `extractApiError`, surfacing localized server reasons.
7. **U2** — Required asterisks + client rules now match the server contract in both editor modals.
8. **U3** — ConcludeModal no longer swallows failures: error toast shown, entered conclusion preserved, modal stays open.
9. **U5** — Lists use `keepPreviousData` + `isFetching` (hardened-page loading pattern).

Deliberately unchanged (recorded debt): `Verify` permission still covers Acknowledge + Respond on error reports (L7); no attachment module for food poisoning (gap vs. licensing modules); map tab hard-caps at 500 records per source.

## Evidence — spec files (9/9 passing at `71d0e46`, 14.8s)

- `FoodSafe.FE/e2e/food-poisoning.spec.ts` — happy path through the real UI with the new required fields (case create → submit → verify; incident create with occurrence date → submit → verify → conclude), Excel export by PK magic bytes, map marker with real coordinates. Confirm buttons matched with `/^(Đồng ý|OK)$/`.
- `FoodSafe.FE/e2e/food-poisoning-verification.spec.ts` — 8 tests:
  1. Unauthenticated `GET` → 401.
  2. `noperm` user → 403.
  3. Cross-organization: province case invisible in district list; direct GET blocked.
  4. Workflow guards: verify-on-Draft, double submit, edit-after-submit all rejected with `FoodSafe:FoodPoisoning` codes.
  5. Server-side validation: victimName > 200 chars → 400.
  6. **New**: empty case / empty incident → 400 with `validationErrors`; negative statistics → 400.
  7. **New**: case code not reused after delete-recreate of a draft.
  8. Persistence after reload + empty state ("Trống").

Other gates at the same tree: `FoodSafe.Domain.Tests` 223/223 (5 new error-report guard tests), `FoodSafe.Application.Tests` 357/357, food-poisoning Vitest 6/6, oxlint clean. Browser screenshot pass confirmed inline Vietnamese validation, asterisks, incident-link select, and zero console errors.

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403) |
| Database persistence | PASS (case survives reload + search) |
| Validation (server) | PASS (400 on empty case/incident, oversized name, negative statistics) |
| Validation (client) | PASS (inline Vietnamese messages, no request sent on empty submit) |
| Functional permission | PASS (noperm → 403) |
| Organization scope | PASS (district user cannot list or fetch province case) |
| Administrative-area scope | PASS via organization hierarchy scope |
| Workflow transitions | PASS (happy path via UI; invalid transitions rejected) |
| Immutability after submit | PASS (PUT on Reported case rejected with FoodPoisoning code) |
| Code uniqueness | PASS (delete-recreate keeps codes unique; DB unique indexes in place) |
| Excel export | PASS (real .xlsx download) |
| Map rendering | PASS (Leaflet container + interactive marker with real coordinates) |
| Loading state | PASS (`isFetching` + `keepPreviousData`) |
| Empty state | PASS ("Trống" for unmatched search) |
| Error state | PASS (localized server messages via `extractApiError`; conclude failure keeps input) |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Defect history

1. **PoisoningMap crashed the whole route** on `null` coordinates — fixed in `c8f9537` (2026-07-27 verification round).
2. **Hardening batch `71d0e46`** (2026-07-28) — see list above (L1–L6, U1–U5).

## Related source paths

- Frontend: `FoodSafe.FE/src/features/food-poisoning/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/FoodPoisoning/**`, `FoodSafe.BE/src/FoodSafe.Domain/FoodPoisoning/**`, `FoodSafe.BE/src/FoodSafe.Application.Contracts/FoodPoisoning/**`
- Migration: `20260728124853_AddFoodPoisoningCodeUniqueIndexes`

## Shared dependencies

- Cookie authentication + antiforgery (Level 3)
- `CurrentDataScopeProvider` (Level 3)
- axios instance + `lib/apiError.ts` (Level 3)
- Leaflet/react-leaflet map stack (Level 2 for map-related changes)

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Auth/data-scope/axios/`apiError`/router changes (Level 3)
- Registry entry invalid for commits after `71d0e46` touching the above paths
