# Phase 5 — Database Readiness Audit

**Audit commit:** fe3dbd2  
**Audit date:** 2026-07-27  
**Auditor:** Independent Database Reviewer  
**Scope:** FoodSafe.BE — EF Core migrations, schema quality, query performance, reliability, and database security  
**Backend stack:** .NET 9 + ABP 9 + EF Core 9 + PostgreSQL 15  
**Migration runner:** FoodSafe.DbMigrator (console hosted service)

---

## Summary

| Metric | Value |
|---|---|
| Total migrations | 20 |
| CRITICAL issues | 2 |
| HIGH issues | 3 |
| MEDIUM issues | 4 |
| LOW issues | 3 |
| **Verdict** | **NOT PRODUCTION READY** |

**Production blockers (must resolve before first production deploy):**

1. No automated database backup scripts or backup rehearsal evidence
2. Destructive orphan-DELETE statements in migration Up() permanently erase data on any non-fresh database
3. ~~`ExtraProperties` PascalCase column~~ — REFUTED as runtime issue on independent verification (model maps the same PascalCase name; F-019 E2E passes). Cosmetic inconsistency only — see §5.1
4. Six certificate and registration unique indexes missing a `WHERE is_deleted = FALSE` soft-delete partial filter

---

## 1. Migrations

### 1.1 Migration inventory

20 migrations spanning 2026-07-25 to 2026-07-27. All are within the feature development window. The chronological sequence is correct.

| # | Migration | Key operations |
|---|---|---|
| 1 | `20260725082617_InitialFoodSafe` | ABP framework tables + `organizations` (self-referential FK, Restrict) |
| 2 | `20260725083203_AddGeographicCatalogs` | `cat_provinces`, `cat_districts`, `cat_communes` |
| 3 | `20260725083655_AddDataScope` | Management scope assignments, administrative area tables |
| 4 | `20260725085617_AddPasswordHistory` | `AbpUserPasswordHistories` |
| 5 | `20260725093801_UpgradeAbp937` | ABP 9.3.7 upgrade: additive columns only in Up(), no destructive Up() operations |
| 6 | `20260725120605_AddMasterCatalogs` | Countries, regions, document types |
| 7 | `20260725124518_AddBusinessManagement` | `businesses`, `products`, `business_types` |
| 8 | `20260725134744_AddFileAttachments` | `file_attachments` |
| 9 | `20260725141416_AddSelfDeclarations` | `self_declarations` |
| 10 | `20260725144004_AddProductRegistrations` | `product_registrations` |
| 11 | `20260725150001_AddAdvertisementRegistrations` | `advertisement_registrations` |
| 12 | `20260725152441_AddEligibilityCertificates` | `eligibility_certificates` |
| 13 | `20260725154114_AddCfsCertificates` | `cfs_certificates` |
| 14 | `20260726022948_AddExportFoodCertificates` | `export_food_certificates` |
| 15 | `20260726024252_AddInspectionModule` | Inspection plans, results, violations |
| 16 | `20260726083732_AddRemainingModules` | Reporting, alerts, food poisoning, data integration (ExtraProperties naming inconsistency — cosmetic, see §5.1) |
| 17 | `20260727021916_AddNewsRecallAudit` | `recalled_at`/`recalled_by_id` on `atp_news`; backfill UPDATE before check constraint |
| 18 | `20260727104254_AddMissingForeignKeys` | Adds FK constraints; **orphan-DELETE in Up() — see CRITICAL-2** |
| 19 | `20260727125207_AddResultFinalizeAndCitizenNews` | `is_finalized` on `inspection_results`; citizen reporter fields on `atp_news` |
| 20 | `20260727131218_AddApiCallLogDataType` | `data_type smallint` on `di_api_call_logs`, `defaultValue: (short)0` |

### 1.2 Down() completeness

All 20 migrations have proper Down() methods that reverse Up() operations. No migration has an empty or stub Down(). Fresh-install rollback is possible for every migration step.

### 1.3 Seeding idempotency

`MasterCatalogDataSeedContributor` and `FoodSafePermissionDataSeedContributor` check for existing records before inserting. Deterministic GUIDs (prefix `7e5ccdd0-…`) are used for catalog seeds. Re-running the migrator on an already-seeded database will not insert duplicate records.

`E2eTestDataSeedContributor` is guarded by `ASPNETCORE_ENVIRONMENT == "Development"`. The province FK dependency on the `regions` table was fixed in commit 579bcd1 (the seed contributor now checks for the region row and inserts it if absent before creating provinces). Seeding is viable on a fresh database.

---

## 2. Schema Quality

### 2.1 Foreign key strategy

All FK constraints use `DeleteBehavior.Restrict` on aggregate roots. Cascade delete is limited to owned child entities (e.g., constraint violation items, error notification entries). No unexpected cascades exist at the aggregate boundary.

The self-referential FK on `organizations.parent_id` correctly uses `Restrict`, preventing accidental deletion of parent nodes while child nodes exist.

### 2.2 Soft-delete partial index coverage

ABP `ISoftDelete` entities require soft-delete-aware partial unique indexes (`WHERE is_deleted = FALSE`) to allow number reuse after a record is soft-deleted.

**Correctly filtered (examples):**
- `uq_businesses_code` — filter: `code IS NOT NULL AND is_deleted = FALSE`
- `uq_businesses_tax_code` — filter: `tax_code IS NOT NULL AND is_deleted = FALSE`
- `uq_inspection_plans_code` — filter: `is_deleted = FALSE`
- `uq_ndtp_reports_*` and `uq_amr_reports_*` — filter: `is_deleted = false`

**Missing soft-delete filter (six indexes — HIGH):**

All six indexes below are plain `UNIQUE` with no partial filter. A soft-deleted certificate or registration occupies its unique slot permanently, blocking re-issuance of the same number.

| Index name | Table | Column(s) | Config line |
|---|---|---|---|
| `uq_self_declarations_business_number` | `self_declarations` | `(business_id, declaration_number)` | `Extensions.cs:384` |
| `uq_product_registrations_number` | `product_registrations` | `registration_number` | `Extensions.cs:493` |
| `uq_cfs_certificates_number` | `cfs_certificates` | `certificate_number` | `Extensions.cs:595` |
| `uq_export_food_certificates_number` | `export_food_certificates` | `certificate_number` | `Extensions.cs:706` |
| `uq_advertisement_registrations_number` | `advertisement_registrations` | `registration_number` | `Extensions.cs:818` |
| `uq_eligibility_certificates_number` | `eligibility_certificates` | `certificate_number` | `Extensions.cs:930` |

### 2.3 Workflow check constraints

All state-machine columns are protected by database-level check constraints. Examples:

- `chk_di_cl_direction` — `direction IN (1, 2)` on `di_api_call_logs`
- `chk_di_ep_auth_type` — `auth_type IN (1, 2, 3, 4)` on `di_api_endpoints`
- `chk_di_ep_status` — `status IN (1, 2)` on `di_api_endpoints`
- `chk_msa_one_target` — complex mutual-exclusion constraint on `management_scope_assignments`
- Multiple constraints on report status columns (AMR, NDTP)

### 2.4 Concurrency stamps

All aggregate roots have a `concurrency_stamp` column (`character varying(40)`). Optimistic concurrency is enforced at the domain layer via ABP's built-in `IConcurrencyStamp` support.

### 2.5 Cross-organization unique constraint scope

The six certificate/registration number indexes listed in 2.2 are global (not scoped to `organization_id`). The same certificate number cannot exist in two different regional organizations. Whether this is the intended business rule should be confirmed. If different Chi cục organizations may legitimately issue identically numbered certificates, these indexes need an `(organization_id, number)` composite key.

---

## 3. Performance

### 3.1 Index coverage

FK columns on all high-volume join paths have covering indexes:
- `organization_id` is indexed on every major entity table
- Composite indexes on (organization_id, called_at), (organization_id, status) for reporting-heavy tables
- Filtered indexes on soft-delete columns where appropriate

### 3.2 Excel export bounding

Both `BusinessExcelAppService` and `ProductExcelAppService` define:

```csharp
private const int ExportPageSize = 1000;
private const int MaximumExportRows = 50_000;
```

These services page through results in 1000-row batches and stop at 50,000 rows, preventing unbounded memory allocation. Confirmed in:
- `FoodSafe.BE/src/FoodSafe.Application/BusinessManagement/BusinessExcelAppService.cs`
- `FoodSafe.BE/src/FoodSafe.Application/BusinessManagement/ProductExcelAppService.cs`

### 3.3 Dashboard aggregation queries

`StatisticsAppService` uses `GroupBy(...).Select(g => new { Count = g.Count() })` patterns that push aggregation to PostgreSQL via GROUP BY SQL. No in-memory full-table scans are present.

However, the service fires four independent async methods sequentially rather than in parallel. Under concurrent dashboard load, each request blocks for the sum of all query durations. Given the NFR requirement of average response < 10 seconds for 30 concurrent users, sequential dashboard aggregation is a medium-priority risk.

**File:** `FoodSafe.BE/src/FoodSafe.Application/Dashboard/StatisticsAppService.cs`

### 3.4 Pagination

All list endpoints use ABP's `PageBy(input)` via `PagedAndSortedResultRequestDto`. No unbounded result sets are returned by application services.

---

## 4. Reliability

### 4.1 ~~CRITICAL: No automated backup scripts~~ — RESOLVED (B-2, 2026-07-27)

**Original issue:** The disaster recovery guide (`docs/40-disaster-recovery-guide.md`) documented a `pg_dump` procedure, but no automated backup script, cron job, or scheduler configuration existed, and there was no rehearsal evidence.

**Resolution (commit on `fix/production-blockers`):**
- `scripts/backup-database.sh` — automated `pg_dump` custom-format backup with SHA-256 checksum, optional GPG encryption (`BACKUP_GPG_RECIPIENT`), retention pruning (`BACKUP_RETENTION_DAYS`, default 30), optional off-host MinIO mirror (`MINIO_MIRROR_TARGET`), and a JSON manifest record per run (start/end, restore point, size, checksum, outcome). Non-zero exit + `outcome=FAILED` on any error so a scheduler can alert on staleness > 24 h.
- `scripts/restore-database.sh` — restores into a **fresh** database with `pg_restore --exit-on-error --single-transaction --no-owner --no-privileges`; refuses to overwrite the live database unless `FORCE=1`; auto-decrypts `*.gpg`.
- `scripts/rehearse-restore.sh` — automated backup→restore→verify rehearsal. Uses `pg_export_snapshot()` + `SET TRANSACTION SNAPSHOT` so the dump and the source verification read one consistent point in time (defeats the concurrent-writer race that otherwise makes row-count checks flaky). Verifies EF migration id, `public` table count, and exact business row counts; reports RTO.
- **CI gate:** `.github/workflows/ci.yml` → `database` job runs the rehearsal against a freshly migrated PostgreSQL on every push/PR (`PG_CONTAINER` mode).

**Recorded rehearsal (2026-07-27):** restore point `20260727131218_AddApiCallLogDataType`; migration history, table count (86), and business row counts all matched against the consistent snapshot; zero restore errors; RTO ~5–8 s (objective < 4 h). Evidence table in `docs/40-disaster-recovery-guide.md` → "Rehearsal evidence (recorded)".

**Remaining (operational, not a code blocker):** schedule `backup-database.sh` ≤ 24 h in production, wire the >24 h staleness alert, add MinIO object-restore to the production rehearsal, and run the full application-level acceptance checks on production hardware before first release.

### 4.2 CRITICAL: Destructive orphan-DELETE in migration Up()

**File:** `FoodSafe.BE/src/FoodSafe.EntityFrameworkCore/Migrations/20260727104254_AddMissingForeignKeys.cs`

Migration 18 runs `DELETE` statements before adding FK constraints:

```sql
-- Lines 79-81
DELETE FROM administrative_documents
WHERE document_type_id NOT IN (SELECT id FROM cat_document_types);

-- Lines 93-104
DELETE FROM atp_alerts WHERE business_id NOT IN (SELECT id FROM businesses);
DELETE FROM food_poisoning_cases WHERE location_commune_id IS NOT NULL ...
DELETE FROM food_poisoning_cases WHERE location_district_id IS NOT NULL ...
DELETE FROM food_poisoning_cases WHERE location_province_id IS NOT NULL ...
DELETE FROM food_poisoning_incidents WHERE location_commune_id IS NOT NULL ...
DELETE FROM food_poisoning_incidents WHERE location_district_id IS NOT NULL ...
DELETE FROM food_poisoning_incidents WHERE location_province_id IS NOT NULL ...
DELETE FROM testing_results WHERE business_id IS NOT NULL ...
DELETE FROM testing_results WHERE inspection_result_id IS NOT NULL ...
DELETE FROM testing_results WHERE product_id IS NOT NULL ...
DELETE FROM testing_results WHERE testing_center_id IS NOT NULL ...
DELETE FROM testing_results WHERE testing_service_id IS NOT NULL ...
```

**Risk:** These DELETE statements are appropriate for a fresh development database where orphaned rows are test artifacts. On any production database that already contains real data, this migration will silently and permanently destroy records from 5 entity tables with no recovery path. The Down() method only drops the FK constraints — it does not restore deleted rows.

**Required action:** Before running this migration against any database that may contain production data:
1. Audit each table for orphaned rows
2. If orphans exist, investigate their origin and either fix the referential integrity or export them for manual review
3. Perform a verified `pg_dump` backup immediately before running the migration
4. Document that the DELETE conditions are safe for the target database state

### 4.3 Docker named volumes

`docker-compose.yml` defines named volumes: `postgres_data`, `redis_data`, `minio_data`, `mailpit_data`, `clamav_data`, `data_protection_keys`. PostgreSQL data is durable across container restarts within the Docker host. However, named volumes are not backed up by Docker and are not replicated. Volume durability does not substitute for backup automation (see 4.1).

---

## 5. Security

### 5.1 LOW (downgraded from HIGH): ExtraProperties PascalCase column — cosmetic naming inconsistency, NOT a runtime error

> **Independent verification (lead auditor, 2026-07-27):** This finding was empirically REFUTED as a runtime breaker. The EF model snapshot (`FoodSafeDbContextModelSnapshot.cs:2376-2379`) explicitly maps the property with `.HasColumnName("ExtraProperties")` — the runtime model and the database column agree, so generated SQL references `"ExtraProperties"` and succeeds. Confirmed against the live database (`information_schema.columns` shows `ExtraProperties`; DataIntegration E2E verification spec F-019 passes against the real stack). The remainder of this section describes the original hypothesis and is retained for the rename recommendation only (cosmetic consistency; optional cleanup migration).

**Files:**
- `FoodSafe.BE/src/FoodSafe.EntityFrameworkCore/Migrations/20260726083732_AddRemainingModules.cs` (lines 294, 324)

Both `di_api_call_logs` and `di_api_endpoints` were created with column `ExtraProperties` (PascalCase) in the migration DDL:

```csharp
// di_api_call_logs, line 294
ExtraProperties = table.Column<string>(type: "text", nullable: false),

// di_api_endpoints, line 324
ExtraProperties = table.Column<string>(type: "text", nullable: false),
```

Every other column in these tables uses snake_case (e.g., `organization_id`, `external_system_name`, `is_success`). The Npgsql provider quotes all identifiers, so the PostgreSQL column is literally `"ExtraProperties"` (case-sensitive).

ABP's `ConfigureByConvention()` (called in `FoodSafeDbContextModelCreatingExtensions.cs`) applies the snake_case naming convention, which maps the entity's `ExtraProperties` property to the expected column name `"extra_properties"`. The EF Core model therefore references `"extra_properties"` in all generated SQL, while the actual database column is `"ExtraProperties"`.

**Effect:** PostgreSQL will return `ERROR: column "extra_properties" does not exist` on every SELECT, INSERT, or UPDATE that touches `di_api_call_logs` or `di_api_endpoints`. All DataIntegration operations will fail at runtime.

**Fix:** Add a migration that renames `"ExtraProperties"` to `extra_properties` on both tables:
```sql
ALTER TABLE di_api_call_logs RENAME COLUMN "ExtraProperties" TO extra_properties;
ALTER TABLE di_api_endpoints RENAME COLUMN "ExtraProperties" TO extra_properties;
```

### 5.2 HIGH: Hardcoded test credential matches dev SEED_ADMIN_PASSWORD

**File:** `FoodSafe.BE/src/FoodSafe.Domain/Data/E2eTestDataSeedContributor.cs`

```csharp
const string TestPassword = "Admin@2026!";
```

This password is identical to the `SEED_ADMIN_PASSWORD=Admin@2026!` configured in `FoodSafe.BE/.env` (the active development environment file). While `.env` is gitignored and not committed, the password constant is in git-tracked source code and visible in the full commit history.

The seeder is guarded by `ASPNETCORE_ENVIRONMENT == "Development"`, which prevents it from running in Production. However, the credential exposure in source code is a security hygiene violation: if `Admin@2026!` is also used as the production bootstrap password, it is now disclosed to anyone with repository read access.

**Required actions:**
1. Use a randomly generated placeholder constant in the seeder (e.g., `const string TestPassword = "Test@LocalDev1!"`)
2. Ensure the production `SEED_ADMIN_PASSWORD` is distinct from any value appearing in source code
3. If `Admin@2026!` was ever used in production, rotate it immediately

### 5.3 PostgreSQL SSL enforcement

`PostgreSqlSslValidator.cs` throws `InvalidOperationException` at startup if `SslMode` is `Disable`, `Allow`, or `Prefer` in Production. This is a correct fail-fast control. The validator is called in `Program.cs` before the application accepts connections.

`.env.example` documents that `POSTGRES_SSL_MODE=Disable` is development-only and instructs operators to use `Require`, `VerifyCA`, or `VerifyFull` for production. The development `.env` file (which has `POSTGRES_SSL_MODE=Disable`) is correctly gitignored.

No concern for this area.

### 5.4 Database user privilege

`docker-compose.yml` configures PostgreSQL with user `foodsafe` (not the `postgres` superuser). The application only has the privileges granted to `foodsafe`, which limits blast radius in the event of SQL injection or application compromise.

### 5.5 MEDIUM: REDIS_PASSWORD absent from .env.example

`docker-compose.yml` declares `${REDIS_PASSWORD:?Set REDIS_PASSWORD}` — the variable is required and will cause compose to fail if unset. However, `.env.example` documents `REDIS_PORT=6379` but omits `REDIS_PASSWORD` entirely.

An operator following `.env.example` to build a production environment file would not know to set this variable. The Docker Compose error message (`Set REDIS_PASSWORD`) will catch the omission at container start, but the missing documentation increases the risk of misconfiguration.

**Fix:** Add `REDIS_PASSWORD=replace-with-a-long-random-password` to `.env.example`.

### 5.6 Secrets gitignore

`FoodSafe.BE/.env` is gitignored (confirmed via `git check-ignore`). `FoodSafe.BE/secrets/` has a `.gitignore` of `* / !.gitignore` that blocks all files in the directory from being committed. The data protection certificate and private keys are not committed to the repository.

---

## 6. Issue Register

### CRITICAL

| ID | Title | Location | Impact |
|---|---|---|---|
| ~~C-1~~ RESOLVED (B-2, 2026-07-27) | Automated backup/restore scripts + CI-gated rehearsal added (`scripts/backup-database.sh`, `restore-database.sh`, `rehearse-restore.sh`); rehearsal evidence recorded in the DR guide | `scripts/*.sh`; `.github/workflows/ci.yml`; `docs/40-disaster-recovery-guide.md` | Was: data loss on failure. Now mitigated; scheduling/alerting remains an operational task |
| C-2 | Destructive orphan-DELETE in migration Up() | `20260727104254_AddMissingForeignKeys.cs` lines 79–104 | Silent permanent data loss if run on non-fresh database |

### HIGH

| ID | Title | Location | Impact |
|---|---|---|---|
| ~~H-1~~ L-4 (downgraded) | `ExtraProperties` PascalCase column naming — cosmetic only; model snapshot maps `HasColumnName("ExtraProperties")`, runtime verified working | `20260726083732_AddRemainingModules.cs` lines 294, 324 | None at runtime; optional cleanup rename |
| H-2 | Six certificate/registration unique indexes missing soft-delete partial filter | `FoodSafeDbContextModelCreatingExtensions.cs` lines 384, 493, 595, 706, 818, 930 | Soft-deleted records permanently block reuse of their certificate/registration numbers |
| H-3 | Hardcoded test password in source code matches dev SEED_ADMIN_PASSWORD | `E2eTestDataSeedContributor.cs` — `const string TestPassword = "Admin@2026!"` | Credential disclosure in git history |

### MEDIUM

| ID | Title | Location | Impact |
|---|---|---|---|
| M-1 | `REDIS_PASSWORD` not in `.env.example` | `FoodSafe.BE/.env.example`; `docker-compose.yml` line 54 | Configuration documentation gap; operator may omit Redis password |
| M-2 | Dashboard StatisticsAppService fires sequential queries | `FoodSafe.Application/Dashboard/StatisticsAppService.cs` | May breach <10 s average response target under 30 concurrent users |
| M-3 | Certificate/registration unique constraints are global (not per-organization) | `FoodSafeDbContextModelCreatingExtensions.cs` lines 493, 595, 706, 818, 930 | Business rule correctness risk if organizations may share certificate numbers |
| M-4 | Check constraint SQL uses `\r\n` in Up() but `\n` in Down() | `20260727125207_AddResultFinalizeAndCitizenNews.cs` | EF Core model-diff noise on Unix CI; Down() may not exactly match stored constraint text |

### LOW

| ID | Title | Location | Impact |
|---|---|---|---|
| L-1 | Pre-existing `di_api_call_logs` rows receive `data_type = 0` (Other) silently | `20260727131218_AddApiCallLogDataType.cs` | Historical call logs lose their actual data category classification |
| L-2 | No documented procedure for rotating SEED_ADMIN_PASSWORD after bootstrap | `FoodSafeDbMigrationService.cs`; `docs/40-disaster-recovery-guide.md` | Bootstrap credential may remain unchanged after initial seeding |
| L-3 | `docker-compose.prod.yml` adds TLS mounts but no WAL archival or backup configuration | `FoodSafe.BE/docker-compose.prod.yml` | Production override is incomplete for data durability requirements |

---

## 7. Positive Findings

- All 20 migration Down() methods are complete and reversible — no stub Down() methods
- Seeder idempotency is implemented correctly across all seed contributors
- Soft-delete partial indexes are applied correctly on high-volume entity tables (`businesses`, `inspection_plans`, reports)
- Workflow state machines are enforced by database-level check constraints — invalid status values are rejected by PostgreSQL
- All FK columns have covering indexes — no unindexed FK columns observed
- PostgreSQL SSL enforcement is fail-fast at startup in Production (`PostgreSqlSslValidator`)
- PostgreSQL runs as a least-privilege application user (`foodsafe`, not `postgres`)
- Secrets are gitignored; the `secrets/` directory is fully blocked from git tracking
- Excel exports are bounded (50,000 rows maximum, 1,000 rows per page) — no unbounded memory risk
- Dashboard aggregation queries use GROUP BY SQL rather than in-memory computation
- Concurrency stamps are present on all aggregate roots

---

## 8. Required Actions Before Production

| Priority | Action | Owner |
|---|---|---|
| P3 (optional) | Rename `ExtraProperties` → `extra_properties` on `di_api_call_logs` / `di_api_endpoints` for naming consistency (no runtime impact) | Backend |
| P0 | Add `WHERE is_deleted = FALSE` filter to all six certificate/registration unique indexes | Backend |
| ~~P0~~ DONE (B-2) | ~~Create automated PostgreSQL backup script~~ → `scripts/backup-database.sh` (encryption, off-host MinIO mirror, retention, manifest). Remaining: schedule ≤ 24 h + wire staleness alert (operational). | DevOps |
| ~~P0~~ DONE (B-2) | ~~Rehearse full backup restore; record RTO/RPO~~ → `scripts/rehearse-restore.sh`, CI-gated; evidence recorded in DR guide (RTO ~5–8 s, RPO 0 for snapshot). Remaining: add MinIO object-restore to production rehearsal. | DevOps |
| P0 | Audit target database for orphaned rows before running migration `20260727104254_AddMissingForeignKeys` | DBA |
| P1 | Replace `const string TestPassword = "Admin@2026!"` with a distinct placeholder; rotate if used in production | Backend / Security |
| P1 | Add `REDIS_PASSWORD` to `.env.example` | DevOps |
| P2 | Parallelize `StatisticsAppService` aggregation queries using `Task.WhenAll` | Backend |
| P2 | Confirm whether cross-organization certificate number uniqueness is the intended business rule | Product |
| P3 | Normalize check constraint SQL to `\n` line endings in migration Down() methods | Backend |
| P3 | Document SEED_ADMIN_PASSWORD rotation procedure | DevOps |
| P3 | Add WAL archival and backup configuration to `docker-compose.prod.yml` | DevOps |
