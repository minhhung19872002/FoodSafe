# 09 — Secret Rotation & Git-History Cleanup (Blocker B-3)

Owner: Security / DevOps
Status: **RESOLVED** (fix committed; see "Resolution" below)
Date: 2026-07-28

This document closes production blocker **B-3 — "Credentials committed to git history."**
It records exactly what was in history, the risk assessment, the decision on
history rewrite, the rotation checklist, and the guards that prevent recurrence.

---

## 1. What was actually committed to history (full inventory)

Enumerated from `git log -p` across every tracked `appsettings*.json` and a full-history
`git grep` for known secret patterns. The complete set of credential-shaped values ever
present in tracked source:

| Value | Where | Nature | Real production secret? |
|---|---|---|---|
| `Host=localhost;…;Username=postgres;Password=postgres` | `FoodSafe.HttpApi.Host/appsettings.json`, `FoodSafe.DbMigrator/appsettings.json` (before `06656c8`) | PostgreSQL **default** credential on localhost | **No** — commodity default, dev-only |
| `StringEncryption:DefaultPassPhrase = "change-this-in-production"` | `FoodSafe.HttpApi.Host/appsettings.json` (before `06656c8`) | Literal **placeholder** | **No** — never a real key |
| Turnstile `SecretKey = 1x0000…AA` | `FoodSafe.HttpApi.Host/appsettings.json` (still present as dev default) | Cloudflare Turnstile **public test key** (always passes) | **No** — public dummy; rejected in Production by `CaptchaConfiguration.Validate` |
| `Admin@2026!` | `E2eTestDataSeedContributor.cs`, e2e specs | **Development-only** seed/test password (`SeedAsync` returns early outside Development) | **No** — test fixture, never seeded in Production |

**What was NEVER committed** (verified — no history match):

- `FoodSafe.BE/.env` (git-ignored from the start; `git log -- FoodSafe.BE/.env` is empty).
- `appsettings.secrets.json` (git-ignored; never tracked).
- The dev `.env` passwords `FoodSafe@Dev2026!`, `Minio@Dev2026!` — present only in the
  git-ignored `.env`; the only history hits are audit-doc *descriptions* of them.
- Any production database password, MinIO root key, Redis password, data-protection
  certificate password, SMTP password, or JWT/OpenIddict signing material.

**Conclusion:** No real production secret ever entered git history. The exposure is limited
to commodity dev defaults and placeholders. This *lowers* B-3's severity from "leaked
production credentials" to "defaults committed + no reuse guard," but the blocker is only
truly closed once (a) those defaults can never authenticate in Production and (b) recurrence
is mechanically prevented — both delivered below.

---

## 2. Decision: no destructive git-history rewrite

A `git filter-repo` / `filter-branch` history rewrite was **considered and rejected**, because:

1. Nothing in history is a real secret (§1) — there is no live credential to purge.
2. A rewrite changes every commit SHA, breaks all existing clones, open PRs/branches, and
   every `Verified Git commit` recorded in `docs/testing/01-feature-verification-registry.md`
   and the production-audit docs — a large, error-prone blast radius for zero security gain.
3. The residual values are already neutralised at the source: Production startup **rejects**
   them (§3), so their presence in old commits is inert.

The rewrite procedure is retained below as a **contingency only** — to be executed if a *real*
secret is ever found to have been committed.

### Contingency procedure (only if a real secret is ever committed)

```bash
# 1. Rotate the leaked secret at the source FIRST (a rewrite does not un-leak it).
# 2. Install git-filter-repo (https://github.com/newren/git-filter-repo).
# 3. From a fresh mirror clone:
git clone --mirror <repo-url> foodsafe-clean && cd foodsafe-clean
# 4. Replace the secret everywhere with a redaction marker:
printf '%s==>REDACTED\n' 'THE_LEAKED_SECRET_LITERAL' > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt
# 5. Force-push the rewritten history and require every clone to re-clone:
git push --force --mirror <repo-url>
# 6. Rebase/recreate open PRs; update recorded "Verified Git commit" SHAs in docs/testing.
```

---

## 3. Rotation, enforced by fail-fast Production guards

"Rotation" for this system means: production secrets are supplied only via the git-ignored
`.env` / `appsettings.secrets.json` / environment, and the application **refuses to start** on
any value known to have leaked. Enforced at startup (`FoodSafeHttpApiHostModule.ConfigureServices`):

| Secret | Guard | Behaviour |
|---|---|---|
| `ConnectionStrings:Default` | `CoreSecretsValidator.Validate` | Missing → throw (all envs). In Production, `postgres/postgres` → throw (must use a rotated, dedicated role). |
| `StringEncryption:DefaultPassPhrase` | `CoreSecretsValidator.Validate` | Missing or `change-this-in-production` → throw (all envs). |
| PostgreSQL SSL mode | `PostgreSqlSslValidator.Validate` | Production requires `Require`/`VerifyCA`/`VerifyFull`. |
| Turnstile keys | `CaptchaConfiguration.Validate` | Production rejects the `1x0000…` test keys and requires `ExpectedHostname`. |
| SMTP delivery | `ValidateEmailDelivery` | Production requires host/from-address/credentials. |

### Operator rotation checklist (before any production deploy)

- [ ] Provision a dedicated PostgreSQL role (not `postgres`) with a unique, generated password.
- [ ] Generate a fresh 32+ char `StringEncryption__DefaultPassPhrase` (never `change-this-in-production`).
- [ ] Generate fresh `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD`, `REDIS_PASSWORD`,
      `DATA_PROTECTION_CERTIFICATE_PASSWORD`, `SEED_ADMIN_PASSWORD`.
- [ ] Obtain real Cloudflare Turnstile `CAPTCHA_SITE_KEY`/`CAPTCHA_SECRET_KEY` + `CAPTCHA_EXPECTED_HOSTNAME`.
- [ ] Supply real SMTP credentials.
- [ ] Set `POSTGRES_SSL_MODE=Require` (or stronger) and enable SSL on the server.
- [ ] Confirm `.env` / `appsettings.secrets.json` are git-ignored on the deploy host.
- [ ] Rotate these on the mandated cadence; never reuse a dev value in Production.

Every value above is injected via environment/secret files — none is committed.

---

## 4. Recurrence prevention

- **`scripts/scan-committed-secrets.sh`** — fails if any tracked `appsettings*.json`
  re-introduces a populated `ConnectionStrings:Default` password or a non-empty
  `DefaultPassPhrase`. Wired into the CI `supply-chain` job (step *"Guard against credentials
  committed in tracked config (B-3)"*), so the exact regression that caused B-3 cannot return.
- **Trivy `secret,misconfig` scan** (existing CI step) — catches high-entropy secrets broadly.
- **`CoreSecretsValidatorTests`** — 13 tests asserting the startup guard rejects the leaked
  defaults in Production and accepts rotated values.
- **`.gitignore`** — `FoodSafe.BE/.env` and `appsettings.secrets.json` remain ignored.

---

## 5. Resolution

**B-3 is resolved.**

- Inventory proves no real production secret was ever committed (§1).
- Leaked defaults can no longer authenticate in Production — startup fails fast (§3).
- The Development-only seed password is now configuration-overridable (`Seed:TestPassword`),
  not a sole hardcoded literal.
- Recurrence is mechanically blocked by a CI-gated scanner + unit-tested guard (§4).
- History rewrite is deliberately not performed (§2); the inert defaults in old commits carry
  no live-credential risk, and the contingency procedure is documented if that ever changes.

Regression evidence:
- `dotnet test … --filter CoreSecretsValidatorTests` → 13 passed (part of 40 security-validator tests).
- `scripts/scan-committed-secrets.sh` → passes on the clean tree; fails when the leaked
  connection string / passphrase is reintroduced (verified by reproduction).
