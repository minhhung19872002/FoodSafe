# F-018 — Risk Analysis (Phân tích nguy cơ)

## Status: VERIFIED

- **Feature ID**: F-018 · **Verified Git commit**: `de02e52` · **Date**: 2026-07-27
- **Environment**: Docker Compose full stack at `http://127.0.0.1:8080` · **Database**: real PostgreSQL 15 · **API interception**: **No**
- **Accounts**: `admin`, `noperm@foodsafe.local`
- **Frontend route**: `/risk-analysis`
- **Endpoints**: `GET/POST/PUT/DELETE /api/v1/app/risk-analysis(/{id})`, `POST .../{id}/publish`

## Evidence

- `e2e/risk-analysis.spec.ts` — UI lifecycle: create via dialog, publish via Popconfirm with "Đã xuất bản" status assertion.
- `e2e/risk-analysis-verification.spec.ts` — 5 tests: unauthenticated → 401; `noperm` → 403; publish workflow (publish sets `publishedById`/`publishedAt`; double publish rejected; edit-after-publish rejected; delete-after-publish rejected — published analyses are immutable/terminal by design); validation (missing title rejected); persistence after reload; empty state.

## Checklist

| Check | Result |
|---|---|
| Unauthenticated / permission | PASS |
| Workflow Draft→Published incl. immutability after publish | PASS |
| Publish audit (who/when) | PASS |
| Validation | PASS |
| Persistence after reload, empty state | PASS |
| Org scope | PASS structurally (same `GetScopedAsync` pattern as verified features); publish permission enforced via `RiskAnalyses.Publish` |

## Notes

- Published analyses cannot be deleted (Draft-only delete), so each workflow-test run leaves one published `E2E-RAV` record; unique suffixes prevent rerun collisions.

## Paths & dependencies

- FE `src/features/risk-analysis/**`; BE `Application/AlertsAndTesting/RiskAnalysisAppService.cs`, `Domain/AlertsAndTesting/RiskAnalysis.cs`
- Depends on auth/scope/axios (Level 3)
- Invalid for commits after `de02e52` touching these paths
