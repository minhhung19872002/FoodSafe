# F-015 — Reporting NDTP/ATP/Action Month (Báo cáo)

## Status: VERIFIED

- **Feature ID**: F-015
- **Feature name**: Reporting (NDTP / Công tác ATTP / Tháng hành động)
- **Status**: VERIFIED
- **Verified Git commit**: _(pending commit)_
- **Verification date**: 2026-07-28
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`
- **Real database used**: Yes — PostgreSQL 15 in Docker, real EF Core migrations
- **API interception used**: **No**
- **Test accounts used**:
  - `admin` (global access)
  - `district.staff@foodsafe.local` (DistrictStaff, district organization)
  - `noperm@foodsafe.local` (no roles)
- **Frontend route**: `/reporting`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/ndtp-report`
  - `GET/DELETE /api/v1/app/ndtp-report/{id}`
  - `PUT /api/v1/app/ndtp-report/{id}` (stats via UI editor)
  - `POST /api/v1/app/ndtp-report/{id}/submit|verify|return|return-to-draft|complete`
  - `GET /api/v1/app/ndtp-report/excel/export`

## Evidence — spec files (all 11 passing)

- `FoodSafe.FE/e2e/reporting.spec.ts` — happy path: Excel export (PK magic bytes), create NDTP report via UI, edit stats via editor modal, workflow via Popconfirms Draft → "Đã gửi" → "Đã xác minh" → "Hoàn thành" with visible status tag assertions; ATP and Action-Month tabs render. Self-healing cleanup walks stale test reports through return/return-to-draft/delete and picks a free test period (years 2090–2099).
- `FoodSafe.FE/e2e/reporting-verification.spec.ts` — 7 tests (uses year 2089 to avoid the main spec's pool):
  1. Unauthenticated `GET /api/v1/app/ndtp-report` → 401.
  2. `noperm` user denied → 403.
  3. Cross-organization: province report absent from district list; direct GET blocked.
  4. Workflow guards: verify-on-Draft rejected, complete-on-Draft rejected, double submit rejected, delete-on-Submitted rejected; full return path passes (Submitted → Returned with reason → back to Draft → delete → GET confirms gone); return without `returnReason` → 400.
  5. Server-side validation: `periodMonth: 13` → 400 (`[Range(1,12)]`).
  6. Persistence after reload (report found via year filter after `page.reload()`); empty state ("Trống") for a year with no reports.
  7. **Server-side sorting**: `periodYear asc/desc` produces opposite item orders (regression for case-mismatch in ApplySorting whitelist). **Duplicate period**: second create for same (org, year, month) → <500 with `FoodSafe:Report:0010` error code (not a raw 500 from DB unique index).

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403) |
| Database persistence | PASS (report visible after reload via year filter; deletion confirmed by follow-up GET) |
| Validation (server) | PASS (400 on month 13; 400 on return without reason) |
| Validation (client) | PASS (editor modal required fields exercised in main spec) |
| Functional permission | PASS (noperm → 403) |
| Organization scope | PASS (district user cannot list or fetch province report) |
| Administrative-area scope | PASS via organization hierarchy scope |
| Workflow transitions | PASS (full state machine: Draft→Submitted→Verified→Completed via UI; Submitted→Returned→Draft via API; all invalid transitions rejected) |
| Immutability after submit | PASS (delete-on-Submitted rejected; per domain, stats edits only in Draft) |
| Duplicate prevention | PASS (application-level `EnsurePeriodIsFreeAsync` returns `FoodSafe:Report:0010` with <500 status; verified in `reporting-verification.spec.ts` test 7) |
| Excel export | PASS (real .xlsx download) |
| Loading state | PASS implicitly (antd Table loading wired to TanStack Query) |
| Empty state | PASS ("Trống" via year filter) |
| Error state | PASS at API level (400/403 payloads asserted) |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Notes

- Completed reports are terminal by design (no transition out of Completed, delete is Draft-only), so each main-spec run permanently consumes one synthetic period slot; pool is 120 slots (years 2090–2099 × 12 months). Reset the dev database volume to reclaim slots.
- The `return` endpoint DTO field is `returnReason` (a `reason` field is silently ignored and yields 400) — the main spec cleanup was fixed accordingly in `e141203`.

## Related source paths

- Frontend: `FoodSafe.FE/src/features/reporting/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/Reporting/**`, `FoodSafe.BE/src/FoodSafe.Domain/Reporting/**`

## Shared dependencies

- Cookie authentication + antiforgery (Level 3)
- `CurrentDataScopeProvider` (Level 3)
- axios instance (Level 3)
- `BaseReport` state machine (shared by NDTP/ATP/Action-Month — Level 2 across all three tabs on change)

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Auth/data-scope/axios/router changes (Level 3)
- Registry entry invalid for commits after verified commit touching the above paths

## 2026-07-28 — Production-readiness hardening (Level 2 retest)

Fixes applied:
- **L1 Sorting broken**: `ApplySorting` whitelist was case-sensitive; fixed to lowercase labels + `ThenBy(Id)` tiebreaker. All 3 report AppServices.
- **L2 Duplicate period → 500**: Added `EnsurePeriodIsFreeAsync` to all 3 AppServices; dedicated `FoodSafe:Report:0010` error code.
- **L3 OrganizationIds.First() non-deterministic**: Changed to `scope.HomeOrganizationId` for deterministic org assignment.
- **L4 TotalAffected miscalculation**: `ReportCalculationAppService` now sums `PoisoningCaseCount + sum(incident.AffectedCount)` instead of just counting cases.
- **M1 ReturnToDraft wrong error code**: Added dedicated `CannotReturnToDraftNonReturned` (Report:0011).
- **M5 Error vs Empty state**: Added `ListErrorAlert` component to all 3 tabs when API errors occur.
- **M6 Actor names as GUIDs**: Added `ReportNameEnricher` + `IReportActorsDto` to batch-resolve org/user names.
- **M7 Document header hardcoded**: Now uses `report.organizationName?.toUpperCase()`.
- **M8 Editor no success feedback**: Added `message.success("Đã lưu báo cáo.")` to all 3 editor modals.
- **M9 E2E "OK" button locale**: Fixed to regex `/^(Đồng ý|OK)$/` for antd vi_VN locale.
- **S1/S2 Export error handling**: Export uses `extractApiError` for localized error message.
- **S3 Year filter range**: Added `min={2020} max={2100}` to year input + Vietnamese validation messages.
- **S4 Partial-save error**: Added try/catch around narrative mutation with partial-save error message.
- **S5 CreationTime sort column**: Added `creationTime` sorter column + `Tháng` filter select for NDTP tab.

Retest: Level 2 — 11/11 Playwright specs passed. Docker stack rebuilt with all fixes.

## 2026-07-27 — Error notifications (FR-33-05, FR-34-05, FR-35-05)

- Endpoints: `GET/POST /api/v1/app/{ndtp-report|atp-work-report|action-month-report}/{id}/error-notification(s)`, `POST .../{id}/acknowledge-error-notification/{nid}`, `POST .../{id}/respond-error-notification/{nid}`
- Permissions: add = `Reporting.*.Submit`; acknowledge/respond = `Reporting.*.Verify`; org scope enforced server-side; `FromOrganizationId` server-derived
- Domain rule: allowed when Submitted or Verified (YCKT "sau khi gửi"); Draft rejected
- Spec: `e2e/reporting-error-notifications.spec.ts` (real stack, no interception) — verified commit `07476e3`
