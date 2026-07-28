# F-013 — Inspection Plans & Results (Thanh tra - Kiểm tra ATTP)

## Status: VERIFIED

- **Feature ID**: F-013
- **Feature name**: Inspection Plans & Results
- **Status**: VERIFIED
- **Verified Git commit**: `02e6b68` (production-readiness hardening batch, 2026-07-28)
- **Verification date**: 2026-07-28
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`; api + frontend images rebuilt from the verified tree
- **Real database used**: Yes — PostgreSQL 15 in Docker (`foodsafe-postgres-1`), real EF Core migrations
- **API interception used**: **No** — no `page.route()`, no MSW, no mocked FoodSafe API
- **Test accounts used**: `admin` (DataScope.All), `district.staff@foodsafe.local` (no Approve permission, district org), `noperm@foodsafe.local` (no roles)
- **Frontend route**: `/inspection`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/inspection-plan`, `GET/PUT/DELETE /{id}`
  - `POST /{id}/submit|approve|reject|complete|cancel`, `PUT /{id}/item-status/{itemId}`
  - `GET /business-options`, `GET /excel/export`
  - `GET/POST /api/v1/app/inspection-result`, `GET/PUT/DELETE /{id}`
  - `POST /{id}/finalize|set-follow-up-result`, `POST /mark-violation-remedied`, `GET /excel/export`

## Evidence — 2026-07-28 hardening retest (Level 2)

- Playwright `npx playwright test inspection` — **11/11** (inspection.spec.ts, inspection-verification.spec.ts, inspection-attachments.spec.ts, inspection-violations-verification.spec.ts), workers=1, no interception, against rebuilt images.
- Real-API probe script (Playwright request context, cookie login, XSRF): 15 checks PASS covering every defect fix below (`scratchpad/inspection-verify.js`, session-local).
- Vitest inspection 5/5, `tsc -b` clean, `oxlint` clean, BE `FoodSafe.Application` compile 0 errors.

## Defects found and fixed in the 2026-07-28 review

**LOGIC (all reproduced live against the real stack before fixing):**

1. **Plan update silently ignored edits to existing items** — `UpdateAsync` only added/removed by BusinessId; notes/plannedDate/sequence changes were dropped. Fixed with `InspectionPlan.UpdateBusinessDetails` + item `UpdateDetails`. Probe: notes update now persists (200).
2. **Plan-linked result accepted mismatched data** — a result for business A could reference a plan item of business B (item silently marked Completed, plan advanced); items not in the plan were ignored; Skipped items could be completed. Fixed in `GetValidatedLinkedPlanAsync`: item must belong to the plan (`0007`), item business must equal the result business (`0019` new), `MarkCompleted` now rejects Skipped (`0005`). Plan/item pairing is now both-or-neither (`0018` new), matching DB constraint `chk_ir_plan_tuple` (plan-only links previously crashed with a 500 on that constraint).
3. **User-entered total fine silently destroyed** — `RecalculateViolationState` overwrote `FineAmount`/`HasViolation` from itemised violations (entering 5,000,000 ₫ + one un-priced violation saved `null`). Now explicit input wins; the itemised sum only fills in when no total was entered; `HasViolation` = checkbox OR itemised rows exist. Update flow reordered (`ClearViolations` → `Update` → add) so stale rows can't leak into the recalculation.
4. **500s → 4xx**: planItemId-without-planId (was NRE), negative fine (`[Range]` on DTOs), plan-only link (was DB constraint violation). All now BusinessException/validation errors with localized messages.
5. **No year validation** — `year: 0` accepted; now `[Range(2000, 2100)]` → 400.
6. **Future inspection dates accepted** (2030-01-01 saved); now rejected server-side (`0020` new) + FE `disabledDate`.
7. **Excel exports dropped `Sorting`** (both plans and results) — same defect class as F-008/F-009; fixed.
8. **`ApplySorting` had no unique tiebreaker** — `.ThenBy(Id)` added on both list endpoints (F-008 precedent).
9. **Localization gaps** — `FoodSafe:Inspection:0016/0017` were missing from vi/en (raw code shown when touching a finalized result); added, plus new `0018/0019/0020`.

**UX/UI:**

10. ~15 hardcoded error toasts replaced with `extractApiError` (page + all 4 modals) — server messages like "Mã kế hoạch đã tồn tại." now surface.
11. Result editor: plan link selects disabled on edit (server ignores link changes — previously silently dropped); picking a plan item auto-fills the business (with name-fallback options); plan item is required when a plan is chosen.
12. Plan editor: client-side validation for empty/duplicate business rows (inline error + red selects); "Ngày dự kiến" per-item DatePicker added (field existed in BE/drawer but was un-enterable).
13. Lists use `keepPreviousData` + `isFetching` (no empty-table flash); year filter commits on Enter/blur instead of per keystroke.
14. Result date column via dayjs `DD/MM/YYYY` (was un-padded `toLocaleDateString`); rejected Drafts show a "Bị từ chối" tag with reason tooltip; fine InputNumber has matching formatter+parser; checkbox rows baseline-aligned; hardcoded colors → antd tokens.
15. Specs: confirm-button locators `OK` → `/^(Xóa|Đồng ý|OK)$/`; duplicate-code assertion updated to the real server message under `locale: "vi-VN"`.

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403 asserted; former 500s now 4xx) |
| Database persistence | PASS (plan + result survive reload; item edits persist) |
| Validation (client) | PASS (required fields, item rows, future dates) |
| Validation (server) | PASS (400 missing planCode, year range, negative fine; 403 business-rule codes) |
| Functional permission | PASS (noperm → 403) |
| Organization scope | PASS (district user cannot list or fetch province plan) |
| Administrative-area scope | PASS via organization hierarchy scope |
| Workflow transitions | PASS (Draft→Submitted→Approved→InProgress→…; invalid transitions rejected; Skipped items cannot complete) |
| Duplicate prevention | PASS (duplicate planCode rejected with localized toast; duplicate item rows blocked client + server) |
| Excel export | PASS (real download, honours filters + Sorting) |
| Loading state | PASS (isFetching wired; keepPreviousData) |
| Empty state | PASS ("Trống" + zero rows) |
| Error state | PASS (localized server messages via extractApiError) |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Related source paths

- Frontend: `FoodSafe.FE/src/features/inspection/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/Inspection/**`, `FoodSafe.BE/src/FoodSafe.Domain/Inspection/**`, `FoodSafe.BE/src/FoodSafe.Application.Contracts/Inspection/**`, `FoodSafe.BE/src/FoodSafe.HttpApi/Inspection/**`
- Shared (additive-only edits): `FoodSafeDomainErrorCodes.cs`, `Localization/FoodSafe/vi.json|en.json`

## Known accepted behaviors (not defects; revisit only on business ruling)

- "Đạt" (Pass) may coexist with "Có vi phạm" — no server rule ties overall result to violations.
- Violation remediation and follow-up results remain editable after finalize (remediation happens after the record is frozen).
- Soft-deleted plans still block planCode reuse (duplicate check intentionally ignores the soft-delete filter).

## Shared dependencies

- Cookie authentication + antiforgery (Level 3 on change)
- `CurrentDataScopeProvider` organization scope (Level 3 on change)
- axios instance `FoodSafe.FE/src/lib/axios.ts`, `extractApiError` (Level 3 on change)
- `PageHeader`, `RowActions`, `RecordDetailDrawer`, `RevokeModal`, antd Table patterns (Level 1)

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Any change to authentication, antiforgery, data scoping, axios instance, router (Level 3 per impact map)
- Registry entry invalid for commits after the verified commit that touch the above paths
