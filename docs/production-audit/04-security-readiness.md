# Phase 4 — Security Readiness Audit

**System:** FoodSafe — Chi cục An toàn vệ sinh thực phẩm tỉnh Quảng Ninh  
**Audited commit:** `fe3dbd2` (HEAD at audit time)  
**Audit date:** 2026-07-27  
**Classification:** ATTT Cấp độ 2 (Nghị định 85/2016/NĐ-CP)  
**Scope:** Authorized defensive review of own codebase before production deployment

---

## 1. Methodology

All findings are verified against source code at HEAD `fe3dbd2`. No speculative results are reported. Each finding cites exact file and line numbers.

**Artefacts inspected:**

| Area | Files / Commands |
|---|---|
| Authentication config | `FoodSafeHttpApiHostModule.cs`, `AccountSecurityAppService.cs`, `AppUserProfile.cs` |
| Authorization | All `AppService` and `Controller` files (grep for `[Authorize]`, `[AllowAnonymous]`) |
| Application security | Grep for `dangerouslySetInnerHTML`, `FromSqlRaw`, SSRF patterns, `innerHTML` |
| Infrastructure | `docker-compose.yml`, `docker-compose.prod.yml`, `nginx.conf`, `nginx.prod.conf.template`, `Dockerfile` |
| Secrets | `appsettings.json`, git history scan, `ci.yml` |
| Dependencies | `npm audit --omit=dev` on `FoodSafe.FE` |
| New post-audit features | `DataSharingAppService.cs`, `ApiEndpointAppService.cs`, `SystemSettingsAppService.cs`, `DashboardAppService.cs`, `ReportStatisticsAppService.cs`, `StatisticsAppService.cs`, `InspectionAttachmentAppServices.cs` |

---

## 2. Findings Table

| ID | Severity | Area | Description | Evidence | Fix Required |
|---|---|---|---|---|---|
| SEC-H-01 | HIGH | Authorization / SSRF | SSRF via unvalidated data-integration endpoint URLs | See §3.1 | YES |
| SEC-H-02 | HIGH | Dependencies | react-router-dom CSRF bypass CVE (GHSA-qwww-vcr4-c8h2) | See §3.2 | YES |
| SEC-M-01 | MEDIUM | Authentication | CAPTCHA bypass via malformed JSON body | See §3.3 | YES |
| SEC-M-02 | MEDIUM | Secrets | Git history contains committed dev credentials | See §3.4 | YES |
| SEC-M-03 | MEDIUM | Authentication | Password expiry enforced client-side only; backend APIs remain accessible | See §3.5 | YES |
| SEC-M-04 | MEDIUM | Application | SVG allowed in branding uploads without script sanitization | See §3.6 | YES |
| SEC-M-05 | MEDIUM | Authorization | Hangfire dashboard reachable via SSRF (chains with SEC-H-01) | See §3.7 | YES |
| SEC-L-01 | LOW | Secrets | CI ephemeral database password committed in `ci.yml` | See §3.8 | RECOMMENDED |
| SEC-L-02 | LOW | Infrastructure | No startup validation that `RequireHttpsMetadata=true` in production | See §3.9 | RECOMMENDED |
| SEC-L-03 | LOW | Authorization | Dashboard/statistics services use only `[Authorize]` without granular permission | See §3.10 | RECOMMENDED |

---

## 3. Finding Details

### 3.1 — SEC-H-01: SSRF via unvalidated data-integration endpoint URLs (HIGH)

**Files:**
- `FoodSafe.BE/src/FoodSafe.Domain/DataIntegration/ApiEndpoint.cs:19-46` — `Create()` factory
- `FoodSafe.BE/src/FoodSafe.Application/DataIntegration/ApiEndpointAppService.cs:69-89` — `CreateAsync()`
- `FoodSafe.BE/src/FoodSafe.Application/DataIntegration/ApiEndpointAppService.cs:137-194` — `TestConnectionAsync()`
- `FoodSafe.BE/src/FoodSafe.Application/DataIntegration/DataSharingAppService.cs:84-90` — `ShareAsync()`

**Description:**  
`ApiEndpoint.Create()` accepts a user-supplied `url` string with no validation of URI scheme or network address range. Any user holding the `DataIntegration.ApiEndpoints.Create` permission can register an endpoint whose URL points to internal Docker-network services (e.g., `http://postgres:5432`, `http://redis:6379`, `http://minio:9000`, `http://api:8080/hangfire`).

Two execution paths then perform server-side HTTP requests to the stored URL:

1. `TestConnectionAsync()` — issues an HTTP HEAD request via `ProbeClient` (no network restrictions)
2. `DataSharingAppService.ShareAsync()` — issues a full HTTP POST via `SharedClient`

Both clients are plain `HttpClient` instances with no `SocketsHttpHandler` configured to block private-IP destinations.

**Attack scenario:**  
Admin or high-privilege user creates an endpoint with `url = "http://redis:6379"`, calls `TestConnection`. The server opens a TCP connection to the Redis container and may leak timing/error information about internal services. A more dangerous variant targets the MinIO management API or PostgreSQL to leak configuration metadata.

**Evidence:**
```csharp
// ApiEndpoint.cs:29-44 — no URL format/scheme validation
Check.NotNullOrWhiteSpace(url, nameof(url));   // only non-empty check
return new ApiEndpoint { ... Url = url ... };

// ApiEndpointAppService.cs:147-154 — unconstrained HttpClient
using var request = new HttpRequestMessage(HttpMethod.Head, endpoint.Url);
using var response = await ProbeClient.SendAsync(request, ...);
```

**Fix:**
1. Add URL validation in `ApiEndpoint.Create()` and `Update()`: parse the URL, reject non-HTTPS schemes in production, and block private-IP ranges (RFC 1918: `10.x`, `172.16–31.x`, `192.168.x`, loopback `127.x`/`::1`, link-local `169.254.x`).
2. Configure `SocketsHttpHandler` on `SharedClient` and `ProbeClient` with `ConnectCallback` to DNS-resolve the hostname and reject private IP addresses after resolution (to prevent DNS rebinding).

---

### 3.2 — SEC-H-02: react-router-dom CSRF bypass (HIGH)

**File:** `FoodSafe.FE/package.json` — `react-router-dom` at version `^7.12.x`

**Description:**  
`npm audit --omit=dev` reports GHSA-qwww-vcr4-c8h2: *React Router RSC Mode CSRF Bypass allows action execution before a 400 response*. Severity: HIGH.

**Actual impact assessment:** This application is a Vite SPA (not an RSC server). The vulnerability affects React Server Components mode, which is not used here. Practical exploitability is therefore **low**, but the package should be updated to eliminate the finding from automated scanners and CI gates.

```
# npm audit output (abbreviated)
react-router  7.12.0 - 8.2.0
Severity: high
RSC Mode CSRF Bypass Allows Action Execution Before 400 Response
fix available via `npm audit fix --force`
Will install react-router-dom@7.11.0
```

**Fix:** Pin `react-router-dom` to `7.11.0` (or whichever non-RSC version resolves the advisory). Verify routing still works after downgrade.

---

### 3.3 — SEC-M-01: CAPTCHA bypass via malformed JSON body (MEDIUM)

**File:** `FoodSafe.BE/src/FoodSafe.HttpApi.Host/Security/LoginCaptchaMiddleware.cs:59-63`

**Description:**  
The `LoginCaptchaMiddleware` reads the request body, parses it as JSON to extract the `captchaToken` field, then verifies the token. The parse step is inside a `try/catch (JsonException)` block. When JSON parsing fails, the middleware calls `await next(context)` and bypasses CAPTCHA entirely.

```csharp
catch (JsonException)
{
    await next(context);  // CAPTCHA skipped for non-JSON requests
    return;
}
```

**Affected endpoints:** `/api/account/login`, `/api/account/send-password-reset-code`, `/api/v1/app/account-security/complete-initial-password-change`, `/api/v1/public/alert-reports`, `/api/v1/public/news-reports`.

**Practical impact:** An attacker sends a non-JSON (or invalid-JSON) body. CAPTCHA check is skipped. The controller model-binding then fails with HTTP 400 for most endpoints. For the `send-password-reset-code` endpoint, however, the request goes through to the ABP account controller which has its own input parsing; depending on ABP's content negotiation, it may still process the request (returning 400 for invalid input), confirming that CAPTCHA was not required. This weakens the brute-force protection on the password-reset code endpoint (which could be used for user enumeration probing with no CAPTCHA friction).

**Fix:** Change the `catch` block to reject the request with HTTP 400 instead of calling `next()`:

```csharp
catch (JsonException)
{
    context.Response.StatusCode = StatusCodes.Status400BadRequest;
    return;
}
```

---

### 3.4 — SEC-M-02: Git history contains committed dev credentials (MEDIUM)

**Evidence:**  
```
git log --all -p -- appsettings.json (before commit 06656c8):
+    "Default": "Host=localhost;Port=5433;Database=FoodSafe;Username=postgres;Password=postgres"
```

Credentials were committed in `appsettings.json` at commit `abe2e17` and removed at `06656c8`. They remain permanently visible in git history.

**Risk:** If any production or staging database uses `postgres` as the password for the `postgres` user (a common default), those credentials are now public. CI runners and any developer who cloned the repository before the cleanup has cached copies.

**Fix:**
1. Confirm that no production or staging PostgreSQL instance uses `postgres:postgres` credentials.
2. If the repository is on GitHub or another remote, consider using `git filter-repo` to rewrite history and force-push, or accept the credentials as permanently exposed and ensure they are never reused.
3. The commit message for `06656c8` confirms awareness; the rotation status must be verified and documented.

---

### 3.5 — SEC-M-03: Password expiry enforced client-side only (MEDIUM)

**Files:**
- `FoodSafe.FE/src/app/PrivateRoute.tsx:50` — FE redirect on `passwordMustChange`
- `FoodSafe.FE/src/features/auth/api/authMutations.ts:52` — FE redirect after login
- `FoodSafe.BE/src/FoodSafe.Application/Security/AccountSecurityAppService.cs:18` — 90-day validity constant

**Description:**  
The 90-day password expiry and `MustChangePassword` flags are checked by the frontend via `CurrentUserContextAppService.GetAsync()`. The frontend enforces a redirect to the password-change page. However, no backend middleware or filter blocks API calls from users whose passwords are expired or who have `MustChangePassword == true`. A user or automated client can bypass the frontend and continue calling all `[Authorize]`-protected endpoints with an expired-password session.

**ATTT level-2 requirement:** Server-side enforcement is required ("Password policy bắt buộc" as a server control, not a display hint).

**Fix:** Add an ASP.NET Core middleware or authorization policy that calls `ICurrentDataScopeProvider` / `AppUserProfile.IsPasswordExpired()` and returns HTTP 403 with an error code `FoodSafe:Account:PasswordExpired` for non-password-change API endpoints. Whitelist the following paths from the check: `/api/account/login`, `/api/account/logout`, `/api/v1/app/account-security/*`, `/api/abp/application-configuration`, `/api/v1/app/current-user-context`.

---

### 3.6 — SEC-M-04: SVG allowed in branding image uploads without script sanitization (MEDIUM)

**File:** `FoodSafe.BE/src/FoodSafe.Application/Settings/SystemSettingsAppService.cs:24-31`

```csharp
private static readonly HashSet<string> AllowedImageContentTypes = new(
    StringComparer.OrdinalIgnoreCase)
{
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/svg+xml"    // ← SVG allowed
};
```

**File (serving):** `FoodSafe.BE/src/FoodSafe.HttpApi/Settings/PublicBrandingController.cs:28,39`

```csharp
return File(image.Content, image.ContentType);   // serves with original Content-Type
```

**Description:**  
An admin with `SystemAdministration.Settings` permission can upload an SVG containing embedded `<script>` elements as the system logo or login-page background. The ClamAV malware scan does not detect XSS payloads. The stored SVG is served via `/api/v1/public/branding/logo` with `Content-Type: image/svg+xml`, which causes browsers to execute embedded JavaScript.

**Affected surface:** `/api/v1/public/branding/logo` and `/api/v1/public/branding/login-background` — public, unauthenticated endpoints. A login-page SVG with embedded script executes for every unauthenticated visitor.

**Threat model note:** This requires a malicious or compromised admin account, which is a privileged access vector.

**Fix (preferred):** Remove `image/svg+xml` from `AllowedImageContentTypes`. Branding images should be raster formats only. Alternatively: strip `<script>`, event handlers, and `javascript:` URIs from uploaded SVGs using a dedicated SVG sanitizer library before storage.

---

### 3.7 — SEC-M-05: Hangfire dashboard reachable via SSRF (MEDIUM, chains with SEC-H-01)

**File:** `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs:731-734`

```csharp
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [new Hangfire.Dashboard.LocalRequestsOnlyAuthorizationFilter()]
});
```

**Description:**  
The Hangfire dashboard is protected only by `LocalRequestsOnlyAuthorizationFilter`, which allows access only from 127.0.0.1. The `/hangfire` path is not exposed via nginx. However, the SSRF vulnerability in SEC-H-01 allows server-side HTTP requests from the API container to `http://api:8080`. Depending on Docker's internal routing (loopback vs container-IP), a request from the container to itself may be classified as local, granting access to the Hangfire dashboard and allowing job manipulation.

If successful, an attacker with `DataIntegration.ApiEndpoints.Create` permission who also controls the SSRF (SEC-H-01) could:
- View all background job queues and history (information disclosure)
- Potentially trigger or enqueue jobs (job injection)

**Fix:** In addition to fixing SEC-H-01 (which eliminates the primary attack vector), add role-based authorization to the Hangfire dashboard as a defense-in-depth measure:

```csharp
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = [
        new LocalRequestsOnlyAuthorizationFilter(),
        new HangfireAdminAuthorizationFilter()  // require SystemAdministration permission
    ]
});
```

---

### 3.8 — SEC-L-01: CI ephemeral database password committed in `ci.yml` (LOW)

**File:** `.github/workflows/ci.yml:122-133`

```yaml
POSTGRES_PASSWORD: ci-database-only
ConnectionStrings__Default: Host=127.0.0.1;...;Password=ci-database-only
```

**Description:**  
The CI PostgreSQL service uses a hardcoded password committed in plain text. This is a GitHub Actions ephemeral database destroyed after each CI run. The password has no access to any real infrastructure.

**Risk:** Low. Violates the principle of never committing credentials but poses no actual production risk.

**Fix:** Move to a GitHub Actions secret (`${{ secrets.CI_DB_PASSWORD }}`). This removes the credential from repository history for future commits.

---

### 3.9 — SEC-L-02: No startup validation that `RequireHttpsMetadata=true` in production (LOW)

**Files:**
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/appsettings.json:13` — default `"false"`
- `FoodSafe.BE/docker-compose.yml:12` — `${REQUIRE_HTTPS_METADATA:?Set REQUIRE_HTTPS_METADATA}` (operator must supply)
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs:97-347` — `ValidateCoreSecrets` does not check this value

**Description:**  
The application's startup validators (`ValidateCoreSecrets`, `ValidatePostgreSqlSsl`, `ValidateEmailDelivery`) fail-fast when critical security settings are misconfigured in production. However, `AuthServer:RequireHttpsMetadata` is not validated. An operator could set `REQUIRE_HTTPS_METADATA=false` in production and the application would start without HTTPS metadata validation, weakening OpenIddict token security.

**Fix:** Add a production check in `ConfigureServices` or `ValidateCoreSecrets`:

```csharp
if (hostingEnvironment.IsProduction())
{
    var requireHttps = configuration.GetValue<bool>("AuthServer:RequireHttpsMetadata");
    if (!requireHttps)
        throw new InvalidOperationException(
            "AuthServer:RequireHttpsMetadata must be 'true' in Production.");
}
```

---

### 3.10 — SEC-L-03: Dashboard/statistics services missing granular permissions (LOW)

**Files:**
- `FoodSafe.BE/src/FoodSafe.Application/Dashboard/DashboardAppService.cs:19` — `[Authorize]`
- `FoodSafe.BE/src/FoodSafe.Application/Dashboard/StatisticsAppService.cs:17` — `[Authorize]`
- `FoodSafe.BE/src/FoodSafe.Application/Dashboard/ReportStatisticsAppService.cs:17` — `[Authorize]`
- `FoodSafe.BE/src/FoodSafe.Application/Dashboard/StatisticsExcelAppService.cs:11` — `[Authorize]`

**Description:**  
All dashboard and statistics services require only `[Authorize]` (any authenticated user). Any user who can log in can view aggregated statistics and export Excel reports for all data categories, even without specific feature permissions. Data IS filtered by organization scope.

**Risk:** Low. No data from another organization is exposed. A user without `BusinessManagement.Businesses.View` permission could still view business counts in the dashboard. This contradicts the principle of least privilege but is unlikely to be exploitable for data exfiltration given org-scoping.

**Fix (recommended):** Add a specific dashboard permission (e.g., `Dashboard.View`) and require it on dashboard services. Alternatively, document the intentional design decision that the dashboard is accessible to all authenticated users.

---

## 4. Production Blockers

The following findings must be resolved before production deployment:

| ID | Severity | Blocker Reason |
|---|---|---|
| **SEC-H-01** | HIGH | SSRF allows server-side HTTP requests to internal services; could expose Redis, MinIO, PostgreSQL, Hangfire |
| **SEC-H-02** | HIGH | CVE active in npm audit; CI pipeline may block deployment once advisory scanner runs |
| **SEC-M-01** | MEDIUM | CAPTCHA bypass weakens brute-force protection on login and password-reset endpoints; violates ATTT level-2 |
| **SEC-M-03** | MEDIUM | Password expiry not enforced server-side; API remains fully accessible with expired passwords; violates ATTT level-2 password policy |
| **SEC-M-04** | MEDIUM | SVG upload can embed stored XSS on login page; served to all unauthenticated users |

The remaining findings (SEC-M-02, SEC-M-05, SEC-L-01, SEC-L-02, SEC-L-03) are recommended fixes that do not block deployment but should be addressed in the first post-launch hardening sprint.

---

## 5. ATTT Level-2 Requirement Pass/Fail

| Requirement | Status | Notes |
|---|---|---|
| Password min 8 chars + complexity | PASS | Enforced in `ConfigureIdentity`: `RequiredLength=8`, `RequireDigit`, `RequireLowercase`, `RequireUppercase`, `RequireNonAlphanumeric` — `FoodSafeHttpApiHostModule.cs:458-463` |
| Password 90-day expiry | PARTIAL — BLOCKER | 90-day validity coded (`AccountSecurityAppService.cs:18`), `RecordPasswordChanged` updates expiry. However, server-side enforcement of the expiry on API requests is missing (SEC-M-03) |
| Session timeout | PASS | `ExpireTimeSpan = 30 min`, `SlidingExpiration = true` — `FoodSafeHttpApiHostModule.cs:487-489` |
| HttpOnly cookies | PASS | `options.Cookie.HttpOnly = true` — `FoodSafeHttpApiHostModule.cs:485` |
| Secure cookie flag | PASS | `CookieSecurePolicy.Always` in production — `FoodSafeHttpApiHostModule.cs:488-490` |
| CSRF protection | PASS | ABP anti-forgery enabled; `AutoValidate = true`, `SameSite.Strict`, `SecurePolicy.Always` in prod — `FoodSafeHttpApiHostModule.cs:439-446` |
| Server-side input validation | PASS | Validates at domain/application layer; DTOs use ABP `Check` guards |
| Audit logging | PASS | `app.UseAuditing()` enabled — `FoodSafeHttpApiHostModule.cs:729` |
| Hashed + salted passwords | PASS | ASP.NET Core Identity default: PBKDF2 with random salt |
| XSS output encoding | PASS | React JSX auto-escapes; `dangerouslySetInnerHTML={undefined}` in `PublicNewsPage.tsx:99`; `contentRef.current.innerHTML` in `ReportDocumentViewModal.tsx:63` operates on React-rendered (already-escaped) DOM. Exception: SVG branding upload (SEC-M-04) |
| CAPTCHA on login | PARTIAL — BLOCKER | Turnstile CAPTCHA implemented but bypassable via malformed JSON (SEC-M-01) |
| HTTPS / TLS 1.2+ | PASS | Production nginx template enforces `TLSv1.2 TLSv1.3` — `nginx.prod.conf.template:91`; HSTS `max-age=31536000; includeSubDomains` — line 148; startup `UseHsts()` and `UseHttpsRedirection()` in non-dev — `FoodSafeHttpApiHostModule.cs:682-685`. Minor gap: `RequireHttpsMetadata` not startup-validated (SEC-L-02) |
| IPv6 | PASS | nginx config listens on `[::]:8080` and `[::]:8443` — `nginx.prod.conf.template:60-61,81-82` |
| Account lockout | PASS | `MaxFailedAccessAttempts=5`, `DefaultLockoutTimeSpan=30min` — `FoodSafeHttpApiHostModule.cs:454-456` |
| Password history | PASS | Last N passwords retained in `PasswordHistory` table; reuse prevented by `EnsurePasswordIsNotReused` — `AccountSecurityAppService.cs:196-211` |
| No raw SQL | PASS | No `FromSqlRaw`/`ExecuteSqlRaw` found in source |
| No localStorage token storage | PASS | Auth uses `withCredentials: true` + HTTP-Only cookies; Zustand store holds only user profile info (not tokens) — `axios.ts:4-6`, `authStore.ts` |
| No open redirects | PASS | Redirect URLs validated via `RedirectAllowedUrls` in ABP `AppUrlOptions` |
| File upload security | PASS (with exception) | Extension + MIME + magic-byte validation + ClamAV scan for document attachments (`DocumentAttachmentStore.cs:164-216`). Exception: branding SVG not sanitized (SEC-M-04) |
| No committed production secrets | PASS (current HEAD) | `appsettings.json` blanked; secrets in gitignored `appsettings.secrets.json`; fail-fast at startup when missing |
| Information leakage (stack traces) | PASS | `UseDeveloperExceptionPage()` only in development (`FoodSafeHttpApiHostModule.cs:700-703`); production uses `ProblemDetails` |
| Rate limiting | PASS | Per-endpoint fixed-window rate limiting: login 10/5min, password-reset 5/15min, public API 60/min in production |

---

## 6. Non-Findings (Verified Secure)

The following areas were explicitly checked and found to be properly implemented:

- **Raw SQL injection:** No `FromSqlRaw`, `ExecuteSqlRaw`, or string-concatenated SQL in application code. All queries use EF Core LINQ.
- **IDOR on file downloads:** `DocumentAttachmentStore.GetOwnedAsync()` (line 247) enforces `DocumentOwnerId == ownerId` in all download paths. Attachment lookup always validates parent ownership.
- **Password reset token enumeration:** ABP's built-in `send-password-reset-code` returns a uniform success response regardless of whether the email exists. The `ResetPasswordAsync` takes `UserId` from the reset token URL (URL-encoded by ABP), not from user input directly.
- **Organization scope on all modules:** `ICurrentDataScopeProvider.GetAsync()` is called in all inspected modules: BusinessManagement, Inspection, FoodPoisoning, Reporting, AlertsAndTesting, DataIntegration, Dashboard.
- **Admin self-registration:** Self-registration is disabled: `"Abp.Account.IsSelfRegistrationEnabled": "false"` in `appsettings.json:17`.
- **Dependency injection security:** ClamAV is required (throws `ScannerUnavailable` if unconfigured), not optional or skippable.
- **Docker container users:** API container uses `$APP_UID` (non-root) — `Dockerfile:34`. Frontend uses `nginx` user — `FoodSafe.FE/Dockerfile:12`. PostgreSQL and Redis use their default non-root users.
- **Infrastructure port exposure:** PostgreSQL and Redis ports bound to `127.0.0.1` (default) in `docker-compose.yml:34,56`. MinIO console also localhost-only.
- **nginx security headers (production):** CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, HSTS, Referrer-Policy, Permissions-Policy all present in `nginx.prod.conf.template:148-153`.
- **HSTS implementation:** Correctly present only in the HTTPS server block of `nginx.prod.conf.template`, not in the HTTP redirect server block.
- **SVG/XSS in public news content:** `PublicNewsPage.tsx:99` has `dangerouslySetInnerHTML={undefined}` (explicitly not rendering raw HTML); news content rendered via `Typography.Paragraph` which escapes output.
- **OpenIddict token lifetime:** Access token 15 min, refresh token 14 days — `FoodSafeHttpApiHostModule.cs:83-85`. Security stamp validated on every request (`ValidationInterval = TimeSpan.Zero`) — line 475-477.
- **Data Protection keys:** Protected by X.509 certificate in production; requires `CertificatePath` and `CertificatePassword` — `FoodSafeHttpApiHostModule.cs:401-415`.

---

## 7. Remediation Priority

| Priority | Finding | Estimated Effort |
|---|---|---|
| P0 — Must fix before launch | SEC-H-01 (SSRF) | 1 day |
| P0 — Must fix before launch | SEC-M-01 (CAPTCHA bypass) | 2 hours |
| P0 — Must fix before launch | SEC-M-03 (password expiry server-side) | 1 day |
| P0 — Must fix before launch | SEC-M-04 (SVG XSS) | 2 hours (remove SVG from allowlist) |
| P1 — Fix before launch or in first patch | SEC-H-02 (react-router-dom CVE) | 1 hour (pin version) |
| P1 — Fix before launch or in first patch | SEC-M-05 (Hangfire SSRF chain) | resolved by SEC-H-01 fix + 2 hours for auth hardening |
| P2 — First hardening sprint | SEC-M-02 (git history credentials) | verify rotation; optional history rewrite |
| P2 — First hardening sprint | SEC-L-02 (RequireHttpsMetadata validation) | 30 min |
| P2 — First hardening sprint | SEC-L-01 (CI DB password) | 1 hour (move to GitHub secret) |
| P3 — Backlog | SEC-L-03 (dashboard granular permissions) | 2 hours |
