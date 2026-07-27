#!/usr/bin/env bash
#
# Backup + restore rehearsal for FoodSafe (production blocker B-2 evidence).
#
# This is the automated proof required by the "Rehearsal and release gate"
# section of docs/40-disaster-recovery-guide.md. It:
#   1. Exports a consistent snapshot of the live database (pg_export_snapshot)
#      and holds it open so the dump and the source verification read the
#      IDENTICAL point in time — even while the live DB is being written to.
#   2. Reads the source's expected state (migration id, table count, business
#      row counts) from that snapshot.
#   3. Takes a real backup pinned to that same snapshot (scripts/backup-database.sh).
#   4. Restores it into a throwaway database (scripts/restore-database.sh).
#   5. Verifies the restore against the snapshot-consistent source figures:
#        - EF migration history (latest MigrationId) matches
#        - table count matches
#        - row counts of key business tables match exactly
#   6. Measures elapsed recovery time (RTO indicator).
#   7. Drops the throwaway database.
#
# Comparing against a held snapshot (rather than a second live read) is what
# makes the row-count check trustworthy: a naive live-vs-restore comparison
# races any concurrent writer and produces false failures.
#
# Exit 0 = rehearsal passed. Non-zero = the restore is not trustworthy.
#
# Usage: scripts/rehearse-restore.sh
# Requires the Compose stack (postgres service) to be running.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_ROOT/FoodSafe.BE/docker-compose.yml}"
PG_SERVICE="${PG_SERVICE:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-FoodSafe}"
POSTGRES_USER="${POSTGRES_USER:-foodsafe}"
REHEARSAL_DB="${POSTGRES_DB}_rehearsal_$(date -u +%Y%m%d%H%M%S)"
SNAPSHOT_HOLD_SECS="${SNAPSHOT_HOLD_SECS:-300}"

export COMPOSE_FILE PG_SERVICE POSTGRES_DB POSTGRES_USER

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }

# pgx runs a client command against PostgreSQL. Default path talks to the Compose
# service; set PG_CONTAINER to exec into a plain container instead (used by CI).
# PG_CONTAINER is exported so the backup/restore sub-scripts inherit the mode.
pgx() {
  if [ -n "${PG_CONTAINER:-}" ]; then docker exec -i "$PG_CONTAINER" "$@";
  else dc exec -T "$PG_SERVICE" "$@"; fi
}
[ -n "${PG_CONTAINER:-}" ] && export PG_CONTAINER

# q <db> <sql> -> scalar (live read)
q() { pgx psql -U "$POSTGRES_USER" -d "$1" -tAc "$2" 2>/dev/null | tr -d '\r'; }

HOLDER_PID=""
SNAP_OUT=""
cleanup() {
  [ -n "$HOLDER_PID" ] && kill "$HOLDER_PID" 2>/dev/null || true
  [ -n "$SNAP_OUT" ] && rm -f "$SNAP_OUT" || true
  pgx psql -U "$POSTGRES_USER" -d postgres \
    -c "DROP DATABASE IF EXISTS \"$REHEARSAL_DB\";" >/dev/null 2>&1 || true
}
fail() { echo "REHEARSAL FAILED: $*" >&2; cleanup; exit 1; }
trap cleanup EXIT

START="$(date -u +%s)"

# --- [1/5] Export a consistent snapshot of the live DB and hold it open --------
echo "==> [1/5] Export consistent snapshot of live database"
SNAP_OUT="$(mktemp)"
(
  pgx psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atq <<SQL
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT pg_export_snapshot();
SELECT pg_sleep($SNAPSHOT_HOLD_SECS);
SQL
) > "$SNAP_OUT" 2>/dev/null &
HOLDER_PID=$!

SNAP=""
for _ in $(seq 1 50); do
  SNAP="$(head -1 "$SNAP_OUT" 2>/dev/null | tr -d '\r')"
  [ -n "$SNAP" ] && break
  sleep 0.2
done
[ -n "$SNAP" ] || fail "could not export a consistent snapshot"
echo "    snapshot=$SNAP (held for verification)"

# sread <sql> -> scalar, read from the SAME snapshot the dump will use
sread() {
  pgx psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atq <<SQL 2>/dev/null | tr -d '\r' | tail -1
BEGIN ISOLATION LEVEL REPEATABLE READ;
SET TRANSACTION SNAPSHOT '$SNAP';
$1
COMMIT;
SQL
}

SRC_MIG="$(sread 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1;')"
SRC_TABLES="$(sread "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
[ -n "$SRC_MIG" ] || fail "source has no migration history"
declare -A SRC_ROWS
CHECKED=0
for tbl in AbpUsers organizations businesses cat_provinces cat_communes; do
  exists="$(sread "SELECT to_regclass('public.\"$tbl\"') IS NOT NULL;")"
  [ "$exists" = "t" ] || continue
  SRC_ROWS[$tbl]="$(sread "SELECT count(*) FROM \"$tbl\";")"
  CHECKED=$((CHECKED+1))
done
[ "$CHECKED" -gt 0 ] || fail "no known business tables were found to verify"

# --- [2/5] Backup the live DB pinned to that snapshot -------------------------
echo "==> [2/5] Backup live database (pinned to snapshot)"
BK_OUT="$(PG_DUMP_SNAPSHOT="$SNAP" bash "$REPO_ROOT/scripts/backup-database.sh")" || fail "backup step failed"
echo "$BK_OUT" | sed 's/^/    /'
DUMP="$(ls -t "$REPO_ROOT/FoodSafe.BE/backups/"*.dump 2>/dev/null | head -1)"
[ -n "$DUMP" ] && [ -f "$DUMP" ] || fail "no dump produced"

# The snapshot has served its purpose; release the holder transaction.
kill "$HOLDER_PID" 2>/dev/null || true
HOLDER_PID=""

# --- [3/5] Restore into a throwaway database ----------------------------------
echo "==> [3/5] Restore into throwaway database '$REHEARSAL_DB'"
bash "$REPO_ROOT/scripts/restore-database.sh" "$DUMP" "$REHEARSAL_DB" >/dev/null || fail "restore step failed"

# --- [4/5] Verify restored data against the snapshot-consistent source --------
echo "==> [4/5] Verify restored data against source snapshot"
DST_MIG="$(q "$REHEARSAL_DB" 'SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY "MigrationId" DESC LIMIT 1;')"
[ "$SRC_MIG" = "$DST_MIG" ] || fail "migration mismatch: source=$SRC_MIG restored=$DST_MIG"
echo "    migration history matches: $DST_MIG"

DST_TABLES="$(q "$REHEARSAL_DB" "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")"
[ "$SRC_TABLES" = "$DST_TABLES" ] || fail "table count mismatch: source=$SRC_TABLES restored=$DST_TABLES"
echo "    table count matches: $DST_TABLES"

MISMATCH=0
for tbl in "${!SRC_ROWS[@]}"; do
  d="$(q "$REHEARSAL_DB" "SELECT count(*) FROM \"$tbl\";")"
  if [ "${SRC_ROWS[$tbl]}" != "$d" ]; then
    echo "    ROW MISMATCH $tbl: source=${SRC_ROWS[$tbl]} restored=$d"; MISMATCH=1
  else
    echo "    $tbl rows match: $d"
  fi
done
[ "$MISMATCH" = "0" ] || fail "row count mismatch in at least one table"

# --- [5/5] Drop the throwaway database ----------------------------------------
echo "==> [5/5] Drop throwaway database"
pgx psql -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$REHEARSAL_DB\";" >/dev/null 2>&1 || true

ELAPSED=$(( $(date -u +%s) - START ))
echo
echo "PASS: backup + restore rehearsal succeeded in ${ELAPSED}s (RTO objective: < 4h)."
echo "      Verified against a consistent snapshot: migration history, table count,"
echo "      and business row counts all match."
