# Feature Verification Registry

## Legend

- **Status**: NOT_STARTED | IN_PROGRESS | READY_FOR_TEST | FAILED | VERIFIED | DIRTY | BLOCKED
- **E2E spec**: Playwright spec file if exists
- **Verified commit**: Git SHA when last verified against real stack

## Registry

| ID    | Feature                         | Status         | E2E Spec                                      | Verified Commit | Date       |
|-------|---------------------------------|----------------|-----------------------------------------------|-----------------|------------|
| F-001 | Authentication (Login)          | VERIFIED       | `e2e/auth.spec.ts`, `e2e/auth-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-002 | Password Management             | VERIFIED       | `e2e/password-management-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-003 | Organizations                   | VERIFIED       | `e2e/organizations.spec.ts`, `e2e/organizations-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-004 | Master Catalogs                 | VERIFIED       | `e2e/catalogs.spec.ts`, `e2e/catalogs-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-005 | Geographic Catalogs             | VERIFIED       | `e2e/geography.spec.ts`, `e2e/geography-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-006 | Businesses & Products           | VERIFIED       | `e2e/businesses.spec.ts`, `e2e/businesses-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-007 | Self Declarations               | VERIFIED       | `e2e/self-declarations.spec.ts`, `e2e/self-declarations-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-008 | Product Registrations           | VERIFIED       | `e2e/product-registrations.spec.ts`, `e2e/product-registrations-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-009 | Advertisement Registrations     | VERIFIED       | `e2e/advertisement-registrations.spec.ts`, `e2e/advertisement-registrations-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-010 | Eligibility Certificates        | VERIFIED       | `e2e/eligibility-certificates.spec.ts`, `e2e/eligibility-certificates-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-011 | CFS Certificates                | VERIFIED       | `e2e/cfs-certificates.spec.ts`, `e2e/cfs-certificates-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-012 | Export Food Certificates        | VERIFIED       | `e2e/export-food-certificates.spec.ts`, `e2e/export-food-certificates-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-013 | Inspection Plans & Results      | VERIFIED       | `e2e/inspection.spec.ts`, `e2e/inspection-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-014 | Food Poisoning Cases            | VERIFIED       | `e2e/food-poisoning.spec.ts`, `e2e/food-poisoning-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-015 | Reporting (NDTP/ATP/Action)     | VERIFIED       | `e2e/reporting.spec.ts`, `e2e/reporting-verification.spec.ts`, `e2e/reporting-error-notifications.spec.ts` | `8be91bc` | 2026-07-28 |
| F-016 | Alerts & News                   | VERIFIED       | `e2e/alerts-news.spec.ts`, `e2e/alerts-news-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-017 | Testing Results                 | VERIFIED       | `e2e/testing-results.spec.ts`, `e2e/testing-results-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-018 | Risk Analysis                   | VERIFIED       | `e2e/risk-analysis.spec.ts`, `e2e/risk-analysis-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-019 | Data Integration                | VERIFIED       | `e2e/data-integration.spec.ts`, `e2e/data-integration-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-019c | Data Integration — Outbound Auth Credentials (P0-2, FR-50/51) | VERIFIED | `e2e/data-integration-credentials.spec.ts` (6/6) | `8be91bc` | 2026-07-28 |
| F-019d | Data Integration — Outbound Share via UI + history persistence (P1-3, FR-51) | VERIFIED | `e2e/data-integration-share.spec.ts` (3/3) | `8be91bc` | 2026-07-28 |
| F-019e | Data Integration — Typed share payloads + retry attempt history (Batch F-1, FR-51..57) | VERIFIED | `e2e/data-integration-retry.spec.ts` (3/3) | `8be91bc` | 2026-07-28 |
| F-019f | Data Integration — Inbound partner surface: accounts, API keys, receive endpoint (Batch F-2, INT-03) | VERIFIED | `e2e/data-integration-partners.spec.ts` (3/3; full DI subset 23/23) | `52d35c1` | 2026-07-28 |
| F-020 | Identity Administration         | VERIFIED       | `e2e/identity-administration.spec.ts`, `e2e/identity-administration-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-021 | Audit Logs                      | VERIFIED       | `e2e/audit-logs.spec.ts`, `e2e/audit-logs-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-022 | Dashboard                       | VERIFIED       | `e2e/dashboard.spec.ts`, `e2e/dashboard-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-023 | Statistics                      | VERIFIED       | `e2e/statistics.spec.ts`, `e2e/statistics-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-024 | Public Lookup — Business        | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-025 | Public Lookup — Self Declaration| VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-026 | Public Lookup — Product Reg.    | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-027 | Public Lookup — Eligibility     | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-028 | Public Lookup — CFS             | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-029 | Public Lookup — Export Food     | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-030 | Public Lookup — Ad Registration | VERIFIED       | `e2e/public-lookups.spec.ts`, `e2e/public-lookups-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-031 | Documents                       | VERIFIED       | `e2e/documents.spec.ts`, `e2e/documents-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-032 | System Settings                 | VERIFIED       | `e2e/system-settings.spec.ts`, `e2e/system-settings-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-033 | Public Portal FR-41..FR-49      | VERIFIED       | `e2e/public-portal-verification.spec.ts` | `8be91bc` | 2026-07-28 |
| F-034 | Certificate PDF Download (incl. anonymous citizen path) | VERIFIED | `e2e/certificate-pdf-verification.spec.ts` (5/5, cookie-less ctx) | `8be91bc` | 2026-07-28 |

## Summary

- Total features: 34
- VERIFIED: **34** (ALL features — see `features/*.md`)
- READY_FOR_TEST: 0
- FAILED: 0
- BLOCKED: 0
- NOT_STARTED: 0

## UI restyle (2026-07-28) — áp bộ nhận diện FoodSafe Quảng Ninh — RE-VERIFIED

- Áp design `FoodSafe Admin.dc.html` + `FoodSafe Portal.dc.html` (Claude Design project 641c2c86) lên FE.
- Thay đổi mang tính TOÀN CỤC nên mọi row đã được đánh DIRTY rồi chạy lại toàn bộ để re-certify: `src/theme/themeConfig.ts` (palette xanh #128A3E thay #00796B, font Be Vietnam Pro, token Layout/Menu/Table/Card/Breadcrumb) và `src/index.css` (viền, bo góc, sidebar, header, stat-card, empty-state, footer) tác động mọi màn hình.
- File đổi trực tiếp: `index.html`, `src/app/AppLayout.tsx`, `src/features/auth/pages/LoginPage.tsx`, `src/features/dashboard/pages/DashboardPage.tsx`, `src/features/public-portal/components/PublicShell.tsx`, `src/features/public-portal/pages/PublicPortalHomePage.tsx`, `src/features/public-portal/pages/PublicGeneralSearchPage.tsx`.
- KHÔNG đổi logic nghiệp vụ, API hook, schema validate hay luồng phân quyền — chỉ trình bày. Trang chủ cổng công khai chuyển từ số liệu tĩnh sang lấy `totalCount` thật từ các endpoint `/v1/public/*` đang có; ô tra cứu hero điều hướng `/tra-cuu-chung?q=...` (trang này nay đọc tham số `q`).
- Đã chạy: `tsc -b` sạch, `oxlint src` sạch, `prettier` đã format, `vite build` thành công, `vitest run` 114/116 pass (2 fail là timeout do chạy song song 59 file — chạy riêng file đó pass cả trước và sau thay đổi).
- **Playwright full suite trên stack thật (Docker compose + PostgreSQL, đăng nhập thật, không interception): 282 passed / 1 failed (7.5 phút).** Mọi row re-stamp về `17ea0ae`.
- Fail duy nhất: `business-list-filters.spec.ts` › FR-19-02 pagination — `.ant-pagination-item-2` không xuất hiện. Đã kiểm chứng: build lại frontend từ `origin/main` SẠCH (stash toàn bộ thay đổi giao diện) thì spec này fail y hệt ⇒ lỗi CÓ SẴN, không do restyle.
- Một hồi quy do restyle đã được phát hiện và sửa ngay trong đợt này: padding tab mới làm thanh tab tràn vào menu "..." khiến `excel-exports` › FR-17-05 không thấy nút Xuất Excel. Sửa bằng `margin-left: 2px` giữa các tab (đúng khoảng cách design quy định) — spec trở lại xanh.
- Đợt bổ sung `8be91bc` (hoàn thiện độ khớp thiết kế): tự host Be Vietnam Pro (CSP production chặn Google Fonts nên font trước đó KHÔNG hề load), đặt `font-family` cho `body`, áp đúng nhóm/thứ tự/icon sidebar theo thiết kế, thêm khối số liệu + "Ghi nhớ đăng nhập" ở trang đăng nhập, sửa lỗi hotline/email trống do branding trả chuỗi rỗng. Chạy lại full suite: **283 passed / 1 failed** (vẫn đúng lỗi pagination có sẵn). Đã kiểm chứng font trong browser thật: đủ 5 weight, `body` tính ra Be Vietnam Pro, không request nào lỗi.
- Lưu ý môi trường: `FoodSafe.BE/docker-compose.yml` KHÔNG truyền `Seed__TestPassword`, nên user seed cho E2E dùng mặc định `Admin@2026!` trong Development trong khi admin dùng `SEED_ADMIN_PASSWORD`. Do spec đọc chung một biến `E2E_ADMIN_PASSWORD`, hai giá trị này phải bằng nhau thì `ndtp-rollup-aggregation` mới chạy được.

## Merge note (2026-07-28) — main merged into fix/production-blockers — RE-CERTIFIED

- Merge `c57faa9` combined main's defect-fix batch (`b6c5384`, merge `363a70b`) with this branch's P0/P1/Batch F-1 work. All rows were marked DIRTY pending a post-merge re-run.
- **Post-merge full-suite re-certification: `npx playwright test` → 283/283 passed, 0 failed/flaky/skipped (327s)** on the stack rebuilt from the merged tree (real login, no interception). Every registry row above is re-stamped to `4662fad`.
- The re-run surfaced ONE semantic merge conflict git could not see: main's `ChartCard` disables the PNG download for empty charts, and the FR-39-09 spec assumed an always-enabled button (its svg pre-check passed on the AntD Empty graphic). Fixed in the spec (`4662fad`): it now seeds one real inspection result + one real poisoning case for the current year through the real API, asserts the button is ENABLED, downloads both PNGs, and cleans up. Product behaviour unchanged — the empty-state gate is main's intended UX.
- First post-merge run (pre-fix): 282/283, the only failure being that spec. BE `dotnet test` on the merged tree: **621/621**; `tsc -b` + `oxlint` clean.

## Test Run (2026-07-28) — Batch F-1: typed share payloads + retry attempt history (FR-51..57)

- Commit `71f35e2`. Share payload now carries the REAL records of the selected `SharedDataType` (per-type builder strategies, versioned envelope, org-scope in every builder); new `POST /data-sharing/retry/{logId}` appends an immutable linked attempt (correlation_id / attempt_number / sha256 payload_checksum — migration `20260728001241` confirmed applied); FE retry button + attempt column + date-range filter.
- `e2e/data-integration-retry.spec.ts` **3/3** (6.4s, no interception): parsed request body of an entityId-pinned share = versioned envelope with the seeded alert (recordCount 1, exact title/id) + receiver reflection contains the record; UI retry of a failed share (postman-echo /status/503) → linked `#2` row, identical body+checksum, original untouched, persists after reload; date-range filter narrows table; guards (successful→403 VN error, readonly→403).
- **F-019c re-verified at `71f35e2`** — its spec setup now pins one seeded record per share (the typed payload otherwise pushes the echo reflection past the 4000-char response truncation, hiding the reflected auth headers); assertions unchanged, **6/6**. DataIntegration subset **20/20**; cross-module smoke (businesses+auth) **13/13**; BE **621/621**.
- **Full suite post-batch: 282/282 passed, 0 failed/flaky/skipped (306s)** — first fully-green full run on record (covers the impact-map Level-3 migration obligation). Baseline runs the same day: 278/1 (the 1 = `reporting-error-notifications` load-contention flake, green in isolation, 2.1s).

## Test Run (2026-07-28) — Batch F-2: INT-03 inbound partner surface (F-019f)

- Commit `52d35c1`. Partner accounts (org-scoped, per-partner data-type allow-list, Active/Suspended), API keys (SHA-256 hash + prefix lookup only — raw key shown exactly once at issuance, fixed-time verification, expiry/revocation/last-used), inbound receive endpoint `POST /api/v1/partner/submissions/{dataType}` (X-Api-Key auth, ±300s replay window, schemaVersion gate, DB-enforced idempotency via unique `(partner_account_id, request_id)`, every attributable attempt an Inbound `ApiCallLog` row), admin submissions browser. Migration `20260728064640` confirmed applied (di_partner_accounts / di_partner_api_keys / di_inbound_submissions live in the real DB).
- `e2e/data-integration-partners.spec.ts` **3/3** (8.0s + guards, no interception; partner calls from a cookie-less `request` fixture → auth is provably the X-Api-Key header alone): UI lifecycle (create partner → issue key, raw key visible once → real partner POST 200 → duplicate delivery returns the ORIGINAL submission id with `duplicate:true` and exactly one persisted row → submission + Vietnamese payload visible in UI and after reload → Inbound row in call history → UI revoke → 401 → UI-issued replacement key works (rotation) → UI suspend → 401); guards (missing/garbage/unprefixed key → 401, expired key → 401, disallowed data type → 403 `DataTypeNotAllowed`, unknown segment / stale timestamp / missing X-Request-Id / missing X-Timestamp / schemaVersion 9.9 / empty records → 400); idempotency scoped per partner (same request id from two partners = two submissions; admin filter isolates each).
- **Two product defects found by the run and fixed in the same commit**: (1) `records: []` returned **500** — ABP method-argument validation fired ahead of the service body and, through the `IActionResult` controller, bypassed ABP's exception→status mapping, leaking the ABP error shape to partners; validation is now in-method (`[DisableValidation]` + null-safe envelope guards) so every outcome maps to 400/401/403 as designed — pinned by contract test and an e2e assertion on the `InvalidRecords` error code. (2) Stored payloads were `\uXXXX`-escaped, rendering Vietnamese content unreadable in the officer UI — now stored human-readable (`UnsafeRelaxedJsonEscaping`; payload is rendered as a text node, no HTML sink).
- Regression owed for the shared `OutboundUrlValidator` hardening (AllowAutoRedirect=false + 2 MB response cap) executed: **full DataIntegration subset 23/23** (F-019 7/7 + credentials 6/6 + share 3/3 + retry 3/3 + partners 3/3 + UI lifecycle 1/1). BE: DataIntegration contract **27/27**, EF mapping **2/2**, OutboundUrlValidator **58/58**. `tsc --noEmit` clean; existing FE unit tests for the feature 5/5.

## Test Run (2026-07-28) — SEC-04 password-expiry server-side enforcement (P0-1)

- New middleware `PasswordExpiryMiddleware` (Host pipeline, after `UseDynamicClaims`) blocks every authenticated non-whitelisted request when the caller's `AppUserProfile` is `MustChangePassword` or `IsPasswordExpired`, returning 403 `FoodSafe:Account:PasswordExpired`. Whitelist: account-security, current-user-context, `/api/abp`, `/api/v1/public`, logout, health. Validity period moved to config `Security:PasswordValidityDays` (default 90).
- Deterministic seed account `expired.pw@foodsafe.local` (ProvinceAdmin, password aged 100d under 90d policy → expired 10d ago). Spec never mutates it → re-runnable.
- `e2e/password-expiry-enforcement.spec.ts`: **4 passed, 0 failed** (6.0s, workers=1), no API interception. Evidence: expired user logs in (`result=1`) but `/api/v1/app/business` → **403 gate** while holding **134 permissions** (proves gate ≠ RBAC); whitelisted change-password runs the controller (`FoodSafe:Account:0001`, not the gate); **admin control → 200**; real UI redirects the expired session to `/account/change-password`.
- Cross-checked by curl on the live stack (login→business 403, admin→200). Closes the SEC-04 "expiry not exercised" gap (doc 73 → PASS_WITH_BROWSER_EVIDENCE). Commit `6dab46e`+wt.

## Test Run (2026-07-28) — F-034 anonymous public certificate download (P1-2)

- Strengthened `e2e/certificate-pdf-verification.spec.ts`: **5 passed, 0 failed** (4.1s), no API interception.
- New decisive evidence: a **cookie-less** `browser.newContext()` (asserted 0 cookies) resolves each id via the anonymous public search endpoint and downloads a valid `%PDF` for **all 5 certificate types**; a second test clicks "Tải PDF" on `/tra-cuu-giay-phep` and fetches the linked doc anonymously.
- Closes the FR-4x-03/04 gap that doc 75 had marked MISSING (endpoints existed all along — see doc 77 §1). Reclassified in doc 73 §3 Group E + §4 roll-up (MISSING 13 → 3).
- Prior F-034 evidence (`86b793a`) only proved the **authenticated** byte-fetch; this proves the **citizen/anonymous** path required by FR-42/43/44/46/47-03/04.
## Test Run (2026-07-28, eighth) — defect-fix batch, Level 4 on rebuilt images

- Playwright **236/236 passed (7.6m)**; backend **519/519**; `tsc -b --noEmit` and `oxlint src`
  clean; backend Release build 0 errors (1 pre-existing `CS8714` warning).
- Covers a batch that fixed one data-loss defect, three security defects and a dead workflow —
  see `03-regression-log.md` (2026-07-28) for the full list and the runtime evidence.
- New spec `e2e/inspection-violations-verification.spec.ts` closes the coverage hole that let the
  violation data-loss defect survive a previously green suite.
- **[Merge note 2026-07-28]** These fixes are now committed as `b6c5384` (merged via `363a70b`);
  the registry rows still record `fe3dbd2` and are re-stamped only after the post-merge re-run
  (see Merge note above).
- Frontend `vitest` is **not** green at HEAD (9 failures) — proven pre-existing/flaky against a
  pristine `fe3dbd2` worktree, root-caused to jsdom role-query latency. It is not acceptance
  evidence under this project's policy, but it does make the CI frontend gate unreliable.

## Test Run (2026-07-27, seventh) — Level 4 re-certification at merge `fe3dbd2`

- All 34 features re-verified at **`fe3dbd2`**; the previous per-feature SHAs were invalidated
  by Level 3 shared-dependency changes in `0eba6b6` (permissions, host module, EF model,
  three migrations, auth API, router/layout).
- Stack rebuilt from HEAD on a **fresh PostgreSQL volume**: 20 migrations applied, migrator
  exit 0, seven containers healthy, 86 tables created.
- Playwright full suite: **235 passed, 0 failed (8.0m)** — no API interception, real login.
- Backend: **519 passed, 0 failed** (Domain 197, Application 251, HttpApi.Host 53, EFCore 18).
- Release build 0 warnings; `dotnet format --verify-no-changes` clean.
- Caveat: the native backend run used `DOTNET_ROLL_FORWARD=Major` (runtime 10.0.7) because no
  .NET 9 runtime is installed on this workstation. Container-based evidence is unaffected.
  See `03-regression-log.md` for the full entry.

## Test Run (2026-07-27, sixth) — F-033 Public Portal FR-41..FR-49 verified

- **21 test cases** in new `public-portal-verification.spec.ts` — **21 passed, 0 failed** (10.4s)
- Feature verified: F-033 (Public Portal FR-41..FR-49)
- New spec covers: general business/product search, 5 certificate-type searches (FR-42..FR-44, FR-46..FR-47), warned businesses (FR-45), public news/alerts (FR-48-01/02), citizen alert submission via API (FR-48-03), public documents (FR-49)
- All endpoints confirmed AllowAnonymous — no 401 on any public endpoint
- Draft/non-public filter enforced on news, alerts, and documents
- Citizen captcha bypass: any non-empty token accepted via Cloudflare test secret in non-production
- Stack: API + FE containers rebuilt from HEAD at this commit

## Test Run (2026-07-27, fifth) — F-024..F-030 Public Lookups verified

- **22 test cases** across new `public-lookups-verification.spec.ts` — **22 passed, 0 failed** (7.9s)
- **7 smoke tests** in `public-lookups.spec.ts` — **7 passed** (4.3s)
- Features verified: F-024..F-030 (all 7 public lookup features)
- Key finding: ABP `UserFriendlyException` maps to HTTP 403, NOT 400 or 404. Public endpoints return 403 body with Vietnamese error message when entity not found — this is expected, not an error.
- All 7 public endpoints confirmed AllowAnonymous (no session required)
- Commit SHA: `06e4b1c`

## Test Run (2026-07-27, fourth) — F-001, F-003, F-004, F-005 verified

- **27 test cases** across 4 new verification specs — **27 passed, 0 failed** (16.8s)
- Features verified: F-001 (Authentication), F-003 (Organizations), F-004 (Master Catalogs), F-005 (Geographic Catalogs)
- Product defects found and fixed:
  1. `authApi.ts` logout used POST — fixed to GET (`/api/account/logout` is a GET endpoint)
  2. `useGeography.ts` districts/communes sent IDs as query params — fixed to route segments (`/districts/{provinceId}`, `/communes/{districtId}`)
- Docker frontend image rebuilt to pick up fixes
- Commit SHA: `94f1f57`

## Test Run (2026-07-27, third) — commit `a54889f` (Statistics DI fix)

- **146 test cases** — **145 passed, 1 failed** (3.4m, workers=1) after rebuilding API image with Statistics DI fix
- Failure: `public-portal.spec.ts` › "citizen alert submission creates a moderation-queue draft" — Turnstile CAPTCHA timeout; this spec is for F-024..F-030 (READY_FOR_TEST, not yet VERIFIED); does not affect any VERIFIED feature
- All 20 VERIFIED features (F-002, F-006..F-023) maintain their VERIFIED status

## Test Run (2026-07-27, second) — commit `df7823c` + security pass

- **90 test cases** — **90 passed, 0 failed** (2.7m) after rebuilding both Docker images at HEAD (includes security-pass commit `06656c8`)
- Clears the F-015 DIRTY flag set by the shared `FoodSafeHttpApiHostModule` change: reporting main + verification specs pass on the rebuilt stack
- F-002 verified separately at `b2f13fb` (password-history product defect found and fixed — see `features/password-management.md`)

## Test Run (2026-07-27) — commit `c8f9537`

- **41 test cases** across 26 spec files — **41 passed, 0 failed** (1.8m, workers=1)
- Stack: Docker Compose (PostgreSQL 15, Redis 7, MinIO, ClamAV, API, nginx) at `http://127.0.0.1:8080`
- API interception: None; login via real `/api/account/login` with CSRF token
- Blockers cleared this run:
  1. Dev rate limiter raised (general API bucket 300→5000/min in Development) — full suite no longer 429s
  2. `/api/*` unauthorized requests now return 401/403 instead of 302 HTML redirects
  3. Inspection plan editor bug fixed (items form never mounted — "Thêm cơ sở" did nothing)
  4. PoisoningMap Leaflet crash on null coordinates fixed
  5. Reporting E2E made self-healing against stale non-Draft workflow reports

## Audit Results (2026-07-26) — Re-run with verified root causes

### Test Run

- **33 test cases** across 25 spec files
- **8 passed**, **25 failed**, 0 skipped
- Stack: Docker Compose (PostgreSQL 15, Redis 7, MinIO, ClamAV, API, nginx)
- Git commit: `9d2cb1e`
- API interception: None
- Method: Each spec run individually with `E2E_ADMIN_PASSWORD` set; API restarted between batches to reset in-memory rate limiter

### Verified Root Causes of Failures

| Root Cause | Failed Tests | Detail |
|------------|-------------|--------|
| Docker frontend 404 | 14 | Route exists in source code but not in stale Docker build |
| No organization seed data | 8 | Organization tree API returns `{"items":[]}` — tests can't create entities |
| Test selector bug | 1 | organizations.spec.ts: dialog opens but Playwright can't locate textbox by accessible name |
| App bug (export) | 1 | businesses.spec.ts: "Xuất Excel" click doesn't trigger download event |
| Test assertion mismatch | 1 | dashboard.spec.ts: expects "Chi tiết theo loại hồ sơ" but actual text is "Tổng hợp theo loại hồ sơ" |
| Permission denied | 1 | identity-administration.spec.ts: admin user lacks required permission |

### Why No Feature is VERIFIED

Even the 8 passing tests do not qualify for VERIFIED status because:

1. **F-001** (auth) — 3/3 pass, but no validation tests (wrong password, empty fields), no CAPTCHA test, no session timeout test
2. **F-004** (catalogs) — tests only 1/9 entity types (document type); no validation, permission, or reload tests
3. **F-005** (geography) — read-only tab navigation only; no create/edit/delete tests
4. **F-026/027/028** (public lookups) — only route + not-found state; no successful lookup with real data

### Systemic Gaps (No Feature Has Coverage)

- Permission denial (non-admin user)
- Cross-organization access denial
- Cross-administrative-area access denial
- Search, filter, sort, pagination
- Browser reload persistence
- Loading, empty, error states
- Browser console error monitoring
- Audit log verification

### Priority Blockers

1. **Docker frontend build is stale** — Fix Dockerfile to use `node:20-alpine` (14 test failures)
2. **No organization seed data** — Add org seeding in DbMigrator (8 test failures)
3. **API rate limiter blocks test execution** — Exempt dev environment or share sessions
4. **No test user isolation** — Create restricted test users for permission/scope testing
5. **Admin missing permissions** — Seed `IdentityAdministration` permission for admin role

### Notes

- `READY_FOR_TEST` means tests passed but coverage is too shallow for VERIFIED
- `FAILED` means tests exist but did not pass against the real stack (root causes now verified via screenshots)
- `BLOCKED` means no test exists and cannot proceed without writing one
- Previous `READY_FOR_TEST` status for all 32 features was incorrect — tests had never been run against the real stack

