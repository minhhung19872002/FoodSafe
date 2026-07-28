# FoodSafe — UI Audit Bug Report

**Date:** 2026-07-28 · **Branch:** `feat/integration-completion` (working tree) · **Stack:** real Docker compose (nginx FE + ASP.NET Core API + PostgreSQL) at `http://127.0.0.1:8080` — zero API mocking/interception.

## Executive summary

322 automated Playwright checks were executed against the running full stack: 46 route-coverage tests, 258 route×viewport responsive tests (6 viewports), and 18 user-flow/component tests across 4 roles (admin, ProvinceAdmin, CommuneStaff/readonly, no-permission) plus the expired-password account. 138 full-page screenshots were captured (49 desktop / 43 tablet / 46 mobile) and reviewed.

**The application is functionally solid**: every route loads, authentication/authorization guards hold at the UI and API layer, CRUD/search/pagination/validation flows work, and the security posture is strong (see §Positive findings). **The dominant defect class is responsive layout**: data tables and action toolbars overflow their containers on 15 of 45 routes — including one page (`/data-integration`) that overflows even at 1920×1080 — because AntD tables are rendered without internal horizontal scrolling. Nothing found blocks a desktop-officer happy path; several findings meaningfully degrade tablet/phone use, which matters most for the citizen-facing public portal.

| Severity | Count | IDs |
|---|---|---|
| Critical | 0 | — |
| High | 3 | UIA-001, UIA-002, UIA-003 |
| Medium | 4 | UIA-004, UIA-005, UIA-006, UIA-007 |
| Low | 5 | UIA-008 … UIA-012 |

Test matrix results: routes 45/46 pass (1 intermittent third-party CAPTCHA issue → UIA-009); responsive 216/258 pass (42 overflow failures → UIA-001/002/003/004); user-flow & visual 18/18 pass (one concurrency-only flake of the harness itself, verified passing in isolation; two cosmetic findings recorded → UIA-008).

---

## High

### UIA-001 — Data tables overflow the page instead of scrolling inside their card (systemic)

- **Severity:** High (data hidden, layout broken, page-level horizontal scroll)
- **Pages:** `/food-poisoning` (breaks from **1440px** down), `/documents`, `/testing-results` (from 768px down), `/risk-analysis`, `/reporting`, `/catalogs`, `/dashboard` (2 tables), `/statistics` (report table), `/product-registrations` (table 1250px), `/cfs-certificates` (1350px), `/export-food-certificates` (1600px) at 390/375px — 12 authenticated pages + 2 public pages (see UIA-003)
- **Component:** AntD `<Table>` inside content cards
- **Steps to reproduce:** Log in as admin → open `/food-poisoning` → resize window to 1440×900 (a common laptop size).
- **Expected:** Wide tables scroll horizontally *inside* their own container (`overflow-x: auto`), page body never scrolls sideways; low-priority columns collapse on small screens.
- **Actual:** The `<table>` renders at its natural width (e.g. 1220px at a 1440 viewport, up to 1705px at 390), spilling out of the white card across the page background; status chips and action buttons ("Xác minh", Sửa/Xóa) sit outside the card; the whole document scrolls horizontally while header/sidebar stay fixed-width, so content and actions are invisible until the user discovers page-level panning.
- **Screenshots:** `screenshots/tablet/food-poisoning-768.png`, `screenshots/tablet/documents-768.png`, `screenshots/mobile/catalogs-390.png`, `screenshots/mobile/statistics-390.png`, `screenshots/mobile/dashboard-390.png`
- **Root cause:** Tables are rendered without `scroll={{ x: ... }}` (and their card containers don't clip), so the table's intrinsic width defines `scrollWidth` of the document. Detection data (offending element + width per route/viewport) is in the responsive findings (42 records).
- **Suggested fix:** Project-wide table wrapper (the CLAUDE.md §14.1 `DataTable` compound component is the natural place): always set `scroll={{ x: "max-content" }}`, and add responsive column priorities (hide Mô tả/secondary columns under `md`). One shared fix addresses all 14 pages.

### UIA-002 — `/data-integration` overflows at every resolution, including Full HD

- **Severity:** High (broken layout on the standard desktop size; action buttons clipped)
- **Page:** `/data-integration` (tab "Cấu hình API")
- **Component:** endpoint table — per-row action group (`Space`: Test / Sửa / Bật/Tắt / Xóa)
- **Steps to reproduce:** Log in as admin → open `/data-integration` at 1920×1080.
- **Expected:** The page fits 1920px with no horizontal scrolling; every action button fully visible.
- **Actual:** `scrollWidth` = 2002px at a 1920 viewport. The 319px-wide action group pushes the table beyond the viewport; the red "Xóa" buttons are clipped at the right edge (visible in the screenshot). Every tested viewport (1920→375) overflows — this is the only page broken even on desktop.
- **Screenshot:** `screenshots/desktop/data-integration-1920.png`
- **Root cause:** five text buttons per row + wide URL/system columns, no `scroll.x` on the table (same class as UIA-001, but severity is higher because 1920 is affected).
- **Suggested fix:** icon-only actions with tooltips, or collapse secondary actions (Bật/Tắt, Xóa) into a "⋯" dropdown; add `scroll={{ x: "max-content" }}` so the table pans internally.

### UIA-003 — Citizen-facing public lookup results unusable on phones

- **Severity:** High (citizens are the primary mobile audience of the public portal)
- **Pages:** `/tra-cuu-chung` (general public search — 8-column results table, 573px wide at 390 viewport), `/co-so-bi-canh-bao` (warned businesses)
- **Component:** public search result tables
- **Steps to reproduce:** On a phone (390×844), open `/tra-cuu-chung` without logging in → search runs automatically with seeded data.
- **Expected:** Results readable on one screen — a stacked card layout per result, or an internally scrollable table.
- **Actual:** The page is 597px wide on a 390px phone; columns LOẠI HÌNH/ĐỊA CHỈ/CAM KẾT/GIẤY ĐĐK force whole-page horizontal panning; a citizen sees roughly two-thirds of each row and may never notice the status columns exist.
- **Screenshot:** `screenshots/mobile/public-general-search-390.png`
- **Root cause:** same table pattern as UIA-001 applied to anonymous pages.
- **Suggested fix:** for public results specifically, prefer a responsive card list under `md` (name + code + status chip stacked); the remaining columns become labeled rows inside the card. The portal home page (`screenshots/mobile/public-portal-home-390.png`) already demonstrates the clean stacked pattern — reuse it.

---

## Medium

### UIA-004 — Filter/action toolbars don't wrap at smaller widths

- **Severity:** Medium (layout broken, controls pushed off-screen; becomes the *first* breakage on alerts-news at laptop sizes)
- **Pages:** `/alerts-news` (breaks from **1440px** — toolbar `Space` 248px pushed to 1451px), `/dashboard` + `/statistics` (390px: header filter selects, 456px total), `/product-registrations`, `/cfs-certificates`, `/export-food-certificates` (390px: search + Xuất Excel + Thêm row at 415px)
- **Component:** toolbar rows built with `Space` (`div.ant-space-horizontal`)
- **Steps to reproduce:** Log in as admin → `/alerts-news` → resize to 1440×900.
- **Expected:** Toolbar controls wrap to a second line when they no longer fit.
- **Actual:** `Space` keeps everything on one non-wrapping line, pushing the row (and with it the page scroll width) past the viewport; on phones the year/unit selects of dashboard/statistics extend 66px past the screen edge.
- **Screenshots:** `screenshots/tablet/alerts-news-768.png`, `screenshots/mobile/statistics-390.png`
- **Root cause:** `Space` defaults to `wrap: false`; several toolbars also sit inside the tables from UIA-001, compounding the width.
- **Suggested fix:** `Space wrap` (or `Flex wrap="wrap"` / `Row gutter`) for every list-page toolbar; on ≤`sm`, stack filters vertically.

### UIA-005 — `/statistics` is reachable without any permission and degrades into 403 errors

- **Severity:** Medium (permission-UI mismatch; error-state page for unauthorized users; console noise)
- **Pages:** `/statistics` (and, partially, `/dashboard`)
- **Component:** route config (`router.tsx` — the only business route without `PermissionRoute`), sidebar menu (no `permission` key), statistics API calls
- **Steps to reproduce:** Log in as `noperm@foodsafe.local` (zero permissions) → the sidebar shows "Thống kê tổng hợp" → open it.
- **Expected:** Either the menu entry is hidden and direct navigation shows the 403 Result (as every other business page does), or the page renders fully with data the user is allowed to see.
- **Actual:** The page loads and fires `GET /api/v1/app/organization/tree`, `/food-poisoning-incident?...`, `/food-poisoning-case?...` — all rejected **403** (3 console errors); charts fall back to empty states. The dashboard likewise calls `organization/tree` → 403 console error for this user. Backend scoping is correct (it blocks); the frontend simply shouldn't offer the page/calls.
- **Screenshot:** — (evidence: recorded findings `user-flow /statistics (noperm)`, `noperm-restrictions`)
- **Root cause:** missing `PermissionRoute` wrapper + missing menu `permission` key for statistics; dashboard/statistics fetch org-tree and food-poisoning data unconditionally.
- **Suggested fix:** gate route + menu behind the statistics-view permission set; guard the individual queries with `enabled: hasPermission(...)` so partially-permissioned users get partial data instead of console errors.

### UIA-006 — Menu ↔ route permission drift creates 403 traps for partially-permissioned roles

- **Severity:** Medium (latent: a user sees a menu entry that always lands on "Không có quyền truy cập")
- **Pages:** `/food-poisoning`, `/reporting`
- **Component:** `AppLayout.tsx` NAV_CONFIG vs `router.tsx` PermissionRoute
- **Steps to reproduce:** Grant a role only `FoodSafe.FoodPoisoning.Incidents.View` (no `Cases.View`) → the sidebar shows "Ngộ độc thực phẩm" → click it.
- **Expected:** Menu visibility and route access use the same permission set.
- **Actual:** Menu shows for `Cases.View ∨ Incidents.View` but the route only accepts `Cases.View` → guaranteed 403 page. Same for "Báo cáo": menu accepts NdtpReports/AtpWorkReports/ActionMonthReports, route demands `NdtpReports.View` specifically.
- **Screenshot:** — (static config analysis, confirmed against both files)
- **Root cause:** the two permission lists were edited independently.
- **Suggested fix:** single source of truth — export the per-route permission array once and use it in both NAV_CONFIG and the route definition.

### UIA-007 — Precise backend errors are replaced by a generic message in catalog forms

- **Severity:** Medium (violates CLAUDE.md §7 "thông báo lỗi rõ ràng"; user must guess what's wrong)
- **Page:** `/catalogs` (create/edit modal; pattern likely shared by other catalog tabs)
- **Component:** create/update mutation error handler
- **Steps to reproduce:** Log in as admin → Danh mục dùng chung → Loại văn bản → Thêm mới → enter an existing Mã (e.g. `LUAT`) + any Tên → Lưu.
- **Expected:** The server's localized, specific message — `"Mã danh mục đã tồn tại."` (error `FoodSafe:Catalog:0001`, verified in the response body) — shown on the Mã field or in the toast.
- **Actual:** A generic toast "Không thể lưu. Vui lòng kiểm tra mã và dữ liệu liên quan." appears; no field-level error; the precise ABP error envelope (message + offending `data.Code`) is discarded.
- **Screenshot:** — (evidence: probe capture — `403 POST /api/v1/app/master-catalog/document-type` → `{"error":{"code":"FoodSafe:Catalog:0001","message":"Mã danh mục đã tồn tại."}}` while UI showed the generic toast)
- **Root cause:** the mutation `onError` shows a fixed string instead of reading `error.response.data.error.message`.
- **Suggested fix:** shared error adapter: prefer the ABP envelope's `message`; map `Catalog:0001`-style duplicate errors onto the Mã form item via `setError`.

---

## Low

### UIA-008 — Dashboard side-by-side cards render unequal heights

- **Severity:** Low (cosmetic misalignment)
- **Page:** `/dashboard`
- **Component:** rows "Phân bố hồ sơ theo loại" / "Chi tiết theo loại hồ sơ" (284 vs 364px) and "Tình hình nộp báo cáo" / "Hoạt động gần đây" (232 vs 433px)
- **Expected:** Cards in the same row stretch to equal height.
- **Actual:** Bottom edges are ragged; measured deltas 80px and 201px.
- **Screenshot:** `screenshots/desktop/dashboard-initial-1920.png`
- **Root cause:** grid children not stretched (`align-items` default / cards not `height: 100%`).
- **Suggested fix:** `Row align="stretch"` + `Card style={{height:"100%"}}` (AntD grid), or CSS grid with `align-items: stretch`.

### UIA-009 — Intermittent CAPTCHA widget failure on the citizen report form

- **Severity:** Low in dev (test keys), **verify before production** — if it reproduces with production keys it becomes High (citizen cannot submit)
- **Page:** `/gui-phan-anh`
- **Component:** Cloudflare Turnstile widget
- **Steps to reproduce:** Load `/gui-phan-anh` (observed once under 4-way parallel page load; passed on retry — intermittent).
- **Expected:** Widget initializes and issues a token.
- **Actual:** Console: `Refused to display 'https://challenges.cloudflare.com/' in a frame because it set 'X-Frame-Options' to 'sameorigin'` plus a 403 resource load — the widget iframe fails; the form's CAPTCHA cannot complete until reload.
- **Screenshot:** — (console evidence in `playwright/.results` routes run)
- **Root cause:** third-party (Cloudflare) challenge response under the *test* sitekey; host page loads it correctly on retry. Possibly load-related.
- **Suggested fix:** keep the widget's error callback wired to a visible "Tải lại xác minh" retry action; re-verify with real hostname-pinned production keys during staging security review.

### UIA-010 — Phones keep a 64px dead sidebar rail on every authenticated page

- **Severity:** Low (usability: 16% of a 390px screen unusable; compounds UIA-001/004 overflows)
- **Pages:** all authenticated pages at ≤390px
- **Component:** `AppLayout` `Sider` (`breakpoint="lg"`, `collapsedWidth=64`) — the mobile `Drawer` already exists and works
- **Expected:** On phones the rail disappears (`collapsedWidth=0`) and navigation lives in the drawer.
- **Actual:** A 64px icon rail persists beside content (see any `screenshots/mobile/*-390.png`); tap targets are tiny and duplicate the drawer.
- **Suggested fix:** set `collapsedWidth={0}` when the `lg` breakpoint is broken (AntD supports zero-width with an auto trigger), keeping the hamburger→drawer as the only mobile nav.

### UIA-011 — 403 page "Về trang chủ" does a full page reload

- **Severity:** Low
- **Page:** any permission-denied screen (`PermissionRoute`)
- **Actual:** `<Button href="/">` triggers a browser navigation (full SPA reload) instead of client-side routing.
- **Suggested fix:** `onClick={() => navigate("/")}` (or `Link`), keeping SPA state.

### UIA-012 — Mã inputs silently clip long input at maxLength

- **Severity:** Low (standard HTML behavior, but silent for pasted codes)
- **Page:** `/catalogs` modal (Mã, maxLength 50) — verified by probe: a 60-char paste is stored as its 50-char prefix with no cue
- **Expected:** visible counter or validation message when the limit is hit.
- **Suggested fix:** `showCount maxLength={50}` on code inputs, and matching `.max(50)` in the Zod schema so a paste >50 shows an explicit error instead of clipping.

---

## Performance observations

- All 45 routes settled in **1.2–2.6s** (network-idle, warm stack) — comfortably inside the NFR (<10s average). No slow table rendering observed with seeded data volumes (up to ~500-row API pages on statistics).
- `/login`, `/account/forgot-password`, `/gui-tin` never reach network-idle within 12s because the Turnstile widget keeps polling — a measurement artifact of the audit's settle heuristic, **not** user-visible slowness (DOM interactive in ~1s). No action needed.

## Positive findings (verified working)

- **Route guards:** anonymous access to any private/unknown URL redirects to `/login` (no route-list leak); in-app 404 renders inside the layout for logged-in users.
- **Role UI:** readonly (CommuneStaff) menu correctly hides Tài khoản và quyền / Nhật ký hoạt động / Cấu hình hệ thống, and direct URLs to those pages render the 403 Result; the no-permission account sees only Tổng quan entries and gets 403 UI (no crash) on business pages.
- **Auth flows:** real login page works end-to-end (CAPTCHA widget → token → dashboard); empty-submit shows Vietnamese field errors; expired-password account is force-redirected to Đổi mật khẩu (server-enforced); logout returns to login **and revokes the session server-side** (a parallel browser holding the same cookie is signed out — good security posture).
- **CRUD & lists:** catalog create/edit/delete round-trip works with success toasts and post-delete list consistency (soft-delete verified in DB); businesses search → empty state → clear → data; status filter and pagination work without console/network errors.
- **Components:** sidebar active state follows the route; collapse toggle works; user dropdown complete; create modal centered, fits viewport at 1920 and 390, required-field validation displays under inputs, X closes; mobile drawer opens/navigates/auto-closes; businesses table (desktop) correctly contains its own scroll; public portal home is fully responsive at 390 (`screenshots/mobile/public-portal-home-390.png`).
- **Console hygiene:** apart from the findings above, no React errors, hydration errors, unhandled promise rejections, or failed chunk loads anywhere in 322 tests.

## Artifacts & how to re-run

- Suite: `testing/ui-audit/playwright/{routes,responsive,user-flow,visual}.spec.ts` (+ `helpers.ts`, `global-setup.ts`, `playwright.config.ts`)
- Raw evidence: `playwright/.results/` (findings JSONL per stage, run logs, failure artifacts) — git-ignored
- Screenshots: `screenshots/{desktop,tablet,mobile}/` (138 full-page captures)
- Re-run (from `FoodSafe.FE`, stack must be up):
  ```powershell
  $env:E2E_ADMIN_PASSWORD = "<SEED_ADMIN_PASSWORD from FoodSafe.BE/.env>"
  npx playwright test --config=..\testing\ui-audit\playwright\playwright.config.ts
  ```
- Harness notes (learned the hard way, kept for future auditors): ABP revokes sessions server-side on logout — never log out a shared `storageState` account while other tests run; the antiforgery cookie must be refreshed via `application-configuration` *after* login before saving a storage state, or every authenticated POST returns an empty 400.
