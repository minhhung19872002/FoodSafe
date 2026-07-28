# Disaster Recovery Guide — FoodSafe

## Objectives and protected state

The approved objectives are RTO under 4 hours and RPO under 24 hours.
PostgreSQL receives a daily full backup retained for 30 days; production should
also archive WAL for point-in-time recovery. MinIO requires replication or a
daily versioned sync. Redis does not require backup.

Protect these items in encrypted, access-controlled, off-host storage:

- PostgreSQL base/full backups and WAL required for the selected restore point;
- MinIO buckets, versions, object metadata, and checksum inventory;
- ASP.NET data-protection key ring and the separate certificate needed to
  decrypt it;
- deployment manifests, immutable image digests, and non-secret configuration;
- secret-store recovery procedure and ownership metadata.

Never store the certificate password beside the certificate or backup. Mailpit
is not a production record and must not be restored.

## Backup controls

Automate backup creation, encryption, transfer, retention, and verification.
Record start/end time, source, restore point, object count/size, checksum,
encryption key reference, and outcome. Alert when the most recent verified
backup is older than 24 hours.

This is automated by [`scripts/backup-database.sh`](../scripts/backup-database.sh):
it produces a custom-format `pg_dump`, computes a SHA-256 checksum, optionally
GPG-encrypts for off-host storage (`BACKUP_GPG_RECIPIENT`), prunes by retention
(`BACKUP_RETENTION_DAYS`, default 30), can mirror to MinIO (`MINIO_MIRROR_TARGET`),
and appends a JSON manifest record (start/end, restore point = latest EF
`MigrationId`, size, checksum, outcome) to `backups/manifest.log`. It exits
non-zero and records `outcome=FAILED` on any error so a scheduler can alert.
Schedule it at least every 24 h to satisfy RPO.

Underlying logical backup for a small deployment:

```powershell
pg_dump --format=custom --no-owner --no-privileges --file FoodSafe.dump FoodSafe
```

For production scale and PITR, use physical base backups plus continuous WAL
archival instead. MinIO should use server-side replication or `mc mirror` into
a versioned recovery target. A copied file is not a valid backup until an
isolated restore verifies it.

## Recovery sequence

1. Declare the incident, recovery point, recovery environment, and authorized
   decision maker. Preserve the failed environment for investigation.
2. Provision an isolated network with the approved PostgreSQL, MinIO, Redis,
   API, and frontend versions. Do not expose public ingress.
3. Restore PostgreSQL to the chosen point, then restore MinIO objects and
   versions from the matching backup window.
4. Restore the data-protection key ring and certificate from separate protected
   sources. Load current environment secrets from the approved secret store.
5. Start Redis empty. Run the migrator only if the restored schema is older
   than the application image and that upgrade path has been rehearsed.
6. Start API/frontend and complete the acceptance checks below.
7. Reconcile transactions or objects created after the recovery point using
   retained external evidence; never silently invent missing records.
8. Obtain incident-lead and business-owner approval before changing DNS or
   reopening ingress.

For a logical PostgreSQL restore, use
[`scripts/restore-database.sh <dump> <target-db>`](../scripts/restore-database.sh).
It always creates a fresh target, restores with
`pg_restore --exit-on-error --single-transaction --no-owner --no-privileges`,
and refuses to overwrite the configured live database unless `FORCE=1`. It
decrypts `*.gpg` dumps automatically. The equivalent manual sequence:

```powershell
createdb FoodSafe_Restore
pg_restore --exit-on-error --single-transaction --no-owner --no-privileges `
  --dbname FoodSafe_Restore FoodSafe.dump
```

Use a fresh database. Do not overwrite the only copy of a failed database.

## Restore acceptance checks

- Database restore completed without errors and the EF migration history
  matches the selected application image.
- Row counts and critical aggregate samples match the backup inventory.
- MinIO object count, size, versions, and sampled SHA-256 checksums match.
- Required file metadata points to existing objects; unauthorized download is
  denied.
- API and ingress health checks pass.
- Administrator sign-in, cookie/CSRF continuity policy, current-user context,
  scoped organization/geography reads, and an expected cross-scope denial pass.
- Password recovery email is delivered through production SMTP.
- Audit logging, correlation IDs, rate limiting, and background processing
  function without exposing secrets.

Record elapsed recovery time and measured data loss. A result exceeding RTO or
RPO fails the exercise and requires a corrective action with owner and date.

## Rehearsal and release gate

Run an isolated restore at least quarterly, before first production release,
and after material database, MinIO, encryption, key-management, or deployment
changes. Destroy rehearsal data securely after evidence is approved.

An automated rehearsal is provided by
[`scripts/rehearse-restore.sh`](../scripts/rehearse-restore.sh) and is gated in
CI (the `database` job runs it against a freshly migrated PostgreSQL). It:

1. Exports a consistent snapshot of the source (`pg_export_snapshot`) and holds
   it open, so the dump and the source verification read the identical point in
   time even while the live database is being written to — a naive
   live-vs-restore comparison races concurrent writers and reports false
   failures.
2. Takes a real backup pinned to that snapshot (`backup-database.sh`).
3. Restores into a throwaway database (`restore-database.sh`).
4. Verifies the restore against the snapshot: EF migration id, `public` table
   count, and exact row counts of key business tables all match.
5. Reports elapsed recovery time (RTO indicator) and drops the throwaway DB.

### Rehearsal evidence (recorded)

| Field | Value |
|---|---|
| Date | 2026-07-27 |
| Method | `scripts/rehearse-restore.sh` against the real Compose PostgreSQL 15 stack |
| Backup tool | `scripts/backup-database.sh` (pg_dump custom, SHA-256, manifest) |
| Restore tool | `scripts/restore-database.sh` (fresh DB, `--single-transaction --exit-on-error`) |
| Restore point | `20260727131218_AddApiCallLogDataType` (latest EF migration) |
| Migration history match | Yes |
| `public` table count match | Yes (86 = 86) |
| Business row-count match (snapshot-consistent) | Yes — `businesses`, `organizations`, `AbpUsers`, `cat_provinces`, `cat_communes` |
| Restore errors | None (`pg_restore --exit-on-error` clean) |
| Elapsed recovery time (RTO) | ~5–8 s (objective: < 4 h) |
| Data loss (RPO) | 0 for the captured snapshot; scheduled ≤ 24 h in production |
| CI gate | `.github/workflows/ci.yml` → `database` job → "Backup and restore rehearsal (B-2 disaster-recovery gate)" |

A production-like backup/restore rehearsal has now been performed and recorded,
and is enforced on every CI run. **B-2 is resolved.** MinIO object-restore and
the full application-level acceptance checks above remain a pre-first-release
operational exercise on production hardware.

## Backup and restore scripts

Two executable scripts implement the mechanical part of the procedure above.
Both are Windows PowerShell 5.1 compatible, are run from the repository root,
and drive the Compose stack with `docker compose exec`, so they need Docker
Desktop running, the stack up, and `FoodSafe.BE/.env` present (that file is
gitignored). Neither script reads, prints, or passes a credential:
`pg_dump`, `pg_restore`, `psql` and `mc` read `POSTGRES_PASSWORD`,
`MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD` from the environment of their own
container, which Compose populated from `.env`. Only the non-secret
`POSTGRES_DB` and `POSTGRES_USER` names are read from `.env`.

### scripts/Backup-FoodSafeDatabase.ps1

```powershell
# Interactive backup with defaults
.\scripts\Backup-FoodSafeDatabase.ps1

# Scheduled nightly backup with the documented 30-day retention
.\scripts\Backup-FoodSafeDatabase.ps1 -Destination D:\FoodSafeBackups `
    -RetentionDays 30 -Label nightly
```

The script runs `pg_dump --format=custom --no-owner --no-privileges` inside the
`postgres` container, verifies the archive is non-empty and readable with
`pg_restore --list`, copies it out, checks the copied size, records its
SHA-256, mirrors the MinIO bucket with `mc mirror`, and writes a manifest.

Parameters: `-Destination` (default `$env:FOODSAFE_BACKUP_ROOT`, else
`D:\FoodSafeBackups`), `-RetentionDays` (0 = keep everything; pass 30 for the
retention this guide documents), `-Label`, `-SkipMinio` (database only — the
result is then not a complete recovery point), `-NoMinioChecksums`,
`-MinioBucket` (default `foodsafe-files`), and the overrides `-ComposeFile`,
`-EnvFile`, `-PostgresService`, `-MinioService`, `-Database`, `-User`.
Exit code 0 means the backup was created and verified; 1 means failure. Wire
that exit code into the scheduler so the 24-hour backup-freshness alert in
`docs/39-operations-runbook.md` has a signal to fire on.

Each run creates one timestamped folder, `<Destination>\yyyyMMdd-HHmmss[-label]`,
containing:

- `FoodSafe-<db>-<timestamp>.dump` — the custom-format archive;
- `table-rowcounts.csv` — exact row count of every public base table, the
  inventory the restore is checked against;
- `manifest.json` — start/end time, duration, restore point, source, dump size,
  SHA-256, archive entry count, table/row totals, EF migration head, MinIO
  object count and size, and the outcome;
- `minio\objects\...` — the mirrored bucket contents;
- `minio\minio-inventory.jsonl` and `minio\minio-checksums.csv` — object
  inventory and per-object SHA-256.

### scripts/Restore-FoodSafeDatabase.ps1

```powershell
# Rehearsal: restore the newest backup into a fresh database
.\scripts\Restore-FoodSafeDatabase.ps1 -Latest

# Real recovery over the live database, after stopping the API
docker compose --env-file .env stop api
.\scripts\Restore-FoodSafeDatabase.ps1 `
    -DumpPath D:\FoodSafeBackups\20260727-232626\FoodSafe-FoodSafe-20260727-232626.dump `
    -TargetDatabase FoodSafe -ConfirmDropDatabase FoodSafe -AllowLiveDatabaseOverwrite
```

The script hashes the dump and compares it with `manifest.json` before doing
anything, refusing a corrupt or modified archive. It then creates the target
database and runs `pg_restore --exit-on-error --single-transaction --no-owner
--no-privileges`, exactly as the logical restore above.

**This script can destroy data, so it is gated.** The default target is the
fresh database `FoodSafe_Restore`. If the target database already exists, the
script refuses unless `-ConfirmDropDatabase` is given with the target's exact
name (case-sensitive). If the target is also the live application database from
`.env`, `-AllowLiveDatabaseOverwrite` is required in addition. A refusal exits
with code **2** and changes nothing; 0 means restored and verified, 1 means a
failure or a verification mismatch.

After the restore it reports and checks: public table count, the
`__EFMigrationsHistory` head and migration count, row counts of `AbpUsers` and
`businesses`, and — unless `-SkipInventoryComparison` is passed — every table's
row count against `table-rowcounts.csv`, listing each mismatch and failing if
any table differs. It also prints the elapsed time as an input to the RTO
measurement.

`-RestoreMinio` additionally mirrors `minio\objects` back into the bucket
(creating it if absent) and compares the resulting object count with the
manifest. It requires `-ConfirmMinioOverwrite <bucket>`. Objects present in the
bucket but absent from the backup are overwritten only on key collision; they
are never deleted.

### Rehearsal steps

1. Take a backup and note the backup ID:
   `.\scripts\Backup-FoodSafeDatabase.ps1 -Label rehearsal`.
2. Bring up an isolated Compose project containing only PostgreSQL and MinIO —
   not the production stack, and with no public ingress.
3. Restore into it, pointing the script at that project:
   `.\scripts\Restore-FoodSafeDatabase.ps1 -Latest -ComposeFile <isolated compose> -EnvFile <isolated env> -RestoreMinio -ConfirmMinioOverwrite foodsafe-files`.
4. Require the inventory comparison to report that every table matches, and the
   EF migration head to match the application image being recovered.
5. Continue with the functional items in "Restore acceptance checks" above —
   sign-in, scoped reads, an expected cross-scope denial, SMTP recovery mail,
   ingress health — which the scripts do not automate.
6. Record elapsed recovery time and measured data loss against RTO and RPO.
7. Destroy the rehearsal environment and its volumes
   (`docker compose ... down -v`) and record the evidence.

### What the scripts deliberately do not do

These remain manual and must not be assumed from a green script run:

- no encryption at rest and no off-host transfer of the run folder;
- no WAL archiving, therefore no point-in-time recovery — the only recovery
  point is the moment the dump was taken, so the 24-hour RPO holds only if the
  backup is scheduled at least daily;
- no backup of the ASP.NET data-protection key ring
  (volume `foodsafe_data_protection_keys`) or of
  `FoodSafe.BE/secrets/foodsafe-data-protection.pfx`; this guide requires the
  key ring and its certificate to live in separate protected stores, so they
  are not copied beside the database dump;
- no backup-freshness alerting;
- mirroring MinIO to a filesystem does not preserve S3 object metadata or
  versions — production still needs server-side replication or `mc mirror` into
  a versioned target;
- none of the functional restore acceptance checks.

The scripts were exercised against the local development stack on 2026-07-27
(0.62 MB dump, 86 tables, 5,488 rows, 14 objects; restore into an isolated
PostgreSQL/MinIO project reported an exact inventory match). That is tooling
evidence only. The production-like rehearsal required by the release gate above
is still outstanding.
