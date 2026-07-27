# F-013 — Inspection Plans & Results (Thanh tra - Kiểm tra ATTP)

## Status: VERIFIED

- **Feature ID**: F-013
- **Feature name**: Inspection Plans & Results
- **Status**: VERIFIED
- **Verified Git commit**: `c8f9537`
- **Verification date**: 2026-07-27
- **Environment**: Docker Compose full stack (PostgreSQL 15, Redis 7, MinIO, ClamAV, ASP.NET Core API, nginx frontend) at `http://127.0.0.1:8080`
- **Real database used**: Yes — PostgreSQL 15 in Docker (`foodsafe-postgres-1`), real EF Core migrations
- **API interception used**: **No** — no `page.route()`, no MSW, no mocked FoodSafe API
- **Test accounts used**:
  - `admin` (global access, DataScope.All)
  - `district.staff@foodsafe.local` (DistrictStaff role, district organization, no Approve permission)
  - `noperm@foodsafe.local` (no roles, no inspection permissions)
- **Frontend route**: `/inspection`
- **Backend endpoints reached**:
  - `GET/POST /api/v1/app/inspection-plan`
  - `GET/PUT/DELETE /api/v1/app/inspection-plan/{id}`
  - `POST /api/v1/app/inspection-plan/{id}/submit|approve`
  - `GET /api/v1/app/inspection-plan/business-options`
  - `GET /api/v1/app/inspection-plan/excel/export`
  - `GET/POST/DELETE /api/v1/app/inspection-result`
  - `POST /api/v1/app/business` (fixture setup)

## Evidence — spec files (all passing at `c8f9537`)

- `FoodSafe.FE/e2e/inspection.spec.ts` — happy path: create plan with business item via UI dialog, Excel export (real .xlsx download verified by PK magic bytes), submit via Popconfirm (success toast + status "Đã gửi"), approve (status "Đã duyệt"), record inspection result via Kết quả tab, verify result row appears.
- `FoodSafe.FE/e2e/inspection-verification.spec.ts` — 7 tests:
  1. Unauthenticated `GET /api/v1/app/inspection-plan` rejected (401).
  2. `noperm` user denied on plan list (403).
  3. Cross-organization: plan created in province org is absent from `district.staff` list results and direct GET by id is blocked.
  4. Invalid workflow transitions rejected server-side: approve on Draft fails; submit without businesses returns 403 `FoodSafe:Inspection:0004`.
  5. Server-side validation: POST without planCode → 400.
  6. Client validation (required-field messages), duplicate planCode rejected by backend (unique check), persistence after reload (plan survives `page.reload()`), delete via UI Popconfirm, deletion persists after reload.
  7. Empty state: unmatched search shows antd "Trống" and zero data rows.

## Checklist results

| Check | Result |
|---|---|
| HTTP status contract | PASS (200/400/401/403 asserted) |
| Database persistence | PASS (row visible after full page reload; deletion persists after reload) |
| Validation (client) | PASS (required messages "Vui lòng nhập mã kế hoạch/tên kế hoạch") |
| Validation (server) | PASS (400 on missing planCode) |
| Functional permission | PASS (noperm → 403) |
| Organization scope | PASS (district user cannot list or fetch province plan) |
| Administrative-area scope | PASS via organization hierarchy scope (org expansion includes geography of home org; district user restricted to district subtree) |
| Workflow transitions | PASS (Draft→Submitted→Approved via UI; invalid approve-on-Draft and submit-without-business rejected) |
| Duplicate prevention | PASS (duplicate planCode rejected, error toast shown) |
| Excel export | PASS (real download, xlsx magic bytes) |
| Loading state | PASS implicitly (antd Table `loading` prop wired to TanStack Query `isLoading`; not separately asserted because local responses render faster than the spinner threshold) |
| Empty state | PASS ("Trống" + zero `.ant-table-row`) |
| Error state | PASS (error toast on duplicate create: "Không thể lưu kế hoạch. Kiểm tra dữ liệu.") |
| Persistence after reload | PASS |
| Unauthenticated access | PASS (401) |

## Defects found and fixed during verification

1. **InspectionPlanEditorModal "Thêm cơ sở" was a no-op** — the plan-items form instance (`Form.useForm`) was never mounted in a `<Form>` element, so `setFieldsValue`/`useWatch` never re-rendered. Users could never add businesses to a plan through the UI, which also made every submit fail with `FoodSafe:Inspection:0004` (plan must have ≥1 business). Fixed by replacing the phantom form with React `useState`. (`FoodSafe.FE/src/features/inspection/components/InspectionPlanEditorModal.tsx`)
2. **API returned 302 HTML redirects for unauthenticated/forbidden `/api/*` requests** — cookie auth redirected to `/Account/Login` / `/Account/AccessDenied`. Now returns 401/403. (`FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs`)

## Related source paths

- Frontend: `FoodSafe.FE/src/features/inspection/**`
- Backend: `FoodSafe.BE/src/FoodSafe.Application/Inspection/**`, `FoodSafe.BE/src/FoodSafe.Domain/Inspection/**`, `FoodSafe.BE/src/FoodSafe.HttpApi/Inspection/**`

## Shared dependencies

- Cookie authentication + antiforgery (Level 3 on change)
- `CurrentDataScopeProvider` organization scope (Level 3 on change)
- axios instance `FoodSafe.FE/src/lib/axios.ts` (Level 3 on change)
- `PageHeader`, antd Table/Popconfirm patterns (Level 1)

## Conditions requiring retest

- Any change under the related source paths (Level 2)
- Any change to authentication, antiforgery, data scoping, axios instance, router (Level 3 per impact map)
- Registry entry invalid for commits after `c8f9537` that touch the above paths
