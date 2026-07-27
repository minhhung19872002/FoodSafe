# 70 — Production Blocker Resolution Plan

**Created**: 2026-07-27
**Based on**: docs/audit/68-independent-audit-review.md (authoritative),
             docs/audit/65-final-project-completion-audit.md,
             docs/audit/66-prioritized-completion-backlog.md,
             docs/testing/60-full-project-verification-results.md

---

## Reconciliation Summary

| Source | Blocker count | Vitest failures | Missing FKs |
|---|---|---|---|
| doc 65 (final audit) | 7 | 9 | 5 |
| doc 66 (backlog) | 7 | 9 | 5 |
| **doc 68 (independent review)** | **10** | **4** | **9** |
| **This plan (authoritative)** | **10** | **4** | **9** |

**Discrepancies resolved**:
- doc 65/66 overcounted Vitest failures as 9; actually 4 (confirmed: 108/112 pass)
- doc 65/66 undercounted missing FKs as 5; actually 9 categories (confirmed by doc 68)
- doc 65/66 missed 3 new blockers (B8 CAPTCHA on pwd-reset, B9 Redis auth, B10 MinIO SSL)

---

## Definitive Blocker Table

| ID | Requirement IDs | Problem | Severity | FE work | BE work | DB work | Infra work | Tests | Dependencies | Est. effort |
|---|---|---|---|---|---|---|---|---|---|---|
| **B1** | SEC (implicit) | Swagger UI unconditionally enabled; directly accessible on API container bypassing nginx `/swagger/` block | HIGH | None | Gate `UseSwagger()` + `UseAbpSwaggerUI()` behind `env.IsDevelopment()` check | None | None | Build check | None | 5 min |
| **B2** | DBS-09 | PostgreSQL SSL not enforced — no `SslMode` in connection string; traffic unencrypted in production | HIGH | None | Add `SslMode` parameter, driven by `POSTGRES_SSL_MODE` env var (default `Prefer`, `Require` in prod) | None | Production: provision PostgreSQL SSL cert | Config-level test | PostgreSQL SSL cert for prod | 30 min code + ops |
| **B3** | SEC-05 | Password reset token lifetime defaults to 24h (requirement: ≤8h) | MEDIUM | None | Configure `DataProtectionTokenProviderOptions.TokenLifespan = TimeSpan.FromHours(8)` in `ConfigureIdentity` | None | None | Domain test for token | None | 5 min |
| **B4** | IPV-03 | nginx does not listen on IPv6 (`listen [::]:8080` missing) | MEDIUM | Add `listen [::]:8080;` to `FoodSafe.FE/docker/nginx.conf` | None | None | nginx config | Docker rebuild | None | 10 min |
| **B5** | IPV-06 | HSTS header absent from nginx responses; only present on API responses | MEDIUM | Add `Strict-Transport-Security` header to `FoodSafe.FE/docker/nginx.conf` | None | None | nginx config | Docker rebuild | None | 5 min |
| **B6** | CI health | 4 Vitest tests fail due to stale UI text selectors (not production defects) | LOW | Fix 4 test files (update expected text to match current component output) | None | None | None | Vitest run | None | 30 min |
| **B7** | DBS | 9 FK categories missing from DB schema (testing_results, atp_alerts, food_poisoning, administrative_documents) | LOW | None | New EF Core migration with 9 FK constraints | Migration | None | EF migration test | None | 1 hour |
| **B8** | SEC-08 | CAPTCHA not enforced on `POST /api/account/send-password-reset-code`; enables email enumeration attacks | MEDIUM | Add CAPTCHA widget to `ForgotPasswordPage.tsx`, update `authApi.sendPasswordResetCode` to include `captchaToken` | Add path to `LoginCaptchaMiddleware.cs` | None | None | Test middleware + FE test | None | 2 hours |
| **B9** | SEC (infra) | Redis running without `--requirepass`; unauthenticated access possible within Docker network | LOW | None | None | None | Add `REDIS_PASSWORD` env var and `--requirepass` to docker-compose.yml redis command | None | Redis auth verification | 30 min |
| **B10** | SEC (infra) | MinIO SSL hardcoded to `false`; file transfers unencrypted, no per-environment override | LOW | None | None | None | Change `BlobStorage__WithSsl` to env-var-driven `${MINIO_WITH_SSL:-false}` in docker-compose.yml | None | MinIO cert for prod | 10 min |

---

## Stale Selector Root Causes (B6 detail)

| Test file | Expected (stale) | Actual (current component) | Classification |
|---|---|---|---|
| `PublicAdRegistrationLookupPage.test.tsx` | `placeholder="Số đăng ký quảng cáo"` | `placeholder="Số đăng ký"` | Stale test — component text updated, test not |
| `PublicBusinessLookupPage.test.tsx` | `"Tra cứu cơ sở sản xuất kinh doanh"` | `"Tra cứu cơ sở sản xuất, kinh doanh thực phẩm"` | Stale test |
| `PublicBusinessLookupPage.test.tsx` | `placeholder="Mã cơ sở hoặc mã số thuế"` | `placeholder="Tên cơ sở hoặc mã số"` | Stale test |
| `PublicSelfDeclarationLookupPage.test.tsx` | `"Tra cứu hồ sơ tự công bố sản phẩm"` | `"Tra cứu tự công bố sản phẩm"` | Stale test |
| `PublicSelfDeclarationLookupPage.test.tsx` | `placeholder="Số hồ sơ tự công bố"` | `placeholder="Số tự công bố"` | Stale test |
| `SelfDeclarationPage.test.tsx` | `aria-label="Tệp đính kèm TCB-001"` | `aria-label="Tệp TCB-001"` | Stale test |

All 4 failures are maintenance issues — production UI is correct, tests are stale.

---

## Missing FK Categories (B7 detail)

The "9" count refers to 9 source-table-column groups. Physically this adds more FK constraints because some groups cover multiple geographic columns:

| # | Table | Column(s) | Target | Note |
|---|---|---|---|---|
| 1 | `testing_results` | `testing_center_id` | `cat_testing_centers` | Non-nullable FK |
| 2 | `testing_results` | `testing_service_id` | `cat_testing_services` | Non-nullable FK |
| 3 | `testing_results` | `business_id` | `businesses` | Non-nullable FK |
| 4 | `testing_results` | `product_id` | `products` | Nullable FK |
| 5 | `testing_results` | `inspection_result_id` | `inspection_results` | Nullable FK |
| 6 | `atp_alerts` | `business_id` | `businesses` | Nullable FK |
| 7 | `food_poisoning_cases` | `location_commune_id`, `location_district_id`, `location_province_id` | `cat_communes`, `cat_districts`, `cat_provinces` | 3 nullable geographic FKs |
| 8 | `food_poisoning_incidents` | `location_commune_id`, `location_district_id`, `location_province_id` | `cat_communes`, `cat_districts`, `cat_provinces` | 3 nullable geographic FKs |
| 9 | `administrative_documents` | `document_type_id` | `cat_document_types` | Non-nullable FK |

---

## Implementation Order

Process in this order (severity then effort):

1. **B6** (30 min) — Fix stale Vitest tests first; restores clean CI
2. **B1** (5 min) — Gate Swagger to development only
3. **B3** (5 min) — Password reset token lifetime 8h
4. **B4** (10 min) — nginx IPv6 listener
5. **B5** (5 min) — nginx HSTS header
6. **B8** (2 hours) — CAPTCHA on password reset (both FE and BE)
7. **B9** (30 min) — Redis password
8. **B10** (10 min) — MinIO SSL configurable
9. **B2** (30 min) — PostgreSQL SSL mode configurable via env var
10. **B7** (1 hour) — 9 missing FK constraints via EF migration

B2 is listed last among config items because it requires PostgreSQL SSL certificate provisioning in production and cannot be fully tested in Docker without SSL cert setup.

---

## File Change Manifest

| Blocker | File | Change type |
|---|---|---|
| B1 | `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs` | Gate Swagger to IsDevelopment |
| B2 | `FoodSafe.BE/docker-compose.yml` | Add `POSTGRES_SSL_MODE` env var to connection string |
| B3 | `FoodSafe.BE/src/FoodSafe.HttpApi.Host/FoodSafeHttpApiHostModule.cs` | Add `DataProtectionTokenProviderOptions.TokenLifespan = 8h` |
| B4 | `FoodSafe.FE/docker/nginx.conf` | Add `listen [::]:8080;` |
| B5 | `FoodSafe.FE/docker/nginx.conf` | Add `Strict-Transport-Security` header |
| B6 | 4 test files in `FoodSafe.FE/src/features/` | Update stale text/placeholder selectors |
| B7 | New EF Core migration file | Add 9 FK constraint groups |
| B8 | `FoodSafe.BE/src/FoodSafe.HttpApi.Host/Security/LoginCaptchaMiddleware.cs` | Add `/api/account/send-password-reset-code` to protected paths |
| B8 | `FoodSafe.FE/src/features/auth/pages/ForgotPasswordPage.tsx` | Add CaptchaWidget + captchaToken to form |
| B8 | `FoodSafe.FE/src/features/auth/api/authApi.ts` | Update `sendPasswordResetCode` signature to include `captchaToken` |
| B9 | `FoodSafe.BE/docker-compose.yml` | Add `REDIS_PASSWORD` env var, add `--requirepass` to Redis command |
| B10 | `FoodSafe.BE/docker-compose.yml` | Change `BlobStorage__WithSsl` to `${MINIO_WITH_SSL:-false}` |
