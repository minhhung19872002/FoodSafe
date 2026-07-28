#!/usr/bin/env bash
#
# Regression test for production blocker B-1 (missing FoodSafe.FE/Dockerfile.prod
# / unverified HTTPS/TLS/HSTS/IPv6 path).
#
# Builds the production frontend image, runs it with a throwaway self-signed
# certificate, and asserts the full production edge behaviour end to end:
#
#   1. Dockerfile.prod exists and the image builds.
#   2. nginx config is syntactically valid after envsubst templating.
#   3. HTTP /healthz returns 200 without redirecting (load-balancer probe).
#   4. HTTP / issues a 301 redirect to HTTPS.
#   5. HTTPS / serves the SPA over TLS 1.2/1.3.
#   6. The SPA document response carries HSTS + CSP + the security header set
#      (guards against the add_header inheritance regression).
#   7. Both IPv4 and IPv6 listeners are present.
#
# Exit code 0 = all assertions passed. Non-zero = a regression.
#
# Usage:  scripts/verify-prod-frontend.sh
# Requires: docker, curl, openssl.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FE_DIR="$REPO_ROOT/FoodSafe.FE"
IMAGE="foodsafe-frontend:prod-verify"
CONTAINER="fs-prod-fe-verify"
HTTP_PORT="${HTTP_PORT:-8091}"
HTTPS_PORT="${HTTPS_PORT:-8453}"
WORK="$(mktemp -d)"

fail() { echo "FAIL: $*" >&2; exit 1; }
cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "==> [1/7] Dockerfile.prod present"
[ -f "$FE_DIR/Dockerfile.prod" ] || fail "FoodSafe.FE/Dockerfile.prod is missing"

echo "==> [2/7] Building production frontend image"
( cd "$FE_DIR" && docker build -f Dockerfile.prod -t "$IMAGE" . ) >/dev/null \
  || fail "production frontend image did not build"

echo "==> Generating throwaway self-signed certificate"
openssl req -x509 -newkey rsa:2048 -nodes \
  -keyout "$WORK/tls.key" -out "$WORK/tls.crt" \
  -days 1 -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost" >/dev/null 2>&1 \
  || fail "could not generate test certificate"
# nginx runs unprivileged (uid 101); the key must be readable by that user.
chmod 644 "$WORK/tls.key" "$WORK/tls.crt"

echo "==> Starting container"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" --add-host api:127.0.0.1 \
  -e SSL_CERT_PATH=/run/secrets/tls.crt -e SSL_KEY_PATH=/run/secrets/tls.key \
  -v "$WORK/tls.crt:/run/secrets/tls.crt:ro" \
  -v "$WORK/tls.key:/run/secrets/tls.key:ro" \
  -p "$HTTP_PORT:8080" -p "$HTTPS_PORT:8443" "$IMAGE" >/dev/null \
  || fail "container did not start"

# Wait for health.
for _ in $(seq 1 15); do
  st="$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER" 2>/dev/null || echo none)"
  [ "$st" = "healthy" ] && break
  sleep 2
done
[ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER")" = "true" ] \
  || { docker logs "$CONTAINER" | tail -20; fail "container is not running"; }

echo "==> [3/7] nginx config valid"
docker exec "$CONTAINER" nginx -t >/dev/null 2>&1 || fail "nginx -t failed"

echo "==> [4/7] HTTP /healthz returns 200 (no redirect)"
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$HTTP_PORT/healthz")"
[ "$code" = "200" ] || fail "/healthz returned $code, expected 200"

echo "==> [5/7] HTTP / redirects (301) to HTTPS"
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$HTTP_PORT/")"
loc="$(curl -s -o /dev/null -w '%{redirect_url}' "http://127.0.0.1:$HTTP_PORT/")"
[ "$code" = "301" ] || fail "HTTP / returned $code, expected 301"
case "$loc" in https://*) : ;; *) fail "HTTP / redirect target '$loc' is not https" ;; esac

echo "==> [6/7] HTTPS / serves SPA over TLS with HSTS + CSP"
code="$(curl -sk -o /dev/null -w '%{http_code}' "https://127.0.0.1:$HTTPS_PORT/")"
[ "$code" = "200" ] || fail "HTTPS / returned $code, expected 200"
headers="$(curl -sk -D - -o /dev/null "https://127.0.0.1:$HTTPS_PORT/")"
echo "$headers" | grep -iq "^strict-transport-security: max-age=31536000" \
  || fail "HSTS header missing on SPA document response"
echo "$headers" | grep -iq "^content-security-policy:" \
  || fail "CSP header missing on SPA document response"
echo "$headers" | grep -iq "^x-frame-options: DENY" \
  || fail "X-Frame-Options header missing on SPA document response"
# TLS 1.2 must succeed; TLS 1.1 must be refused.
curl -sk --tlsv1.2 -o /dev/null "https://127.0.0.1:$HTTPS_PORT/" \
  || fail "TLS 1.2 handshake failed"
if curl -sk --tls-max 1.1 -o /dev/null "https://127.0.0.1:$HTTPS_PORT/" 2>/dev/null; then
  fail "TLS 1.1 handshake succeeded but must be refused"
fi

echo "==> [7/7] IPv4 and IPv6 listeners present"
conf="$(docker exec "$CONTAINER" cat /etc/nginx/conf.d/default.conf)"
echo "$conf" | grep -q "listen \[::\]:8443 ssl" || fail "IPv6 HTTPS listener missing"
echo "$conf" | grep -q "listen 8443 ssl"        || fail "IPv4 HTTPS listener missing"

echo
echo "PASS: production frontend HTTPS/TLS/HSTS/IPv6 verified."
