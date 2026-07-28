#!/usr/bin/env bash
#
# Automated PostgreSQL logical backup for FoodSafe.
#
# Addresses production blocker B-2 (no backup automation). Implements the
# "Backup controls" section of docs/40-disaster-recovery-guide.md:
#   - pg_dump custom format (--no-owner --no-privileges)
#   - SHA-256 checksum
#   - optional GPG encryption for off-host storage
#   - retention pruning (default 30 days)
#   - a per-run manifest record (start/end, source, size, checksum, outcome)
#   - non-zero exit + manifest outcome=FAILED on any error, so a scheduler can alert
#
# It talks to the running Compose PostgreSQL service (single-node deployment
# model). Override any value via environment variables.
#
# Usage:
#   scripts/backup-database.sh
#
# Environment (defaults suit the local/prod Compose stack):
#   COMPOSE_FILE        docker compose file (default FoodSafe.BE/docker-compose.yml)
#   PG_SERVICE          compose service name (default postgres)
#   POSTGRES_DB         database name (default FoodSafe)
#   POSTGRES_USER       database user (default foodsafe)
#   BACKUP_DIR          host backup directory (default FoodSafe.BE/backups)
#   BACKUP_RETENTION_DAYS  prune dumps older than N days (default 30)
#   BACKUP_GPG_RECIPIENT   if set, encrypt the dump to this GPG recipient
#   MINIO_MIRROR_TARGET    if set (e.g. myminio/foodsafe-backups), `mc mirror`
#                          the backup dir into that off-host bucket
#   PG_DUMP_SNAPSHOT       if set, pg_dump exports from this exported snapshot id
#                          (pg_export_snapshot). Used by the restore rehearsal so
#                          the dump and the source verification read identical data
#                          even while the live DB is being written to.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/FoodSafe.BE/docker-compose.yml}"
PG_SERVICE="${PG_SERVICE:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-FoodSafe}"
POSTGRES_USER="${POSTGRES_USER:-foodsafe}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/FoodSafe.BE/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
MANIFEST="$BACKUP_DIR/manifest.log"

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BASENAME="foodsafe-${POSTGRES_DB}-${STAMP}.dump"
DUMP_PATH="$BACKUP_DIR/$BASENAME"
START_EPOCH="$(date -u +%s)"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# pgx runs a client command against PostgreSQL. Default path talks to the Compose
# service; set PG_CONTAINER to exec into a plain container instead (used by CI,
# where PostgreSQL is a bare service container rather than a Compose stack).
pgx() {
  if [ -n "${PG_CONTAINER:-}" ]; then docker exec -i "$PG_CONTAINER" "$@";
  else dc exec -T "$PG_SERVICE" "$@"; fi
}

record() {
  # record <outcome> <size_bytes> <sha256> <restore_point>
  printf '{"time":"%s","db":"%s","file":"%s","restore_point":"%s","size_bytes":%s,"sha256":"%s","elapsed_s":%s,"outcome":"%s"}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$POSTGRES_DB" "$BASENAME" "$4" "$2" "$3" \
    "$(( $(date -u +%s) - START_EPOCH ))" "$1" >> "$MANIFEST"
}

fail() {
  echo "BACKUP FAILED: $*" >&2
  record "FAILED" "0" "-" "-"
  exit 1
}

echo "==> Backing up database '$POSTGRES_DB' via compose service '$PG_SERVICE'"
# Capture the current restore point (latest applied EF migration) for the manifest.
RESTORE_POINT="$(pgx psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
  'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1;' 2>/dev/null | tr -d '\r' || echo 'unknown')"

# Stream a custom-format dump out of the container to the host.
# An optional pre-exported snapshot pins the dump to a specific consistent point
# in time (used by the rehearsal to defeat concurrent writers during verification).
SNAPSHOT_ARG=()
[ -n "${PG_DUMP_SNAPSHOT:-}" ] && SNAPSHOT_ARG=(--snapshot="$PG_DUMP_SNAPSHOT")
if ! pgx pg_dump -U "$POSTGRES_USER" \
      --format=custom --no-owner --no-privileges "${SNAPSHOT_ARG[@]}" "$POSTGRES_DB" > "$DUMP_PATH" 2>/dev/null; then
  rm -f "$DUMP_PATH"
  fail "pg_dump did not complete"
fi

[ -s "$DUMP_PATH" ] || fail "dump file is empty"

# Optional encryption for off-host storage.
if [ -n "${BACKUP_GPG_RECIPIENT:-}" ]; then
  gpg --yes --batch --encrypt --recipient "$BACKUP_GPG_RECIPIENT" "$DUMP_PATH" \
    || fail "GPG encryption failed"
  rm -f "$DUMP_PATH"
  DUMP_PATH="$DUMP_PATH.gpg"
  BASENAME="$BASENAME.gpg"
  echo "==> Encrypted to $BASENAME"
else
  echo "WARNING: backup is not encrypted (BACKUP_GPG_RECIPIENT unset). Ensure the" >&2
  echo "         storage target provides encryption at rest for off-host copies." >&2
fi

SIZE="$(wc -c < "$DUMP_PATH" | tr -d ' ')"
SHA="$(sha256sum "$DUMP_PATH" | awk '{print $1}')"
echo "$SHA  $BASENAME" > "$DUMP_PATH.sha256"

# Off-host mirror (optional).
if [ -n "${MINIO_MIRROR_TARGET:-}" ]; then
  echo "==> Mirroring backups to $MINIO_MIRROR_TARGET"
  mc mirror --overwrite "$BACKUP_DIR" "$MINIO_MIRROR_TARGET" || fail "mc mirror failed"
fi

# Retention pruning.
find "$BACKUP_DIR" -type f \( -name '*.dump' -o -name '*.dump.gpg' -o -name '*.sha256' \) \
  -mtime "+$BACKUP_RETENTION_DAYS" -print -delete 2>/dev/null | sed 's/^/pruned: /' || true

record "SUCCESS" "$SIZE" "$SHA" "$RESTORE_POINT"
echo "==> Backup OK: $BASENAME ($SIZE bytes), restore_point=$RESTORE_POINT"
echo "==> sha256=$SHA"
