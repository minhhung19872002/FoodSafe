# FoodSafe — UI Audit Fix Report

**Date:** 2026-07-28 · **Branch:** `feat/integration-completion` (working tree on `aad87c1`) · **Scope:** all High + Medium findings from [`ui-bug-report.md`](ui-bug-report.md)
**Verification:** complete UI-audit suite re-run against the rebuilt Docker stack — **323/323 passed**, plus Level-2 feature-spec retests for every touched feature.

## Result summary

| Requested verification | Result |
|---|---|
| 46 route-coverage tests pass | ✅ 46/46 (public, authenticated, guards, in-app 404) |
| No horizontal overflow | ✅ 258/258 responsive tests, **0 overflow findings** (was 42 across 15 routes) |
| No console errors | ✅ 0 console-error / page-error / failed-request findings on every route |
| Responsive tests pass | ✅ all 6 viewports × 43 routes green |
| Existing feature e2e specs (Level 2) | ✅ catalogs, geography, statistics, dashboard, food-poisoning, data-integration, alerts-news (8/8), reporting (2/2), `src/app` Vitest 6/6 |

Final artifacts: `playwright/.results/final-record.log` (full run), `.results/e2e-regression.log` + `.results/reporting-final.log` (feature specs), findings JSONL (only remaining entries: 4 known settle-cap measurement artifacts on Turnstile pages, 2 Low card-height records, 3 informational role-menu notes).

---

## Fixes by finding

### UIA-001 / UIA-002 / UIA-003 (High) — table overflow, one global fix

**Change:** one CSS rule in [src/index.css](../../FoodSafe.FE/src/index.css) rather than edits to 41 table call-sites:

```css
.ant-table-wrapper .ant-table-content { overflow-x: auto; }
```

Every AntD table that outgrows its card now pans **inside its own container**; the page body never scrolls horizontally. Tables that already declare `scroll={{ x }}` keep their behavior (AntD's inline style wins), so the 19 existing call-sites are untouched — this is a safety net, not a rewrite. It simultaneously fixed:
- `/food-poisoning` (broken from 1440×900 down), `/documents`, `/testing-results`, `/risk-analysis`, `/reporting`, `/catalogs`, `/alerts-news` (UIA-001)
- `/data-integration` at 1920×1080 — the 5-button action row now pans inside the table; Xóa no longer clipped (UIA-002)
- citizen pages `/tra-cuu-chung`, `/co-so-bi-canh-bao` on phones (UIA-003)

### UIA-004 (Medium) — toolbars that never wrapped

**Change:** the design system already had wrapping toolbar containers (`.page-header-actions`, `.filter-toolbar`); what broke was AntD `Space` (a non-wrapping inline-flex) and fixed-width inputs *inside* them. Added to the same two hooks in [src/index.css](../../FoodSafe.FE/src/index.css):

```css
.page-header-actions .ant-space, .filter-toolbar .ant-space { flex-wrap: wrap; max-width: 100%; }
.page-header-actions .ant-space-item, .filter-toolbar .ant-space-item { max-width: 100%; min-width: 0; }
/* + max-width: 100% on .ant-input-search / .ant-select / .ant-input / .ant-picker in those containers */
```

Zero component edits; every current and future toolbar built on the two standard containers wraps and clamps. Fixed dashboard/statistics header filters at 390/375, the 310px search inputs on product-registrations / cfs-certificates / export-food-certificates, and alerts-news at 1440.

### UIA-005 (Medium) — unauthorized 403 calls from dashboard/statistics

The backend deliberately serves `/statistics` to every signed-in account (`StatisticsAppService` is `[Authorize]`-only), so the right fix was not gating the route but stopping the page from calling APIs the user cannot pass:

- [organizationQueries.ts](../../FoodSafe.FE/src/features/organizations/api/organizationQueries.ts), [foodPoisoningQueries.ts](../../FoodSafe.FE/src/features/food-poisoning/api/foodPoisoningQueries.ts): hooks accept `{ enabled }` (backward-compatible).
- [StatisticsPage.tsx](../../FoodSafe.FE/src/features/statistics/pages/StatisticsPage.tsx): org-unit filter select renders and fetches only with `FoodSafe.Organizations.View`; the poisoning map section renders only with a poisoning view permission and fetches each dataset only when its permission is held.
- [DashboardPage.tsx](../../FoodSafe.FE/src/features/dashboard/pages/DashboardPage.tsx): same gating for the org-unit filter.

**Verified:** the audit's no-permission probe now records **zero failed requests** on `/dashboard` and `/statistics` (was 4× 403 + console errors); the user still gets the server-scoped statistics content by design.

### UIA-006 (Medium) — menu ↔ route permission drift

**Change:** new single source of truth [src/app/routePermissions.ts](../../FoodSafe.FE/src/app/routePermissions.ts) — one permission list per page, consumed by **both** [router.tsx](../../FoodSafe.FE/src/app/router.tsx) (all 21 `PermissionRoute`s) and [AppLayout.tsx](../../FoodSafe.FE/src/app/AppLayout.tsx) (all 21 menu entries). This closed all three drifts (two from the audit plus a third found during the fix — INT-03's `Partners.View` was on the route but missing from the menu):

- `/food-poisoning`: route now accepts Cases ∨ Incidents (menu already did)
- `/reporting`: route now accepts Ndtp ∨ AtpWork ∨ ActionMonth (menu already did)
- `/data-integration`: menu now includes `Partners.View` (route already did)

Because the routes became more permissive, the pages had to stop assuming the strongest permission: [FoodPoisoningPage.tsx](../../FoodSafe.FE/src/features/food-poisoning/pages/FoodPoisoningPage.tsx) and [ReportingPage.tsx](../../FoodSafe.FE/src/features/reporting/pages/ReportingPage.tsx) now build their tab lists from view permissions (a user with only Incidents.View lands on the Vụ ngộ độc tab instead of a 403'ing Cases tab; the map tab fetches only permitted datasets). `PermissionRoute`/`NavItem` types widened to `readonly string[]`.

### UIA-007 (Medium) — generic error toasts

**Change:** the project already had a comprehensive, sanitizing ABP-envelope error extractor ([src/lib/apiError.ts](../../FoodSafe.FE/src/lib/apiError.ts) → `extractApiError`) that the catalog pages ignored. [MasterCatalogPage.tsx](../../FoodSafe.FE/src/features/catalogs/pages/MasterCatalogPage.tsx) and [GeographicCatalogPage.tsx](../../FoodSafe.FE/src/features/geography/pages/GeographicCatalogPage.tsx) save/delete handlers now surface the server's precise Vietnamese reason (e.g. `"Mã danh mục đã tồn tại."`) instead of fixed generic strings. No e2e spec asserted the old strings (verified by grep), so no test contract broke.

---

## Changed files (this fix batch only)

| File | Change |
|---|---|
| `FoodSafe.FE/src/index.css` | 2 CSS blocks: table containment net; toolbar Space wrap + width clamps |
| `FoodSafe.FE/src/app/routePermissions.ts` | **new** — single source of truth for per-page permissions |
| `FoodSafe.FE/src/app/router.tsx` | all PermissionRoutes read `ROUTE_PERMISSIONS` |
| `FoodSafe.FE/src/app/AppLayout.tsx` | all menu entries read `ROUTE_PERMISSIONS`; readonly-array type; `typeof`-based narrowing |
| `FoodSafe.FE/src/app/PermissionRoute.tsx` | accepts `readonly string[]`; `typeof`-based narrowing |
| `FoodSafe.FE/src/features/organizations/api/organizationQueries.ts` | `useOrganizationTree(options?: { enabled })` |
| `FoodSafe.FE/src/features/food-poisoning/api/foodPoisoningQueries.ts` | `usePoisoningCases/Incidents(filter, options?: { enabled })` |
| `FoodSafe.FE/src/features/statistics/pages/StatisticsPage.tsx` | permission-gated org filter + poisoning map |
| `FoodSafe.FE/src/features/dashboard/pages/DashboardPage.tsx` | permission-gated org filter |
| `FoodSafe.FE/src/features/food-poisoning/pages/FoodPoisoningPage.tsx` | view-permission-filtered tabs; map queries gated |
| `FoodSafe.FE/src/features/reporting/pages/ReportingPage.tsx` | view-permission-filtered tabs |
| `FoodSafe.FE/src/features/catalogs/pages/MasterCatalogPage.tsx` | `extractApiError` in save/delete toasts |
| `FoodSafe.FE/src/features/geography/pages/GeographicCatalogPage.tsx` | `extractApiError` in save/delete toasts |

Audit-harness maintenance (test code, not product): `testing/ui-audit/playwright/user-flow.spec.ts` login helper now waits on Turnstile's `cf-turnstile-response` token input instead of an iframe (Cloudflare shipped a widget build mid-day that renders no iframe — diagnosed live; the app itself was unaffected), with product-faithful reload-retry; `visual.spec.ts` measures the modal after the zoom animation; `global-setup.ts` refreshes the antiforgery token post-login.

The `data-integration` api/page files listed as modified in `git status` belong to the parallel integration session, not this batch.

## Regression safety

- Build + type-check green; `src/app` Vitest 6/6 (PermissionRoute/PrivateRoute).
- Full audit suite green **twice** on the final build (interim runs isolated two environment transients: one Windows `ERR_NO_BUFFER_SPACE` under 4-worker load, one mid-animation modal measurement — both harness-side, both fixed/passing).
- Feature specs for every touched feature green (Level 2 per `docs/testing/02-impact-map.md` discipline; the global CSS was additionally smoke-verified by the 258-test responsive sweep across **every** page).
- Admin UX unchanged: admin holds every permission, so gated selects/tabs/map render exactly as before — confirmed by the unchanged menu-walk, CRUD, dashboard and statistics tests.

## Pre-existing defect discovered during retest (not caused, fixed environmentally)

`reporting.spec.ts` failed identically **with and without** this change-set (A/B verified by stash + container rebuild): 24 fantasy-year (2097–2099) NDTP reports had accumulated on the shared dev DB — 18+ Completed, which the spec's cleanup cannot delete — pushing its fresh draft past page 1 (PAGE_SIZE 15). Soft-deleted all fantasy-year rows; spec green. Logged in `docs/testing/03-regression-log.md` with a recommendation to purge Completed test reports in the spec's cleanup, otherwise the full release gate re-hits this after ~15 more runs.

## Not fixed (Low severity, out of requested scope)

UIA-008 (dashboard card heights), UIA-009 (Turnstile widget lacks an inline retry action — reload still required on a failed load), UIA-010 (64px collapsed rail on phones), UIA-011 (403-page full reload), UIA-012 (silent maxLength clipping). All remain documented in `ui-bug-report.md`.
