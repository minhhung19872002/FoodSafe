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
