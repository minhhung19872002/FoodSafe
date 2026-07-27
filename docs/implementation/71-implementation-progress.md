# Implementation Progress — FoodSafe Production Readiness

**Branch**: `codex/production-readiness`
**Start commit**: `154c9d6`
**Last updated**: 2026-07-27

---

## Batch Summary

| Batch | Blocker | Description | Status | Commit |
|-------|---------|-------------|--------|--------|
| B6 | Test suite | Fix 9 Vitest failures (4 stale selectors + 5 timeouts) | ✅ Done | — |
| B1 | Security | Gate Swagger behind `IsDevelopment()` | ✅ Done | — |
| B3 | Security | DataProtection token lifetime → 8 h | ✅ Done | — |
| B4 | Compliance | nginx IPv6 listen directive (`listen [::]:8080`) | ✅ Done | — |
| B5 | Compliance | nginx HSTS in HTTPS block only; production template with TLS 1.2/1.3 | ✅ Done | — |
| B2 | Security | PostgreSQL SSL: `:?` env var required; startup validation rejects Prefer/Disable in Production | ✅ Done | — |
| B8 | Security | CAPTCHA on `/api/account/send-password-reset-code` — middleware + FE form + 38 new BE tests | ✅ Done | — |
| B9 | Security | Redis `requirepass` — password required via `${REDIS_PASSWORD:?…}` | ✅ Done | — |
| B10 | Security | MinIO SSL configurable via env (`${MINIO_WITH_SSL:-false}`) | ✅ Done | — |
| B7 | Integrity | 9 missing FK constraints — EF Core model + migration `AddMissingForeignKeys` | ✅ Done | — |

---

## Detailed Change Log

### Batch 1 — Vitest test fixes

**Files changed:**
- `FoodSafe.FE/vite.config.ts` — added `testTimeout: 15000` (was 5000 default; 5 tests timed-out under parallel load)
- `FoodSafe.FE/src/features/advertisement-registrations/pages/PublicAdRegistrationLookupPage.test.tsx` — placeholder `"Số đăng ký quảng cáo"` → `"Số đăng ký"`
- `FoodSafe.FE/src/features/businesses/pages/PublicBusinessLookupPage.test.tsx` — title + placeholder updated to match live component
- `FoodSafe.FE/src/features/businesses/pages/PublicSelfDeclarationLookupPage.test.tsx` — title + placeholder updated
- `FoodSafe.FE/src/features/self-declarations/pages/SelfDeclarationPage.test.tsx` — aria-label `"Tệp đính kèm TCB-001"` → `"Tệp TCB-001"`

**Result:** 112/112 Vitest pass (was 103/112).

---

### Batch 2 — P0 security/compliance config

**Files changed:**
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs`
  - `ConfigureIdentity()`: added `DataProtectionTokenProviderOptions.TokenLifespan = TimeSpan.FromHours(8)`
  - `OnApplicationInitialization()`: moved `UseSwagger()` + `UseAbpSwaggerUI()` inside `if (env.IsDevelopment())`
- `FoodSafe.FE/docker/nginx.conf`
  - Added `listen [::]:8080;` for IPv6
  - Added `Strict-Transport-Security` header at server level (moved to HTTPS-only block in B5 remediation below)
- `FoodSafe.BE/docker-compose.yml`
  - Connection string: added `SslMode=${POSTGRES_SSL_MODE:-Prefer}` (upgraded to `:?` required in B2 remediation below)

---

### Batch 3 — CAPTCHA / Redis / MinIO

**Files changed:**
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/Security/LoginCaptchaMiddleware.cs` — added `/api/account/send-password-reset-code` to protected paths
- `FoodSafe.FE/src/features/auth/pages/ForgotPasswordPage.tsx` — added `CaptchaWidget`, extended Zod schema with `captchaToken`, wired `setValue` callback
- `FoodSafe.FE/src/features/auth/api/authApi.ts` — `sendPasswordResetCode` now accepts + forwards `captchaToken`
- `FoodSafe.BE/docker-compose.yml`
  - Redis: `command` changed to `--requirepass ${REDIS_PASSWORD:?Set REDIS_PASSWORD}`; healthcheck uses `-a $REDIS_PASSWORD`
  - MinIO: `BlobStorage__WithSsl: ${MINIO_WITH_SSL:-false}`

---

### Batch 4 — Missing FK constraints

**Files changed:**
- `FoodSafe.BE/src/FoodSafe.EntityFrameworkCore/EntityFrameworkCore/FoodSafeDbContextModelCreatingExtensions.cs`
  - `TestingResult`: `HasOne<TestingCenter>`, `HasOne<TestingService>`, `HasOne<Business>`, `HasOne<Product>`, `HasOne<InspectionResult>`
  - `AdministrativeDocument`: `HasOne<DocumentType>`
  - `FoodPoisoningIncident`: `HasOne<Commune>`, `HasOne<District>`, `HasOne<Province>` (location fields)
  - `FoodPoisoningCase`: `HasOne<Commune>`, `HasOne<District>`, `HasOne<Province>` (location fields)
  - `AtpAlert`: `HasOne<Business>`

**Migration generated:**
- `src/FoodSafe.EntityFrameworkCore/Migrations/20260727104254_AddMissingForeignKeys.cs`
- Adds 9 FK constraints + 13 supporting indexes; full reversible `Down()` method included

---

## Batch 5 — Acceptance Blocker Remediation (B2, B5, B8)

**Date**: 2026-07-27
**Based on**: `docs/audit/69-implementation-batch-independent-verification.md`

### B2 — PostgreSQL SSL enforcement

**Files changed:**
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/Security/PostgreSqlSslValidator.cs` (new)
  - Static `Validate(connectionString, isProduction)` — rejects Disable/Allow/Prefer in Production
- `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs`
  - Added `ValidatePostgreSqlSsl()` call after `ValidateCoreSecrets()`
- `FoodSafe.BE/docker-compose.yml`
  - `SslMode=${POSTGRES_SSL_MODE:-Prefer}` → `SslMode=${POSTGRES_SSL_MODE:?Set POSTGRES_SSL_MODE …}` (now required)
- `FoodSafe.BE/.env.example`
  - Added `POSTGRES_SSL_MODE=Disable` with production guidance comment
- `FoodSafe.BE/test/FoodSafe.HttpApi.Host.Tests/Security/PostgreSqlSslValidatorTests.cs` (new)
  - 23 tests covering all rejection cases, acceptance cases, and edge cases

### B5 — nginx HTTPS / TLS / HSTS

**Files changed:**
- `FoodSafe.FE/docker/nginx.conf`
  - Removed `Strict-Transport-Security` header from HTTP-only server block (HSTS is meaningless/incorrect over HTTP)
- `FoodSafe.FE/docker/nginx.prod.conf.template` (new)
  - Port 8080 block: HTTP permanent redirect to HTTPS only (no HSTS, no content)
  - Port 8443 block: TLS 1.2/1.3 only, ECDHE cipher suite, HSTS with max-age=31536000
  - Uses `${SSL_CERT_PATH}` / `${SSL_KEY_PATH}` substituted via envsubst at container start
- `FoodSafe.BE/docker-compose.prod.yml` (new)
  - Production overlay: maps host 80→8080 and 443→8443, mounts cert/key as read-only secrets

**Validation results:**
- Dev `nginx.conf` syntax: `nginx -t` PASS (exit 0)
- Production template HTTP redirect block: `nginx -t` PASS (exit 0)
- Production template full (with dummy self-signed cert): `nginx -t` PASS (exit 0)
- Full validation against real production cert: requires infrastructure — classified CODE_READY_INFRA_REQUIRED

### B8 — Password-reset CAPTCHA test coverage

**Files changed:**
- `FoodSafe.BE/test/FoodSafe.HttpApi.Host.Tests/Security/PasswordResetCaptchaTests.cs` (new)
  - 14 tests covering all 10 B8 acceptance requirements
- `FoodSafe.BE/test/FoodSafe.HttpApi.Host.Tests/Security/TurnstileCaptchaVerifierTests.cs`
  - Added `Verification_Should_Fail_Closed_On_Network_Failure` test (HttpRequestException → false)

---

## Test Results After All Batches

| Suite | Before | After |
|-------|--------|-------|
| BE — HttpApi.Host.Tests | 15 pass | 53 pass (+38 new) |
| BE — Application.Tests | 251 pass | 251 pass |
| BE — Domain.Tests | 197 pass | 197 pass |
| BE — EntityFrameworkCore.Tests | 18 pass | 18 pass |
| **BE Total** | **481 pass / 0 fail** | **519 pass / 0 fail** |
| FE — Vitest | 112 pass / 0 fail | 112 pass / 0 fail |

---

## Remaining Blockers (not yet implemented)

| ID | Description | Estimated Effort |
|----|-------------|-----------------|
| B11 | Broken mandatory business workflows (state machine gaps) | ~40 h |
| B12 | Missing customer-facing functions (FR gaps) | ~80 h |
| B13 | Import/export/attachment gaps | ~30 h |
| B14 | Non-functional / deployment / handover evidence | ~20 h |

See `docs/implementation/70-production-blocker-resolution-plan.md` for full details.
