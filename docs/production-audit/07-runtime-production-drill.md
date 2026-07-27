# 07 — Runtime Production Drill

Audit date: 2026-07-27
Commit under test: HEAD `fe3dbd2` (images rebuilt from source at this commit — the previously-running containers were built ~5h earlier and were stale)
Method: real Docker Compose stack, no API interception, real login, real PostgreSQL.

## 1. Stack brought up from HEAD

Rebuilt all three images (`docker compose --profile development build`) and started the full stack. All 7 services healthy:

| Service | Image | Status |
|---|---|---|
| postgres | postgres:15-alpine | healthy |
| redis | redis:7-alpine (password-protected) | healthy |
| minio | minio RELEASE.2025-04-22 | healthy |
| clamav | clamav/clamav:1.4 | healthy |
| mailpit | axllent/mailpit:v1.30.0 (dev profile) | healthy |
| api | foodsafe-api (built from HEAD) | healthy |
| frontend | foodsafe-frontend nginx (built from HEAD) | healthy |

Migrator ran to completion (exit 0) applying all 20 migrations before the API started (`Database__AutoMigrate=false`, one-shot migrator with `depends_on: service_completed_successfully`).

### Issues encountered bringing up a clean stack (documented, non-code)

1. ~~**`REDIS_PASSWORD` missing from `.env.example`.**~~ **RESOLVED (C-6, 2026-07-28).** `docker-compose.yml` requires `${REDIS_PASSWORD:?}` and the redis healthcheck uses it, but `.env.example` was never updated, so a fresh clone following the example failed to start Redis. `REDIS_PASSWORD` (and the production-overlay `SSL_CERT_PATH` / `SSL_KEY_PATH`, also defaultless-required and previously absent) are now in `.env.example`. Recurrence is CI-gated by `scripts/verify-env-example-complete.sh`, which asserts every defaultless `${VAR:?}` / bare `${VAR}` in both compose files has a key in `.env.example` (CI injects these vars, so `docker compose config` alone never caught the drift).
2. **`POSTGRES_SSL_MODE` missing from the local `.env`** (present in `.env.example`). Interpolation aborts with "Set POSTGRES_SSL_MODE". Local-only; documents that the two env files have drifted.
3. Host port 6379 was already occupied by another project's Redis; had to move `REDIS_PORT` to 6380. Not a product issue, but confirms compose has no fixed alternative and the example port collides with common local stacks.

## 2. Smoke probes (curl, real endpoints)

| Probe | Result | Verdict |
|---|---|---|
| `GET /health` | 200, 4.8 ms | ✅ liveness OK |
| `GET /` (SPA) | 200, HTML served by nginx | ✅ |
| `GET /api/abp/application-configuration` (anon) | 200 | ✅ anon config allowed |
| `GET /api/v1/app/business` (unauthenticated) | **401** | ✅ auth gate enforced (not a 302 HTML redirect) |
| `GET /api/v1/public/businesses` (no keyword) | 400 with Vietnamese validation error | ✅ server-side validation |

### Security headers (verified live)

- nginx serves on all responses: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and a restrictive `Content-Security-Policy` (default-src 'self'; Turnstile + OSM tiles allowlisted; `object-src 'none'`; `base-uri 'self'`).
- Antiforgery: `XSRF-TOKEN` + `.AspNetCore.Antiforgery` cookies issued; antiforgery cookie is `httponly; samesite=strict`.
- **Gap:** no `Strict-Transport-Security` header on the dev stack (expected — HSTS belongs to the prod nginx template, which is currently undeployable, see doc 06). HSTS must be confirmed on the prod build once `Dockerfile.prod` exists.

### Container hardening (verified live)

- API container runs as non-root: `uid=1654(app)`.
- Frontend container runs as non-root: `uid=101(nginx)`.

## 3. Full real-stack E2E acceptance run

Command: `E2E_ADMIN_PASSWORD=*** npx playwright test` (all specs, chromium, workers=1, no `page.route`/no interception, real cookie login via `/api/account/login` with antiforgery token).

**Result: 229 passed, 6 failed (11.0 min). 0 browser console errors captured across the run.**

- All 34 authoritative per-feature `*-verification.spec.ts` specs **passed** — these are the designated acceptance tests (they cover auth, permission denial, cross-org isolation, workflow transitions, validation, persistence-after-reload, empty/loading/error states).
- The 6 failures are all in the **older legacy smoke `*.spec.ts` files** (not the verification specs), and all fail at the identical step: after creating a business via API, the spec opens an Ant Design business-picker `<Select>` and clicks the option via `getByText(name).last()` **without typing a search term**.

### Root cause of the 6 failures — investigated, not assumed

| Hypothesis | Finding |
|---|---|
| New business filtered out by status | Refuted — `Business.Create` sets `Status = Active` ([Business.cs:72](../../FoodSafe.BE/src/FoodSafe.Domain/BusinessManagement/Business.cs#L72)); options endpoint filters Active and the business qualifies. |
| Options endpoint paginated/truncated | Refuted — `GetBusinessOptionsAsync` caps at `Take(500)` ([ProductAppService.cs:87](../../FoodSafe.BE/src/FoodSafe.Application/BusinessManagement/ProductAppService.cs#L87)); only 20 businesses exist in the DB. |
| React Query stale cache | Refuted — Playwright uses a fresh browser context per test; the query refetches on page mount. |
| **AntD Select virtualization** | **Confirmed root cause.** The `<Select showSearch optionFilterProp="label">` uses rc-virtual-list, which only renders options in the viewport. With ~20 options the target is scrolled out of the rendered DOM, so `getByText(...).last()` never matches. A real user (and the passing verification specs' pattern) filters by typing; the legacy specs click blind. |

**Classification: test fragility in superseded smoke specs — NOT a product defect.** The `showSearch` type-to-filter path works; these older specs simply predate the virtualized picker and were not updated. However, this does surface a real **coverage gap**: the *form-based create UI path* (fill modal → pick business from combobox → save) for self-declarations, product registrations, advertisement registrations, eligibility certificates, export-food certificates, and inspection has **no currently-passing automated test**, because the verification specs create those records via API and never drive the modal. Severity: LOW (coverage), but it means "create via the on-screen form" for those 6 modules is not part of the green acceptance evidence.

## 4. NFR load evidence (reviewed, credible)

`scripts/load-test.k6.js` is a genuine k6 test (real cookie login, 6 main-flow endpoints, ramp to 30 VUs held 2 min, thresholds mapped to NFR-01/02/05/06). Recorded results (`docs/testing/05-load-test-results.md`): 3,270 requests, 0% failed, avg 31 ms, max 418 ms, 30 VUs held, API CPU ~54% / PG ~20%. All NFR thresholds pass. Caveat (stated in the doc): measured on a dev Windows/Docker-Desktop machine; NFR-03/04 on production hardware still need confirmation, but this proves the software is not the bottleneck.

## 5. Drill verdict

The application **runs correctly from HEAD** against a real full stack: health OK, auth gate enforced, security headers present, non-root containers, 229/235 E2E green with the 6 reds isolated to stale-test fragility and zero console errors. Runtime behavior is **production-quality for the implemented feature set**.

At the time of the original drill, the **production** stack could only be validated for compose syntax — `FoodSafe.FE/Dockerfile.prod` was missing, so HTTPS/TLS/HSTS were unverified in runtime.

### Update (2026-07-27) — production frontend now runtime-verified [B-1 RESOLVED]

`FoodSafe.FE/Dockerfile.prod` was created and the production frontend was brought up in a real container with a self-signed certificate. Verified live:

| Probe | Result |
|---|---|
| `docker compose -f docker-compose.yml -f docker-compose.prod.yml build frontend` | exit 0 |
| Container health | healthy |
| `nginx -t` (after envsubst templating) | ok |
| HTTP `/healthz` | 200, no redirect |
| HTTP `/` | 301 → `https://…` |
| HTTPS `/` | 200 over TLS 1.2/1.3; TLS 1.1 refused |
| IPv4 + IPv6 listeners | both present (`listen 8443 ssl` + `listen [::]:8443 ssl`) |
| Security headers on SPA document | HSTS + CSP + X-Frame-Options + X-Content-Type-Options + Referrer-Policy + Permissions-Policy **all present** |

A latent security-header defect was found and fixed in the process: the `location /` `add_header` was suppressing the server-level security headers (nginx `add_header` inheritance), so the SPA document had previously shipped without HSTS/CSP. Fixed in both `nginx.prod.conf.template` and `nginx.conf`. Automated by `scripts/verify-prod-frontend.sh`, now gated in CI. The HTTPS production path is no longer a runtime unknown.
