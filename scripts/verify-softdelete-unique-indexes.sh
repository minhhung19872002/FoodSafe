#!/usr/bin/env bash
#
# Regression test for production condition C-4.
#
# Proves that migration 20260727181120_SoftDeleteFilterOnCertificateNumbers makes
# the six certificate/registration UNIQUE indexes SOFT-DELETE AWARE by adding the
# partial predicate `WHERE is_deleted = FALSE`. It runs the REAL migration via
# `dotnet ef` against a real, disposable PostgreSQL database — no mocking, no
# InMemory.
#
# Two things are proven:
#
#   1. STRUCTURAL: all six UNIQUE indexes exist WITH the `is_deleted` predicate.
#        uq_self_declarations_business_number, uq_product_registrations_number,
#        uq_export_food_certificates_number, uq_eligibility_certificates_number,
#        uq_cfs_certificates_number, uq_advertisement_registrations_number.
#
#   2. BEHAVIOURAL (product_registrations, representative single-column index):
#        a) insert an active row with number N            -> succeeds
#        b) soft-delete it (is_deleted = TRUE)            -> succeeds
#        c) insert a NEW active row reusing number N      -> MUST SUCCEED  (the fix)
#        d) insert a SECOND active row reusing number N   -> MUST FAIL     (uniqueness
#                                                                            among live
#                                                                            rows preserved)
#
# Before the fix the index had no predicate, so step (c) failed with a unique
# violation — a soft-deleted licence number could never be reissued.
#
# Usage: scripts/verify-softdelete-unique-indexes.sh
#
# Environment (same contract as verify-migration-nondestructive.sh):
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
TARGET_MIG="20260727181120_SoftDeleteFilterOnCertificateNumbers"

UNIQUE_INDEXES=(
  uq_self_declarations_business_number
  uq_product_registrations_number
  uq_export_food_certificates_number
  uq_eligibility_certificates_number
  uq_cfs_certificates_number
  uq_advertisement_registrations_number
)

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
TEST_DB="softdel_uq_regr_$STAMP"

dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
# pgx: admin/seed/verify psql (local socket — no password needed as container user)
pgx() {
  if [ -n "${PG_CONTAINER:-}" ]; then docker exec -i "$PG_CONTAINER" "$@";
  else dc exec -T "$PG_SERVICE" "$@"; fi
}
psqlc() { pgx psql -U "$PGUSER" -d "$1" -v ON_ERROR_STOP=1 -tAc "$2" 2>&1 | tr -d '\r'; }
psql_admin() { pgx psql -U "$PGUSER" -d postgres -v ON_ERROR_STOP=1 -c "$1" >/dev/null 2>&1; }

# Run one SQL statement, expecting it to SUCCEED. Fails the test otherwise.
psql_expect_ok() { # <db> <sql> <label>
  if ! pgx psql -U "$PGUSER" -d "$1" -v ON_ERROR_STOP=1 -tAc "$2" >/dev/null 2>&1; then
    fail "$3: statement was expected to SUCCEED but errored"
  fi
}
# Run one SQL statement, expecting it to FAIL. Fails the test if it succeeds.
psql_expect_fail() { # <db> <sql> <label>
  if pgx psql -U "$PGUSER" -d "$1" -v ON_ERROR_STOP=1 -tAc "$2" >/dev/null 2>&1; then
    fail "$3: statement was expected to FAIL (unique violation) but SUCCEEDED"
  fi
}

ef_update() { # <db> <migration>
  ( cd "$BE" \
    && ASPNETCORE_ENVIRONMENT=Development \
       ConnectionStrings__Default="Host=$PGHOST;Port=$PGPORT;Database=$1;Username=$PGUSER;Password=$PGPASSWORD" \
       dotnet ef database update "$2" \
         --project "$EF_PROJECT" --startup-project "$EF_STARTUP" \
         --configuration Release --no-build )
}

cleanup() { psql_admin "DROP DATABASE IF EXISTS \"$TEST_DB\";" || true; }
fail() { echo "SOFT-DELETE UNIQUE-INDEX REGRESSION FAILED: $*" >&2; cleanup; exit 1; }
trap cleanup EXIT

command -v dotnet >/dev/null 2>&1 || fail "dotnet is required on PATH"
[ -n "$PGPASSWORD" ] || fail "PGPASSWORD not set and not found in FoodSafe.BE/.env"

echo "==> Ensuring dotnet-ef tool is available"
( cd "$BE" && dotnet tool restore >/dev/null 2>&1 ) || true

echo "==> Creating disposable database $TEST_DB and migrating through $TARGET_MIG"
psql_admin "DROP DATABASE IF EXISTS \"$TEST_DB\";"
psql_admin "CREATE DATABASE \"$TEST_DB\";"
ef_update "$TEST_DB" "$TARGET_MIG" >/dev/null 2>&1 \
  || fail "could not migrate $TEST_DB to $TARGET_MIG"

# =============================================================================
echo "==> [1/2] All six UNIQUE indexes must carry the is_deleted predicate"
for idx in "${UNIQUE_INDEXES[@]}"; do
  DEF="$(psqlc "$TEST_DB" "SELECT indexdef FROM pg_indexes WHERE indexname = '$idx';")"
  [ -n "$DEF" ] || fail "index $idx is missing after migration"
  echo "$DEF" | grep -qi 'UNIQUE'      || fail "index $idx is not UNIQUE: $DEF"
  echo "$DEF" | grep -qi 'is_deleted'  || fail "index $idx has NO is_deleted predicate (soft-delete unsafe): $DEF"
  echo "    OK: $idx -> partial UNIQUE WHERE is_deleted"
done

# =============================================================================
echo "==> [2/2] product_registrations: a soft-deleted number can be reissued,"
echo "          but two live rows cannot share a number"
NUM="PR-REUSE-$STAMP"

# (a) insert an active row with number N
psql_expect_ok "$TEST_DB" "
SET session_replication_role = replica;
INSERT INTO product_registrations
  (id, business_id, organization_id, product_name, registration_number,
   registration_date, status, is_deleted, extra_properties, concurrency_stamp, creation_time)
VALUES
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'regr', '$NUM',
   now(), 1, false, '{}', 'regr', now());" \
  "insert original active row"
echo "    OK: original active row inserted with number $NUM"

# (b) soft-delete it
psql_expect_ok "$TEST_DB" "
UPDATE product_registrations
   SET is_deleted = true, deletion_time = now()
 WHERE registration_number = '$NUM';" \
  "soft-delete original row"
echo "    OK: original row soft-deleted"

# (c) reuse the same number on a NEW active row — MUST SUCCEED (the fix)
psql_expect_ok "$TEST_DB" "
SET session_replication_role = replica;
INSERT INTO product_registrations
  (id, business_id, organization_id, product_name, registration_number,
   registration_date, status, is_deleted, extra_properties, concurrency_stamp, creation_time)
VALUES
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'regr', '$NUM',
   now(), 1, false, '{}', 'regr', now());" \
  "reissue number after soft-delete"
echo "    OK: number $NUM reissued on a new active row after soft-delete (the fix)"

# (d) a SECOND live row with the same number — MUST FAIL (uniqueness among live rows)
psql_expect_fail "$TEST_DB" "
SET session_replication_role = replica;
INSERT INTO product_registrations
  (id, business_id, organization_id, product_name, registration_number,
   registration_date, status, is_deleted, extra_properties, concurrency_stamp, creation_time)
VALUES
  (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'regr', '$NUM',
   now(), 1, false, '{}', 'regr', now());" \
  "duplicate live number"
echo "    OK: a second live row with number $NUM was rejected (uniqueness preserved)"

# sanity: exactly one live row + one soft-deleted row carry the number
LIVE="$(psqlc "$TEST_DB" "SELECT count(*) FROM product_registrations WHERE registration_number = '$NUM' AND is_deleted = false;")"
DEAD="$(psqlc "$TEST_DB" "SELECT count(*) FROM product_registrations WHERE registration_number = '$NUM' AND is_deleted = true;")"
[ "$LIVE" = "1" ] || fail "expected exactly 1 live row with $NUM, got $LIVE"
[ "$DEAD" = "1" ] || fail "expected exactly 1 soft-deleted row with $NUM, got $DEAD"

echo
echo "PASS: $TARGET_MIG makes the six certificate/registration UNIQUE indexes"
echo "      soft-delete aware. A soft-deleted number can be reissued while two"
echo "      live rows still cannot share a number."
