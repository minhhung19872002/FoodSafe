#!/usr/bin/env bash
#
# Regression test for production condition C-6 (.env.example drift).
#
# A developer bootstrapping the stack copies FoodSafe.BE/.env.example to .env and
# runs `docker compose up`. Every compose variable written as ${VAR:?...} or a bare
# ${VAR} has NO default, so Compose aborts if it is unset. Any such variable that is
# missing from .env.example makes a fresh clone unbootable (this is exactly how
# REDIS_PASSWORD drifted — CI injects the vars into the job env, so `docker compose
# config` never caught it; only a human following the example hit the failure).
#
# This test parses the compose files for required (defaultless) variable references
# and asserts each has a key in .env.example. No Docker required.
#
# Usage: scripts/verify-env-example-complete.sh

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BE="$REPO_ROOT/FoodSafe.BE"
ENV_EXAMPLE="$BE/.env.example"
COMPOSE_FILES=("$BE/docker-compose.yml" "$BE/docker-compose.prod.yml")

fail() { echo "ENV-EXAMPLE DRIFT REGRESSION FAILED: $*" >&2; exit 1; }

[ -f "$ENV_EXAMPLE" ] || fail "missing $ENV_EXAMPLE"

# Keys present in .env.example (left-hand side of KEY=...).
EXAMPLE_KEYS="$(grep -oE '^[A-Z_][A-Z0-9_]*=' "$ENV_EXAMPLE" | sed 's/=$//' | sort -u)"

# Required (defaultless) variable references across all compose files:
#   ${VAR:?...}  ${VAR?...}  ${VAR}        -> required (no default) -> MUST be documented
#   ${VAR:-...}  ${VAR-...}               -> has a default          -> optional, ignored
required_vars() {
  for f in "${COMPOSE_FILES[@]}"; do
    [ -f "$f" ] || continue
    grep -oE '\$\{[A-Z_][A-Z0-9_]*(:?[-?][^}]*)?\}' "$f"
  done | sort -u | while read -r ref; do
    body="${ref#\$\{}"; body="${body%\}}"          # strip ${ and }
    case "$body" in
      *:-*|*-* ) : ;;                               # has a default -> optional
      *:\?*|*\?* ) echo "${body%%[:?]*}" ;;          # :? or ? default-less guard -> required
      * ) echo "$body" ;;                            # bare ${VAR} -> required
    esac
  done | sort -u
}

MISSING=""
while read -r var; do
  [ -n "$var" ] || continue
  if ! grep -qxF "$var" <<<"$EXAMPLE_KEYS"; then
    MISSING="$MISSING $var"
  fi
done < <(required_vars)

if [ -n "$MISSING" ]; then
  echo "The following defaultless compose variables are missing from .env.example:" >&2
  for v in $MISSING; do echo "  - $v" >&2; done
  fail "a fresh clone following .env.example cannot start the stack"
fi

echo "PASS: .env.example documents every defaultless compose variable"
echo "      (checked: ${COMPOSE_FILES[*]#$BE/})"
