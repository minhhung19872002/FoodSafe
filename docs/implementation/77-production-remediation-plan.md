# 77 — Production / UAT Remediation Plan (Prioritized, Grounded in Executed Code)

> **Scope of this document.** A prioritized remediation plan derived from the independent release
> acceptance audit — docs/testing/[75](../testing/75-final-browser-acceptance-report.md),
> [71](../testing/71-independent-test-evidence-audit.md),
> [72](../testing/72-playwright-quality-audit.md),
> [73](../testing/73-requirement-browser-coverage-matrix.md).
> **This is NOT a re-run of the audit.** Every classification below was re-grounded against the
> *actual source tree at HEAD (`fe3dbd2`)* — several audit "MISSING" verdicts were found to be
> over-stated once the code was read and the live stack was probed. Where the executed reality
> differs from the audit, the corrected status is stated explicitly and the evidence is cited.
>
> **Prioritization rule (per request):** only **functional / business / security acceptance**
> issues are prioritized. SSL certificate, domain, and infrastructure deployment are **excluded**
> unless they block functional verification. Items excluded on that basis are listed in §6 with the
> reason, not silently dropped.

---

## 0. Priority definitions

| Priority | Meaning | Gate |
|---|---|---|
| **P0** | Production blocker — a functional or security defect that makes the system unsafe/incorrect to run in production, and is buildable now. | Blocks production. |
| **P1** | Required before UAT — feature is implemented but has **no executed browser evidence**, or a citizen/security-facing acceptance gap that testers will hit. | Blocks UAT sign-off. |
| **P2** | Required before production hardening — real but non-UAT-blocking (integration protocol, regression harness, NFR reproduction, DB security). | Blocks the later production gate. |
| **P3** | Nice to have — UX/secondary-path improvements; requirement already met by another path. | Optional. |

## 1. Corrections to the audit (established by execution this session)

These reshape the plan and must be read before the item tables.

| Audit claim (doc 75 §4) | Executed reality at `fe3dbd2` | Effect on plan |
|---|---|---|
| **FR-42/43/44/46/47-03/04** public certificate document view/download **MISSING** ("no anonymous file-serving endpoint exists"). | **FALSE — implemented.** `CertificatePdfController` (`FoodSafe.HttpApi/Public/PublicPortalControllers.cs`) exposes `[AllowAnonymous] GET /api/v1/public/{cert-type}/{id:guid}/pdf` for all 5 types; `CertificatePdfAppService` generates QuestPDF docs. `PublicCertificateSearchPage.tsx` already renders a "Tải PDF" link column. **Curl-proven anonymous** this session: all 5 return HTTP 200 / `application/pdf` / `%PDF` (eligibility 53 100 B, self-decl 53 602 B, product-reg 53 261 B, cfs 48 525 B, export-food 52 496 B). | Reclassified **MISSING → IMPLEMENTED_NOT_VERIFIED**. Only gap = no browser test performs the **anonymous download click**. → **P1-2** (evidence), not a build. |
| **STT 50–57 data-integration** "effectively non-functional / no operational engine". | **PARTLY FALSE.** `DataSharingAppService.ShareAsync()` is a **real** outbound engine — builds a JSON envelope and does an actual `HttpClient.SendAsync()`, then writes an `ApiCallLog` (Outbound, with `DataType`). Reachable via authenticated `POST /api/v1/app/data-sharing/share`. FE has a complete "Chia sẻ dữ liệu" button + modal gated by `FoodSafe.DataIntegration.Share`. | Genuine gaps **narrowed** to: (a) **no credential storage/injection** → any auth-requiring partner gets an unauthenticated call [**P0-2**]; (b) no **TT31-conformant typed payload** → external-blocked [**P2-1**]; (c) no **inbound** partner surface [**P2-2**]; (d) no browser evidence of a share [**P1-3**]. |
| **O-1** "ProvinceAdmin holds system user-admin + audit-log permissions — reconcile before sign-off." | **RESOLVED — INTENDED.** `docs/05-permission-matrix.md` lines 132–137 explicitly grant ProvinceAdmin `SystemAdmin.Users` (trong tỉnh), `.Roles`, `.AuditLogs`, `.Settings`. Seed `FoodSafePermissionDataSeedContributor.cs` implements exactly this (all admin perms minus `DataScope.All`). Escalation is still guarded: `IdentityAdministrationRules.EnsureRoleCanBeAssigned` blocks non-global users from assigning `SystemAdmin`/`admin` (`GetRequiredLevel` returns null → `IncompatibleRole`). The "(trong tỉnh)" note is a server-side `OrganizationId` data-scope qualifier, not a permission restriction. | **No remediation.** Documented in §5 as closed-INTENDED so it is not re-raised at sign-off. |

**Net effect:** the production scope-gap list in doc 75 §7.1 shrinks materially. The dominant remaining
work is **executed browser evidence for ~55 already-built features** (P1), plus **two real
security/functional builds** (P0), plus **integration/hardening** that is partly externally blocked (P2).

---

## 2. P0 — Production blockers (buildable now)

### P0-1 — Server-side password-expiry enforcement (SEC-04)

> **✅ DONE — 2026-07-28, commit `6dab46e`+wt.** Implemented as **`PasswordExpiryMiddleware`** (Host pipeline, registered after `UseDynamicClaims()` — chosen over an MVC action filter to mirror the existing `LoginCaptchaMiddleware` and to also cover non-MVC endpoints). Gates any authenticated request whose `AppUserProfile` is `MustChangePassword` or `IsPasswordExpired(now)` → **403 `FoodSafe:Account:PasswordExpired`**. Whitelist prefixes: `/api/v1/app/account-security`, `/api/v1/app/current-user-context`, `/api/account/logout`, `/api/abp`, `/api/v1/public`, `/health` (login is anonymous → passes naturally). Validity moved to config `Security:PasswordValidityDays` (default 90) in `appsettings.json`, consumed by `AccountSecurityAppService`. Deterministic seed user `expired.pw@foodsafe.local` (ProvinceAdmin, aged 100d/90d policy). **Evidence:** `e2e/password-expiry-enforcement.spec.ts` — **4/4 passed (6.0s), no interception**; expired user logs in but business API → 403 while holding 134 permissions; whitelist reachable (`FoodSafe:Account:0001`, not the gate); admin control → 200; real UI redirects to `/account/change-password`. Recorded in docs/testing/73 (SEC-04 → PASS_WITH_BROWSER_EVIDENCE) + registry. Files: `PasswordExpiryMiddleware.cs`, `FoodSafeHttpApiHostModule.cs`, `AccountSecurityAppService.cs`, `appsettings.json`, `E2eTestDataSeedContributor.cs`.

| Field | Detail |
|---|---|
| **Requirement ID** | SEC-04 (CLAUDE.md §5 "Password policy … hết hạn 90 ngày"); prior finding SEC-M-03 (docs/production-audit/04). |
| **Business impact** | Mandated ATTT Cấp độ 2 control. The 90-day expiry is **enforced only in the browser** (`PrivateRoute.tsx` redirect off the `IsPasswordExpired` flag in the current-user context). Any client bypassing the SPA — script, Postman, mobile — with a valid session cookie and an expired password calls **every** `[Authorize]` business endpoint freely. The control is effectively bypassable, so the requirement is not met. |
| **Current implementation status** | **Partial (client-only).** Domain is done: `AppUserProfile.PasswordExpiresAt` + `IsPasswordExpired(now)` (`FoodSafe.Domain/Security/AppUserProfile.cs:13,41`); set via `RecordPasswordChanged(now, PasswordValidity)`. Flag surfaced in `CurrentUserContextAppService.cs:218`. **Verified absent this session:** no action filter/middleware named `PasswordExpir*`, no `Security:PasswordValidityDays` config key. Validity is a compile-time constant `TimeSpan.FromDays(90)` (`AccountSecurityAppService.cs:18`). |
| **Missing part** | (1) An ASP.NET Core global action filter / middleware that returns **403 `FoodSafe:Account:PasswordExpired`** for any authenticated request from an expired-password (or `MustChangePassword`) user, with a whitelist for login/logout/change-password/config endpoints. (2) Move the 90-day period to configuration. |
| **Recommended approach** | Add `PasswordExpiryActionFilter : IAsyncActionFilter` registered globally via `Configure<MvcOptions>(o => o.Filters.Add<…>())` in `FoodSafeHttpApiHostModule`. Skip when: path starts with a whitelisted prefix, OR user unauthenticated. Resolve `AppUserProfile` by `CurrentUser.GetId()`; if expired/must-change → `context.Result = new ObjectResult(new { error = new { code = "FoodSafe:Account:PasswordExpired" } }) { StatusCode = 403 }`. Cache the per-request lookup (`IMemoryCache`, 60 s TTL keyed by UserId, **or** reuse the value already computed for the current-user context) to avoid a DB hit per request. |
| **Backend changes** | New `FoodSafe.HttpApi.Host/Filters/PasswordExpiryActionFilter.cs`; register in `FoodSafeHttpApiHostModule.cs`. Replace the constant in `AccountSecurityAppService.cs:18` with `config.GetValue("Security:PasswordValidityDays", 90)`. Add `"Security": { "PasswordValidityDays": 90 }` to `appsettings.json`. **Whitelist:** `/api/account/login`, `/api/account/logout`, `/api/v1/app/account-security/*`, `/api/abp/application-configuration`, `/api/v1/app/current-user-context`. |
| **Frontend changes** | None functionally required (redirect already exists). Optional: on a `403 PasswordExpired` from the API client interceptor, force-redirect to the change-password page for layered UX. |
| **Database changes** | None. |
| **Test cases required** | Real HTTP (no mock): (1) seed a user with `PasswordExpiresAt` in the past → any business `GET` returns **403 `FoodSafe:Account:PasswordExpired`**. (2) Same user hits each whitelisted path → normal status. (3) After a real change-password call → same business `GET` returns **200**. (4) Playwright: log in as that user → auto-redirected to change-password; complete change → business route loads. Use a **dedicated** expired-password seed user; keep existing test users at long validity so other specs are unaffected. |
| **Estimated complexity** | **Medium** (2–4 h incl. tests). Domain + FE already exist; net new = one filter + one registration + config move. |
| **Verification criteria** | Executed browser + real-HTTP evidence that (a) an expired-password session is 403-blocked on business APIs, (b) whitelisted auth/recovery paths still work, (c) post-change the same session succeeds — recorded against a fixed commit in docs/testing/73. |

### P0-2 — Data-integration outbound: encrypted credential storage + auth-header injection (FR-50/51, INT security)

> **✅ DONE — VERIFIED (commit `3fe7325`, 2026-07-28).** Encrypted write-only credential
> (ABP `IStringEncryptionService`) + `AuthType`-driven header injection shipped; migration
> `20260727183552_AddApiEndpointCredential` adds `credential_value`. Browser/real-stack evidence:
> `e2e/data-integration-credentials.spec.ts` **6/6** — secret never returned by create/detail/list,
> Bearer→`Authorization` / API-key→`X-Api-Key` injection **observed at a real receiver** (postman-echo),
> rotate + clear stops injection, noperm share → 403, real UI never shows the secret. Shared-stack
> regression (businesses + auth) 13/13.
>
> **Deviations from the plan below, deliberate:** (a) `IHttpClientFactory` swap **deferred** — the
> engine keeps the **SSRF-guarded static `SharedClient`** (B-5), because the auth header rides the
> per-request `HttpRequestMessage`, so a shared client is not a credential-leak vector and the DNS
> concern is already covered by the guard's connect-time IP re-resolution; the factory swap is folded
> into **P2-3** where the Polly policies land. (b) No dev echo-endpoint seed row — the spec provisions
> its own endpoints against `postman-echo.com` and deletes them, giving stronger real-receiver evidence
> than a loopback echo. **Also fixed en route:** an app-wide AutoMapper 15.1.3 ABI regression (a prior
> "B-6 FIXED" pin that was runtime-broken) reverted to 14.0.0 — see regression-log 2026-07-28 / doc 08 B-6.

| Field | Detail |
|---|---|
| **Requirement ID** | FR-50 / FR-51 (liên thông outbound); security hardening of the share engine. |
| **Business impact** | The outbound share engine works but **never authenticates**: `ShareAsync` ignores `endpoint.AuthType` and adds no `Authorization`/`X-Api-Key` header, and `ApiEndpoint` has **no credential column** at all. Every real partner (Bộ Y tế / Sở NN / Sở CT) that requires auth will reject the call. Additionally the engine uses a **static `HttpClient`** (DNS-staleness / socket-exhaustion risk) and would store any future credential **in plaintext**. Without this, no real liên thông can occur and it is unsafe to store partner secrets. |
| **Current implementation status** | **Implemented-but-non-operational for authed partners.** `di_api_endpoints` stores URL/method/system/`AuthType` enum/status — **no credential value**. `DataSharingAppService.ShareAsync()` real `SendAsync` + `ApiCallLog` write, but no auth injection; static `HttpClient` (not `IHttpClientFactory`). |
| **Missing part** | (1) Encrypted `CredentialValue` on `ApiEndpoint` (+ DTO + migration). (2) `AuthType`-driven header injection in `ShareAsync`. (3) `IHttpClientFactory` instead of the static client. (4) FE credential field (show/hide by `AuthType`). |
| **Recommended approach** | Add nullable `CredentialValue` encrypted at rest (ABP `IStringEncryptionService` or an EF `ValueConverter`). In `ShareAsync`, `switch (endpoint.AuthType)` → inject `Authorization: Bearer …` / `X-Api-Key: …` / `Authorization: Basic …` when a credential is set. Replace the static client with an `IHttpClientFactory`-named client (30 s timeout retained; add a simple Polly timeout/retry later under P2-3). Seed one dev `ApiEndpoint` pointing at a local echo server so an end-to-end share is browser-verifiable. |
| **Backend changes** | `ApiEndpoint` entity (+ `SetCredential` method, encrypted), `CreateUpdateApiEndpointDto`/`ApiEndpointDto`, EF migration adding `credential_value` to `di_api_endpoints`. `DataSharingAppService.ShareAsync` header-injection switch + `IHttpClientFactory`. Register the named client in the module. |
| **Frontend changes** | Credential input in the endpoint create/edit form (`DataIntegrationPage.tsx`), conditional on selected `AuthType`; never echo the stored secret back (write-only field). |
| **Database changes** | **Yes** — new EF migration: `credential_value text NULL` (encrypted payload) on `di_api_endpoints`. |
| **Test cases required** | Real HTTP: (1) create endpoint with `AuthType=ApiKey` + credential → persisted; `GET` never returns the raw secret. (2) Stand up a local echo receiver; `POST /data-sharing/share` → receiver log shows the injected `X-Api-Key`/`Authorization` header; an `ApiCallLog` Outbound row with the right `DataType` is written. (3) DB inspection confirms `credential_value` is not plaintext. (4) User without `DataIntegration.Share` → 403. (Browser flow shared with **P1-3**.) |
| **Estimated complexity** | **Medium** (migration + injection + FE field + encryption). |
| **Verification criteria** | Executed evidence that an authenticated outbound share reaches a real receiver **with the configured auth header**, the credential is encrypted at rest, and the share is logged — recorded against a fixed commit. (Full TT31 business payload is **P2-1**, external-blocked — this item proves the transport + auth, not the partner schema.) |

> **P0 note.** These are the only two production blockers that are both real *and* buildable now.
> Everything else the audit called a "production blocker" is either evidence work (P1), externally
> blocked (P2-1), or excluded infra (§6).

---

## 3. P1 — Required before UAT

### P1-1 — Executed browser evidence for the ~55 IMPLEMENTED_NOT_VERIFIED features

| Field | Detail |
|---|---|
| **Requirement ID** | ~55 items across FR-02/03, FR-19, FR-27/28, FR-33/34/35, FR-36, FR-39, FR-40, and per-module Excel export & attachments (doc 71 §7; doc 73 IMPLEMENTED_NOT_VERIFIED = 32 rows + PASS_WITH_BACKEND_ONLY ≈ 55 browser targets). |
| **Business impact** | Every one of these is **built** (BE controllers + FE pages + hooks all exist) but **no executed Playwright test touches the browser-observable action**. UAT testers will hit untested paths cold; regressions are unguarded. This is the single largest acceptance gap and the core of the mandated feature-verification loop. |
| **Current implementation status** | **Implemented, zero executed browser evidence.** Existing `*-verification.spec.ts` files are thin (0–2 `page.goto` each, mostly search/persistence). Grounded inventory (agent) enumerates 60+ browser-observable targets in 13 areas: no `waitForEvent("download")` exists **anywhere** (all Excel exports unproven); no attachment upload/download browser test exists anywhere; report workflow buttons, dashboard/statistics filters, risk-analysis publish + public view, and the data-sharing history tab are API-only. |
| **Missing part** | Browser tests for: user-admin create/edit/reset-password; audit-log detail drawer + Excel export; system-settings save + logo/login-background upload; profile view/edit + avatar; change-password form submit; **Excel export download for every module** (~20 endpoints); advanced list filter + column sort + page-size for businesses/inspection/food-poisoning/reporting/alerts/testing/risk-analysis; **attachment upload+download** for inspection + 6 licensing modules + products; report workflow buttons (Submit/Verify/Return/Complete) in-UI; dashboard year filter + KPI drill-down; statistics year-selector change; risk-analysis Publish + public-portal view; data-sharing history tab. |
| **Recommended approach** | **Extend existing specs — do not create parallel suites.** Add two shared helpers under `FoodSafe.FE/e2e/helpers/`: `expectExcelDownload(page, triggerLocator)` (wraps `page.waitForEvent("download")`, asserts `PK` XLSX magic) and `attachmentRoundTrip(page, dialog, …)` (upload PDF → assert row → download → assert `%PDF` → delete). Then batch by blast radius (below) so each PR is a Level-2 feature retest per the testing policy. Follow the mandatory loop per feature: implement test → run affected Playwright → update docs/testing/73 + registry → **no VERIFIED without browser evidence**. |
| **Backend changes** | **None** — all endpoints exist (confirmed by inventory agent). |
| **Frontend changes** | **None** — all pages/components exist. New Playwright test code only. |
| **Database changes** | None (test seed/teardown only; attachment tests require the running MinIO from compose). |
| **Test cases required** | The 60+ rows in the grounded inventory table (kept in this session's evidence). Each: open real route (no `page.route`), execute the named UI action against the real backend, assert the browser-observable result (visible element / download event / navigation / badge text), and `page.reload()` to confirm persistence where applicable, with a clean console. |
| **Estimated complexity** | **High (aggregate)** — 60+ targets. Per batch: Low–Medium. Sequence by dependency, not all at once. |
| **Verification criteria** | Each feature moves to `VERIFIED` in docs/testing/73 + `01-feature-verification-registry.md` only with an executed browser run (interception `No`) recorded against the HEAD commit. Batch is "done" when its Playwright subset is green on a non-contended run. |

**P1-1 execution batches** (each is one Level-2 retest / PR):

| Batch | Areas | New helper leaned on | Status |
|---|---|---|---|
| P1-1a | Excel export downloads — all ~20 modules | `expectExcelDownload` | ✅ DONE (`2adc785`) — `excel-exports.spec.ts` 5/5 |
| P1-1b | Attachment upload/download — inspection + 6 licensing + products | `attachmentRoundTrip` | 🔶 inspection DONE (`inspection-attachments.spec.ts` 2/2 — FR-27-08/09, FR-28-05): plan + result upload→**reload-persist**→download(`%PDF`)→delete, real ClamAV+MinIO, no interception. Products + 6 licensing modules **already** covered by existing `businesses`/`self-declarations`/`advertisement-registrations`/`eligibility-certificates`/`cfs-certificates`/`export-food-certificates` full-cycle specs; only `/documents` (admin-doc) attachment upload remains untested |
| P1-1c | Identity admin user lifecycle — delete (FR-02-05), random password (FR-02-07), permission filter (FR-02-02) | — | ✅ DONE — `identity-user-lifecycle.spec.ts` 2/2 + BE contract 2/2. **Fixed 2 real defects**: `Users.Delete` not surfaced to FE (button never rendered) + `DeleteUserAsync` NRE/HTTP 500 on projected user |
| P1-1d | List filter + sort + page-size — businesses, inspection, food-poisoning, reporting, alerts, testing, risk-analysis | — | ✅ DONE (`a0313c1`). **businesses** (`business-list-filters.spec.ts` 3/3 — FR-19-02): status filter + multi-column sort + pagination; **implemented BE `ApplySorting` whitelist + FE column sorters** — sort was hard-coded Name-asc, the one genuinely-missing sort. **reporting** covered under P1-1e (year filter + persistence, `reporting.spec.ts`/`reporting-verification.spec.ts`). **inspection/food-poisoning/alerts/testing/risk-analysis**: code survey confirmed these declare **no `sorter` columns** in the FE (only `businesses` did) and their BE list services use deterministic ordering (`OrderByDescending` on CreationTime/Year/SampleDate/InspectionDate) + `PageBy(input)` — so there is **no hidden sort defect** to fix (nothing in the UI requests a sort the server ignores). Filter (search) + empty-state already carry browser evidence in each `*-verification.spec.ts`; re-run **6/6 green at HEAD** (inspection filter+empty, food-poisoning, alerts-news, testing-results, risk-analysis — real backend, no interception) |
| P1-1e | Report workflow buttons in-UI (Submit/Verify/Return/Complete); dashboard filter + drill-down; statistics year change | role-seeded verifier | ✅ DONE (`2eca557`) — dashboard/statistics: `dashboard-statistics-filters.spec.ts` 3/3 (`e2665e4`). **Report-workflow buttons now fully UI-verified**: `reporting.spec.ts` 2/2 drives Submit(Gửi)→Verify(Xác minh)→Complete(Hoàn thành) *and* the return path Submit→Return(Trả lại, reason modal)→ReturnToDraft(Về nháp) through real buttons; `reporting-verification.spec.ts` 6/6 covers guards/permission/cross-org/validation/persistence. Full reporting subset re-run **7/7 green** at HEAD, no interception |
| P1-1f | Citizen submission moderation — alert reject (FR-29-06), news approval (FR-30-07) | source-filter helper | ✅ DONE (`f780fdb`) — `citizen-moderation.spec.ts` **2/2 green (10.1s)**, real backend, no interception. Citizen submissions are **seeded over real HTTP** through the real public endpoints (`POST /api/v1/public/news-reports`, `/api/v1/public/alert-reports`) — the request passes through the real Turnstile captcha middleware (test secret accepts any non-empty token) → real app service → real domain factory → PostgreSQL. Officer moderation is driven **entirely through the browser UI** at `/alerts-news`: **news** — filter Nguồn="Từ dân" → Draft row → **Xuất bản** (approve) → status flips to "Đã xuất bản" → **persists across `page.reload()`**; **alert** — filter Nguồn="Từ dân" → Draft row tagged "Từ dân" → **Xóa** (reject, Draft-only) → row leaves the queue. **Env note:** the real `/gui-tin` / `/gui-phan-anh` browser forms cannot seed here because the third-party Turnstile *widget* does not resolve to a token in headless CI (submit POST never fires) — an external-widget limitation, not a product defect; the citizen *endpoints* are still fully exercised via real HTTP |

### P1-2 — Anonymous public certificate document download — browser evidence (FR-4x-03/04)

| Field | Detail |
|---|---|
| **Requirement ID** | FR-42-03/04, FR-43-03/04, FR-44-03/04, FR-46-03/04, FR-47-03/04. |
| **Business impact** | Citizen-facing: the public must be able to view/download the certificate document without login. **The requirement is already met** via the search page's "Tải PDF" links backed by anonymous endpoints (curl-proven, §1). The only true gap is that **no test performs the anonymous download click in a browser**, so it cannot be signed off as VERIFIED. |
| **Current implementation status** | **Implemented + partially evidenced.** `certificate-pdf-verification.spec.ts` already asserts the "Tải PDF" link is visible with the right `href` in a **fresh unauthenticated** context and that ad-registrations has none. But its PDF **byte-fetch** assertions use `adminPage.context().request` (carries the admin cookie), so they do **not** prove the download works **anonymously**. |
| **Missing part** | One assertion: in an **unauthenticated** browser context, click the "Tải PDF" link (or fetch its `href` with that context's `request`) and assert a `download` event / `%PDF` bytes for all 5 types. |
| **Recommended approach** | Extend `certificate-pdf-verification.spec.ts`: create `browser.newContext()` (no storage state), navigate to `/tra-cuu-giay-phep`, run each cert-type search, and for each row with a PDF link use `context.request.get(href)` **from the anonymous context** (or `page.waitForEvent("download")` on click) → assert 200 / `application/pdf` / `%PDF`. |
| **Backend changes** | None. |
| **Frontend changes** | None. |
| **Database changes** | None (needs one seeded certificate per type — reuse existing lifecycle-spec seeds). |
| **Test cases required** | Anonymous context: (1) all 5 types → `%PDF` bytes with no auth cookie present. (2) unknown Guid → non-200. (3) ad-registrations tab → no PDF link (already covered). |
| **Estimated complexity** | **Low** (extend one spec). |
| **Verification criteria** | Executed run proving the download succeeds with an unauthenticated context. On pass, reclassify FR-4x-03/04 **MISSING → VERIFIED** in docs/testing/73 (with the §1 correction noted). |

### P1-3 — Data-sharing outbound: real share action browser evidence (F-019 extension, FR-51)

> **DONE — VERIFIED (2026-07-28).** Driving the share through the real UI **surfaced a genuine functional defect**, not merely missing evidence: the "Chia sẻ dữ liệu" button is gated on `hasPermission("FoodSafe.DataIntegration.Share")`, and the FE permission list is served by `CurrentUserContextAppService`, whose hard-coded `FoodSafePermissionNames` allowlist **omitted `DataIntegration.Share`**. Result: the Share permission was granted server-side (API authorized — P0-2 test 5 confirmed), but the button **never rendered for any user, including admin** — the share action was UI-unreachable. Fix: added `FoodSafePermissions.DataIntegration.Share` to the allowlist (`CurrentUserContextAppService.cs`) — one-line, purely additive. (The plan's "Frontend changes: None" held; the real change was **BE**, and the seeded-receiver/mock-service in the original approach proved unnecessary — a public echo reachable through the B-5 SSRF guard is used instead of `page.route`.)
>
> **Evidence:** new `e2e/data-integration-share.spec.ts` — **3 passed** (7.4s, no API interception): (1) admin opens `/data-integration` → "Lịch sử gọi API" → "Chia sẻ dữ liệu" → picks a seeded ACTIVE endpoint + `Cảnh báo ATTP` → "Gửi" → success toast `Đã chia sẻ dữ liệu thành công.` → a new **Outbound ("Gửi")** history row appears (correct DataType, receiver URL, HTTP 200/OK) → **full browser reload → row still served by the backend**; (2) INACTIVE endpoint → real API `POST /data-sharing/share` refused with `Điểm kết nối đang ngừng hoạt động…`; (3) non-admin (`readonly@`, no DataIntegration grant) → `/data-integration` shows the 403 Result, no history tab, no share button. DataIntegration regression re-run green: **17/17** (`credentials` 6 + `verification` + `data-integration` + `share` 3). FR-51 transport → PASS_WITH_BROWSER_EVIDENCE (business-schema conformance remains **P2-1**).

| Field | Detail |
|---|---|
| **Requirement ID** | FR-51 (share + record history); depends on **P0-2** for the auth path. |
| **Business impact** | The "Chia sẻ dữ liệu" action and the call-history view are the visible proof that liên thông works. Today `data-integration-verification.spec.ts` covers endpoint CRUD + permission denial but **never triggers a share** and never asserts a history row — so the core outbound requirement has no browser evidence. |
| **Current implementation status** | **Implemented, not evidenced.** Engine + FE modal exist; no test exercises them. No seeded partner endpoint exists to target. |
| **Missing part** | (1) A dev-seeded `ApiEndpoint` pointing at a local echo/mock receiver. (2) A Playwright flow: open `/data-integration` → "Chia sẻ dữ liệu" → pick endpoint + `DataType` → submit → assert success toast → switch to history tab → assert new Outbound row → reload → row persists. (3) Permission-denial assertion (noperm/district sees no button; direct API → 403). |
| **Recommended approach** | Add the mock receiver as a tiny compose service (or an in-test route on a non-FoodSafe port — **not** `page.route`). Seed one endpoint in the E2E seed contributor. Extend `data-integration-verification.spec.ts` with the share + history flow and the negative case. |
| **Backend changes** | E2E seed: one `ApiEndpoint` row (AuthType per P0-2). Optional tiny mock-receiver service in compose. |
| **Frontend changes** | None. |
| **Database changes** | Seed row only (no schema change beyond P0-2's migration). |
| **Test cases required** | Real stack: share submit → toast; history tab shows the row (correct `DataType`, non-empty request body, endpoint URL, timestamp); mock receiver actually received the POST; reload persists; Inactive endpoint → Vietnamese error; no-permission user blocked in UI and at API. |
| **Estimated complexity** | **Medium** (seed + mock receiver + flow). |
| **Verification criteria** | Executed browser evidence of one end-to-end authenticated share landing in history and at the receiver, recorded against a fixed commit. Marks FR-51 transport VERIFIED (business-schema conformance remains **P2-1**). |

### P1-4 — CAPTCHA real-enforcement verification (SEC-08)

> **✅ DONE — PASS_WITH_BROWSER_EVIDENCE (commit `ee00412`, 2026-07-28).** The "dev bypass" is Cloudflare Turnstile **test keys** (always-pass secret), not a bypass token — so `LoginCaptchaMiddleware` runs and is fully observable on the dev stack. `e2e/login-captcha-enforcement.spec.ts` **6/6** (real HTTP, no interception): missing token → **400 `FoodSafe:Captcha:0001`**; malformed body → 400 (SEC-M-01); valid token + valid creds → 200 `result:1`; valid token + bad creds → 200 `result:2` (gate passes, auth independent); password-reset also gated; `/login` serves turnstile config + mounts the widget. **Residual (staging only):** a real *failing* Turnstile challenge + production action/hostname pinning + test-keys-forbidden (`CaptchaConfiguration.Validate`, Host tests) need an environment with real keys — a config exercise, not a code gap.

| Field | Detail |
|---|---|
| **Requirement ID** | SEC-08 (CLAUDE.md §5 "CAPTCHA trên trang đăng nhập"). |
| **Business impact** | Login CAPTCHA is a mandated control. In dev it is **bypassed by design** via the dummy token `"XXXX.DUMMY.TOKEN.XXXX"`; the audit never saw a real Turnstile challenge fail. If the production toggle/keys are misconfigured, login is unprotected against automated abuse. |
| **Current implementation status** | **Implemented, unverified in enforcing mode.** Verification is a config/staging exercise, not a code build — but it **blocks security acceptance**, so it is in scope (not excluded infra). |
| **Missing part** | An executed check on a CAPTCHA-**enabled** environment that (a) a missing/invalid Turnstile token → login rejected, (b) a valid token → login succeeds. |
| **Recommended approach** | On staging with real Turnstile keys and the dev-bypass **off**: negative probe (POST `/api/account/login` with an invalid captcha token → rejected) + positive manual browser login. Confirm the enable flag and site/secret keys are wired from config, not hardcoded. |
| **Backend changes** | None expected (verify config wiring only). |
| **Frontend changes** | None expected (verify the widget renders when enabled). |
| **Database changes** | None. |
| **Test cases required** | (1) invalid/absent captcha token → login 4xx. (2) valid token → 200. (3) dev-bypass token is rejected when bypass is off. |
| **Estimated complexity** | **Low** (config + probe) — but requires a CAPTCHA-enabled environment. |
| **Verification criteria** | Executed evidence of a rejected login on invalid captcha and a successful one on valid captcha in enforcing mode. |

### P1-5 — Deterministic acceptance suite (flakiness fix)

| Field | Detail |
|---|---|
| **Requirement ID** | Testing-policy / doc 75 §7.2 condition 1; doc 72 quality findings. |
| **Business impact** | The full Playwright run passed 229/235 then 234/235, with **every** failure being a **UI-click timeout under host load** (never a wrong result) — the failing set even moved between runs. A non-deterministic acceptance suite cannot gate UAT: green/red is contention-dependent, so evidence is untrustworthy. |
| **Current implementation status** | Suite runs single-worker with ClamAV + shared host; heavy lifecycle specs intermittently time out at a selector. The 4 E7 selector patches (add `page.keyboard.type` before the business-option click) are already applied. |
| **Missing part** | Structural determinism: adequate per-test timeouts, a less-contended/dedicated runner or sharding, and robust selectors for the heavy lifecycle specs. |
| **Recommended approach** | Raise per-test timeouts on lifecycle specs; run acceptance on a dedicated/less-loaded host or shard the run; audit the flakiest specs (doc 72) for brittle text selectors and replace with role/testid waits. Re-run the full suite twice back-to-back and require **identical green**. |
| **Backend changes** | None. |
| **Frontend changes** | Playwright config (timeouts/sharding) + selector hardening in the heavy lifecycle specs. |
| **Database changes** | None. |
| **Test cases required** | Two consecutive full-suite runs on the target host → both fully green, same result set. |
| **Estimated complexity** | **Medium** (config + selector hardening + host provisioning). |
| **Verification criteria** | Two consecutive deterministic green full runs recorded; no timeout-class failures. |

### P1-6 — Verification registry reconciled to HEAD

| Field | Detail |
|---|---|
| **Requirement ID** | Testing-policy "Git-aware verification"; doc 75 §6.1. |
| **Business impact** | Recorded "verified commits" span `94f1f57..86b793a` while HEAD is `fe3dbd2` (~39k lines added since) with **no DIRTY markings**. Every registry `VERIFIED` is verified-at-an-older-commit. Sign-off based on it would over-state readiness. |
| **Current implementation status** | Registry stale; doc 68 "53 NOT_IMPLEMENTED" also out of date; 108 Vitest tests must not be counted as acceptance. |
| **Missing part** | Run `git diff --name-only <verified-commit>..HEAD` per feature against docs/testing/02-impact-map.md; mark affected features `DIRTY`; re-verify (via P1-1) and stamp the HEAD commit; or state plainly that registry SHAs are historical. |
| **Recommended approach** | Do this **as the bookkeeping half of each P1-1 batch** so re-verification and registry update happen together, not as a separate late pass. |
| **Backend changes** | None. |
| **Frontend changes** | None. |
| **Database changes** | None. |
| **Test cases required** | N/A (documentation reconciliation, validated by P1-1 evidence). |
| **Estimated complexity** | **Low–Medium** (bookkeeping, folded into P1-1). |
| **Verification criteria** | Registry + docs/testing/73 reflect HEAD; every `VERIFIED` cites a browser run at `fe3dbd2` (or successor); Vitest excluded from coverage counts. |

---

## 4. P2 — Required before production hardening

### P2-1 — TT 31/2026 conformant outbound business payload (INT-02) — **BLOCKED-EXTERNAL**

| Field | Detail |
|---|---|
| **Requirement ID** | FR-51…57 business-schema; INT-02 (Thông tư 31/2026/TT-BCT + NĐ 37/2026). |
| **Business impact** | The current outbound payload is a **generic envelope** (`{dataType, entityId, note, organizationId, sharedAt, source}`) — it carries no actual business record. A real partner expects TT31-structured, field-mapped, possibly signed data per type; the envelope would be rejected. Full liên thông is not delivered until this lands. |
| **Current implementation status** | Envelope-only; per-type typed payload builders absent. **Explicitly deferred** in code comment pending the external partner specification. |
| **Missing part** | One payload builder per `SharedDataType` that loads the real entity by `EntityId` and serializes it to the TT31 field mapping (+ versioning/signing if required). |
| **Recommended approach** | On receipt of the partner spec: a Strategy per data type (per CLAUDE.md §15.6) behind the existing share engine; validate against the partner schema before send. |
| **Backend changes** | Per-type payload builders + a TT31 protocol adapter layer over P0-2's transport. |
| **Frontend changes** | Likely none (same trigger). |
| **Database changes** | None expected (reads existing entities). |
| **Test cases required** | Per type: payload matches the partner schema; a conformance/contract test against the published spec; receiver accepts. |
| **Estimated complexity** | **High** — and **blocked** until the external TT31 partner contract is available. |
| **Verification criteria** | Each data type serialized to and accepted by the partner (or a spec-conformant validator). **Cannot start without the external spec** — track as blocked, do not count against the buildable backlog. |

### P2-2 — Inbound partner API surface + partner accounts/sessions (INT-03)

| Field | Detail |
|---|---|
| **Requirement ID** | INT-03 (partner accounts / API sessions); FR-50 inbound; the orphaned `ApiCallLog.Direction=Inbound`. |
| **Business impact** | No controller lets a partner **push** data into FoodSafe, and there is no partner registration/credential-issuance/session model. The `Inbound` log direction is dormant. Two-way liên thông is incomplete. |
| **Current implementation status** | Absent (new subsystem). |
| **Missing part** | `PartnerAccount` aggregate + credential issuance AppService; inbound authentication (API-key/session validation) middleware; inbound webhook controller writing `Inbound` `ApiCallLog` rows. |
| **Recommended approach** | New bounded deliverable: partner registration + key issuance (encrypted, reuse P0-2 encryption); inbound auth handler; per-type inbound endpoints validating against the same TT31 mapping (shares P2-1). |
| **Backend changes** | New entity, AppService, migration, inbound controller + auth. |
| **Frontend changes** | Partner-account admin UI (list/create/revoke keys). |
| **Database changes** | **Yes** — `partner_accounts` (+ credentials) table; possibly partner-session table. |
| **Test cases required** | Real HTTP: partner registers → key issued (encrypted at rest); inbound POST with valid key → 200 + persisted + `Inbound` log; invalid/absent key → 401; revoked key → 401. |
| **Estimated complexity** | **High** (new subsystem). |
| **Verification criteria** | Executed evidence of an authenticated inbound push persisting and logging as `Inbound`, with auth failures rejected. |

### P2-3 — MoH connectivity hardening (INT-01)

| Field | Detail |
|---|---|
| **Requirement ID** | INT-01 (Bộ Y tế connectivity). |
| **Business impact** | No health probe, retry, or circuit-breaker on the outbound path; a slow/unavailable partner holds a server thread up to 30 s per call, risking thread-pool starvation under load. |
| **Current implementation status** | Basic `SendAsync` only (static client → `IHttpClientFactory` under P0-2). |
| **Missing part** | Polly timeout/retry/circuit-breaker on the named client; a partner health/ping endpoint; MoH-specific adapter if their protocol differs from generic TT31. |
| **Recommended approach** | Add Polly policies to the P0-2 named client; add a `TestConnection`-style health check (a HEAD probe already exists for FR-50-05 — extend it); MoH adapter folded into P2-1's strategy set. |
| **Backend changes** | Polly policy registration; health endpoint; optional MoH adapter. |
| **Frontend changes** | Optional health/status indicator on the endpoint row. |
| **Database changes** | None. |
| **Test cases required** | Simulated slow/unavailable receiver → circuit opens, no thread pile-up; retry on transient failure; health probe reports up/down. |
| **Estimated complexity** | **Medium** (depends on P0-2). |
| **Verification criteria** | Executed resilience evidence (breaker trips, retries, bounded latency) against a fault-injecting receiver. |

### P2-4 — Real-HTTP backend integration suite (regression guard)

| Field | Detail |
|---|---|
| **Requirement ID** | Testing-policy "Backend API test requirements"; doc 75 §6.2 / §7.2. |
| **Business impact** | **Zero** backend tests send real HTTP — the 519 tests check domain logic + `[Authorize]`/DI presence by reflection. A stray `[AllowAnonymous]` or a dropped scope filter would pass all backend tests. Today runtime authorization is guarded only by the Playwright layer + the auditor's manual probes; there is no durable regression net. |
| **Current implementation status** | Absent (no `WebApplicationFactory` + Testcontainers suite). |
| **Missing part** | A real-HTTP backend suite: `WebApplicationFactory` + Testcontainers PostgreSQL, real pipeline/auth/DI/EF, hitting endpoints over HTTP and asserting status/contract/persistence/authorization/scope. |
| **Recommended approach** | Stand up the harness; port the auditor's security probes (401-everywhere, noperm→403, org IDOR read+write isolation, CSRF-400) into durable tests; add scope + workflow + duplicate-prevention cases per the policy checklist. |
| **Backend changes** | New test project + fixtures; no product code change. |
| **Frontend changes** | None. |
| **Database changes** | Disposable Testcontainers DB per run (real migrations). |
| **Test cases required** | Auth (401), RBAC (403/200), org-scope IDOR read+write, CSRF, workflow transitions, duplicate prevention, persistence-after-separate-request — over real HTTP, no mocks. |
| **Estimated complexity** | **High** (new harness). |
| **Verification criteria** | Suite runs green against a disposable real PostgreSQL and fails when an `[Authorize]`/scope guard is removed (mutation-check the guard). |

### P2-5 — Performance / concurrency NFR reproduction

| Field | Detail |
|---|---|
| **Requirement ID** | NFR (CLAUDE.md §6: avg <10 s, worst <30 s, ≥30 concurrent users, CPU ≤75%). |
| **Business impact** | A k6 result exists in-repo but the auditor did not reproduce it; the concurrency/response NFRs are unproven independently. Under-provisioning risks SLA breaches in production. |
| **Current implementation status** | k6 artifact present; not independently reproduced. |
| **Missing part** | An executed load run at ≥30 concurrent users on a production-like host capturing response-time percentiles + CPU. |
| **Recommended approach** | Re-run the k6 scenario on a representative environment; capture p50/p95/max + server CPU; compare against the NFR thresholds. |
| **Backend changes** | None (tune only if thresholds missed). |
| **Frontend changes** | None. |
| **Database changes** | None (indexing tune only if needed). |
| **Test cases required** | ≥30 VUs on the main flows → avg <10 s, worst <30 s, CPU ≤75%. |
| **Estimated complexity** | **Medium** (needs a production-like host). |
| **Verification criteria** | Executed load report meeting all four NFR thresholds, archived. |

### P2-6 — Database security review (DBS) & credential-at-rest

| Field | Detail |
|---|---|
| **Requirement ID** | DBS-* (Level-2 DB security); ties to P0-2 encryption. |
| **Business impact** | Least-privilege DB roles, backup/at-rest posture, and encryption of partner credentials are Level-2 obligations; unreviewed DB access is a breach risk. |
| **Current implementation status** | Not reviewed; P0-2 introduces the first credential-at-rest requirement. |
| **Missing part** | DB least-privilege review; confirmation that P0-2 credentials are encrypted at rest; backup/restore + at-rest policy check. |
| **Recommended approach** | Review app DB role grants (no superuser at runtime); verify encryption of `credential_value`; document backup/at-rest. |
| **Backend changes** | Possibly tighter DB role/connection config. |
| **Frontend changes** | None. |
| **Database changes** | Role/grant adjustments if over-privileged. |
| **Test cases required** | App role cannot perform DDL/superuser ops; credential column not plaintext; restore drill succeeds. |
| **Estimated complexity** | **Medium**. |
| **Verification criteria** | Documented least-privilege posture + verified credential encryption + a successful restore drill. |

### P2-7 — Secure-cookie / TLS config (SEC-12) — code-config portion only

| Field | Detail |
|---|---|
| **Requirement ID** | SEC-12 (Secure flag / HTTPS-only cookies; CLAUDE.md §5). |
| **Business impact** | Session cookies must carry `Secure` + HttpOnly under HTTPS. Verifiable only on an HTTPS deployment; the **code/config** that sets the flags is in scope here (the certificate/domain itself is infra — §6). |
| **Current implementation status** | Unverified in the HTTP audit environment. |
| **Missing part** | Confirm cookie policy emits `Secure`+`HttpOnly` when served over HTTPS; verify on a TLS-enabled staging. |
| **Recommended approach** | Set/verify cookie `SecurePolicy=Always` + HttpOnly; probe `Set-Cookie` headers on HTTPS staging. |
| **Backend changes** | Cookie policy config if not already `Always`. |
| **Frontend changes** | None. |
| **Database changes** | None. |
| **Test cases required** | Over HTTPS: `Set-Cookie` carries `Secure; HttpOnly`. |
| **Estimated complexity** | **Low** (config) — needs a TLS environment (§6 caveat). |
| **Verification criteria** | Observed `Secure; HttpOnly` on session cookies over HTTPS staging. |

---

## 5. Closed — investigated, no remediation

| ID | Verdict | Basis |
|---|---|---|
| **O-1** ProvinceAdmin holds SystemAdmin.Users/AuditLogs | **INTENDED — CLOSED.** | `docs/05-permission-matrix.md` lines 132–137 explicitly grant these (scoped "trong tỉnh" via server-side `OrganizationId`). Seed matches. Escalation blocked by `IdentityAdministrationRules.EnsureRoleCanBeAssigned` (non-global users cannot assign `SystemAdmin`/`admin`). No misconfiguration. **Verify at UAT:** province.admin loads users/audit-logs (200) but is org-scoped on writes. |

---

## 6. Excluded from prioritization (per request) — infrastructure / deployment

These are **not** prioritized because they are SSL/domain/infra and do **not** block functional
verification of the current stack. Listed so they are tracked, not dropped.

| Item | Reason excluded | Note |
|---|---|---|
| SSL certificate + domain | Pure deployment infra. | Needed for the production go-live, not for functional/UAT verification on the current stack. |
| IPv6 listener (IPV-*) | Server/network config. | CLAUDE.md §5 requirement; a deployment task. Verify on the production host. |
| nginx reverse-proxy / HTTPS termination | Deployment infra. | Enables P2-7's HTTPS check; the cookie-flag **config** is in P2-7, the cert/proxy is infra. |
| General TLS 1.2+ enforcement | Infra/transport. | Verified at deployment; no functional code gap found. |

---

## 7. Priority roll-up & sequencing

| Priority | Items | Nature | Blocks |
|---|---|---|---|
| **P0** | P0-1 password-expiry enforcement; P0-2 data-integration credential storage/injection | Real security/functional builds, buildable now | Production |
| **P1** | P1-1 (~55-feature browser-evidence sweep, 5 batches); P1-2 public-cert anon download evidence; P1-3 data-sharing action evidence; P1-4 CAPTCHA verification; P1-5 suite determinism; P1-6 registry reconcile | Mostly executed-evidence + 2 small verifications | UAT |
| **P2** | P2-1 TT31 payload (**blocked-external**); P2-2 inbound partners; P2-3 MoH hardening; P2-4 real-HTTP backend suite; P2-5 perf NFR; P2-6 DB security; P2-7 Secure-cookie/TLS config | Integration + hardening | Production gate |
| **P3** | Individual lookup-page download buttons (Id in 5 Public DTOs + "Tải tài liệu"); `FileAttachment.MarkPublic()` for real signed PDFs; configurable `EXTERNAL_SYSTEMS`; IPv6 (infra) | UX / secondary paths | — |

**Recommended order:** P0-1 → P1-2 (fast reclassification win) → P0-2 → P1-3 → P1-1 batches (a→e, each with P1-6 bookkeeping) → P1-5 → P1-4 → P2 as environments allow (P2-1 only when the TT31 spec arrives).

**Implementation discipline (every P0/P1 item):** add a **real** (non-mocked, no `page.route`) automated
test → run the affected Playwright flows on the live stack → update docs/testing/73 + the verification
registry → **do not mark complete without executed browser evidence** recorded against the HEAD commit.

---

*Grounded against source at `fe3dbd2` and the live Docker stack (http://127.0.0.1:8080). Corrections in
§1 supersede the corresponding "MISSING"/"non-functional" verdicts in docs/testing/75 §4.*
