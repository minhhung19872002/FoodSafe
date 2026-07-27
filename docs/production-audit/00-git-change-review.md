# 00 — Git Change Review (Production Audit Baseline)

Audit date: 2026-07-27
Audit HEAD: `fe3dbd2` (main, working tree clean, no merge conflicts, no uncommitted changes)
Previous independent audit baseline: `154c9d6` (2026-07-27 17:19 +0700, "docs: complete independent customer requirement audit")

## 1. Repository state

| Item | Value |
|---|---|
| Branch | `main` |
| HEAD | `fe3dbd2` 2026-07-27 21:37 +0700 |
| Working tree | clean |
| Merge conflicts | none |
| Contributors | Danh Van Pham (112+2), Hung Bui (16), dependabot (15) |
| `.env` handling | `FoodSafe.BE/.env` exists locally, **git-ignored** (verified with `git check-ignore`); tracked file is `.env.example` with placeholder values only |
| Secrets in tracked files | `appsettings.json` connection strings/passphrase blanked at `06656c8`; local dev uses git-ignored `appsettings.secrets.json`; startup fails fast on missing/default secrets |
| Residual risk | **RESOLVED (B-3, 2026-07-28).** Full-history inventory ([doc 09](09-secret-rotation-and-history.md)) confirms only commodity dev defaults / placeholders were ever committed (`postgres`/`postgres`, `change-this-in-production`, a public Turnstile test key, a Development-only seed password) — **no real production secret**. The `.env` dev passwords were never tracked. Leaked defaults now fail-fast at Production startup (`CoreSecretsValidator`); recurrence blocked by `scripts/scan-committed-secrets.sh` (CI-gated). History rewrite deliberately declined — nothing live to purge. |

## 2. Commit timeline (major arcs)

1. **Foundation & database design** (`5577756`..`c449657`): scaffold, DB schema v2.x with red-team review rounds.
2. **Core feature build** (`c762baa`..`fef368a`): organizations, geography, identity, catalogs, businesses/products, self-declarations, registrations, certificates.
3. **Module completion** (`22ec456`..`23fd258`): advertisement, CFS/export food, inspection, alerts/news, food poisoning, reporting, risk analysis, DataIntegration, public portal lookups, dashboard.
4. **Test & verification wave** (`f90ac9c`..`eb3151a`, `3c12156`..`94f1f57`): authorization contract tests, data-scope negative tests, per-feature real-stack Playwright verification specs F-001..F-033.
5. **Security passes**: `9d2cb1e` (CSP, username out of query strings), `ca5e7f8` (cross-org plan mutation fix), `06656c8` (committed credentials removed, fail-fast on default secrets), `b2f13fb` (password-history reuse fix), `9bbaded` (X-Frame-Options, gzip, cache headers).
6. **Independent audit** (`71c58bf`, `154c9d6`): adversarial audit docs 60–68.
7. **Post-audit remediation** (`276f5b1`): security hardening, FK integrity, acceptance blocker remediation.
8. **UNAUDITED parallel batch** (`8fe0320`..`579bcd1` + PR #17 merge `bdfff4c`): STT 2/3/6/17/40 Excel exports + audit detail; STT 4 system settings; STT 19 advanced filters; STT 39 dashboard filters/widgets; STT 5/27/28/29/30 profile+avatar, inspection attachments+finalize, citizen channels; STT 33/34/35 report auto-calc + roll-up; STT 51–57 typed data-sharing engine.
9. **Final gap close** (`0eba6b6`/`fe3dbd2`): FR-50-05, FR-38-07, FR-36-08, FR-39-08, DT-08, NFR-01..06 + k6 load-test evidence.

## 3. Changed since last audit baseline (`154c9d6..HEAD`)

- **281 files, +38,993 / −2,081 lines** — this entire delta post-dates the last independent audit and is the primary regression-risk surface.
- `FoodSafe.BE/src`: 95 files, **+29,698** lines (data-sharing engine, system settings, report auto-calculation, exports, attachments).
- `FoodSafe.FE/src`: 157 files, +5,579 / −1,352 lines (settings page, dashboard widgets, filters, record tabs, virtualized month picker).
- Infra: `docker-compose.prod.yml`, `.env.example`, FE docker, `vite.config.ts`, `scripts/load-test.k6.js`.
- Only 3 BE test files changed for ~30k lines of new BE code — **test coverage of the new batch is disproportionately thin and must be treated as unverified until the runtime drill passes.**

## 4. Risky changes requiring regression focus

| Area | Commits | Risk |
|---|---|---|
| Typed data-sharing engine (STT 51–57) | `88d46a5` | Large new external-facing surface; serialization + auth on integration APIs |
| System settings (password policy, lockout, SMTP, branding) | `b1873a4` | Shared security dependency — Level 3 impact (affects authentication for all features) |
| Report auto-calculation & roll-up (STT 33–35) | `f4d5dfd` | Cross-aggregate math; correctness of official government reports |
| Inspection attachments + finalize | `71e0b3b` | File handling, workflow immutability |
| Dashboard filters + compliance widgets | `0763d1f` | Query scope — cross-org data leakage risk in aggregates |
| Excel exports (many modules) | `8fe0320`, `c519768`, `8cbced7` | Export limits, authorization on export endpoints |
| CI formatting/non-root container fixes | `5fca525` | Deployment behavior changed post-audit |
| Fresh-DB seeding order | `579bcd1` | Clean-install migration path |

## 5. Areas requiring regression testing (per impact map)

- Authentication/lockout/password policy (system settings touched it) → Level 3.
- All modules with new Excel export endpoints → authorization + scope retest.
- Reporting (auto-calc changed) → full feature retest.
- Inspection (attachments/finalize) → full feature retest.
- DataIntegration (share engine) → full feature retest.
- Public portal → smoke (FR-50-05 homepage settings touched it).
- Clean-install migration (seeding order changed) → deployment drill.
