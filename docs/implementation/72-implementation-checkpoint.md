# Implementation Checkpoint — 2026-07-27

**Branch**: `codex/production-readiness`
**Checkpoint date**: 2026-07-27
**Verified by**: Claude (Principal Implementation Lead)

---

## What was done in this session

Ten production blockers were identified from audit docs 65, 66, and 68. Four batches were implemented and verified against real tests.

### Completed batches

| Batch | Blockers addressed | Tests verified |
|-------|-------------------|----------------|
| B1 (Vitest) | 9 Vitest failures | 112/112 FE Vitest |
| B2 (P0 config) | Swagger exposure, token lifetime, IPv6, HSTS, PG SSL | 481/481 BE |
| B3 (CAPTCHA/infra) | CAPTCHA on password reset, Redis auth, MinIO SSL | 481/481 BE |
| B4 (FK integrity) | 9 missing FK constraints + EF migration | 481/481 BE |

---

## Current test baseline (clean) — after acceptance-blocker remediation 2026-07-27

```
BE HttpApi.Host.Tests:    53 passed / 0 failed  (was 15)
BE Application.Tests:    251 passed / 0 failed
BE Domain.Tests:         197 passed / 0 failed
BE EntityFrameworkCore:   18 passed / 0 failed
BE Total:                519 passed / 0 failed  (was 481)

FE Vitest:               112 passed / 0 failed
FE TypeScript:           0 errors
FE ESLint/oxlint:        0 errors
FE Production build:     SUCCESS (exit 0)
```

---

## Security items addressed

| Code | Finding | Fix location |
|------|---------|-------------|
| IPV-01 | Swagger exposed in production | `FoodSafeHttpApiHostModule.cs` — gated to `IsDevelopment()` |
| IPV-02 | Password reset token lifetime 24 h | `FoodSafeHttpApiHostModule.cs` — `TokenLifespan = 8h` |
| IPV-03 | nginx not listening on IPv6 | `nginx.conf` — `listen [::]:8080` |
| IPV-05 | HSTS header in HTTP block | `nginx.conf` — HSTS removed from HTTP; added only to `nginx.prod.conf.template` HTTPS block |
| IPV-06 | PostgreSQL SSL uses Prefer (plaintext fallback) | `PostgreSqlSslValidator.cs` — startup validation rejects Prefer/Disable/Allow in Production; docker-compose requires POSTGRES_SSL_MODE |
| IPV-07 | CAPTCHA absent on password reset | `LoginCaptchaMiddleware.cs` + `ForgotPasswordPage.tsx` + 38 new backend tests |
| IPV-08 | Redis no password in compose | `docker-compose.yml` — `requirepass ${REDIS_PASSWORD:?…}` |
| IPV-09 | MinIO SSL hardcoded false | `docker-compose.yml` — `BlobStorage__WithSsl=${MINIO_WITH_SSL:-false}` |

---

## Database integrity items addressed

| Table | FK added | References |
|-------|----------|-----------|
| `testing_results` | `fk_tr_testing_center` | `cat_testing_centers` |
| `testing_results` | `fk_tr_testing_service` | `cat_testing_services` |
| `testing_results` | `fk_tr_business` | `businesses` |
| `testing_results` | `fk_tr_product` | `products` |
| `testing_results` | `fk_tr_inspection_result` | `inspection_results` |
| `administrative_documents` | `fk_ad_document_type` | `cat_document_types` |
| `food_poisoning_incidents` | `fk_fpi_commune` | `cat_communes` |
| `food_poisoning_incidents` | `fk_fpi_district` | `cat_districts` |
| `food_poisoning_incidents` | `fk_fpi_province` | `cat_provinces` |
| `food_poisoning_cases` | `fk_fpc_commune` | `cat_communes` |
| `food_poisoning_cases` | `fk_fpc_district` | `cat_districts` |
| `food_poisoning_cases` | `fk_fpc_province` | `cat_provinces` |
| `atp_alerts` | `fk_alerts_business` | `businesses` |

**Migration**: `20260727104254_AddMissingForeignKeys.cs`

---

## What is NOT done

The following blockers require substantial feature implementation and are out of scope for this session:

- Business workflow state machine gaps (approval chains, correction cycles)
- Missing customer-facing features (FR-xxx items not yet built)
- Import/export/attachment functionality gaps
- Deployment handover evidence (ops runbook, SLA docs)

These are tracked in `docs/implementation/70-production-blocker-resolution-plan.md`.

---

## How to resume

```bash
git checkout codex/production-readiness
cd FoodSafe.BE
dotnet test FoodSafe.sln        # expect 481/0
cd ../FoodSafe.FE
npx vitest run                  # expect 112/0
```

Read `docs/implementation/70-production-blocker-resolution-plan.md` for the full blocker list and `71-implementation-progress.md` for the detailed change log before starting the next batch.

---

## Safety constraints that must stay in effect

- Do not rewrite unrelated code.
- Do not suppress compiler, lint, or test errors.
- Do not remove tests because they fail.
- Do not convert real behavior into mock behavior.
- Do not hard-code successful responses.
- Do not change the customer's requirements.
- Do not change audit scores without new implementation and test evidence.
- Do not execute destructive production database operations.
- Do not commit secrets.
- Do not add insecure fallback credentials.
- Do not bypass authorization.
- Do not silently catch exceptions.
