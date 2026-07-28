# F-018 — Risk Analysis (Phân tích nguy cơ)

## Status: VERIFIED

- **Feature ID**: F-018 · **Verified Git commit**: wt-post-`819b803` (production-readiness hardening commit) · **Date**: 2026-07-28
- **Environment**: isolated Docker Compose stack (project `fsra`, port 8180) built from `819b803` + the hardening changes — fresh PostgreSQL 15, real migrations + seed · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/risk-analysis`
- **Endpoints**: `GET/POST/PUT/DELETE /api/v1/app/risk-analysis(/{id})`, `POST .../{id}/publish`, `GET .../excel/export`

## 2026-07-28 production-readiness hardening

Deep FE+BE review with a real-browser recon pass first (same series as F-006/007/008/009/011/017). Defects found live and fixed:

- **BE 500-on-invalid-input (nghiêm trọng)**: `CreateUpdateRiskAnalysisDto` had no DataAnnotations — empty/501-char title, whitespace content and out-of-range enums fell through to `Check.*` (ArgumentException) or the DB check constraint `chk_ra_category` (PostgresException 23514), all surfacing as HTTP 500 "An internal error occurred". Added `[Required]/[StringLength(500)]/[EnumDataType]` (mirrors `CreateUpdateAtpAlertDto`); all four probes now return 400 with validationErrors.
- **Delete data-scope op**: `DeleteAsync` resolved scope with `DataScopeOperation.Edit`; profiles carry a distinct `CanDelete` flag → switched to `Delete` (matches every other AppService).
- **Generic error toasts → `extractApiError`**: create/update/publish/delete/export toasts now surface the localized BE business message (proved live: edit-after-publish shows "Chỉ được sửa phân tích nguy cơ ở trạng thái Nháp." in the toast under `vi` Accept-Language).
- **`isFetching` + `placeholderData: keepPreviousData`** on the list query (no blank-table flash on page/filter change).
- **Title input `maxLength={500}` + showCount**; **Chuyên mục filter** added (BE `Category` filter was already supported but unexposed).
- **Layout normalized**: `PageHeader` (title/subtitle/actions) + `page-container`/`page-card` + table `size="middle"`; Chuyên mục column widened 130→160 (no more two-line wrap).
- **Label consistency FE↔Excel↔Print**: Excel now says "Vừa"/"Đã xuất bản"/"Chuyên mục"/"An toàn thực phẩm"/"Nhiễm bẩn" (was "Trung bình"/"Đã phát hành"/"Danh mục"/"An toàn TP"/"Ô nhiễm"); print header "Danh mục"→"Chuyên mục"; Excel gains "Ngày công bố" column.
- **Specs**: search placeholder updated ("Tìm theo tiêu đề"), confirm clicks accept `/^(Xóa|Đồng ý|OK)$/`.

## Evidence (isolated stack, workers=1, no interception)

- `e2e/risk-analysis.spec.ts` — UI lifecycle: create via dialog, publish via confirm with "Đã xuất bản" assertion — 1/1.
- `e2e/risk-analysis-verification.spec.ts` — 5/5: unauthenticated → 401; `noperm` → 403; publish workflow (publish audit set; double publish / edit-after-publish / delete-after-publish rejected); server-side validation; persistence after reload + empty state.
- `e2e/risk-analysis-publish.spec.ts` — 1/1: FR-36-07 publish via real UI + FR-36-08 anonymous public-portal exposure + reload persistence.
- Ad-hoc probes (spec deleted after run): 4 invalid-input POSTs → **400** each (was 500); edit-after-publish → 403 `FoodSafe:RiskAnalysis:0002` localized vi/en; business-error toast visible in UI; export downloads `phan-tich-nguy-co-*.xlsx`; browser console clean.
- BE: `FoodSafe.Application` builds 0 errors; Domain `RiskAnalysisTests` 6/6 (isolated worktree — main tree was mid-edit by a concurrent session). Vitest risk-analysis 4/4; `tsc --noEmit` clean.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS (401 / 403 + Vietnamese denial page) |
| Validation returns 4xx with actionable message | PASS (was 500 before hardening) |
| Workflow Draft→Published incl. immutability after publish | PASS |
| Publish audit (who/when) | PASS |
| Persistence after reload, empty state | PASS |
| Loading state | PASS (`isFetching` + keepPreviousData) |
| Error state | PASS (localized business message in toast) |
| Org scope | PASS structurally (`GetScopedAsync`); delete now uses `CanDelete` scope flag |
| Export Excel | PASS (labels consistent with UI) |

## Notes

- Published analyses cannot be deleted (Draft-only delete) — each workflow-test run leaves one published `E2E-RAV`/`E2E-RISK` record; unique suffixes prevent rerun collisions.
- Server-side column sorting deliberately not added: list is fixed `CreationTime desc` (sorting-sweep `4a4af68` left this page as-is).

## Paths & dependencies

- FE `src/features/risk-analysis/**`; BE `Application.Contracts/AlertsAndTesting/RiskAnalysisDtos.cs`, `Application/AlertsAndTesting/RiskAnalysisAppService.cs`, `Application/AlertsAndTesting/RiskAnalysisExcelAppService.cs`, `Domain/AlertsAndTesting/RiskAnalysis.cs`
- Depends on auth/scope/axios/`extractApiError`/`PageHeader`/`RowActions` (Level 3 shared deps)
- Invalid for later commits touching these paths
