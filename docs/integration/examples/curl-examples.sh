#!/usr/bin/env bash
# FoodSafe Partner API — curl examples (INT-03 / FR-50-05).
# Usage: BASE_URL=... API_KEY=fsp_... ./curl-examples.sh
# Each request generates a fresh X-Timestamp; reuse X-Request-Id ONLY to retry
# the same logical batch (that is the idempotency contract).
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8080}"
API_KEY="${API_KEY:?Set API_KEY to your issued raw key (fsp_...)}"
HERE="$(cd "$(dirname "$0")" && pwd)"

submit() { # submit <dataTypeSegment> <requestId> <payloadFile>
  curl -sS -w "\nHTTP %{http_code}\n" \
    -X POST "$BASE_URL/api/v1/partner/submissions/$1" \
    -H "Content-Type: application/json" \
    -H "X-Api-Key: $API_KEY" \
    -H "X-Request-Id: $2" \
    -H "X-Timestamp: $(date -u +%s)" \
    -H "X-Correlation-Id: curl-example-$(date -u +%Y%m%dT%H%M%SZ)" \
    --data @"$3"
}

echo "== 1. Submit an alert batch (expected: 200, duplicate:false) =="
submit alert "alert-batch-$(date -u +%Y%m%d)-001" "$HERE/alert-submission.json"

echo "== 2. Redeliver the SAME X-Request-Id (expected: 200, duplicate:true, same submissionId) =="
submit alert "alert-batch-$(date -u +%Y%m%d)-001" "$HERE/alert-submission.json"

echo "== 3. Food-poisoning case with Vietnamese Unicode payload (expected: 200) =="
submit food-poisoning "ndtp-$(date -u +%Y%m%d)-001" "$HERE/food-poisoning-submission.json"

echo "== 4. Inspection result (expected: 200 if 'inspection-result' is on your allow-list, else 403 DataTypeNotAllowed) =="
submit inspection-result "ttkt-$(date -u +%Y%m%d)-001" "$HERE/inspection-result-submission.json"

echo "== 5. ISO-8601 timestamp variant (expected: 200) =="
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/v1/partner/submissions/alert" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Request-Id: alert-iso-$(date -u +%s)" \
  -H "X-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --data @"$HERE/alert-submission.json"

echo "== 6. Error demo: stale timestamp (expected: 400 StaleTimestamp) =="
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/v1/partner/submissions/alert" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Request-Id: stale-demo-$(date -u +%s)" \
  -H "X-Timestamp: $(( $(date -u +%s) - 600 ))" \
  --data @"$HERE/alert-submission.json"

echo "== 7. Error demo: unknown data type (expected: 400 UnknownDataType) =="
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/v1/partner/submissions/does-not-exist" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Request-Id: unknown-demo-$(date -u +%s)" \
  -H "X-Timestamp: $(date -u +%s)" \
  --data @"$HERE/alert-submission.json"

echo "== 8. Error demo: bad key (expected: 401 InvalidApiKey — generic by design) =="
curl -sS -w "\nHTTP %{http_code}\n" \
  -X POST "$BASE_URL/api/v1/partner/submissions/alert" \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: fsp_0000000000000000000000000000000000000000" \
  -H "X-Request-Id: badkey-demo-$(date -u +%s)" \
  -H "X-Timestamp: $(date -u +%s)" \
  --data @"$HERE/alert-submission.json"
