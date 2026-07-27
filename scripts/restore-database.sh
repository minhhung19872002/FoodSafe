#!/usr/bin/env bash
#
# PostgreSQL logical restore for FoodSafe.
#
# Addresses production blocker B-2. Implements the "Recovery sequence" logical
# restore from docs/40-disaster-recovery-guide.md:
#   - restores into a FRESH database (never overwrites the live database)
#   - pg_restore --single-transaction --exit-on-error --no-owner --no-privileges
#   - refuses to target the configured live database name unless FORCE=1
#
# Usage:
#   scripts/restore-database.sh <dump-file> <target-db>
#
# Environment:
#   COMPOSE_FILE     docker compose file (default FoodSafe.BE/docker-compose.yml)
#   PG_SERVICE       compose service (default postgres)
#   POSTGRES_USER    database user (default foodsafe)
#   POSTGRES_DB      live database name — guarded against overwrite (default FoodSafe)
#   BACKUP_GPG_RECIPIENT  set if the dump is *.gpg and must be decrypted first
#   FORCE=1          allow restoring onto the live database name (dangerous)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/FoodSafe.BE/docker-compose.yml}"
PG_SERVICE="${PG_SERVICE:-postgres}"
POSTGRES_USER="${POSTGRES_USER:-foodsafe}"
LIVE_DB="${POSTGRES_DB:-FoodSafe}"

DUMP_FILE="${1:-}"
TARGET_DB="${2:-}"

[ -n "$DUMP_FILE" ] && [ -n "$TARGET_DB" ] || {
  echo "usage: $0 <dump-file> <target-db>" >&2; exit 2;
}
[ -f "$DUMP_FILE" ] || { echo "dump file not found: $DUMP_FILE" >&2; exit 2; }

if [ "$TARGET_DB" = "$LIVE_DB" ] && [ "${FORCE:-0}" != "1" ]; then
  echo "REFUSING to restore onto the live database '$LIVE_DB'." >&2
  echo "Restore into a fresh database, or set FORCE=1 only if you accept overwrite." >&2
  exit 1
fi

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# pgx runs a client command against PostgreSQL. Default path talks to the Compose
# service; set PG_CONTAINER to exec into a plain container instead (used by CI).
pgx() {
  if [ -n "${PG_CONTAINER:-}" ]; then docker exec -i "$PG_CONTAINER" "$@";
  else dc exec -T "$PG_SERVICE" "$@"; fi
}

# Decrypt if needed, into a temp plaintext dump.
WORK=""
if [[ "$DUMP_FILE" == *.gpg ]]; then
  [ -n "${BACKUP_GPG_RECIPIENT:-}" ] || echo "note: decrypting with default GPG keyring" >&2
  WORK="$(mktemp)"
  gpg --yes --batch --decrypt --output "$WORK" "$DUMP_FILE" || { rm -f "$WORK"; echo "decrypt failed" >&2; exit 1; }
  DUMP_FILE="$WORK"
fi
cleanup() { [ -n "$WORK" ] && rm -f "$WORK" || true; }
trap cleanup EXIT

echo "==> Creating fresh target database '$TARGET_DB'"
pgx psql -U "$POSTGRES_USER" -d postgres \
  -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$TARGET_DB\";" -c "CREATE DATABASE \"$TARGET_DB\";" \
  || { echo "could not create target database" >&2; exit 1; }

echo "==> Restoring dump into '$TARGET_DB'"
# pg_restore reads the dump from stdin (streamed into the container).
if pgx pg_restore -U "$POSTGRES_USER" --exit-on-error --single-transaction \
      --no-owner --no-privileges --dbname "$TARGET_DB" < "$DUMP_FILE"; then
  echo "==> Restore completed without errors into '$TARGET_DB'"
else
  echo "RESTORE FAILED into '$TARGET_DB'" >&2
  exit 1
fi
