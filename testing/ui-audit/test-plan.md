# FoodSafe — UI Audit Test Plan

**Date:** 2026-07-28 · **Auditor:** Automated Playwright audit (senior FE QA process)
**Target:** Full stack running via Docker Compose at `http://127.0.0.1:8080` (nginx FE → ASP.NET Core API → PostgreSQL 15). No API interception or mocking anywhere — every request is a real round trip, per the repo testing policy.

---

## 1. Project analysis summary

| Aspect | Finding |
|---|---|
| Framework | React 19 + TypeScript + Vite, Ant Design 5, TanStack Query v5, Zustand, React Router DOM v7 |
| Routing | `src/app/router.tsx` — 45 concrete routes + catch-all 404 (see `route-inventory.md`) |
| Auth flow | Cookie-based ABP login (`POST /api/account/login`) guarded by antiforgery token (`XSRF-TOKEN`) + Cloudflare Turnstile CAPTCHA (dev stack uses Cloudflare **test keys**, so any non-empty token verifies). Session restored via `GET /api/abp/application-configuration`. `PrivateRoute` redirects anonymous users to `/login`; `PermissionRoute` renders an AntD 403 `Result` when a granted policy is missing. Expired passwords are force-redirected to `/account/complete-password-change`. |
| Roles / fixture accounts | Seeded by `E2eTestDataSeedContributor` (Development env): `admin` (full), `province.admin@foodsafe.local` (ProvinceAdmin), `district.staff@foodsafe.local` (DistrictStaff), `readonly@foodsafe.local` (CommuneStaff), `noperm@foodsafe.local` (no roles), `expired.pw@foodsafe.local` (expired password). Password = `E2E_ADMIN_PASSWORD` (dev seed default). |
| Business modules | Dashboard/Statistics, Business management + products, Self-declarations, Product registrations, Ad registrations, Eligibility/CFS/Export certificates, Inspection, Food poisoning, Alerts & news, Risk analysis, Testing results, Legal documents, Reporting (NĐTP / ATTP work / action month), Data integration, Organizations, Geography, Master catalogs, Identity admin, Audit logs, System settings, Public portal (9 pages) + 7 public certificate lookups |
| Shared UI | `AppLayout` (dark Sider + header with global search/notification/user dropdown + breadcrumb + footer), mobile nav `Drawer` (breakpoint `lg`), lazy route chunks with `RouteLoading` fallback, `RouteErrorBoundary` |
| Existing tests | 78 Playwright specs in `FoodSafe.FE/e2e` (feature verification, 1 worker, real backend), Vitest unit tests. This audit adds a **separate, non-destructive** sweep under `testing/ui-audit/` and does not modify the existing suites. |

## 2. Scope & objectives

Find production-affecting UI/UX defects: broken pages, console/network errors, layout overflow, unusable components, permission-UI mismatches, and slow screens. Code style is out of scope.

## 3. Environment & tooling

- Reuses the healthy running compose stack (`foodsafe-frontend-1` on `127.0.0.1:8080`). Database already carries demo + E2E seed data.
- Playwright (Chromium) from `FoodSafe.FE/node_modules`, wired into `testing/ui-audit/playwright/` via a directory junction.
- Config: `testing/ui-audit/playwright/playwright.config.ts` (4 workers, JSON report, trace/screenshot on failure).
- Auth: `global-setup.ts` performs **real logins** through the real API (antiforgery + CAPTCHA gate) once per role and stores Playwright `storageState` files (`.auth/*.json`). Specs reuse those sessions — the repo policy explicitly allows a stored session created through a previous real login. The login **page** itself is additionally exercised through the UI in `user-flow.spec.ts`.
- Findings are appended as JSONL to `.results/findings.jsonl` by every check and aggregated into `ui-bug-report.md`.

### How to run

```powershell
cd FoodSafe.FE
$env:E2E_ADMIN_PASSWORD = "<seed admin password from FoodSafe.BE/.env>"
npx playwright test --config=..\testing\ui-audit\playwright\playwright.config.ts            # everything
npx playwright test --config=..\testing\ui-audit\playwright\playwright.config.ts routes     # one spec
```

## 4. Test matrix

### 4.1 Route coverage (`routes.spec.ts`)

Every route in `route-inventory.md` (45 routes + 404 + auth redirect), as the strongest role that can reach it (admin) and anonymously for public pages. Per route:

- loads with HTTP 200 and stays on the requested URL (no unexpected redirect)
- renders non-blank content (root text > threshold, no dead `RouteLoading` spinner)
- zero uncaught page errors, zero console errors (filtered allowlist: DevTools banner only)
- zero failed same-origin requests (any 4xx/5xx API response is a finding)
- navigation time recorded; > 10 s flagged per NFR §6

### 4.2 Layout & overflow (`responsive.spec.ts`)

All routes × 6 viewports: 1920×1080, 1440×900, 1366×768 (desktop), 768×1024 (tablet), 390×844, 375×812 (mobile).

- document-level horizontal overflow detection (`scrollWidth > clientWidth + 1`) with offending-element reporting (deduplicated to top-most offenders)
- full-page screenshots at 1920 / 768 / 390 into `screenshots/{desktop,tablet,mobile}/` for human visual review
- broken-layout signals: content wider than viewport, fixed-element collisions surfaced via screenshots

### 4.3 Component-level checks (`visual.spec.ts`, admin)

- **Header:** logo block, global search input, notification badge, user dropdown opens and contains profile / change-password / logout
- **Sidebar:** active menu state follows route, collapse toggle works, long Vietnamese labels don't wrap out of the rail, mobile drawer opens/closes
- **Tables (businesses):** header alignment, column overflow stays inside the scroll container, empty state on nonsense search, pagination visible and clickable
- **Forms/modals (catalogs, businesses):** create modal centered, fits viewport height, closes; required-field validation messages appear under inputs; date picker / select dropdowns stay inside viewport on mobile
- **Cards (dashboard):** stat cards render equal heights per row; before/after interaction screenshots

### 4.4 User flows & roles (`user-flow.spec.ts`)

| Flow | Account | Checks |
|---|---|---|
| Real login via UI | admin | login page → dashboard greeting; CAPTCHA widget initialises |
| Full menu walk | admin | every visible menu entry navigates and renders |
| CRUD | admin | catalogs → create / edit / delete a `UIAUDIT-` document type (self-cleaning) |
| Search + filter + pagination | admin | businesses list |
| Restricted menu | readonly (CommuneStaff) | admin-only entries hidden; direct URL to identity/settings → 403 Result |
| No permission | noperm | business menus hidden, `/businesses` → 403 Result, no crash |
| Expired password | expired.pw | UI login forces `/account/complete-password-change` |
| Logout | admin | user dropdown → Đăng xuất → back to `/login` |

### 4.5 Console & network monitoring

Attached on **every** page in every spec (console `error`, `pageerror`, responses ≥ 400, failed requests except `net::ERR_ABORTED`). Third-party (Cloudflare Turnstile) failures are recorded separately and never counted as app bugs.

### 4.6 Performance UI check

Route navigation timings from 4.1; slow-interaction observations (search debounce, table render) noted in the bug report when observed > NFR thresholds (avg < 10 s, worst < 30 s).

## 5. Data policy

Mutating flows create records with the `UIAUDIT-` prefix only, and delete them in the same test (with stale-artifact cleanup before the run). No existing data is edited or deleted. All other tests are read-only.

## 6. Deliverables & exit criteria

- `route-inventory.md` — complete route/permission map
- `playwright/{routes,responsive,user-flow,visual}.spec.ts` + helpers — repeatable audit suite
- `screenshots/{desktop,tablet,mobile}/` — full-page captures for every route
- `ui-bug-report.md` — every defect with ID, severity (Critical/High/Medium/Low), repro, expected vs actual, root cause, suggested fix

The audit is complete when every route/viewport combination has been executed, every finding is triaged into the bug report, and false positives are documented as such.

## 7. Known constraints

- Another agent session works this repo concurrently (Batch F-2 / INT-03, uncommitted BE files). The audit only adds files under `testing/ui-audit/` and never restarts the stack.
- Heavy specs can flake under full-suite load (documented for `reporting-error-notifications`); audit runs use 4 workers and generous timeouts, and any load-contention flake is retried in isolation before being reported as a bug.
