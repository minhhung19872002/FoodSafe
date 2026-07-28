# Production Readiness Review — Frontend Production Quality

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · Primary evidence: the executed 323-test UI audit + fix cycle of this date (`testing/ui-audit/`), the 286/286 full-suite gate, and fresh inspection.

## 1. State handling — ✅ verified per feature

| State | Evidence |
|---|---|
| Loading | Unified AntD `Spin`/skeleton via route `RouteLoading` fallback + per-query loading; verified in feature verification checklists (34/34) |
| Empty | AntD empty states verified per list (e.g. businesses nonsense-search → `.ant-empty` — executed in UI audit) |
| Error | Coded server messages surfaced; catalogs/geography now show the precise ABP message (`extractApiError`, `83ec103`); global axios interceptor + Vietnamese status-fallback map with stack-trace suppression (`lib/apiError.ts`) — a genuinely production-grade error layer |
| Permission UI | Menu/tabs/routes permission-driven from one source (`routePermissions.ts`); 403 Result page; verified with real restricted accounts |
| Form validation | Zod + RHF with Vietnamese messages; server validation authoritative (browser-verified validation failures per feature) |
| Feedback | Success/error toasts consistent; workflow actions confirm via Popconfirm/modals |

## 2. Runtime health — ✅ measured, not assumed

From the re-run audit suite at the current build: **46/46 routes load clean** (no blank screens, no redirect loops), **zero console errors, zero page errors, zero failed same-origin requests** across all routes and flows; in-app 404 for authenticated users; anonymous users bounced to login without route-list leakage; **0 horizontal overflow across 258 route×viewport checks** (1920/1440/1366/768/390/375) after the `83ec103` fixes; mobile drawer/modals/selects verified at 390px.

## 3. Residual FE findings

| ID | Severity | Finding |
|---|---|---|
| FE-1 | Medium | **Two dead header controls on every authenticated page**: global search input with no handler and a notification bell with a hard-coded red dot and no backend (`AppLayout.tsx:453-474`). In a government acceptance review these read as unfinished product (G-15). Wire or remove before UAT |
| FE-2 | Medium | `ApiSpecs.View`-only users cannot reach `/data-integration` (route-map wiring, SEC-F2/G-02) |
| FE-3 | Low | Statistics/dashboard remain open to all authenticated users **by design** (BE `[Authorize]`-only) — consistent at all layers since `83ec103`, but the openness itself was never signed off (G-22). Confirm as policy |
| FE-4 | Low | UI-audit Low items untouched by request: dashboard card-height raggedness, 64px collapsed rail on phones, 403-page full reload, silent `maxLength` clipping, Turnstile widget lacking an inline retry (UIA-008…012) |
| FE-5 | Low | `EXTERNAL_SYSTEMS` hard-coded in FE (`DataIntegrationPage.tsx:75`) — catalog-drive later (G-16) |

## 4. Browser compatibility & i18n

- Chrome/Edge (Chromium) — fully evidenced (entire E2E estate). Firefox — required by YCKT; not in the automated matrix (manual smoke recommended at UAT; AntD 5 + Vite targets support it). No IE-era constructs; Vite `build.target` modern.
- Vietnamese-only UI with self-hosted Be Vietnam Pro (CSP-safe — the design pass verified the font actually loads); Unicode content round-trips proven down to the partner API layer (contract test asserts verbatim Vietnamese in stored payloads).

## 5. Bundle & structure

3.5MB dist, route-level code splitting (largest chunks: vendor/axios 432K, StatisticsPage 408K — recharts, table 172K, Leaflet tiles 152K); gzip roughly a third. Feature-folder isolation held (no cross-feature imports except the sanctioned PoisoningMap reuse, which carries an explanatory comment); no `any` policy upheld by oxlint+tsc clean.

**Verdict:** the frontend is in demonstrably shippable shape — states, permissions, responsiveness, and console hygiene are *measured* green, not asserted. The two dead header controls (FE-1) are the only thing a customer would visibly trip over; fix before UAT.
