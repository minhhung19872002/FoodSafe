# Regression Log

Record every verification invalidation and retest result here.

## Format

```
### YYYY-MM-DD — <summary>

- **Cause**: <what changed>
- **Commit**: <SHA>
- **Affected features**: <list>
- **Retest level**: <0–4>
- **Result**: PASSED | FAILED
- **Details**: <brief notes>
```

## Entries

### 2026-07-28 — P1-1j dashboard report-compliance widget (FR-39-03 ATTP work, FR-39-04 Action-Month)

- **Cause**: New browser-acceptance evidence for the dashboard per-unit report-compliance widget (doc 77 P1-1j; doc 73 was IMPLEMENTED_NOT_VERIFIED). New spec only (`FoodSafe.FE/e2e/dashboard-report-compliance.spec.ts`) — no product code changed.
- **Commit**: `3f0cf1b`
- **Affected features**: F-022 reporting (dashboard compliance aggregation) + F-021 dashboard. No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (2.6s), real backend, no interception.
- **Details**: Proves the widget's per-org counts are driven by **real report state**, not hard-coded. (1) A per-org **baseline** is read from the real `GET /api/v1/app/dashboard/report-compliance?Year=2026`. (2) One **ATTP work report** (`POST /api/v1/app/atp-work-report` → Draft, then `/{id}/submit` → Submitted) and one **Action-Month report** (`/api/v1/app/action-month-report`) are seeded + submitted for the officer's org through the **real workflow** (session cookie + antiforgery → ASP.NET Core → domain state machine → PostgreSQL). (3) Re-reading compliance shows the seeded org at **baseline+1** for both `atpWorkSubmitted` (FR-39-03) and `actionMonthSubmitted` (FR-39-04). (4) The real `/dashboard` widget "Tình hình nộp báo cáo" renders that org's row with **BC công tác ATTP = 1/2** and **BC Tháng hành động = 1/1**, and both **persist across `page.reload()`**. Teardown walks the real workflow back (Return → ReturnToDraft → Delete); DB check confirms 0 live non-draft 2026 residue. The baseline-delta assertion keeps the test re-run-safe regardless of residue. FR-39-09 (chart PNG download) remains open. Log: `compliance-run3.log`. Stack unchanged (no rebuild).

### 2026-07-28 — P1-1i business detail drawer related-record tabs (FR-19-11..16)

- **Cause**: New browser-acceptance evidence for the per-business detail tabs (doc 77 P1-1i, doc 73 was IMPLEMENTED_NOT_VERIFIED partial/structural). New spec only (`FoodSafe.FE/e2e/business-detail-tabs.spec.ts`) — no product code changed.
- **Commit**: `2d010a8`
- **Affected features**: F-011 business management (detail drawer related-record aggregation). No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (2.9s), real backend, no interception.
- **Details**: The test discovers a real business owning related data via the real self-declaration list (`GET /api/v1/app/self-declaration?MaxResultCount=1` → DTO `businessId`/`businessName`), then opens the "Hồ sơ cơ sở" drawer through the real browser at `/businesses`. All 5 tabs each fire their business-scoped GET (`businessId=` asserted in URL, 200): `self-declaration`, `product-registration`, `advertisement-registration`, `eligibility-certificate`, `inspection-result`; the "Tự công bố" tab shows ≥1 real row. Real React → nginx → ASP.NET Core → EF Core → PostgreSQL. Log: `bizdetail-run.log`. Stack unchanged (no rebuild).

### 2026-07-28 — P1-1h risk-analysis publish (FR-36-07) + public portal exposure (FR-36-08)

- **Cause**: New browser-acceptance evidence for two IMPLEMENTED_NOT_VERIFIED risk-analysis requirements (doc 77 P1-1h). New spec only (`FoodSafe.FE/e2e/risk-analysis-publish.spec.ts`) — no product code changed.
- **Commit**: `720d01a`
- **Affected features**: F-018 risk-analysis (publish state machine) + public portal `/tin-tuc` risk tab. No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (4.1s), real backend, no interception.
- **Details**: A Draft risk analysis is seeded via the real authenticated admin API (`POST /api/v1/app/risk-analysis`, Status=Draft) after a real UI login. **FR-36-07** — at `/risk-analysis` the officer publishes via the real "Xuất bản" button + Popconfirm → Tag flips Nháp → Đã xuất bản, persists across `page.reload()` (`POST /risk-analysis/{id}/publish` sets Status=Published + IsPublic=true atomically). **FR-36-08** — from a fresh anonymous context (no admin session) `/tin-tuc` → tab "Phân tích nguy cơ" lists the analysis (`GET /api/v1/public/risk-analyses`, `[AllowAnonymous]`). Real React → nginx → ASP.NET Core → EF Core → PostgreSQL. Cleanup: published rows are Draft-only-deletable → E2E-RISK soft-deleted via SQL (0 residual). Note: FR-36-08 "PDF" = client-side `window.print()` (no server PDF endpoint for risk-analysis). Log: `risk-run.log`. Stack unchanged (no rebuild).

### 2026-07-28 — P1-1g concrete-artifact exports: documents Excel+print (FR-38-07), statistics business-breakdown Excel (FR-40-07)

- **Cause**: Added browser-acceptance coverage for the remaining concrete-artifact export/print gaps in doc 73 (test-only; no product code changed).
- **Commit**: `f3b6920`
- **Affected features**: FR-38-07 (administrative-document list Excel export + per-document print), FR-40-07 (statistics "Cơ sở SXKD" business-breakdown Excel export).
- **Retest level**: 2 (feature runtime, new specs only)
- **Result**: PASSED — 3/3 green (5.1s), real backend, no interception.
- **Details**: New `documents-export-print.spec.ts` (2/2): a live document is seeded via the real authenticated admin API (`POST /api/v1/app/administrative-document`) after a real UI login (the live list is normally empty — all 23 fixtures soft-deleted); at `/documents` the list "Xuất Excel" downloads a non-empty OpenXML (PK) workbook and the per-row print button opens the real formatted print window (số văn bản + tiêu đề rendered); seeded rows deleted in `finally`. `excel-exports.spec.ts` +1 (FR-40-07): the "Cơ sở SXKD" tab's "Xuất Excel" (`GET /statistics/excel/business-breakdown`) downloads a non-empty PK workbook. Log: `exports-run.log`.

### 2026-07-28 — P1-1f citizen submission moderation: alert reject + news approval browser-proven (FR-29-06, FR-30-07)

- **Cause**: New evidence for two IMPLEMENTED_NOT_VERIFIED citizen-moderation requirements (doc 77 P1-1f). New spec only (`FoodSafe.FE/e2e/citizen-moderation.spec.ts`) — no product code changed.
- **Commit**: `f780fdb` (files: new `citizen-moderation.spec.ts` + docs 73/77/03 only)
- **Affected features**: F-016 alerts/news (citizen-source moderation queue). No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest — officer moderation of citizen submissions)
- **Result**: PASSED
- **Details**: `citizen-moderation.spec.ts` **2/2 green (10.1 s), no interception** (`cmod-all.log`). Citizen submissions seeded over **real HTTP** through the real public endpoints (`POST /api/v1/public/news-reports` + `/api/v1/public/alert-reports`, anonymous context, `captchaToken:"e2e-test-bypass-token"`) → real Turnstile captcha middleware → real app services → `AtpNews.CreateCitizenSubmission` / `AtpAlert.Create` (`Source=PublicReport`, `Status=Draft`) → PostgreSQL. Officer moderation driven entirely in the browser at `/alerts-news`: **FR-30-07** — tab "Tin tức ATTP", filter Nguồn="Từ dân", Draft row → **Xuất bản** → "Đã xuất bản", **persists across `page.reload()`**; **FR-29-06** — Alerts tab, filter Nguồn="Từ dân", row tagged "Từ dân"+"Nháp" → **Xóa** (reject, Draft-only) → row leaves the queue. Real React → nginx → ASP.NET Core → EF Core → PostgreSQL. **Env caveat** (not a defect): the real `/gui-tin`/`/gui-phan-anh` browser forms can't seed here — the third-party Turnstile widget never resolves a token in headless CI (submit POST never fires); the citizen endpoints are still fully exercised via real HTTP. doc 73 §8 records detail. Stack unchanged (no rebuild).

### 2026-07-28 — P1-1d (list filter/sort sweep): 5 sibling modules verification-only, sort correctly N/A

- **Cause**: Evidence-only sweep (no product code change). P1-1d (doc 77) called for "list filter + sort + page-size" browser evidence across businesses + inspection/food-poisoning/alerts/testing/risk-analysis. **businesses** was already closed with a real fix (FR-19-02, `f29fedc`). This entry resolves the **remaining five modules**. A code survey (`grep sorter` over `FoodSafe.FE/src/features`; `grep OrderBy/input.Sorting` over the list AppServices) found that **only `businesses` declares `sorter` columns** — inspection/food-poisoning/alerts/testing/risk-analysis expose **no sort UI** and each BE list service orders deterministically (`OrderByDescending` on `CreationTime`/`Year`/`SampleDate`/`InspectionDate`) then `PageBy(input)`. So there is **no businesses-style hidden-sort defect** for the five: nothing in their UI requests a sort the server drops. Sort is therefore **N/A**, not a gap.
- **Commit**: `a0313c1` (files: docs 73/77/03 only — no product or test code changed)
- **Affected features**: F-013 inspection (plan list), F-014 food-poisoning (cases list), F-016 alerts/news (alert list), F-017 testing-results, F-018 risk-analysis — list filter/empty-state. No product code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest per module; filter/empty-state)
- **Result**: PASSED
- **Details**: filter (search) + empty-state for all five already carry real-browser evidence in their `*-verification` specs (search box typed → positive match asserted → non-existent term asserts the empty state). Re-run at HEAD, **6/6 green, no interception** (`p1-1d-filter.log`, 16.1 s): `inspection-verification` "client validation, duplicate prevention, persistence after reload" + "empty state renders for unmatched search" (filter `"Mã kế hoạch, tên kế hoạch"`); `food-poisoning-verification` "persistence after reload and empty state" (filter `"Tìm theo mã ca, tên nạn nhân..."`); `alerts-news-verification` "persistence after reload and empty state" (filter `"Tìm theo tiêu đề, số cảnh báo..."`); `testing-results-verification` "persistence after reload, edit, and empty state" (filter `"Mã mẫu, tên mẫu"`); `risk-analysis-verification` "persistence after reload and empty state" (filter `"Tìm kiếm..."`). Real React → nginx → ASP.NET Core → EF Core → PostgreSQL. Net for P1-1d: **1 real defect fixed (businesses sort, `f29fedc`)**; the other five verification-only. Stack unchanged (no rebuild). doc 73 §7 records the full survey.

### 2026-07-28 — P1-1e (report workflow): Return/ReturnToDraft buttons now UI-driven (FR-33 workflow)

- **Cause**: Evidence-only sweep (no product code change). P1-1e's report-workflow-buttons portion was flagged "still pending" in doc 77. On execution the forward path (Submit→Verify→Complete) was already UI-driven by `reporting.spec.ts`, but the **Return ("Trả lại") and ReturnToDraft ("Về nháp") buttons were only ever exercised at the API level** (`reporting-verification.spec.ts` test 4 posts to `/return` + `/return-to-draft` directly). To close "Submit/Verify/Return/Complete **in-UI**" honestly, added a second test to the non-contested `reporting.spec.ts` that drives the return path through the real DOM.
- **Commit**: `2eca557` (files: `FoodSafe.FE/e2e/reporting.spec.ts`, docs 73/77/03)
- **Affected features**: F-015 reporting — NDTP workflow state machine (return path). New Playwright test code only; no product code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest; report workflow)
- **Result**: PASSED
- **Details**: `reporting.spec.ts` **2/2** (10.1 s); full reporting subset (`reporting` + `reporting-verification`) re-run **7/7** at HEAD, real React → nginx → ASP.NET Core → EF Core → PostgreSQL, **no interception** (`page.context().request` used only to seed the Draft + clean up via genuine HTTP). New test 2: seed Draft via API → open `/reporting` (NĐTP tab default) → year-filter to isolate the seeded row → **Draft→Submitted** via the "Gửi" button + Popconfirm (assert "Đã gửi" tag) → **Submitted→Returned** via the "Trả lại" button, which opens the "Trả lại báo cáo" modal requiring a "Lý do trả lại" reason (server-enforced `[Required]`) before "Lưu" (assert the orange "Trả lại" status tag) → **Returned→Draft** via the "Về nháp" button + Popconfirm ("Chuyển") (assert the "Nháp" tag). Existing test 1 continues to cover create + Submit/Verify/Complete UI + Excel `waitForEvent("download")` (`PK`). doc 73 FR-33 was already `PASS_WITH_BROWSER_EVIDENCE`; this adds the missing Return/ReturnToDraft **button** evidence. Stack unchanged (no rebuild).

### 2026-07-28 — P1-1b: inspection plan & result attachment round-trip browser-proven (FR-27-08/09, FR-28-03/05)

- **Cause**: Evidence-only sweep (no product code change). doc 73 had inspection plan attachments (FR-27-08/09) and result document up/download (FR-28-05) as `IMPLEMENTED_NOT_VERIFIED` — the attachment round-trip was proven for products + the licensing modules, but **no executed test ever uploaded a file to an inspection plan or result** (doc 71 §7). The shared DB also has **0 active inspection results**, so the proof must seed its own plan + result. Added `e2e/inspection-attachments.spec.ts`.
- **Commit**: `401105a` (files: `e2e/inspection-attachments.spec.ts`, docs 73/77/03)
- **Affected features**: F-013 inspection — plan attachments + result attachments. No product code changed → no invalidation of other features. New Playwright test code only.
- **Retest level**: 2 (single-feature runtime retest; attachment capability)
- **Result**: PASSED
- **Details**: `e2e/inspection-attachments.spec.ts` **2/2** (8.2 s), real React → nginx → ASP.NET Core → **ClamAV scan → MinIO** → EF Core → PostgreSQL, **no interception** (the `request` fixture seeds a deterministic `E2E-ATT`-prefixed plan/result/business cohort via genuine HTTP and cleans it up; distinct prefix from `inspection.spec.ts`'s `E2E-KH` so concurrent runs don't collide). Both tests: seed via API → open `/inspection` (Plans tab default / switch to "Kết quả") → find the seeded row → open the attachments modal → drive the real AntD `<Upload>` (`setInputFiles` a `%PDF` buffer; `beforeUpload` fires the mutation immediately — no confirm button) → assert **"Đã tải lên tài liệu."** toast + the file row → **`page.reload()` the whole browser, reopen the modal, the file survives** (real MinIO+DB persistence, not client state) → `waitForEvent("download")` and assert the streamed bytes start with `%PDF` (not a 404/HTML) → delete via the row's Popconfirm and assert the row is gone. Endpoints exercised: `POST/GET/DELETE /api/v1/app/inspection-plan/{id}/attachments` (+ `/download`) and the `inspection-result` equivalents. Post-run DB check: 0 leftover `E2E-ATT` plans/results/businesses. **Not covered**: the result *finalize* transition (FR-28-03) remains API-only. api stack unchanged (attachment/MinIO/ClamAV already deployed + healthy).

### 2026-07-28 — FR-19-02: business-list advanced filter + multi-column sort implemented & browser-proven

- **Cause**: Product code change (not evidence-only). doc 73 had FR-19-02 (advanced business filters) as `IMPLEMENTED_NOT_VERIFIED`. Driving the real business list surfaced that **multi-column sort was genuinely not implemented** — `BusinessAppService.GetListAsync` hard-coded `query.OrderBy(x => x.Name)` and ignored the client `Sorting` param, and the FE table columns had no `sorter`. Implemented it: BE added a whitelist `ApplySorting(query, input.Sorting)` (Name/Code/Status, asc+desc; falls back to Name-asc; no dynamic-LINQ) and the FE wired AntD server-side sort (`sorter: true` + controlled `sortOrder` + table `onChange` → `sorting` filter param, page reset guarded so pagination `onChange` doesn't clobber page). Status filter + pagination were already implemented; this proves all three against the real stack.
- **Commit**: `f29fedc` (files: `BusinessAppService.cs`, `business.types.ts`, `BusinessManagementPage.tsx`, `BusinessManagementView.tsx`, `e2e/business-list-filters.spec.ts`, docs 73/77/03)
- **Affected features**: F business list/management (FR-19-01/03..). `ApplySorting` only reorders the existing org-scoped `GetListAsync` query — it adds no rows, changes no filter/permission/scope predicate — so blast radius is the business list ordering only.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED
- **Details**: `e2e/business-list-filters.spec.ts` **3/3** (6.2 s), real React → nginx → ASP.NET Core → EF Core → PostgreSQL, **no interception** (the `request` fixture seeds/cleans deterministic keyworded cohorts via genuine HTTP and independently confirms each query param). (1) **status filter** — seed one Active + one Suspended cohort row; backend `GET ...&Status=1` / `&Status=3` each return exactly the matching row; real UI: search isolates both rows, then the status dropdown narrows to exactly one (Active shown / Suspended hidden, then vice-versa). (2) **column sort** — seed A/M/Z; backend `Sorting=code asc`→[A,M,Z], `code desc`→[Z,M,A]; real UI: clicking the "Mã" header cycles asc→desc and the first visible row's code follows the server order. (3) **pagination** — seed 3, `SkipCount`/`MaxResultCount=2` pages deterministically (page-2 rows disjoint from page-1); real UI: navigate to pager page 2 → first row changes. api+frontend images rebuilt + restarted (healthy) before verification.

### 2026-07-28 — P1-4: login CAPTCHA real-enforcement evidence (SEC-08)

- **Cause**: Evidence-only sweep (no product code change). doc 73 had SEC-08 as `IMPLEMENTED_NOT_VERIFIED` ("bypassed in dev by design") — the audit never observed the CAPTCHA gate actually reject/allow a request. Root of the "bypass": the dev stack is wired with Cloudflare Turnstile **test keys** (site `1x00000000000000000000AA`, always-pass secret `1x0000…AA`); there is **no bypass token** in code — `LoginCaptchaMiddleware` runs on every protected POST and calls real Cloudflare siteverify. So enforcement IS observable here. Added `e2e/login-captcha-enforcement.spec.ts` to prove it against the running full stack.
- **Commit**: `ee00412` (files: `e2e/login-captcha-enforcement.spec.ts`, docs 73/77/03)
- **Affected features**: SEC-08 login/reset/public-report CAPTCHA gate. Read-only probes (one throwaway-username failed-auth attempt; no real account lockout touched). No product code changed → no invalidation of other features.
- **Retest level**: 2 (security control runtime evidence)
- **Result**: PASSED
- **Details**: `e2e/login-captcha-enforcement.spec.ts` **6/6** (4.4 s), real HTTP via the `request` fixture (nginx → ASP.NET Core → `LoginCaptchaMiddleware`), **no interception**: (1) `POST /api/account/login` missing token → **400 `FoodSafe:Captcha:0001`** (rejected before Cloudflare is called — key-independent). (2) malformed JSON body → 400 captcha (SEC-M-01 regression: a bad body must not bypass). (3) valid token + valid admin creds → **200 `result:1`** (gate passes, login succeeds). (4) valid token + throwaway bad creds → **200 `result:2` InvalidUserNameOrPassword** — NOT a captcha 400, proving the gate cleared and auth failed independently. (5) `POST /api/account/send-password-reset-code` missing token → 400 captcha (coverage beyond login). (6) `/login` fires `GET /v1/security/captcha/config` → `{provider:"turnstile", siteKey:"1x…"}` and injects the Turnstile loader (widget mounts when enabled — keys wired from config, not hardcoded). **Still needs staging**: a real *failing* Turnstile challenge and production action/hostname pinning (`CaptchaConfiguration.Validate` forbids test keys + requires `ExpectedHostname` in Production; covered by Host tests) require an environment with real keys.

### 2026-07-28 — P1-1c: admin user-management lifecycle — 2 real defects fixed (FR-02-02/05/07)

- **Cause**: Driving the admin user-management page through the real browser (P1-1c) surfaced **two** functional defects. (1) **`Users.Delete` not surfaced to FE** — the delete button is gated on `hasPermission("FoodSafe.SystemAdmin.Users.Delete")`, but that permission was missing from `CurrentUserContextAppService.FoodSafePermissionNames` (the same hard-coded allowlist behind the P1-3 defect). Granted server-side, never reported to the FE → the delete button never rendered for any user incl. admin → delete was UI-unreachable. (2) **`DeleteUserAsync` NRE (HTTP 500)** — the method called `_userManager.DeleteAsync(existing.User)` where `existing.User` is a scoped projection (`CreateUserQueryAsync`) with no navigation collections (Roles/Claims/Logins/Tokens/OrganizationUnits) loaded, which `IdentityUserManager.DeleteAsync` dereferences → `NullReferenceException`. Fixes: (1) added `FoodSafePermissions.SystemAdministration.Users.Delete` to the allowlist (additive); (2) re-fetch a fully-loaded tracked user via `_userManager.GetByIdAsync(existing.Id)` before delete + `SaveChangesAsync`, mirroring the working `GenerateRandomPasswordAsync`.
- **Commit**: `fe74293` (files: `CurrentUserContextAppService.cs`, `IdentityAdministrationAppService.cs`, `CurrentUserContextPermissionContractTests.cs`, `e2e/identity-user-lifecycle.spec.ts`, docs 73/77/03)
- **Affected features**: F-001 identity administration (delete + permission filter). `CurrentUserContextAppService` is a shared authorization capability, but the allowlist change is **additive only** (one entry to a per-entry `IsGrantedAsync` allowlist) — it cannot alter any other permission's gating; `DeleteUserAsync` is local to identity admin. Level-3 regression scoped to identity administration accordingly.
- **Retest level**: 3 (shared auth capability; additive → blast radius = identity administration)
- **Result**: PASSED
- **Details**: `e2e/identity-user-lifecycle.spec.ts` **2/2** (9.3 s). Test 1 (FR-02-05/07): real UI create throwaway user → persists across full browser reload (re-search) → regenerate random password (≥8-char value from `POST .../random-password`, shown in modal) → delete → `DELETE .../users/{id}` returns **204** (confirmed in api logs, NRE gone) → account absent on re-search. Test 2 (FR-02-02): permission filter issues observed `GET .../users?permissionName=…` (not intercepted) and the filtered list renders. BE contract test `CurrentUserContextPermissionContractTests` **2/2** — added `Frontend_permission_projection_includes_system_administration` asserting all `SystemAdministration.Users.*`/`Roles.*` permissions are surfaced (would have failed pre-fix, locks in defect 1). No API interception. api image rebuilt + restarted (healthy) before verification.

### 2026-07-28 — P1-1e: dashboard/statistics filter rendered-UI evidence (FR-39-02, FR-40)

- **Cause**: Evidence-only sweep (no product code change). doc 73 had dashboard filters as `IMPLEMENTED_NOT_VERIFIED` and statistics as `PASS_WITH_BACKEND_ONLY` (heading-only browser checks). Added `e2e/dashboard-statistics-filters.spec.ts` to prove the filters drive rendered content, not just the backend.
- **Commit**: `e2665e4` (files: `e2e/dashboard-statistics-filters.spec.ts`, docs 73/03)
- **Affected features**: F-039 dashboard, F-040 statistics — read-only filter paths. No mutation, no shared capability → no invalidation of other features.
- **Retest level**: 2 (per-feature runtime evidence, filter sub-flow)
- **Result**: PASSED
- **Details**: `e2e/dashboard-statistics-filters.spec.ts` **3/3** (5.4 s). (1) Dashboard year `Select` → the "Tình hình nộp báo cáo … — Năm YYYY" card title re-renders to the chosen year (and the old year's title disappears). (2) Quick-action card "Kế hoạch thanh tra" → real React-Router nav to `/inspection` landing on the "Thanh tra - Kiểm tra ATTP" heading. (3) Statistics year `Select` → monthly-chart titles re-render to the chosen year. Read-only, no API interception. Still `IMPLEMENTED_NOT_VERIFIED`: FR-39-03/04/09 (compliance widgets, chart PNG download).

### 2026-07-28 — P1-1a: Excel-export browser evidence for uncovered admin/catalog/statistics modules (FR-02-13, FR-03-03, FR-06-06, FR-17-05, FR-40-02/04/06)

- **Cause**: Evidence-only sweep (no product code change). doc 73 listed these five exports as `IMPLEMENTED_NOT_VERIFIED` — the export UIs existed but no executed spec exercised the real download. Added `e2e/excel-exports.spec.ts` to drive each real "Xuất Excel" button and assert the browser receives a genuine, non-empty OpenXML workbook.
- **Commit**: `2adc785` (files: `e2e/excel-exports.spec.ts`, docs 73/03)
- **Affected features**: F-001 identity admin, F-003 audit logs, F-006 organizations, F-catalogs, F-statistics — export path only. No shared capability touched (test-only addition) → no invalidation of other features.
- **Retest level**: 2 (per-feature runtime evidence, export sub-flow)
- **Result**: PASSED
- **Details**: `e2e/excel-exports.spec.ts` **5/5** (7.2 s). Each test: real admin login → real route → click "Xuất Excel" → `page.waitForEvent("download")` → read bytes → assert `.xlsx` filename **and** ZIP magic `PK` (proves a real ClosedXML/MiniExcel stream reached the browser, not an empty/error blob). Statistics test covers all 3 report tabs (licenses / poisoning / inspection). No API interception. Still `IMPLEMENTED_NOT_VERIFIED`: FR-03-02 (audit detail view), FR-40-07/08 (further breakdown exports).

### 2026-07-28 — P1-3: data-sharing Share permission missing from current-user-context allowlist (FR-51)

- **Cause**: Driving the outbound share through the real UI (P1-3) surfaced a functional defect. The "Chia sẻ dữ liệu" button is gated on `hasPermission("FoodSafe.DataIntegration.Share")`; the FE permission list is built by `CurrentUserContextAppService.FoodSafePermissionNames`, a hard-coded allowlist that **omitted `DataIntegration.Share`**. The permission was granted server-side (API authorized) but never reported to the FE → the button never rendered for any user, incl. admin → the share action was UI-unreachable. Fix: added `FoodSafePermissions.DataIntegration.Share` to the allowlist (one line, purely additive).
- **Commit**: `9cfcf11` (files: `CurrentUserContextAppService.cs`, `e2e/data-integration-share.spec.ts`, docs 73/77/03)
- **Affected features**: F-019 Data Integration (share action). `CurrentUserContextAppService` is a shared authorization capability, but the change is **additive only** (adds one entry to a per-entry `IsGrantedAsync` allowlist) — it cannot remove or alter any other permission, so no other feature's gating changes. Level-3 regression scoped to DataIntegration accordingly.
- **Retest level**: 3 (shared auth capability; additive → blast radius = DataIntegration)
- **Result**: PASSED
- **Details**: `e2e/data-integration-share.spec.ts` **3/3** (UI share → toast → Outbound history row → reload persistence; inactive→VN workflow error; non-admin→403 Result). Full DataIntegration e2e regression **17/17** (`credentials` 6 + `verification` + `data-integration` + `share` 3). No API interception. api image rebuilt + restarted (healthy) before verification.

### 2026-07-28 — P0-2: outbound API credential encryption + auth-header injection (FR-50/51)

- **Cause**: New capability — partner endpoints store an outbound-auth secret (API key / bearer / Basic), encrypted at rest via ABP `IStringEncryptionService`, injected onto the outgoing share request at send time and never returned to the client or persisted to the call log. Touched `ApiEndpoint` aggregate (+`EncryptedCredential`/`HasCredential`/`SetEncryptedCredential`), EF mapping (`credential_value`), `ApiEndpointDto`/`CreateUpdateApiEndpointDto`, `ApiEndpointAppService`, `DataSharingAppService.ApplyAuthHeader`, FE editor + detail drawer, and migration `20260727183552_AddApiEndpointCredential`.
- **Commit**: `3fe7325`
- **Affected features**: F-019 Data Integration (extended; credential capability). No change to businesses/auth source.
- **Retest level**: 2 (feature) + targeted Level-3 shared-stack regression (rebuilt api image)
- **Result**: PASSED — `data-integration-credentials.spec.ts` **6/6** against the real stack, no API interception (write-only secret never returned by create/detail/list; Bearer→`Authorization`/API-key→`X-Api-Key` injection **observed at a real external receiver** postman-echo; rotate + `ClearCredential` stops injection; noperm share → 403; real UI at `/data-integration` renders the write-only field and never shows the secret). Shared-stack regression `businesses-verification` + `auth-verification` **13/13**.
- **Details**: This work had been silently wiped from the working tree by a parallel-agent git operation on the shared `fix/production-blockers` branch (source clean, migration file + snapshot entry gone) and was re-implemented from current source. Disposable dev DB reconciled before re-migration: dropped the orphaned `credential_value` column (4 leftover dev rows) and deleted the stale `20260727175710_AddApiEndpointCredential` history row so the freshly generated migration applied cleanly (migrator exit 0). `SharedClient` kept SSRF-guarded (B-5); switch to `IHttpClientFactory` deferred (auth rides the per-request `HttpRequestMessage`, so a static client is not a credential-leak vector). Committed selectively (own 11 files only) to survive the volatile shared tree.

### 2026-07-28 — AutoMapper 15.1.3 pin was a runtime-broken "fix"; reverted to 14.0.0 (B-6 corrected)

- **Cause**: Re-verifying P0-2 surfaced an app-wide HTTP 500 `MissingMethodException` on **every** `ObjectMapper` call. Root cause: a prior "B-6 FIXED" commit (`452f666`) pinned `AutoMapper 15.1.3` in `common.props`. AutoMapper 15.x removed the `MapperConfiguration(MapperConfigurationExpression)` constructor that `Volo.Abp.AutoMapper 9.3.7` calls; NuGet unifies the `>=14` request to 15, so it **builds** but throws at runtime. The earlier "591 tests green / --vulnerable clean" evidence was build-/stale-artifact-verified only, never runtime-verified — a concrete instance of "do not trust completion percentages without executable evidence."
- **Commit**: `9bca58f`
- **Affected features**: All (every AppService uses `ObjectMapper`). Was masking businesses-verification 5 failures.
- **Retest level**: 3 (shared dependency — object mapping)
- **Result**: PASSED after revert — `businesses-verification` + `auth-verification` **13/13**, 0 `MissingMethodException` in api logs.
- **Details**: Reverted the pin to `AutoMapper 14.0.0` (the only ABP-9.3.7-compatible line; no patched 14.0.x exists). CVE-2026-32933 (GHSA-rvv3-g6hj-g44x) uncontrolled-recursion DoS is **fix-only-in-15.1.1+**, so it is now accepted-risk with compensating controls: `System.Text.Json` default `MaxDepth=64` bounds request-graph depth before mapping, and the two recursive AutoMapper profiles capped at `.MaxDepth(8)`. Re-added to the NuGet-vulnerability allow-list with justification; tracked to the ABP 10 upgrade. Docs 08 (B-6) corrected; 04 §3.2 / 43 pending.

### 2026-07-27 — Functional-gap completion batch (STT 2-5, 19, 27-35, 39-40, 48, 51-57) + merge with parallel main batch

- **Cause**: Feature branch `feature/complete-remaining-functions` implemented the audit-65/66 backlog (Excel exports, audit-log detail, user delete/random password/permission search, full Settings module, business filters + per-business tabs, dashboard filters + report-compliance widgets + chart download, profile/avatar, inspection attachments + finalize, citizen alert/news moderation + citizen news channel, report auto-calc/roll-up/document view, typed data-sharing engine) and merged `origin/main`'s parallel batch, keeping the feature-branch implementations and de-duplicating merge artifacts. Fresh-database seeding gaps fixed (region/role ordering, document-type catalog seed).
- **Commit**: merge `bdfff4c` + spec fixes (this commit)
- **Affected features**: All (Level 3-4 — shared FE pages, permissions, EF model, seeding)
- **Retest level**: 4 (full regression)
- **Result**: PASSED — BE 519/519 xUnit, FE 112/112 Vitest, FE production build + oxlint clean, Playwright full suite 232+ tests against the rebuilt Docker stack (fresh volume, real login, no API interception)
- **Details**: Three spec-level defects found and fixed during certification: (1) documents E2E blocked on empty document-type catalog → seeded 8 standard types; (2) citizen alert form required danh mục while the backend defaults it → made optional; (3) system-settings spec was written for the removed static stub → rewritten for the live editable page; reporting month-picker made robust against antd virtualized dropdown on slow machines. E2eTestDataSeedContributor now self-seeds its region/role dependencies so a fresh `docker compose up` migrates cleanly.

### 2026-07-27 — Infrastructure blockers cleared; F-013 verified; full suite green

- **Cause**: Fixes for inspection plan items editor (unconnected antd form), PoisoningMap null-coordinate crash, Development rate limits, cookie-auth 302→401/403 on `/api/*`, and E2E hardening (stale-data self-healing cleanup, Popconfirm scoping, unique test data)
- **Commit**: `c8f9537`
- **Affected features**: All (authentication response contract and rate limiting are Level 3 shared dependencies)
- **Retest level**: 3 (full suite executed — 41/41 specs pass against the real Docker stack)
- **Result**: PASSED
- **Details**: F-013 (Inspection) verified with the full checklist including unauthenticated access (401), permission denial (403 for `noperm@foodsafe.local`), cross-organization isolation (`district.staff@foodsafe.local` cannot see or fetch province plans), invalid workflow transitions rejected, server- and client-side validation, duplicate prevention, Excel export, empty state, and persistence after reload. Evidence: `docs/testing/features/inspection.md`. Remaining features stay READY_FOR_TEST until each runs the same checklist.

### 2026-07-27 — F-015 DIRTY cleared; F-002 unblocked with password-history defect fix; F-007..F-012 verified

- **Cause**: (a) shared `FoodSafeHttpApiHostModule` change from security pass `06656c8` dirtied F-015; (b) F-002 verification found a product defect — password history stored the NEW hash after each change, so the replaced password never entered history and could be reused immediately
- **Commit**: `b2f13fb` (fix + F-002 spec); verification specs `232c814`/`9af99ba`/`df7823c`
- **Affected features**: F-015 (retested); F-002 (fixed + verified); all features re-run due to auth-helper hardening (signIn now asserts ABP login result=1 — HTTP 200 alone does not prove login success)
- **Retest level**: 3 — full suite (90 tests) rebuilt-image run: 90/90 PASSED; F-002 spec 2/2 PASSED after API rebuild; backend Application.Tests 251/251
- **Result**: PASSED
- **Details**: F-007..F-012 verified via per-feature verification specs (unauthenticated 401, noperm 403, cross-org hidden+blocked, revoke/double-revoke, duplicate numbers, server validation, persistence after reload, empty states). F-009 exposed a server rule requiring `productIds` min 1 on advertisement registrations (fixture adjusted, rule verified). Evidence: `features/*.md`.

### 2026-07-27 — Security pass: secrets, integration toggle URL, news recall audit

- **Cause**: Tracked appsettings credentials blanked (moved to gitignored appsettings.secrets.json + fail-fast startup validation); data-integration `toggleEndpointStatus` URL fixed (`/api/api/app/...` doubling); `AtpNews.Recall` now records `RecalledById`/`RecalledAt` (migration `AddNewsRecallAudit` with backfill + CHECK)
- **Commit**: `06656c8`
- **Affected features**: F-016 (Alerts & News — BE contract extended, additive), F-019 (Data Integration — toggle endpoint now reachable). Both were READY_FOR_TEST, not VERIFIED — no invalidation needed. No VERIFIED feature touched.
- **Retest level**: 2 planned at verification sweep (frontend Docker image not yet rebuilt with the FE fix; toggle must be runtime-verified when F-019 runs its checklist)
- **Result**: PASSED (backend 480/480 unit+contract tests; FE data-integration Vitest 5/5; migration applied cleanly to dev DB)
- **Details**: Stale MSW contract tests that pinned the old buggy `/api/app/...` paths were repaired to pin the real `/v1/app/...` routes and now also cover toggle-status.

### 2026-07-27 — Report error notifications implemented (FR-33/34/35-05); inspection FE route fixes

- **Cause**: (a) New error-notification endpoints + UI for all 3 report types (get/add/acknowledge/respond; domain guard relaxed to Submitted-or-Verified per YCKT "sau khi gửi"); (b) discovered via ABP api-definition that FE inspection `markViolationRemedied` and `setFollowUpResult` called nonexistent routes (`/{id}/violations/{vid}/remedied`, `/{id}/follow-up-result`) — fixed to the real conventional routes (`/mark-violation-remedied?resultId&violationId`, `/{id}/set-follow-up-result`)
- **Commit**: see this commit
- **Affected features**: F-015 (Reporting) → DIRTY (new surface must be verified); F-013 (Inspection) → DIRTY (two actions were broken in FE and are not covered by inspection-verification.spec.ts — false-positive portion of prior verification)
- **Retest level**: 2 per feature after stack rebuild — specs: `reporting-verification`, new `reporting-error-notifications`, `inspection-verification` (+ manual/API check of the two fixed inspection actions)
- **Result**: PENDING (stack rebuild required; unit/contract suites green: BE 481, FE reporting+inspection 11/11)

### 2026-07-27 — F-013/F-015 re-verified after error-notification feature (retest level 2)

- **Cause**: Error-notification endpoints/UI added to reporting; inspection FE route fixes
- **Commit**: `07476e3`
- **Affected features**: F-015, F-013
- **Retest level**: 2 (rebuilt stack: `reporting-error-notifications` 2/2, `reporting-verification` 7/7, `reporting` 2/2, `inspection` 5/5, `inspection-verification` 7/7 — the last one flaked once inter-spec, passed 7/7 in isolation)
- **Result**: PASSED
- **Details**: Error-notification lifecycle runtime-verified: draft-rejection, submit→add (Pending), server validation 400, acknowledge (Acknowledged), respond (Corrected), persistence via separate GET, permission denial for noperm user, UI modal display. NOTE: FE `markViolationRemedied`/`setFollowUpResult` api methods are correct now but are **dead code — no UI calls them**; recorded in doc 66 M15.

### 2026-07-27 — Remaining functional gaps closed (branch `feature/close-remaining-gaps`)

- **Cause**: Six remaining gaps implemented after re-reconciling docs 73/74 against post-merge `main`: FR-50-05 endpoint Test Connection (`POST /api/v1/app/api-endpoint/{id}/test-connection` + FE Test button); FR-38-07 administrative document attachments (upload/download/delete controller + modal) and print view; FR-36-08 risk analysis print view (new `utils/printHtml.ts`); FR-39-08 poisoning map embedded on Statistics page; DT-08 `ActionMonthDates` format validation (BE DataAnnotations + FE antd rules, `dd/MM/yyyy - dd/MM/yyyy`); L1 six `Class1.cs` scaffold stubs deleted. NFR-01..06 evidenced by k6 load test (`scripts/load-test.k6.js`, results in `05-load-test-results.md`).
- **Commit**: see this commit
- **Affected features**: F-019 (Data Integration — additive endpoint), F-020/documents (attachments + print — additive), risk-analysis (print — FE-only additive), F-018/statistics (map section — FE-only additive), F-015 (Reporting — DTO validation tightened)
- **Retest level**: 4 (full regression on rebuilt Docker stack with fresh code)
- **Result**: PASSED — BE 519/519 (Domain 197, Application 251, HttpApi.Host 53, EFCore 18); FE Vitest 112/112; FE `npm run build` + oxlint clean; Playwright full E2E **235/235 passed (4.8m)**, no API interception
- **Details**: Load test: 30 concurrent VUs held 2 minutes — 3,270 requests, 0% failed, avg 31ms, max 418ms (NFR-01/02/05/06 PASS); API container CPU avg ~54%, PostgreSQL ~20% under load (NFR-03/04 PASS). `ActionMonthDates` tightening is contract-narrowing but no seed/E2E/tests used non-conforming values; domain layer still accepts free text (validation at DTO boundary only).

### 2026-07-27 — Detail views, double-click, and workflow/data flows (branch `feature/detail-views-and-flows`)

- **Cause**: (a) All 22 entity lists now open a read-only detail view on row double-click — new shared `components/RecordDetailDrawer.tsx` + per-feature drawers (19 lists previously had no read-only detail at all); existing detail surfaces (BusinessDetailDrawer, ReportDocumentViewModal, call-log modal) wired to double-click. (b) Dead/missing flows implemented: poisoning error-report Acknowledge/Respond lifecycle (BE endpoints `acknowledge-error-report`/`respond-error-report` for case+incident, new `PoisoningErrorReportsModal`, warning button on non-draft rows); inspection plan item status transitions FR STT 27.4 (`InspectionPlan.UpdateItemStatus` guard-railed to InProgress/Skipped, `PUT /inspection-plan/{id}/item-status/{itemId}`, items table with Bắt đầu/Bỏ qua buttons in plan detail drawer); license expiry warnings 30/60/90 days (`GET /dashboard/expiring-licenses` across 5 license types + dashboard card with tier Tags). (c) Business picker in inspection editors upgraded to server-side search (BE cap 50 made new businesses unpickable on data-rich DBs — real UX defect found via E2E).
- **Commit**: see this commit
- **Affected features**: every list page (additive detail drawers), F-013 Inspection (item transitions + picker search), food-poisoning (error-report lifecycle), dashboard (expiring licenses)
- **Retest level**: 4 (full regression on rebuilt Docker stack)
- **Result**: PASSED — BE 519/519; FE Vitest 112/112; FE build + oxlint clean; Playwright full E2E **235/235 (4.6m)**, no API interception; new routes verified against `/api/abp/api-definition`; expiring-licenses smoke-tested via real cookie login (HTTP 200)
- **Details**: Initial full run had 3 failures: inspection + eligibility specs failed because accumulated E2E data pushed the target business out of the capped options list (fixed by server-side search in inspection FE + typing the business name in both specs); businesses spec was an antd dropdown timing flake (chooseFirstOption now retries until the selector displays a value; full create flow verified working via standalone browser probe — app itself was correct, POST 200). Reran businesses spec 3/3 green, then full suite green.
