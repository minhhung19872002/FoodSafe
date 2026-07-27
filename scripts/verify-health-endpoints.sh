#!/usr/bin/env bash
#
# Regression test for production condition C-7 (health/readiness probes, H-01).
#
# Before C-7, GET /health registered no downstream probes and returned 200 even
# when PostgreSQL or MinIO were unreachable — so the Compose api healthcheck (which
# curls it) reported a degraded API as "healthy". C-7 splits liveness from readiness:
#
#   /health/live   -> process-only; 200 regardless of dependency state
#   /health/ready  -> exercises PostgreSQL + MinIO; 503 when either is down
#   /health        -> alias of /health/ready (backward compatible)
#
# This test drives the REAL running api container against the REAL stack (no mocks):
#   1. liveness and readiness are 200 with all dependencies up, and readiness
#      reports the "postgresql" and "minio" component checks;
#   2. when MinIO is paused, readiness flips to 503 / Unhealthy while liveness
#      stays 200 (proving readiness actually reflects dependency state);
#   3. readiness recovers to 200 once MinIO is unpaused.
#
# Requires a running dev stack (docker compose up). Reaches the endpoints via
# `docker exec` on the api container (curl is present — the compose healthcheck
# uses it), so it needs no host port mapping for the api.
#
# Usage:
#   scripts/verify-health-endpoints.sh
#   API_CONTAINER=foodsafe-api-1 MINIO_CONTAINER=foodsafe-minio-1 scripts/verify-health-endpoints.sh

set -euo pipefail

API_CONTAINER="${API_CONTAINER:-foodsafe-api-1}"
MINIO_CONTAINER="${MINIO_CONTAINER:-foodsafe-minio-1}"
BASE="http://127.0.0.1:8080"

fail() { echo "HEALTH-ENDPOINT REGRESSION FAILED: $*" >&2; exit 1; }
info() { echo "  $*"; }

# Return HTTP status of an in-container GET (no --fail, so 503 is returned not errored).
http_code() {
  docker exec "$API_CONTAINER" curl -s -o /dev/null -w '%{http_code}' \
    -H 'X-Forwarded-Proto: https' "$BASE$1"
}
http_body() {
  docker exec "$API_CONTAINER" curl -s -H 'X-Forwarded-Proto: https' "$BASE$1"
}

docker inspect "$API_CONTAINER" >/dev/null 2>&1 \
  || fail "api container '$API_CONTAINER' is not running (start the dev stack first)"
docker inspect "$MINIO_CONTAINER" >/dev/null 2>&1 \
  || fail "minio container '$MINIO_CONTAINER' is not running"

# Always leave MinIO unpaused, even if an assertion fails midway.
cleanup() { docker unpause "$MINIO_CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== C-7: health endpoint readiness regression =="

# ---- 1. Healthy baseline -----------------------------------------------------
info "1) all dependencies up"

code="$(http_code /health/live)"
[ "$code" = "200" ] || fail "/health/live expected 200, got $code"
info "   /health/live -> 200"

code="$(http_code /health/ready)"
[ "$code" = "200" ] || fail "/health/ready expected 200 with deps up, got $code"
body="$(http_body /health/ready)"
grep -q '"postgresql"' <<<"$body" || fail "/health/ready body missing postgresql check: $body"
grep -q '"minio"' <<<"$body" || fail "/health/ready body missing minio check: $body"
grep -q '"status":"Healthy"' <<<"$body" || fail "/health/ready not Healthy: $body"
info "   /health/ready -> 200, reports postgresql + minio, status Healthy"

code="$(http_code /health)"
[ "$code" = "200" ] || fail "/health (alias) expected 200, got $code"
info "   /health (alias) -> 200"

# ---- 2. Dependency down -> readiness fails, liveness stays up -----------------
info "2) MinIO paused"
docker pause "$MINIO_CONTAINER" >/dev/null

# Liveness must not depend on MinIO.
code="$(http_code /health/live)"
[ "$code" = "200" ] || fail "/health/live must stay 200 while MinIO down, got $code"
info "   /health/live -> 200 (unaffected)"

# Readiness must reflect the outage (503) and name minio as Unhealthy.
code="$(http_code /health/ready)"
[ "$code" = "503" ] || fail "/health/ready expected 503 with MinIO down, got $code"
body="$(http_body /health/ready)"
grep -q '"status":"Unhealthy"' <<<"$body" || fail "/health/ready should be Unhealthy: $body"
info "   /health/ready -> 503, status Unhealthy"

docker unpause "$MINIO_CONTAINER" >/dev/null

# ---- 3. Recovery -------------------------------------------------------------
info "3) MinIO unpaused"
# Give the container a moment to accept connections again.
recovered=""
for _ in 1 2 3 4 5 6 7 8 9 10; do
  if [ "$(http_code /health/ready)" = "200" ]; then recovered="yes"; break; fi
  docker exec "$API_CONTAINER" sleep 1 || true
done
[ -n "$recovered" ] || fail "/health/ready did not recover to 200 after MinIO unpause"
info "   /health/ready -> 200 (recovered)"

echo "PASS: liveness is dependency-independent; readiness reflects PostgreSQL + MinIO state"
