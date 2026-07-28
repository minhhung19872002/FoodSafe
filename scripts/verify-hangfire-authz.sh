#!/usr/bin/env bash
#
# Real-stack regression for C-8 (doc 04 §3.7): the Hangfire dashboard requires an
# authenticated SystemAdministration principal, not merely a loopback origin.
#
# The primary vector is already closed by LocalRequestsOnlyAuthorizationFilter (B-5):
# a non-loopback request never reaches the dashboard. This test therefore drives the
# request from INSIDE the api container (127.0.0.1 — the loopback filter PASSES) to
# prove the second, independent control: an unauthenticated loopback request must be
# denied by HangfireAdminAuthorizationFilter.
#
# No mocks, no interception — real running api container against the real pipeline.
# Requires a running stack whose api image was built from the C-8 commit.
#
# Env overrides: API_CONTAINER (default foodsafe-api-1)
set -euo pipefail

API_CONTAINER="${API_CONTAINER:-foodsafe-api-1}"
BASE="http://127.0.0.1:8080"

code() {
  docker exec "$API_CONTAINER" curl -s -o /dev/null -w '%{http_code}' "$BASE$1"
}

echo "== C-8: Hangfire dashboard authorization =="

# Loopback origin (the LocalRequestsOnly filter passes) BUT unauthenticated.
# HangfireAdminAuthorizationFilter must deny → anything other than 200.
dash=$(code /hangfire)
echo "loopback unauthenticated GET /hangfire -> $dash"
if [ "$dash" = "200" ]; then
  echo "FAIL: dashboard served to an unauthenticated loopback request (defense-in-depth filter not enforcing)"
  exit 1
fi
case "$dash" in
  401|403|302) echo "PASS: unauthenticated loopback request denied ($dash)" ;;
  *) echo "FAIL: unexpected status $dash (expected 401/403/302 denial)"; exit 1 ;;
esac

# Liveness must be unaffected — the dashboard control does not touch app health.
live=$(code /health/live)
echo "GET /health/live -> $live"
[ "$live" = "200" ] || { echo "FAIL: liveness regressed ($live)"; exit 1; }

echo "== C-8 regression PASS =="
