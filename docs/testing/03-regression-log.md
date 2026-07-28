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

### 2026-07-28 — Default list ordering → CreationTime desc + server-side column sorting (cross-cutting UX change)

- **Cause**: Product request: every admin list must show newly created items first by default; the previous per-feature ordering must remain reachable via column-header sorting. BE: 16 AppServices gained/changed a whitelisted `ApplySorting` (fallback `CreationTime desc`; whitelist = old default field + `creationTime`, businesses/organizations keep their existing name/code/status/level entries). DTO constructor `Sorting` defaults that pre-empted the fallback were changed to `creationTime desc` or removed (`BusinessListInput`, `GetOrganizationListInput`, `SelfDeclarationListInput`, `ProductListInput`, 5 Licensing list inputs). FE: 14 list surfaces gained controlled server-side sorters (testing-results, documents, inspection plans+results, 3 reporting tabs, 5 licensing pages, self-declarations, products table, data-integration partners + api-specs tabs) following the businesses pattern. Catalogs (`SortOrder`), logs (`CalledAt`/`ReceivedAt`), public portal, and lists already on `CreationTime desc` were deliberately not touched.
- **Commit**: working tree on `feat/integration-completion` (mixed with a concurrent session's business-delete-guard work; commit pending)
- **Affected features**: F-003, F-006, F-007, F-008, F-009, F-010, F-011, F-012, F-013, F-015, F-017, F-019f, F-019g, F-031 — all marked DIRTY in the registry.
- **Retest level**: 2 per affected feature (list default order = newest first, header-click sort round-trip incl. restoring the old ordering, pagination/sort interplay, persistence of list behavior after reload).
- **Result**: PENDING — build gates only so far: BE compile 0 errors, FE `tsc -b` clean, `oxlint` clean. Runtime E2E not yet run.
- **Details**: Watch for e2e specs that implicitly assumed the old ordering (first-row assertions on name-/date-sorted lists). ABP populates `input.Sorting` from DTO constructors, not null — that is why the DTO default changes were required for the AppService fallback to ever apply.

### 2026-07-28 — INT-01 outbound SSRF caps — regression tests (redirect + response size)

- **Cause**: P2 explicitly required real regression tests for the outbound SSRF caps "enforce maximum redirects, enforce response-size limit". The guard already sets `AllowAutoRedirect=false` and `MaxResponseContentBufferSize=2 MB`, but neither had a test. These caps cannot be exercised end-to-end (the connect guard refuses every loopback/private address a test HTTP server could bind to, so no origin can serve a real 3xx or oversized body), so the meaningful regression guard is a config-lock test. Extracted the hardened `SocketsHttpHandler` into an **internal, behaviour-identical** `OutboundUrlValidator.CreateGuardedHandler()` factory so the handler's redirect flag is assertable without reflection. Changed files: `FoodSafe.BE/src/FoodSafe.Application/Security/OutboundUrlValidator.cs` (pure method extraction — no behaviour change), `FoodSafe.BE/test/FoodSafe.Application.Tests/Security/OutboundUrlValidatorTests.cs` (+2 tests).
- **Commit**: `d4b964d`
- **Affected features**: F-019 / F-019f (DataIntegration) depend on `OutboundUrlValidator` (shared outbound client). The source change is a behaviour-identical extraction: the returned client/handler are byte-for-byte equivalent to before (same `PooledConnectionLifetime`, `AllowAutoRedirect=false`, `ConnectCallback`, timeout, `MaxResponseContentBufferSize`). **No feature invalidated.**
- **Retest level**: 0 (behaviour-preserving refactor + additive tests) — verified by the affected control's own unit suite.
- **Result**: PASSED — `FoodSafe.Application.Tests` filtered to `OutboundUrlValidatorTests`: **60/60 green** (was 58), 35 ms, exit 0. New tests: `GuardedHandler_never_follows_redirects` (asserts `AllowAutoRedirect==false` + connect callback wired) and `GuardedHttpClient_caps_the_buffered_response_size` (asserts `MaxResponseContentBufferSize == MaxResponseBytes == 2 MB`).
- **Details**: Closes the "add real regression tests" clause of P2 for the two SSRF caps that the connect-time IP-block tests (already present, 58 cases) did not cover. Log: `ssrf-tests.log` (git-ignored). No stack rebuild (test-only + extraction).

### 2026-07-28 — FR-39-09 statistics chart PNG download (P1-1m) — real defect fix

- **Cause**: New browser-acceptance evidence for the statistics chart PNG download buttons (doc 77 P1-1m; doc 73 was IMPLEMENTED_NOT_VERIFIED) — **and a real production defect fix**. `downloadChartAsPng` rasterized the chart SVG by assigning a `blob:` object URL to an `<img>`, but the app's Content Security Policy allows `img-src 'self' data: https://*.tile.openstreetmap.org` and **not** `blob:`; the browser rejected the image before load (`image.onerror`), the export promise rejected, and no PNG was ever produced — both chart download buttons silently failed in the real app (only an error toast). Fix: use a CSP-allowed `data:` URI for the intermediate SVG (`encodeURIComponent` keeps the Vietnamese labels intact); no CSP change. Changed files: `FoodSafe.FE/src/utils/chartExport.ts` (fix) + new `FoodSafe.FE/e2e/statistics-chart-download.spec.ts`.
- **Commit**: `de06374`
- **Affected features**: F-018 statistics (chart image export only). `chartExport.ts` is imported solely by `StatisticsPage.tsx`, so no other feature is invalidated.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (1.7s), real backend, no interception.
- **Details**: Root cause found via an in-browser diagnostic that replicated the rasterization and reported the exact failure point (`image.onload` never fired; console showed the CSP `img-src` violation on the `blob:` URL). After switching to a `data:` URI, the same in-page replication produced a real 62,961-byte PNG (chart 982×300) with **zero CSP console errors**. `statistics-chart-download.spec.ts` then logs in through the real login screen, opens `/statistics` served by the real backend, clicks both time-series download buttons ("Thanh kiểm tra theo tháng" + "Ngộ độc thực phẩm theo tháng") and asserts real browser downloads whose bytes begin with the 8-byte PNG signature and whose suggested filenames are the year-stamped `thanh-kiem-tra-<year>.png` / `ngo-doc-thuc-pham-<year>.png`. FE image rebuilt for this fix; no BE rebuild. Log: `fr39-09b.log`.

### 2026-07-28 — FR-38 administrative-document attachments (P1-1b remainder)

- **Cause**: New browser-acceptance evidence for the `/documents` attachment modal (last untested piece of the P1-1b attachment batch) — **and a real FE defect fix**. The modal read `sizeBytes`/`creationTime` from the attachment DTO, but the backend `FileAttachmentDto` serializes `fileSize`/`uploadTime`, so the "Kích thước" and "Ngày tải" columns rendered `NaN KB` / `Invalid Date`. Changed files: `documentApi.ts`, `DocumentAttachmentsModal.tsx` (FE fix) + new `documents-attachments.spec.ts`. No backend change — the attachment endpoint already existed via the shared `InspectionAttachmentAppServiceBase` / `DocumentAttachmentStore`.
- **Commit**: `9ca9a7b`
- **Affected features**: F-020 administrative documents (attachment display only). The fix is isolated to the documents feature's attachment modal; no shared component/API-client changed → no other feature invalidated.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (4.0s), real backend, no interception.
- **Details**: `documents-attachments.spec.ts` drives the real `/documents` attachment modal end-to-end. A document is seeded over real authenticated HTTP (session cookie + antiforgery → ASP.NET Core → EF Core → PostgreSQL); then in the real browser the officer opens the paper-clip **"Tệp …"** modal and uploads a real PDF through the real `<Upload>` control. The upload is a **real multipart POST** → ASP.NET Core → **ClamAV** malware scan → **MinIO** blob store → PostgreSQL `file_attachments` row. Assertions: success toast `Đã tải lên tài liệu.`; the row shows the real file name, a real **"N KB"** size and a **valid date** (regression guard — asserts no `NaN`, no `Invalid Date`); the attachment **persists across a full `page.reload()`** (served by the backend); **download** yields bytes starting with the `%PDF` magic; **delete** (`Đã xóa tài liệu.`) removes the row. Teardown deletes the seeded document; the attachment left by the UI delete is soft-deleted (`is_deleted=true`), consistent with the soft-delete pattern, and the per-run stamp keeps the test re-run-safe. FE image rebuilt for this fix; no BE rebuild. Log: `docs-attach1.log`. Closes P1-1b in full.

### 2026-07-28 — FR-34-10 ATTP work-report auto-aggregation ("Tự tính số liệu từ hệ thống")

- **Cause**: New browser-acceptance evidence for the ATTP work-report auto-aggregation button (doc 77 P1-1 batch; doc 73 was IMPLEMENTED_NOT_VERIFIED). New spec only (`FoodSafe.FE/e2e/atp-work-auto-aggregation.spec.ts`) — no product code changed.
- **Commit**: `7d38721`
- **Affected features**: F-022 reporting (ATTP work-report auto-aggregation, FR-34-10). No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (4.2s), real backend, no interception.
- **Details**: Proves the ATTP report's auto-filled figures are computed from **real live system data**, not hard-coded. (1) A **baseline** is read from the real `GET /api/v1/app/report-calculation/atp-work-stats?PeriodType=2&PeriodYear=2026`. (2) **One** business is seeded over real authenticated HTTP (session cookie + antiforgery → ASP.NET Core → EF Core → PostgreSQL); its CreationTime = now falls inside the 2026 annual period, so re-reading the endpoint shows `totalBusinesses` **and** `newBusinesses` each at exactly **baseline + 1** and non-zero real figures. (3) A Draft ATTP report is seeded and opened in the **real browser** at `/reporting`; clicking **"Tự tính số liệu từ hệ thống"** fires the real `GET …/atp-work-stats` (200), shows the success message `Đã tự tính số liệu từ dữ liệu hệ thống`, and populates `#totalBusinesses`/`#newBusinesses`/`#businessesInspected` with **EXACTLY** the endpoint response. (4) **Save** persists and survives a full `page.reload()`. Teardown deletes the Draft report and the business; the baseline-delta assertion keeps the test re-run-safe regardless of residue. No API interception. Log: `atp-run1.log`. Stack unchanged (no rebuild). Closes the last FR-34 auto-aggregation gap; FR-34-08 (formatted view) remains a low-priority view-only IMPLEMENTED_NOT_VERIFIED item.

### 2026-07-28 — FR-33-02 NDTP roll-up aggregation ("Tổng hợp từ báo cáo tuyến dưới")

- **Cause**: New browser-acceptance evidence for the NDTP roll-up aggregation button (doc 77 P1-1 batch; doc 73 was IMPLEMENTED_NOT_VERIFIED). New spec only (`FoodSafe.FE/e2e/ndtp-rollup-aggregation.spec.ts`) — no product code changed.
- **Commit**: `714e318`
- **Affected features**: F-022 reporting (NDTP roll-up aggregation). No product/shared code changed → no invalidation of other features.
- **Retest level**: 2 (single-feature runtime retest)
- **Result**: PASSED — 1/1 green (4.6s), real backend, no interception.
- **Details**: Proves the higher-tier NDTP report's aggregated figures are driven by **real lower-tier report state**, not hard-coded. (1) A per-period **baseline** is read from the real `GET /api/v1/app/report-calculation/ndtp-aggregation?PeriodYear=&PeriodMonth=` (period derived from a per-run stamp to avoid the `idx_ndtp_org_period` unique-index residue collision). (2) A **lower-tier** (`district.staff@foodsafe.local`) NDTP report is seeded through the **real workflow** — create Draft → `PUT /{id}/stats` with real casualty/incident figures → `POST /{id}/submit` (session cookie + antiforgery → ASP.NET Core → domain state machine → PostgreSQL). (3) Re-reading aggregation shows `reportCount` and **all 8 stat fields** at exactly **baseline + child**. (4) An **org-isolation guard** asserts the higher-tier province draft's org ≠ the child report's org. (5) In the **real browser** at `/reporting`, the officer filters the NDTP list by year (AntD InputNumber via `pressSequentially` to fire rc-input-number `onChange`), opens the draft editor, clicks **"Tổng hợp từ báo cáo tuyến dưới"** — the real `GET …/ndtp-aggregation` returns 200, the success message reads `Đã tổng hợp từ {reportCount} báo cáo tuyến dưới`, and all 8 form fields populate with the aggregated values. (6) **Save** persists and survives a full `page.reload()`. Teardown walks the child back (Return → ReturnToDraft → Delete) and deletes the province draft; the baseline-delta assertion keeps the test re-run-safe regardless of residue. No API interception. Log: `ndtp-rollup5.log`. Stack unchanged (no rebuild).

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
### 2026-07-28 — Defect-fix batch on top of `fe3dbd2` (working tree, uncommitted)

- **Cause**: An audit sweep found defects that the green 235/235 suite did not cover. Fixed in
  this batch:
  1. **Data loss (critical)** — `InspectionResultEditorModal` submitted `violations: []` on every
     save while `InspectionResultAppService.UpdateAsync` replaces the whole collection, so editing
     any field of an inspection result permanently deleted every itemised violation (code, legal
     reference, fine, remedy deadline, remediation state). No UI existed to create a violation at
     all, which is why `InspectionFollowUpModal` always showed "Không có vi phạm chi tiết".
  2. **Dead plan workflow** — the same modal never sent `planId`/`planItemId`, so approved plans
     never advanced to InProgress and plan progress stayed `0/N` forever.
  3. **Security: SPA served with no security headers** — `location /` and `location /assets/` each
     declared `add_header`, which under nginx rules cancels inheritance of every server-level
     header. Verified live: `GET /` returned only `Cache-Control`. CSP was therefore inert (a CSP
     on a `.js` response is meaningless) and the admin app was frameable. Fixed with a shared
     `security-headers.conf` snippet included in each block, plus `frame-ancestors 'none'` and
     forwarded-proto-conditional HSTS.
  4. **Security: internal notes leaked publicly** — the anonymous certificate PDF endpoints
     rendered `Notes` (officer free text) into the document, bypassing the curated public DTOs
     which deliberately omit it.
  5. **Security: password-reuse oracle** — `ResetPasswordAsync` evaluated the password-history
     rule before validating the reset token, letting an anonymous caller confirm a guessed
     password without a valid token. Token validation now runs first.
  6. Functional gaps closed: food-poisoning error-report UI, identity `ManageRoles`/`ManageScope`
     gating, sub-tab and sidebar permission gating, master-catalog server-side pagination
     (records past row 100 were unreachable), four read-only detail drawers, certificate PDF
     download on four admin pages, testing-result facility/product linkage, dashboard recent
     activity (frontend panel + backend projection), statistics organisation filter, real server
     error surfacing, and backup/restore scripts.
- **Commit**: working tree on top of `fe3dbd2` (not yet committed)
- **Affected features**: F-001, F-002, F-004, F-006, F-008, F-010..F-023, F-031, F-034 and the
  shared `src/lib`, `src/app` and nginx layers → treat as Level 3/4.
- **Retest level**: 4 (full regression)
- **Result**: **PASSED** — Playwright **236/236 (7.6m)** against images rebuilt from this working
  tree, migrator exit 0, all seven containers healthy, no API interception, real login.
- **First run found 4 failures, all fixed before the green run**:
  1–2. `dashboard.spec.ts` and `dashboard-verification.spec.ts` asserted
  `getByText("Cơ sở SXKD")`, which became ambiguous once the new recent-activity panel began
  labelling `Business` rows with the same words. 3. `statistics.spec.ts` asserted a bare
  `getByRole("combobox")`, now two elements after the organisation filter landed.
  4. The new violations spec used `getByDisplayValue`, which is a Testing Library API and does not
  exist in Playwright — replaced with an `input[value="…"]` locator.
  Three of the four were pre-existing under-specified selectors that passed only because exactly
  one element happened to match; adding legitimate UI broke them. Worth noting alongside the
  violation defect: a 100 % green suite is only as strong as what its assertions actually pin down.
- **Runtime evidence captured for the security and data fixes** (not just test counts):
  - `GET /` now returns X-Content-Type-Options, X-Frame-Options, Referrer-Policy,
    Permissions-Policy and CSP with `frame-ancestors 'none'`; before the fix it returned only
    `Cache-Control`.
  - HSTS is absent over plain HTTP (so local development never pins 127.0.0.1) and present as
    `max-age=31536000; includeSubDomains` when the request arrives with
    `X-Forwarded-Proto: https`.
  - `GET /api/v1/app/dashboard/stats` now returns 12 populated `recentActivities` entries; the
    field was previously always `[]`.
  - Seeded reference catalogs survive an image rebuild (12 business types, 37 product groups,
    13 Quảng Ninh districts).
- **Static gates already passed**: backend Release build 0 errors (1 pre-existing `CS8714`
  warning in `ReportStatisticsAppService.cs`), backend **519/519**, frontend `tsc -b --noEmit`
  clean, `oxlint src` clean.
- **New regression cover**: `e2e/inspection-violations-verification.spec.ts` asserts that editing
  a result through the real UI preserves its violations, with the fine, legal reference and
  remedy text intact after a reload. The previous suite contained **zero** assertions touching
  inspection violations, which is exactly why a data-loss defect survived a 235/235 green run.
- **Frontend unit-test finding (pre-existing, not caused by this batch)**: a full `vitest run`
  reports 9 failures. Isolated against a pristine `fe3dbd2` worktree: `businessApi.test.ts` fails
  3/7 deterministically at HEAD, and the certificate/business page tests fail on *timeout* with a
  count that varies between runs at HEAD (3 then 4 in two consecutive runs). Root cause is
  testing-library role queries in jsdom on these pages — measured at 48.8 s for
  `getByRole("button", {name})` and 100.4 s for `getAllByRole("button")` against 7 ms for
  `getByLabelText`, versus a 15–30 s test timeout. The documented "FE Vitest 112/112" baseline no
  longer holds at HEAD. This makes the CI frontend test gate unreliable and should be fixed
  independently of this batch.

### 2026-07-27 — Level 4 re-certification of merge `fe3dbd2` on a clean-volume stack

- **Cause**: The registry still cited per-feature commits from `86b793a` and earlier, while
  `0eba6b6` / merge `fe3dbd2` had since changed Level 3 shared dependencies:
  `FoodSafePermissions.cs`, `FoodSafeHttpApiHostModule.cs`,
  `FoodSafeDbContextModelCreatingExtensions.cs`, three EF migrations
  (`AddMissingForeignKeys`, `AddResultFinalizeAndCitizenNews`, `AddApiCallLogDataType`),
  `authApi.ts`, `router.tsx` and `AppLayout.tsx`. Per the Git-aware verification rule no
  feature could stay VERIFIED on the older evidence.
- **Commit**: `fe3dbd2`
- **Affected features**: All (F-001..F-034)
- **Retest level**: 4 (full regression)
- **Result**: PASSED
- **Details**: Stack rebuilt from HEAD on a **fresh PostgreSQL volume** — 20 migrations applied,
  migrator exited 0, all seven containers healthy. Playwright full suite **235/235 passed
  (8.0m)**, no API interception, real `/api/account/login` with CSRF. Backend
  **519/519** (Domain 197, Application 251, HttpApi.Host 53, EFCore 18); Release build 0
  warnings; `dotnet format --verify-no-changes` clean.
- **Environment caveat**: this workstation has no .NET 9 SDK/runtime installed (only 5.0, 8.0
  preview and 10.0). The solution builds through SDK 10 targeting packs, and the Docker images
  carry their own .NET 9 runtime, but the **native** `dotnet test` run required
  `DOTNET_ROLL_FORWARD=Major` and therefore executed on runtime 10.0.7 rather than the
  production 9.x runtime. The Playwright evidence above is unaffected because it exercises the
  containers. Install the .NET 9 runtime before treating a native test run as release evidence.
- **Infrastructure defect found and fixed**: Playwright browser binaries were absent
  (`chromium_headless_shell-1228`), which failed every browser-backed test in 1–4 ms while
  API-only tests still passed. This is an environment gap, not a product defect; recorded here
  because the failure signature (mass instant failures with `signInAsAdmin` in the stack) can
  easily be misread as an authentication regression.

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

### 2026-07-28 — CI gates fixed: NU1903 warnings-as-errors + frontend image Trivy failures (branch `fix/production-blockers`)

- **Cause**: (a) NuGet audit began reporting AutoMapper 14.0.0 (GHSA-rvv3-g6hj-g44x, High) — the advisory is already an accepted, mitigated risk (doc 43, pinned by ABP 9.3.7 ABI; no patched 14.x exists), but the replayed NU1903 failed the `--warnaserror` CI build in all 14 projects. (b) `nginxinc/nginx-unprivileged:1.27-alpine` is a retired tag no longer rebuilt upstream — frozen Alpine packages (libxml2, musl, musl-utils, nghttp2-libs, zlib) accumulated fixable HIGH/CRITICAL CVEs and the frontend Trivy scan exited 1.
- **Commit**: see this commit
- **Changes**: `common.props` gains a `NuGetAuditSuppress` for exactly that advisory (auditing stays on; `Test-NuGetVulnerabilities.ps1` still detects and reports it); both FE Dockerfiles move `node:20-alpine` (EOL) → `node:22-alpine` and `nginx-unprivileged:1.27-alpine` → `1.30-alpine` (current stable, actively rebuilt); `Dockerfile.prod` gains the `apk upgrade --no-cache` the dev image already had; `ci.yml` compose builds use `--pull`; `deploy.yml` build-push steps use `pull: true`; `.trivyignore` entry hardened with owner + enforced `exp:2026-12-31`. Full diagnosis: `docs/production-audit/10-ci-gate-remediation-nu1903-trivy.md`.
- **Affected features**: none functionally — no FoodSafe application code changed. Frontend serving layer nginx 1.27→1.30 is infra-level; CI re-verifies it at runtime every run via `scripts/verify-prod-frontend.sh` (HTTPS/TLS/HSTS/redirect/IPv6/healthz) and compose health checks.
- **Retest level**: 0 for `common.props` (restore metadata only); 1 (infra smoke) for the nginx base bump, executed locally + gated in CI.
- **Result**: PASSED — restore clean (0 NU19xx), Release build `--warnaserror` clean, BE tests 618/618, Trivy scans of rebuilt dev+prod frontend images 0 HIGH/CRITICAL (Alpine 3.24.1; libxml2 2.13.9-r2, musl 1.2.6-r2, nghttp2-libs 1.69.0-r0, zlib 1.3.2-r0), nginx 1.30.4 serves `/healthz` + `/` HTTP 200 with unchanged config, API image scan with `.trivyignore` exit 0.

### 2026-07-28 — Batch F-2: INT-03 inbound partner surface delivered + verified (branch `feat/integration-completion`)

- **Cause**: Last mandatory-scope code blocker (M-1, `docs/production-audit/07-final-go-no-go-decision.md`): partner accounts, hashed API-key issuance/rotation/revocation, partner-facing inbound receive endpoint with replay/idempotency guards, inbound call logging, admin submissions browser, FE tabs. Also hardens the shared guarded outbound HttpClient (no auto-redirect; 2 MB response cap).
- **Commit**: `52d35c1`
- **Affected features**: F-019f (new); F-019/F-019c/F-019d/F-019e (shared `OutboundUrlValidator` + `ApiCallLog` writer touched → Level-2 retest owed and executed)
- **Retest level**: 2 (rebuilt Docker stack from working tree, migration `20260728064640` applied by the real migrator)
- **Result**: PASSED — Playwright DataIntegration subset **23/23** (incl. new `data-integration-partners.spec.ts` 3/3; cookie-less partner client, zero interception); BE DataIntegration contract 27/27, EF mapping 2/2, OutboundUrlValidator 58/58; `tsc --noEmit` + feature Vitest 5/5.
- **Details**: The evidence run surfaced two real product defects, both fixed in the same commit and pinned by tests: (1) empty `records` array → **500 with the ABP error shape leaked to partners** — ABP method-argument validation pre-empted the in-service data-outcome contract through the `IActionResult` controller; `ReceiveAsync` is now `[DisableValidation]` with null-safe in-method structural checks (contract test asserts the attribute; e2e asserts 400 + `InvalidRecords`). (2) Inbound payloads stored `\uXXXX`-escaped → Vietnamese content unreadable in the admin detail modal; serializer now uses `UnsafeRelaxedJsonEscaping` (payload renders as a text node — no HTML sink). One test-code fix: the partner-form AutoComplete dropdown covered the data-type select (Escape before clicking). Business ingestion of received payloads remains EXTERNALLY_BLOCKED on TT 31/2026 (INT-02).

### 2026-07-28 — INT-03 re-verification: `[DisableValidation]` alone did NOT stop the leaked 500 (branch `fix/production-blockers`)

- **Cause**: Re-running `data-integration-partners.spec.ts` against a Docker stack **rebuilt from `52d35c1`** reproduced the empty-`records` → **500** the F-2 entry claimed fixed. The captured API stack trace showed ABP's `ValidationInterceptor.ValidateAsync` still ran and threw `AbpValidationException` for the `service.ReceiveAsync` call despite `[DisableValidation]` on the method; because `PartnerInboundController.ReceiveAsync` returns `IActionResult` (not an object result), `AbpExceptionHandlingMiddleware` does not wrap it and the raw 500 reached the (cookie-less) partner. So `52d35c1`/`6326af4` certified F-019f with a latent validation-path 500 on empty/oversized/bad-schema envelopes.
- **Commit**: `adb30eb`
- **Fix**: Remove **every** DataAnnotation from `InboundEnvelopeDto` (`[Required]`/`[MinLength]`/`[MaxLength]`/`[StringLength]`) so the interceptor has nothing to throw on regardless of `[DisableValidation]`; the in-method structural checks in `PartnerInboundAppService.ReceiveAsync` are now the single source of validation truth. Port the dropped `[StringLength(256)]` on `SourceSystem` to an in-method guard (`InvalidSourceSystem` → 400). `[DisableValidation]` kept as defense-in-depth (contract test still asserts it).
- **Affected features**: F-019f (re-stamped `52d35c1` → `adb30eb`). No shared dependency touched — `InboundEnvelopeDto`/`PartnerInboundAppService` are inbound-only; F-019/F-019c/F-019d/F-019e unaffected (re-run below confirms).
- **Retest level**: 2 (rebuilt `api` image + container from working tree; migration unchanged).
- **Result**: PASSED — `data-integration-partners.spec.ts` **3/3**; full DataIntegration subset (`data-integration`, `-credentials`, `-retry`, `-share`, `-verification`) **20/20**; API log over the run: partner submissions **10×200, 12×400, 14×401, 2×403, 0×500**. BE Application compile clean; contract test asserting `[DisableValidation]` still green.

### 2026-07-28 — Final production gate review: full-suite + backend re-execution at HEAD `6326af4`

- **Cause**: Independent release-gate review (docs/production-audit/08-final-production-go-no-go.md) re-executed all runnable evidence from current HEAD, including the full-suite smoke owed for the `1e0c833` seed change (doc 07 conditions §5.1-1/2).
- **Commit**: `6326af4` (no product code changed by this review)
- **Retest level**: 4 (release-candidate full regression — mandated by the gate)
- **Result**: PASSED — Playwright full suite **286/286, 0 failed / 0 flaky / 0 skipped (301 s)**, zero API interception (grep-confirmed across all 76 specs); BE **635/635** (Domain 209, HttpApi.Host 71, Application 335, EFCore 20). Artifacts: `pw-full-gate.json`, `be-test-full.log` (session scratchpad).
- **Details**: First fully-clean full-suite run on record. The `business-list-filters` pagination red (T-1, red at `17ea0ae`/`8be91bc`) is **green at HEAD** — consistent with the seed-data row-count triage and the `1e0c833` seed fix. INT-03 spec `data-integration-partners` 3/3 green in-suite; live endpoint probe confirmed the partner surface deployed (400 guard responses, not 404). Registry may be re-stamped to `6326af4` on this evidence. Gate verdict: **READY_FOR_UAT_ONLY** — remaining blockers are contractual/documentation (INT-01/02 disposition, M-8 dossier+manuals, FR-50-05 API spec, M-6/M-7 rulings, I-2 staging CAPTCHA), zero code blockers.

### 2026-07-28 — FR-50-05: partner API specification published + verified against the running API (branch `feat/integration-completion`)

- **Cause**: M-4/FR-50-05 (doc 08 §3) — partner-facing machine-readable API specification was the last documentation-class pre-production item for the INT-03 surface. Deliverables created from the committed implementation (no behavior invented): `docs/integration/partner-api-specification.md`, `docs/integration/partner-openapi.yaml` (OpenAPI 3.0.3), `docs/integration/partner-onboarding-guide.md`, `docs/integration/examples/` (Vietnamese-Unicode payloads, curl walkthrough, canonical success/duplicate/error bodies).
- **Commit**: `0776230` + working-tree spec/docs/test (this entry's commit).
- **Validation executed**:
  1. `npx @redocly/cli lint docs/integration/partner-openapi.yaml` — **valid** (2 non-blocking warnings: no-ambiguous-paths reflects the real controller routes `{id}/toggle-status` vs `submissions/{submissionId}`).
  2. New executable contract test `e2e/partner-openapi-contract.spec.ts` — **1/1 (3.3s)** against the real stack, zero interception, cookie-less partner client: parses the YAML, exercises **every** operation (coverage gate on operationIds — an undocumented-or-unprobed operation fails the test), submits to **all 7 `dataType` enum segments**, reproduces **all 10 partner `error.code` values** with their documented HTTP statuses (including both `MissingRequestId` variants and the 501-record `InvalidRecords` cap), validates success/error bodies against the spec's JSON Schemas ($ref/allOf/enum/pattern/format), confirms one-time raw-key visibility (`rawKey` absent from `GET keys`), idempotent replay echoing the original submission, and verbatim Vietnamese Unicode in the stored payload.
- **Runtime-mismatch defect found and fixed by the run**: the live `api` container (built 14:09) predated `adb30eb` (14:26) — the running binary **lacked the `InvalidSourceSystem` guard** (257-char `sourceSystem` → 200 accepted instead of 400). The container was rebuilt from HEAD `0776230`; after rebuild the probe returns 400 as specified. Two spec corrections were pinned by the test against actual runtime: void admin actions (`toggle-status`, key revoke, partner delete) return **204**, not 200.
- **Affected features**: F-019f only (no product code changed; `api` container redeployed from HEAD). Level-2 regression executed post-rebuild: `data-integration-partners.spec.ts` **3/3** green.
- **Result**: PASSED — FR-50-05 → **PASS_WITH_EXECUTABLE_SPEC_EVIDENCE** (doc `01-requirement-production-readiness-matrix.md` Group F updated).

### 2026-07-28 — UI audit remediation: High/Medium findings fixed (branch `feat/integration-completion`, working tree on `aad87c1`)

- **Cause**: `testing/ui-audit/ui-bug-report.md` (322-test Playwright UI audit, same date) found 3 High + 4 Medium UI defects: page-level table overflow on 15 routes (UIA-001/002/003), non-wrapping toolbars (UIA-004), unauthorized 403 API calls from dashboard/statistics for permissionless users (UIA-005), menu↔route permission drift ×3 incl. the new `Partners.View` route-only entry (UIA-006), and generic error toasts discarding precise ABP messages in catalogs/geography (UIA-007).
- **Fix (FE only, reusable-first)**: two global CSS blocks in `src/index.css` (`.ant-table-content { overflow-x:auto }` containment net; `.page-header-actions/.filter-toolbar` Space wrap + item/input clamps); new single-source `src/app/routePermissions.ts` consumed by both `router.tsx` and `AppLayout.tsx`; `enabled` option on `useOrganizationTree`/`usePoisoningCases`/`usePoisoningIncidents` + permission-gated org filter and poisoning map on dashboard/statistics; view-permission-filtered tabs on FoodPoisoningPage/ReportingPage; `extractApiError` adopted in MasterCatalogPage/GeographicCatalogPage.
- **Retest level**: 3 (shared CSS + shared route/menu config) — full UI-audit suite as the visual/route smoke over every page, plus Level-2 feature specs for every touched feature.
- **Result**: PASSED — UI-audit suite **323/323** (46 routes, 258 route×viewport responsive with **0 horizontal overflow**, 18 flows/visual; 0 console errors, 0 failed requests); feature specs `catalogs`, `geography`, `statistics`, `dashboard`, `food-poisoning`, `data-integration`, `alerts-news` 8/8 and `reporting` 2/2; `src/app` Vitest 6/6. Artifacts: `testing/ui-audit/playwright/.results/final-record.log`, `fix-report.md`.
- **Environment defect found (pre-existing, NOT this change)**: `reporting.spec.ts` NDTP workflow failed reproducibly with and without this change-set — 24 accumulated E2E fantasy-year (2097–2099) NDTP reports, 18+ in Completed status which `cleanTestReports` cannot delete, pushed the fresh draft past the 15-row first page. Remediation: soft-deleted all fantasy-year rows (`UPDATE ndtp_reports SET is_deleted=true … WHERE period_year BETWEEN 2097 AND 2099`); spec green after. **Recommendation**: teach the spec cleanup to purge Completed test reports (or filter the list by the target year before asserting), otherwise the full gate will re-hit this after ~15 more completed-workflow runs.
- **Registry**: per-feature re-stamping deferred to the commit that lands this batch (working tree shared with the in-flight INT/API-spec session); until then treat visual/permission surfaces of the touched features as retested-at-working-tree per this entry.

### 2026-07-28 — FR-50-05 permission projection: additive shared-dependency change (commit `5bc0d86`)

- **Cause**: FR-50-05 added four `FoodSafe.DataIntegration.ApiSpecs.*` permissions. The FE reads its permission set from `CurrentUserContextAppService.FoodSafePermissionNames` — a hardcoded allowlist projected through `GET /api/v1/app/current-user-context` into `user.permissions`. The new permissions were absent from that allowlist, so `hasPermission("FoodSafe.DataIntegration.ApiSpecs.View")` returned false and the "Đặc tả API" tab silently never rendered, even though the permission was granted server-side and exposed in app-config `grantedPolicies` (same class as the historic `Users.Delete` invisible-control bug, P1-1c).
- **Fix**: appended the four `ApiSpecs` constants to the allowlist — additive only, no existing constant changed. Locked in by new backend contract test `Frontend_permission_projection_includes_data_integration`.
- **Impact classification**: `CurrentUserContextAppService` is a Level-3 shared dependency (feeds every FE permission gate), but this change is **purely additive** — it can only add permissions to the projection, never remove or alter existing ones. **No previously VERIFIED feature is invalidated; nothing is marked DIRTY on account of this change.**
- **Retest**: affected `FoodSafe.Application.Tests` filtered subset **22/22** green (Domain `ApiSpecificationTests` 6/6 + Application contract/validator tests + the three projection contract tests). FR-50-05 verified end-to-end by `e2e/api-specification-management.spec.ts` **4/4** (feature F-019g, registry re-stamped to `5bc0d86`). No dependent-feature regression owed.

### 2026-07-28 — Phase-0 baseline freeze (BASE-001..004) — commit `17149f6`

- **Cause**: Phase 0 of `docs/planning/REMAINING_IMPLEMENTATION_PLAN.md`. Most of the planned BASE-001 payload had already landed via the concurrent session (`5bc0d86`, `83ec103`, `6b6ff6a`); this batch closed the remainder: gap **G-02** (`ROUTE_PERMISSIONS.dataIntegration` was missing `FoodSafe.DataIntegration.ApiSpecs.View` — an ApiSpecs-only user was blocked from `/data-integration` despite a valid server-side grant), artifact hygiene (`.gitignore`: precise `test-results/` + `FoodSafe.FE/.results/` entries replacing an overly broad bare `screenshots`), and committing the audit/planning + production-review documentation.
- **Change class**: `routePermissions.ts` is shared route/menu config (Level 3) but the change is **purely additive** (one extra OR-term on one route) — it can only admit a previously blocked-but-authorized user; no existing permission behavior changed. No VERIFIED feature marked DIRTY.
- **New test**: `api-specification-management.spec.ts` gained the BASE-002 scenario — role+user created via the live admin API (real DTO shapes incl. parent-chain permission grant), forced initial password change completed via `POST /api/v1/app/account-security/complete-initial-password-change`, then: route admitted, exactly one tab, sibling DI APIs 403, `noperm` fixture still gets the 403 page. Spec now 5/5.
- **Result**: full gate green on the freeze tree — BE 663/663, EF drift none, migration clean-apply/upgrade/rollback ✓, tsc/oxlint clean, Vitest 116/116, FE prod build ✓, **full Playwright 292/292 (0 flaky, 0 skipped)**. Registry: F-019g re-stamped to `17149f6`; freeze certification section added (all other rows keep historical stamps — untouched features, re-exercised by the 292/292 run).
- **BASE-003 note**: the `FoodPoisoningPage.test.tsx` failure recorded in the Phase-0 plan was already fixed correctly in `83ec103` (fixture lacked `Cases.View`; production UI was right) — re-verified 116/116 this batch.

### 2026-07-28 — F-006 /businesses production-readiness hardening (HEAD `dccac2e` + working tree)

- **Cause**: dedicated FE+BE deep review of `/businesses` before release. 7 defects fixed — see the re-verification table in `docs/testing/features/businesses.md`. Highlights: business Excel export silently ignored the geographic filters (BE dropped `ProvinceId/DistrictId/CommuneId/Sorting`, FE sent only `filter+status`); deleting a business orphaned its still-active products (new guard `FoodSafe:Business:0010`, vi+en localized); map-view marker click opened the edit modal without Edit permission; BE `DateTime` values displayed blank in `<input type="date">` during edit; hardcoded error toasts hid server business-rule reasons (now `extractApiError`).
- **Change class**: Level 2 (single feature) — all BE changes confined to `BusinessManagement` (one additive error code + localization entries in Domain.Shared); FE changes confined to `features/businesses` + one-line confirm-label robustness in `e2e/businesses.spec.ts`. `RowActions`/`index.css`/route config untouched by this batch (concurrent session owns that refactor). No other VERIFIED feature invalidated.
- **New evidence**: `e2e/business-delete-guard.spec.ts` (2 tests, `locale: vi-VN`, no interception) — delete-guard over real API **and** real UI toast, plus export-honours-filter byte-size proof.
- **Result**: PASSED — Docker stack rebuilt from this tree; business specs **13/13** (businesses, businesses-verification, business-list-filters, business-detail-tabs, business-delete-guard; workers=1); BE BusinessManagement tests **35/35**; FE Vitest businesses **13/13**; `tsc -b` clean.
- **Known cross-cutting risk for the concurrent UI-refactor session**: RowActions confirm modal renders the antd vi_VN default OK label ("Đồng ý"), but ~20 in-flight specs click `getByRole("button", { name: "OK" })` — they will time out exactly like `businesses.spec.ts` did until updated (fixed here for businesses with a `Xóa|Đồng ý|OK` regex).

### 2026-07-28 — F-007 /self-declarations production-readiness hardening (working tree, after `dccac2e`)

- **Cause**: dedicated FE+BE deep review of `/self-declarations` (follows the F-006 pass). Fixes: business select now disabled when editing (server always rejected the change with `ProductMismatch` hidden behind a generic toast) with a name-not-GUID fallback option for businesses outside the Active-500 options window; `extractApiError` for save/delete/revoke/export toasts (DuplicateNumber/InvalidDateRange/AlreadyRevoked now visible); table loading switched to `isFetching`; the F-006 business-delete guard extended to also block while self-declarations exist (`Business.BusinessInUse`, same code `FoodSafe:Business:0010`, vi/en messages updated, constant renamed).
- **Change class**: Level 2 for self-declarations + a bounded Level-2 ripple into F-006 (`BusinessAppService.DeleteAsync` guard) — both features fully retested in one batch. No other VERIFIED feature invalidated.
- **Evidence**: `business-delete-guard.spec.ts` extended (delete blocked by product → blocked by declaration → unblocked after both removed); `self-declarations.spec.ts` confirm-click fixed to `/^(Xóa|Đồng ý|OK)$/`. Run at rebuilt stack: SD + guard + 4 business specs **20/20** (workers=1); BE BusinessManagement **35/35**; Vitest self-declarations **3/3**; `tsc -b` clean.
- **Note**: two additional mechanical compile fixes were applied to the concurrent UI-refactor session's in-flight files so the Docker image could build (`SortOrder`/`SorterResult` imported from `antd/es/table/interface` in the two data-integration tabs; unused `Space` imports removed from 2 pages earlier). No behavior change intended there.

### 2026-07-28 — Global modal layout: internal body scroll + vertical centering (working tree, after `dccac2e`)

- **Cause**: UX request — modals taller than the viewport scrolled the whole overlay (browser-style), hiding the Lưu/Hủy footer; short modals sat near the top edge. Change: `index.css` modal rules only — `.ant-modal-wrap { display:flex }` + `.ant-modal { top:0; margin:auto; padding-bottom:0 }` (short modals center vertically; tall modals get even ~32px top/bottom gaps) and `.ant-modal-body { max-height: calc(100vh - 190px); overflow-y:auto; overflow-x:hidden }` (internal scroll with fixed header/footer; `overflow-x:hidden` suppresses the horizontal scrollbar caused by `Row gutter` negative margins inside a scroll container).
- **Also fixed while there (boy-scout)**: the pre-existing `.ant-modal-content` / `.ant-modal-header` radius rules were dead selectors — antd v6 renamed the panel class to `.ant-modal-container`; rule updated accordingly.
- **Change class**: shared UI styling, CSS-only, no business behavior → **Level 1 visual smoke**. No VERIFIED feature invalidated.
- **Evidence** (throwaway spec `modal-scroll-smoke.spec.ts`, run 2/2 green against Vite dev @5173 → real BE, real login, no interception, then deleted): tall Business editor modal — body `overflow-y:auto`, capped height, internally scrollable, Lưu button in viewport, overlay does not scroll, no horizontal overflow, top/bottom gaps 20–64px and even (±8px), Select dropdown tracks its field while the body scrolls; short Import modal — no inner scrollbar, vertically centered. Confirm dialogs (`modal.confirm`) share `.ant-modal-body` but never reach the cap — no visible change.
- **Notes**: (1) the docker `frontend` image predates this CSS — rebuild before running the Playwright suite against :8080 if any spec asserts modal geometry; (2) unrelated pre-existing environment issue observed: the locally-run BE at :5019 returns 500 on `GET /api/v1/public/branding` while the docker API at :8080 returns 200 — stale local build, not a product defect.

### 2026-07-28 — F-009 /advertisement-registrations production-readiness hardening

- **Cause**: dedicated FE+BE deep review (follows F-006/F-007 passes). Fixes: business select disabled on edit + name fallback (server rejected the change with `ProductMismatch` behind a generic toast); `extractApiError` for save/delete/revoke/export; `isFetching` loading; BE Excel export now honours `Sorting`; spec confirm-click fixed to `/^(Xóa|Đồng ý|OK)$/`.
- **Change class**: Level 2 (single feature). Run doubles as the sorting DIRTY-batch retest for F-009 (default `CreationTime desc` + sortable Ngày cấp column exercised in the real UI).
- **Result**: PASSED — ads specs **6/6** at rebuilt stack (workers=1, no interception); BE Licensing tests **48/48**; Vitest ads **4/4**; `tsc -b` clean. F-009 returned to VERIFIED.
- **Architecture debt noted (pre-existing)**: `ProductRegistrationAttachmentsModal` imported across feature folders by ads/cfs/eligibility/export-food — should be promoted to `src/components/`; deferred to avoid touching 5 features mid-flight.

### 2026-07-28 — F-011 /cfs-certificates production-readiness hardening

- **Cause**: dedicated FE+BE deep review (same recurring defect set as F-007/F-009): business select disabled on edit + name fallback; `extractApiError` for save/delete/revoke/export; `isFetching` loading; BE Excel export honours `Sorting`; spec confirm-click `/^(Xóa|Đồng ý|OK)$/`.
- **Change class**: Level 2 (single feature). Run doubles as the sorting DIRTY-batch retest for F-011.
- **Result**: PASSED — CFS specs **6/6** at rebuilt stack (workers=1, no interception); Vitest cfs **4/4**; BE build 0 errors; `tsc -b` clean. F-011 returned to VERIFIED.

### 2026-07-28 — F-008 /product-registrations production-readiness hardening (`8e7840e`)

- **Cause**: dedicated FE+BE deep review with a real-browser recon pass first (same recurring defect set as F-007/F-009/F-011): business select disabled on edit + name fallback (server rejected the change with `ProductMismatch` behind a generic toast — reproduced live as a 403 with ABP "internal error" text); `extractApiError` for save/PDF/delete/revoke/export/attachment toasts; `isFetching` loading; BE Excel export honours `Sorting`; spec confirm-click `/^(Xóa|Đồng ý|OK)$/`.
- **Beyond the series**: (1) `ApplySorting` from the sorting batch (`4a4af68`) had no tiebreaker — pages of equal RegistrationDate could repeat/drop rows; fixed with `ThenBy(Id)` and proven via API paging 18 same-date rows in chunks of 5. (2) vi/en localization added for `FoodSafe:ProductRegistration:0001–0006` (was missing entirely — business errors displayed as "Có một lỗi nội bộ xảy ra..."). (3) Domain guard rejects `default(DateTime)` RegistrationDate (`0006`, new domain test). (4) UI: column widths reduced (scroll.x 1250→960) so Hết hạn/Trạng thái are visible at 1280px; search placeholder mentions nhà sản xuất; attachments empty text.
- **Change class**: Level 2 (single feature); run doubles as the sorting DIRTY-batch retest for F-008. Attachments-modal emptyText is shared by F-009/F-011/F-012/F-013 pages → Level-1 smoke ran on those 4 routes (all load, no page errors).
- **Result**: PASSED — product-registrations specs **6/6** at rebuilt stack (workers=1, no interception); BE Domain ProductRegistration **4/4** + Licensing contracts **48/48**; Vitest product-registrations **4/4**; `tsc -b` clean. F-008 returned to VERIFIED at `8e7840e`.
- **Note**: `FoodSafe:SelfDeclaration:*` error codes are still unlocalized (F-007 shows the same ABP fallback text on duplicate) — follow-up candidate, not touched here to keep scope bounded.

### 2026-07-28 — F-017 /testing-results hardening + merge-regression recovery

- **Cause**: dedicated FE+BE deep review. **Merge `363a70b` had silently dropped the full `TestingResultEditorModal`** (business/product/inspection cascading selects from `b6c5384`) from the page — the linkage fields could never be set from the UI though the component, api layer, and list column all survived. Page rewired to the full editor + restored business/center filter selects, merged with the newer sorting/page-size/RowActions work.
- **BE hardening**: `EnsureReferencesAsync` (center 0003 / service 0004 / business-in-scope 0005 / product-of-business 0006 / inspection-of-business 0007 — previously bogus GUIDs died as FK 500s and cross-org references were accepted); `Guid.Empty` center keeps verified contract 0002; `.First()` org-resolution crash fixed via `HomeOrganizationId`; DTO `[Required]`/`[StringLength]`; ApplySorting Id tiebreakers (same class as the F-008 finding); Excel export honours `Sorting`.
- **Localization debt closed**: `TestingResult:0002–0007` + **`SelfDeclaration:0001–0006`** vi/en entries added (F-007's duplicate-number toast previously fell back to ABP default text).
- **Change class**: Level 2. Run doubles as the sorting DIRTY-batch retest for F-017.
- **Result**: PASSED — testing-results specs **6/6** at rebuilt stack (workers=1, no interception); BE AlertsAndTesting **37/37**; Vitest **7/7**; `tsc -b` clean. F-017 returned to VERIFIED.
