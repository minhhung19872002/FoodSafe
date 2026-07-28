# Production Readiness Review — Security Audit

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · Fresh source inspection for this review (file:line cited), cross-checked against the executed adversarial probes of doc 74 and the independent gate (doc 08 §2.7).

## 1. Authentication — STRONG

| Control | Verdict | Evidence |
|---|---|---|
| Login flow | ✅ | Cookie-based ABP/OpenIddict; CAPTCHA enforced server-side by `LoginCaptchaMiddleware` on login + password-reset + citizen-submission POSTs, with malformed-body rejection (`HttpApi.Host/Security/LoginCaptchaMiddleware.cs:12-26`); antiforgery auto-validate, SameSite=Strict, Secure=Always in prod (`FoodSafeHttpApiHostModule.cs:433-442`); middleware order verified (`:706-713`) |
| Session cookie | ✅ | `HttpOnly`, `SameSite=Strict`, prod name `__Host-FoodSafe.Auth` (host-prefix), 30-min sliding expiration (`FoodSafeHttpApiHostModule.cs:478-487`) |
| Password policy | ✅ | ≥8 + digit/lower/upper/special; lockout 5 attempts/30 min (`:450-459`); max-length validator prevents hash-DoS (`:461-463`); password history policy present |
| 90-day expiry | ✅ | **Server-side gate**: `PasswordExpiryMiddleware` blocks every business API for expired/must-change accounts, whitelisting only account-security + logout (`Security/PasswordExpiryMiddleware.cs:17-91`); proven by executed spec incl. "fully-permissioned user still blocked" |
| Logout | ✅ (minor note) | ABP identity sessions persisted (`FoodSafeDbContext.cs:41`); server-side revocation observed live during the UI audit (parallel browser with same cookie was signed out). Note: no explicit forced revocation of *other* sessions on password change (ABP default behavior) — acceptable, worth a UAT check |
| Forgot/reset | ✅ | Token-based (8h lifespan), rate-limited 5/15min, CAPTCHA-gated (`:465-467`, `:537-541`) |
| Self-registration | ✅ disabled | Setting off + `/Account/Register` and API 404-blocked by middleware (`:686-693`) |

## 2. Authorization — STRONG core, three findings

- **RBAC:** `[Authorize(permission)]` on every AppService surface (spot-checked across modules); FE mirrors via `PermissionRoute` + single-source `routePermissions.ts`; role-based menu/tab gating verified in the UI audit with real restricted accounts (readonly/no-permission).
- **Org/data scope:** consistent `ICurrentDataScopeProvider` → `ScopedQueryAsync` pattern confirmed in Business, NdtpReport, FoodPoisoningCase, InspectionPlan AppServices; `organization_id` indexed on every primary aggregate. Cross-org read+write denial carries executed HTTP-level probe evidence (doc 74; `*-verification.spec.ts` re-run green in the 286/286 gate).
- **Object-level:** attachment downloads authorized against owner (`DocumentAttachmentStore.cs:247-259` — `AbpAuthorizationException` on mismatch); workflow actions permission-checked per status.

**Findings:**

| ID | Severity | Finding |
|---|---|---|
| SEC-F1 | Medium | **Report verify does not pin the approval chain**: `BaseReport.Verify()` checks status only; `VerifyAsync` uses generic edit-scope. A province-scope verifier can verify a commune report submitted to the district — within granted RBAC but bypassing the intended commune→district→province chain (`NdtpReportAppService.cs:111-118`). Same pattern on inspection-plan approval. Business owner must confirm whether hierarchy-skip verification is acceptable; if not, assert `scope.IncludesOrganization(entity.SubmittedToOrganizationId)` |
| SEC-F2 | Medium | **`ApiSpecs.View` missing from the FE route map** (`routePermissions.ts:48-52` vs `FoodSafePermissions.cs:339`): a user granted only the new spec-management view permission is locked out of `/data-integration` UI (BE unaffected). Re-verified live this review |
| SEC-F3 | Medium (policy) | **Internal PII breadth**: `businesses.representative_id_card`, `business_handlers.id_card_number`, poisoning victim name/phone/address/symptoms are readable by every role holding the module View permission down to CommuneStaff; citizen reporter contact data (on `Source=PublicReport` alerts) likewise. No DTO-level masking tiers. Legal exposure question under Level-2/personal-data rules — needs an explicit customer policy (mask below DistrictAdmin or accept) |

**Refuted by this review** (schema-design concerns that the implementation does not have): public alert DTO leaks reporter PII — **no**: `PublicAlertDto` has no reporter fields (`Public/PublicPortalDtos.cs:64-75`); guessable citizen tracking codes — **not applicable**: no tracking-code lookup surface exists; citizen submission returns only an opaque GUID + message (`CitizenAlertReportAppService.cs:63-67`).

## 3. Input security — STRONG

| Control | Verdict | Evidence |
|---|---|---|
| SQL injection | ✅ | Zero raw SQL in the entire BE (`FromSqlRaw`/`ExecuteSqlRaw`/interpolated: 0 matches); all EF LINQ; sorting via explicit switch allowlists (e.g. `BusinessAppService.cs:86-103`) — no dynamic-LINQ injection surface |
| XSS | ✅ | One `dangerouslySetInnerHTML={undefined}` no-op in the whole FE; user content rendered as text nodes; CSP `default-src 'self'` (below) as backstop |
| File upload | ✅ | Extension allowlist (.pdf/.png/.jpg/.docx/.xlsx) + content-type ↔ extension match + **magic-byte verification** + 20MB cap + **mandatory ClamAV streaming scan** (missing scanner host = startup error) + private MinIO bucket (`DocumentAttachmentStore.cs:31,183-215`; `ClamAvFileMalwareScanner.cs:18-21`) |
| SSRF (outbound integration) | ✅ | Two-layer: syntactic URL validation + `ConnectCallback` DNS-rebinding defense refusing private/loopback/link-local/CGNAT/metadata ranges, redirects off, 2MB response cap (`Application/Security/OutboundUrlValidator.cs:79-210`); locked by regression tests (`0776230`) |
| Rate limiting | ✅ | ASP.NET RateLimiter: login 10/5min, reset 5/15min, citizen POST 5/15min, public 60/min, authenticated 300/min; 429 + Retry-After (`FoodSafeHttpApiHostModule.cs:513-610`) |

## 4. Sensitive data — GOOD with items

| Area | Verdict | Notes |
|---|---|---|
| Password storage | ✅ | ASP.NET Identity PBKDF2; no custom crypto |
| Partner API keys | ✅ | SHA-256 hash + prefix only; raw shown once; fixed-time compare; replay window (`PartnerKeyMaterial.cs:18-40`) |
| Outbound partner credentials | ✅ | Encrypted at rest (P0-2), never in tracked config |
| Error responses | ✅ | Dev exception page gated to Development; ABP detail-hiding default; correlationId only (`:697-699`, `:183-186`) |
| Repo secrets | ⚠️ | Tracked configs clean; startup validators reject known dev defaults in Production (`CoreSecretsValidator.cs:35-74`). **But:** dev DB password + `Admin@2026!` live in git history (purge+rotate before prod — G-20); an untracked `cookies.txt` with a live dev session sits at repo root (delete; `git add .` hazard) |
| Integration call logs | ⚠️ | `data_sharing_histories.request_url/request_payload` stored verbatim — credentials passed in URLs/bodies would be persisted unmasked (R-05). Scrub before persisting |

## 5. Transport & headers — READY, pending deployment proof

- nginx prod: TLS 1.2/1.3 only, HSTS (proto-aware), CSP `default-src 'self'` (+Turnstile script, OSM tiles), `X-Frame-Options: DENY`, nosniff, Referrer-Policy, Permissions-Policy (`FoodSafe.FE/docker/security-headers.conf`); runtime-verified in the production drill. CSP retains `style-src 'unsafe-inline'` (AntD constraint — accepted, documented).
- **Deployment-side residuals (must-do, not code):** real-TLS Secure-cookie confirmation (SEC-12); **staging CAPTCHA probe with real Turnstile keys (I-2)** — and a hard finding from this review: `deploy/docker-compose.cloud.yml` defaults `ASPNETCORE_ENVIRONMENT=Staging` **with the always-pass Turnstile test secret as fallback** (`:141`), `POSTGRES_SSL_MODE=Disable`, `REQUIRE_HTTPS_METADATA=false`, empty DataProtection cert — the Production-only startup validators do not fire on Staging, so an unset-env staging deploy silently ships **no effective CAPTCHA**. Remove the test-key fallback and tighten Staging defaults (SEC-F4, High for the staging path).

## 6. Audit logging — ✅

ABP audit logging enabled (`UseAuditing()`, `AbpAuditLogs`/`AbpEntityChanges` tables), admin read UI + Excel export behind `SystemAdmin.AuditLogs`, verified feature (F-021). Gap: background-job writes are unattributable (nullable `changed_by` in status history) — Low.

## 7. Dependency risks — accepted, tracked

B-6 trio unchanged: AutoMapper 14 DoS advisory (pinned deliberately — the 15.1.3 "fix" was runtime-broken), ABP Account.Web open-redirect, react-router RSC-CSRF — all with documented compensating controls, tracked to ABP 10. CI runs NuGet/NPM audits + Trivy (fs + all 3 images, HIGH/CRITICAL).

## Verdict

**Application-layer security: production-grade** — every CLAUDE.md §5 control is implemented *and carries executed adversarial evidence*, which is rare. The open items are: one policy decision (SEC-F1 verify-chain), one FE wiring fix (SEC-F2), one PII-masking policy (SEC-F3), staging-config hardening + real-key CAPTCHA probe (SEC-F4/I-2), git-history secret purge (G-20), and log-scrubbing for integration credentials (R-05). None is an exploitable internet-facing hole in the intended production configuration; all are cheap relative to the risk they retire.
