#!/usr/bin/env bash
#
# Regression test for production blocker B-4.
#
# Proves that migration 20260727104254_AddMissingForeignKeys is PRODUCTION-SAFE
# (non-destructive) when the target database already contains rows whose foreign
# keys dangle. It runs the REAL migration file via `dotnet ef` against a real,
# disposable PostgreSQL database — no mocking, no InMemory.
#
# Two scenarios, each in its own throwaway database migrated to the state just
# BEFORE the FK migration, then seeded with an orphan and migrated forward:
#
#   1. Nullable dangling FK (atp_alerts.business_id):
#        Expect the migration to SUCCEED, the business record to SURVIVE, and the
#        dangling reference to be repaired to NULL (never deleted).
#
#   2. NOT NULL dangling FK (administrative_documents.document_type_id):
#        Expect the migration to ABORT with our guard message, and the record to
#        SURVIVE (transaction rolled back — never silently deleted).
#
# Before the fix, scenario 1 deleted the row and scenario 2 deleted the row.
#
# Usage: scripts/verify-migration-nondestructive.sh
#
# Environment:
#   PGHOST/PGPORT/PGUSER/PGPASSWORD   TCP connection dotnet ef uses (defaults suit
#                                     the local Compose stack; PGPASSWORD is read
#                                     from FoodSafe.BE/.env if unset).
#   PG_CONTAINER                      if set, admin/seed/verify psql runs via
#                                     `docker exec` into that container; otherwise
#                                     via the Compose postgres service.
#   COMPOSE_FILE / PG_SERVICE         Compose targeting for the psql helper.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BE="$REPO_ROOT/FoodSafe.BE"
EF_PROJECT="src/FoodSafe.EntityFrameworkCore"
EF_STARTUP="src/FoodSafe.HttpApi.Host"
PREV_MIG="20260727021916_AddNewsRecallAudit"
TARGET_MIG="20260727104254_AddMissingForeignKeys"

COMPOSE_FILE="${COMPOSE_FILE:-$BE/docker-compose.yml}"
PG_SERVICE="${PG_SERVICE:-postgres}"
PGHOST="${PGHOST:-127.0.0.1}"
PGPORT="${PGPORT:-5434}"
PGUSER="${PGUSER:-foodsafe}"
if [ -z "${PGPASSWORD:-}" ]; then
  PGPASSWORD="$(grep -E '^POSTGRES_PASSWORD=' "$BE/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '\r')"
fi
export PGPASSWORD

STAMP="$(date -u +%Y%m%d%H%M%S)"
NULL_DB="mig_regr_null_$STAMP"
ABORT_DB="mig_regr_abort_$STAMP"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
# pgx: admin/seed/verify psql (local socket — no password needed as container user)
pgx() {
  if [ -n "${PG_CONTAINER:-}" ]; then docker exec -i "$PG_CONTAINER" "$@";
  else dc exec -T "$PG_SERVICE" "$@"; fi
}
psqlc() { pgx psql -U "$PGUSER" -d "$1" -v ON_ERROR_STOP=1 -tAc "$2" 2>&1 | tr -d '\r'; }
psql_admin() { pgx psql -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; }

ef_update() { # <db> <migration>
  ( cd "$BE" \
    && ASPNETCORE_ENVIRONMENT=Development \
       ConnectionStrings__Default="Host=$PGHOST;Port=$PGPORT;Database=$1;Username=$PGUSER;Password=$PGPASSWORD" \
       dotnet ef database update "$2" \
         --project "$EF_PROJECT" --startup-project "$EF_STARTUP" \
         --configuration Release --no-build )
}

cleanup() {
  psql_admin "DROP DATABASE IF EXISTS \"$NULL_DB\";" || true
  psql_admin "DROP DATABASE IF EXISTS \"$ABORT_DB\";" || true
}
fail() { echo "MIGRATION REGRESSION FAILED: $*" >&2; cleanup; exit 1; }
trap cleanup EXIT

command -v dotnet >/dev/null 2>&1 || fail "dotnet is required on PATH"
[ -n "$PGPASSWORD" ] || fail "PGPASSWORD not set and not found in FoodSafe.BE/.env"

echo "==> Ensuring dotnet-ef tool is available"
( cd "$BE" && dotnet tool restore >/dev/null 2>&1 ) || true

# =============================================================================
echo "==> [1/2] Nullable dangling FK must be repaired to NULL, row preserved"
psql_admin "DROP DATABASE IF EXISTS \"$NULL_DB\";"
psql_admin "CREATE DATABASE \"$NULL_DB\";"
echo "    migrating $NULL_DB to pre-FK state ($PREV_MIG)"
ef_update "$NULL_DB" "$PREV_MIG" >/dev/null 2>&1 || fail "could not migrate $NULL_DB to $PREV_MIG"

echo "    seeding an atp_alert with an orphan business_id"
pgx psql -U "$PGUSER" -d "$NULL_DB" -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<'SQL' || fail "seed failed (null case)"
SET session_replication_role = replica;
INSERT INTO atp_alerts
  (id, organization_id, title, content, category, severity, source, status,
   is_public, extra_properties, concurrency_stamp, creation_time, business_id)
VALUES
  (gen_random_uuid(), gen_random_uuid(), 'regr', 'regr', 1, 1, 1, 1,
   false, '{}', 'regr', now(), gen_random_uuid());
SQL

echo "    applying $TARGET_MIG (must succeed)"
ef_update "$NULL_DB" "$TARGET_MIG" >/dev/null 2>&1 || fail "migration unexpectedly failed on nullable orphan"

CNT="$(psqlc "$NULL_DB" "SELECT count(*) FROM atp_alerts;")"
NULLED="$(psqlc "$NULL_DB" "SELECT count(*) FROM atp_alerts WHERE business_id IS NULL;")"
[ "$CNT" = "1" ] || fail "expected atp_alerts row to survive (count=1), got count=$CNT (DESTRUCTIVE)"
[ "$NULLED" = "1" ] || fail "expected dangling business_id to be repaired to NULL, got $NULLED nulled"
echo "    OK: row preserved (count=1) and business_id repaired to NULL"

# =============================================================================
echo "==> [2/2] NOT NULL dangling FK must abort the migration, row preserved"
psql_admin "DROP DATABASE IF EXISTS \"$ABORT_DB\";"
psql_admin "CREATE DATABASE \"$ABORT_DB\";"
echo "    migrating $ABORT_DB to pre-FK state ($PREV_MIG)"
ef_update "$ABORT_DB" "$PREV_MIG" >/dev/null 2>&1 || fail "could not migrate $ABORT_DB to $PREV_MIG"

echo "    seeding an administrative_document with an orphan document_type_id"
pgx psql -U "$PGUSER" -d "$ABORT_DB" -v ON_ERROR_STOP=1 >/dev/null 2>&1 <<'SQL' || fail "seed failed (abort case)"
SET session_replication_role = replica;
INSERT INTO administrative_documents
  (id, organization_id, document_type_id, document_number, title, issued_date,
   status, is_public, extra_properties, concurrency_stamp, creation_time)
VALUES
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'D-REGR', 'regr', now(),
   1, false, '{}', 'regr', now());
SQL

echo "    applying $TARGET_MIG (must abort with our guard)"
EF_LOG="$(mktemp)"
if ef_update "$ABORT_DB" "$TARGET_MIG" >"$EF_LOG" 2>&1; then
  rm -f "$EF_LOG"; fail "migration SUCCEEDED on a NOT NULL orphan — guard did not fire (DESTRUCTIVE risk)"
fi
grep -q "AddMissingForeignKeys aborted" "$EF_LOG" \
  || { echo "---- ef output ----"; tail -20 "$EF_LOG" >&2; rm -f "$EF_LOG"; fail "migration failed but not via our guard message"; }
rm -f "$EF_LOG"

CNT2="$(psqlc "$ABORT_DB" "SELECT count(*) FROM administrative_documents;")"
[ "$CNT2" = "1" ] || fail "expected administrative_documents row to survive abort (count=1), got count=$CNT2 (DESTRUCTIVE)"
echo "    OK: migration aborted via guard and the record was preserved (count=1)"

echo
echo "PASS: 20260727104254_AddMissingForeignKeys is non-destructive."
echo "      Nullable dangling FKs are repaired to NULL; NOT NULL dangling FKs abort"
echo "      the migration (transaction rolled back). No business rows are deleted."
