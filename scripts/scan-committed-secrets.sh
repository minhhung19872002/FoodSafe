#!/usr/bin/env bash
#
# Recurrence guard for production blocker B-3.
#
# Blocker B-3 was: credential values committed into tracked appsettings*.json
# (postgres/postgres connection password, the "change-this-in-production"
# encryption passphrase). Those were blanked at commit 06656c8; real secrets
# now live only in the git-ignored .env / appsettings.secrets.json.
#
# The Cloudflare Turnstile test SiteKey/SecretKey (1x0000...) is intentionally
# the DEV default in appsettings.json and is a public, always-passes dummy that
# CaptchaConfiguration.Validate already rejects in Production, so it is NOT a
# credential and is deliberately out of scope here.
#
# This script FAILS if any tracked appsettings*.json re-introduces a populated
# credential, so the regression cannot silently return. It is deliberately
# narrow (tracked config files only) to avoid false positives on the audit
# docs / tests that legitimately mention the historical values.
#
# Usage: scripts/scan-committed-secrets.sh
#
# Exit codes: 0 = clean, 1 = a credential value is committed in tracked config.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

fail=0
report() { echo "SECRET SCAN FAILURE: $*" >&2; fail=1; }

# All tracked appsettings*.json (Host, DbMigrator, test hosts, environment overlays).
mapfile -t files < <(git ls-files '*appsettings*.json')

for f in "${files[@]}"; do
  [ -f "$f" ] || continue
  # Strip // line comments and whitespace for robust matching.
  content="$(sed 's://.*$::' "$f")"

  # 1. A connection string carrying a non-empty Password= is a committed credential.
  if printf '%s' "$content" | grep -Eiq '"Default"[[:space:]]*:[[:space:]]*"[^"]*Password=[^";[:space:]]+'; then
    report "$f contains a connection string with an inline Password= value"
  fi

  # 2. A populated StringEncryption passphrase must never be committed.
  if printf '%s' "$content" | grep -Eiq '"DefaultPassPhrase"[[:space:]]*:[[:space:]]*"[^"]+"'; then
    report "$f contains a non-empty StringEncryption:DefaultPassPhrase"
  fi
done

if [ "$fail" -ne 0 ]; then
  echo >&2
  echo "Move credentials out of tracked config into the git-ignored" >&2
  echo ".env / appsettings.secrets.json (see docs/production-audit/09-secret-rotation-and-history.md)." >&2
  exit 1
fi

echo "OK: no credentials committed in ${#files[@]} tracked appsettings*.json file(s)."
