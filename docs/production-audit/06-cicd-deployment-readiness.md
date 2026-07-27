# 06 — CI/CD and Deployment Readiness Audit

Audit date: 2026-07-27
Audit HEAD: `fe3dbd2` (main, working tree clean)
Auditor role: Independent DevOps Lead (PHASE 6 of production readiness audit)

---

## REMEDIATION LOG (post-audit fixes)

> This section records fixes applied after the audit. The findings above are preserved as the original audit record.

### B-1 — Production frontend container & HTTPS path — **RESOLVED** (2026-07-27)

Addresses original findings **C-01** and **C-02**.

- **Created `FoodSafe.FE/Dockerfile.prod`** — multi-stage build identical to the dev image except it installs `docker/nginx.prod.conf.template` into `/etc/nginx/templates/`, so the nginx-unprivileged entrypoint runs `envsubst` (substituting `SSL_CERT_PATH`/`SSL_KEY_PATH`) and emits `/etc/nginx/conf.d/default.conf` at start-up. Exposes 8080 (HTTP redirect) + 8443 (HTTPS). Runs as uid 101.
- **Runtime-verified from a real container** (self-signed cert, `scripts/verify-prod-frontend.sh`):
  - `docker compose -f docker-compose.yml -f docker-compose.prod.yml build frontend` → exit 0
  - `nginx -t` passes after templating
  - HTTP `/healthz` → 200 (no redirect); HTTP `/` → 301 → `https://…`
  - HTTPS `/` → 200 over **TLS 1.2/1.3**; TLS 1.1 refused
  - IPv4 **and** IPv6 listeners present (`listen 8443 ssl` + `listen [::]:8443 ssl`)
  - **HSTS + full CSP + X-Frame/X-Content-Type/Referrer/Permissions headers now present on the SPA document response.**
- **Fixed a real security-header defect** found during verification: the `add_header Cache-Control` in `location /` (and `/assets/`) was suppressing all server-level `add_header` directives (nginx inheritance rule), so the SPA document and assets shipped **without** HSTS/CSP. The full header set is now repeated in each overriding location, in both `nginx.prod.conf.template` and `nginx.conf`.
- **CI now exercises the prod overlay** (closes C-02): the `supply-chain` job validates `-f docker-compose.yml -f docker-compose.prod.yml config`, builds the `Dockerfile.prod` image, and runs `scripts/verify-prod-frontend.sh` at runtime.
- **Operational note added** to `docker-compose.prod.yml`: because nginx runs unprivileged (uid 101), the mounted TLS private key must be readable by that uid (a default 0600 root `privkey.pem` fails).

Regression test: `scripts/verify-prod-frontend.sh`. CI gate: `.github/workflows/ci.yml` supply-chain job.

---

## 1. Scope

This audit covers:

- GitHub Actions workflow completeness and quality
- Docker Compose configuration (dev and prod overlay)
- Dockerfile construction (backend and frontend)
- nginx configuration (dev and production template)
- Environment and secrets flow
- Migration strategy and ordering
- Health check coverage
- Monitoring, alerting, and log management
- Backup and disaster recovery implementation vs. documentation
- Documentation accuracy (docs/37–40 vs. actual artifacts)

Compose syntax was validated locally (`docker compose config -q`) on both the base and prod overlay. No containers were started. No code was modified.

---

## 2. GitHub Actions Workflows

### 2.1 Workflow inventory

One workflow file: `.github/workflows/ci.yml`

| Job | Triggers | Gate |
|---|---|---|
| `application` (Application quality gates) | push to `main`/`codex/**`, all PRs | Yes — fails on test failure, format error, or build warning |
| `database` (Clean PostgreSQL migration) | push to `main`/`codex/**`, all PRs | Yes — fails if migrations do not apply cleanly to a fresh DB |
| `supply-chain` (Dependency and container gates) | push to `main`/`codex/**`, all PRs | Yes — fails on unapproved CVE, secret finding, or image vulnerability |

Concurrency is configured with `cancel-in-progress: true`, which correctly cancels stale runs for the same ref.

### 2.2 Application quality gates — assessment: PASS

The `application` job covers:

- `dotnet tool restore` + `dotnet restore` from lock files
- `dotnet format --verify-no-changes` (no format drift allowed)
- `dotnet build --configuration Release --warnaserror` (warnings are errors)
- `dotnet test` with XPlat Code Coverage collection, results retained 14 days
- `dotnet publish` for both API and migrator targets
- `dotnet ef migrations has-pending-model-changes` (model drift rejected)
- `npm ci` (pinned lock file)
- `npm run format:check` + `npm run lint` + `npm run lint:ts`
- `npm test -- --run` (Vitest unit tests)
- `npm run build` (Vite production build)

All steps are sequential and correctly ordered. The EF model-drift check runs after publish (no-build), which is efficient. Backend coverage XML is uploaded as an artifact even on failure.

**Gap (LOW):** Coverage is collected but no minimum threshold is enforced. A CI step using a coverage threshold gate (e.g., `reportgenerator` with a minimum line coverage) would prevent coverage regression.

### 2.3 Clean PostgreSQL migration — assessment: PASS

The `database` job spins up a real `postgres:15-alpine` service with health checks and applies all migrations from scratch via `dotnet ef database update`. It then re-runs `has-pending-model-changes` to verify the applied schema matches the current model. This is a high-value gate that catches migration ordering problems, missing migrations, and model drift — none of which are caught by unit tests alone.

### 2.4 Supply-chain and container gates — assessment: PASS WITH CRITICAL GAP

The `supply-chain` job covers:

- NuGet advisory audit (`scripts/Test-NuGetVulnerabilities.ps1`) with a narrow, documented allow-list
- npm production advisory audit (`scripts/Test-NpmVulnerabilities.ps1`) with a narrow, documented allow-list (three mitigated CVEs total, all documented in `docs/43-dependency-security-policy.md`)
- Trivy filesystem scan for secrets and misconfigurations (HIGH/CRITICAL, `exit-code: 1`)
- Docker Compose config validation (`docker compose config --quiet`)
- Image build for API, migrator, and frontend
- Trivy image vulnerability scans on all three built images (HIGH/CRITICAL, ignore-unfixed, `exit-code: 1`)

The Trivy action is pinned to a full commit SHA (`a9c7b0f06e461e9d4b4d1711f154ee024b8d7ab8`), not a mutable version tag. This is correct practice.

**CRITICAL GAP — CI only validates the dev Compose, not the production overlay.**

The validation and build steps use the default `docker-compose.yml`:
```yaml
- name: Validate production Compose rendering
  run: docker compose config --quiet          # reads docker-compose.yml only

- name: Build deployable images
  run: docker compose build api migrator frontend   # builds using dev Dockerfiles
```

`docker-compose.prod.yml` specifies `dockerfile: Dockerfile.prod` for the frontend service. That file (`FoodSafe.FE/Dockerfile.prod`) **does not exist**. The CI pipeline never attempts to build with the prod overlay, so this breakage is invisible to CI. A production deployment using the documented `docker compose -f docker-compose.yml -f docker-compose.prod.yml build` would fail immediately with a file-not-found error.

### 2.5 Dependabot configuration — assessment: PASS

`.github/dependabot.yml` configures weekly updates for three ecosystems:
- `nuget` (directory: `/FoodSafe.BE`)
- `npm` (directory: `/FoodSafe.FE`)
- `github-actions` (directory: `/`)

The PR limit is 5 per ecosystem, which is reasonable. This keeps transitive vulnerabilities visible and surfaces upstream fixes.

### 2.6 Branch protection and release gates — assessment: UNVERIFIABLE, DOCUMENTED ONLY

`docs/37-ci-cd-guide.md` documents the requirement to protect `main`, require all three CI jobs before merge, and require code-owner review. However:

- No `CODEOWNERS` file exists in the repository.
- GitHub branch protection rules are server-side configuration and cannot be audited from the repository contents.
- There is no enforcement artifact (e.g., a required-status-check list committed to the repository).

This is a documentation claim with no verifiable implementation artifact. It is a prerequisite before allowing any contributor to merge to `main` without human review.

### 2.7 Deployment (CD) pipeline — assessment: NOT IMPLEMENTED

There is no deployment workflow. `docs/37-ci-cd-guide.md` explicitly acknowledges this:

> "No workflow currently deploys to production. Release promotion remains a controlled operator action until a registry, target environment, approval owners, and rollback authority are supplied."

This is an honest statement of current state, not a blocker if manual deployment is the accepted model for this release. However, the deployment process has no automation, meaning every deployment relies entirely on operators following `docs/38-deployment-guide.md` manually. Any deviation introduces risk.

---

## 3. Docker Compose Configuration

### 3.1 Base Compose (`FoodSafe.BE/docker-compose.yml`) — assessment: GOOD

**Services defined:** postgres, redis, minio, mailpit (development profile), clamav, migrator, api, frontend.

**Healthchecks:** All services have healthchecks configured. Intervals, timeouts, and retry counts are appropriate.

**Restart policies:**
- `restart: unless-stopped` — postgres, redis, minio, mailpit, clamav, api, frontend (correct)
- `restart: "no"` — migrator (correct — a one-shot container must not restart on failure)

**Dependency ordering:**
- `migrator` depends on `postgres` (condition: `service_healthy`)
- `api` depends on `migrator` (condition: `service_completed_successfully`), `redis` (healthy), `minio` (healthy), `clamav` (healthy)
- `frontend` depends on `api` (condition: `service_healthy`)

This ordering correctly ensures the database schema is applied before the API starts, and the API is healthy before the frontend container starts. The `Database__AutoMigrate: "false"` setting on the API container prevents schema race conditions if multiple API replicas are ever started.

**Bind addresses:** Infrastructure services (postgres, redis, minio) bind to `INFRA_BIND_ADDRESS:-127.0.0.1` by default, preventing accidental external exposure. The web entry point binds to `WEB_BIND_ADDRESS:-127.0.0.1` by default.

**Static IPs:** Services are assigned static IPs in the `172.28.0.0/24` subnet. The known-proxy setting in the backend (`App__KnownProxies__0: 172.28.0.10`) correctly identifies the nginx container IP.

**Volumes:** All persistent state uses named volumes (`postgres_data`, `redis_data`, `minio_data`, `data_protection_keys`). The `secrets` bind mount (`./secrets`) mounts the data-protection certificate.

**Gap (MEDIUM):** No resource limits (CPU or memory) are configured for any service. A runaway container (e.g., ClamAV during a signature update, or an unthrottled query) could starve adjacent services. Production deployments should set at minimum memory limits on the API and database containers.

**Gap (MEDIUM):** The Redis healthcheck passes the password via `$REDIS_PASSWORD` in the command string. In practice this is fine inside Docker's private network, but the password appears in `docker inspect` output. This is a pre-existing, low-exploitability concern.

### 3.2 Production Compose overlay (`FoodSafe.BE/docker-compose.prod.yml`) — assessment: CRITICAL DEFICIENCY

The overlay correctly:
- Changes `WEB_BIND_ADDRESS` default to `0.0.0.0`
- Exposes ports 80 and 443
- Mounts TLS certificate and private key as read-only bind mounts via `SSL_CERT_PATH`/`SSL_KEY_PATH`
- Uses `:?` mandatory variable syntax so the stack fails fast if cert paths are missing
- Adds a frontend healthcheck

**CRITICAL GAP — `Dockerfile.prod` does not exist:**

```yaml
# docker-compose.prod.yml line 43
frontend:
  build:
    context: ../FoodSafe.FE
    dockerfile: Dockerfile.prod   # Production variant that uses nginx.prod.conf.template
```

`FoodSafe.FE/Dockerfile.prod` is not present in the repository. Only `FoodSafe.FE/Dockerfile` exists. Building the production stack fails immediately:

```
ERROR: failed to solve: failed to read dockerfile: open Dockerfile.prod: no such file or directory
```

`nginx.prod.conf.template` exists at `FoodSafe.FE/docker/nginx.prod.conf.template` with a complete, correct TLS configuration. The Dockerfile.prod that would install it during the build is missing.

**The entire HTTPS production deployment path is broken.** This is the single most urgent production blocker.

**Syntax validation result:** `docker compose -f docker-compose.yml -f docker-compose.prod.yml config -q` exits `0` (syntax and variable interpolation are valid). The missing Dockerfile is only detected at build time, which CI never exercises with this overlay.

---

## 4. Dockerfile Analysis

### 4.1 Backend Dockerfile (`FoodSafe.BE/Dockerfile`) — assessment: GOOD

- Multi-stage build: `mcr.microsoft.com/dotnet/sdk:9.0` (build) → `mcr.microsoft.com/dotnet/aspnet:9.0` (runtime)
- Layer caching is optimized: project files are copied before source, so `dotnet restore` is cached unless project files change
- Both API and migrator are published into the same runtime image; the migrator uses an entrypoint override in Compose
- `curl` is installed in the runtime stage for the API health probe (only dependency added to the slim runtime image)
- `chown` applies the `$APP_UID` to all app directories before switching user
- `USER $APP_UID` — non-root execution (correct)
- `EXPOSE 8080` — internal port

**Gap (MEDIUM):** Base images are tag-pinned (`mcr.microsoft.com/dotnet/sdk:9.0`, `mcr.microsoft.com/dotnet/aspnet:9.0`) not digest-pinned. Microsoft tags are generally stable but could theoretically change. Digest pinning eliminates this risk entirely.

### 4.2 Frontend Dockerfile (`FoodSafe.FE/Dockerfile`) — assessment: GOOD (dev path only)

- Multi-stage build: `node:20-alpine` (build) → `nginxinc/nginx-unprivileged:1.27-alpine` (runtime)
- `npm ci` from lock file (reproducible)
- `USER nginx` — non-root execution (correct)
- `EXPOSE 8080` — internal port
- Built-in `HEALTHCHECK` that uses `wget` (present in alpine nginx image)
- Copies `docker/nginx.conf` into the correct nginx path

**Gap (LOW):** Node.js version mismatch. CI uses `node-version: 22` in the `application` job, but the Dockerfile uses `node:20-alpine`. Both are LTS versions and the build is unlikely to diverge, but the mismatch should be resolved to `node:22-alpine` for consistency.

**Gap (MEDIUM):** Base images are tag-pinned, not digest-pinned.

**Missing:** `Dockerfile.prod` — as described in §3.2.

---

## 5. nginx Configuration

### 5.1 Development nginx (`FoodSafe.FE/docker/nginx.conf`) — assessment: GOOD

- Listens on port 8080 (IPv4 + IPv6)
- `/healthz` — static health response, no upstream dependency, access_log off
- `/health` — proxied to API, with correct forwarded headers
- `/api/` — proxied with `proxy_http_version 1.1`, correct forwarded headers, `client_max_body_size 20m`
- `proxy_read_timeout 120s` — accommodates slow report generation operations
- `/assets/` — 1-year cache with `immutable` directive (correct for hashed assets)
- SPA fallback (`try_files $uri $uri/ /index.html`)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP
- `server_tokens off`
- gzip enabled with appropriate MIME types
- No HSTS — correct, this is the dev/HTTP-only config

**Gap (LOW):** The CSP permits `'unsafe-inline'` for `style-src`. This is needed for Ant Design inline styles. This is an acceptable pragmatic compromise for an internal government dashboard but should be noted for future hardening.

**Gap (LOW):** gzip MIME types do not include `application/xml`, `font/woff2`, or `image/svg+xml`. These are minor optimization omissions.

### 5.2 Production nginx (`FoodSafe.FE/docker/nginx.prod.conf.template`) — assessment: GOOD (when deployed)

- HTTP block (port 8080) redirects all traffic to HTTPS with `301` except `/healthz`
- HTTPS block (port 8443) uses cert/key paths substituted by `envsubst` at container startup
- `ssl_protocols TLSv1.2 TLSv1.3` — TLS 1.0/1.1 disabled (correct)
- Strong cipher suite with ECDHE preference
- `ssl_session_tickets off` — mitigates session ticket key reuse
- HSTS: `max-age=31536000; includeSubDomains` — one year (no `preload` directive, acceptable for initial deployment)
- All security headers from the dev config, plus HSTS
- WebSocket support via `Upgrade`/`Connection` headers (needed for Hangfire dashboard and future SignalR)
- `client_max_body_size 20m` — preserved from dev config

**Gap (MEDIUM):** No OCSP stapling (`ssl_stapling on; ssl_stapling_verify on;`). For a government-grade system, OCSP stapling reduces TLS handshake latency and prevents certificate status requests from leaking browsing patterns to the CA. This should be added with `resolver 8.8.8.8 1.1.1.1 valid=300s;` and the CA's OCSP URL.

**Gap (LOW):** No `ssl_dhparam` directive for DHE cipher suites. While ECDHE is preferred and dominates modern clients, DHE ciphers in the suite list would use a generated DH parameter. Either remove DHE ciphers or generate and mount `dhparam.pem`.

**Deployment concern (MEDIUM):** The template relies on `envsubst` being available and the official nginx image auto-processing `/etc/nginx/templates/*.template` files. Since `Dockerfile.prod` is missing, it is unknown whether this mechanism would be wired correctly. It cannot be verified.

---

## 6. Environment and Secrets Flow

**Assessment: GOOD design, no committed secrets**

The flow is:
1. `.env.example` (committed, placeholder values only, git-tracked)
2. Operator copies to `.env` (git-ignored, real values)
3. Docker Compose reads from `.env` and passes environment variables to containers
4. Application reads from environment variables at startup

Mandatory variables use `:?` syntax in Compose, causing `docker compose up` to fail fast with a clear message if any required secret is missing.

The `FoodSafe.BE/secrets/` directory has a `.gitignore` that excludes all content. The data-protection certificate is placed there and mounted read-only.

The application performs startup validation:
- Missing or placeholder `ConnectionStrings__Default` → fatal exception
- Missing or default `StringEncryption:DefaultPassPhrase` → fatal exception
- Production CAPTCHA test keys → fatal exception
- PostgreSQL SSL mode below `Require` in Production → fatal exception
- Missing data-protection certificate in Production → fatal exception
- Missing or invalid SMTP credentials in Production → fatal exception

These startup guards prevent a misconfigured production deployment from silently running in a degraded or insecure state.

**Residual risk (documented in `00-git-change-review.md`):** Credentials committed before `06656c8` remain in git history. If this repository was ever pushed to a shared remote with those credentials present, they must be treated as compromised and rotated before production deployment.

---

## 7. Migration Strategy

**Assessment: GOOD design, manual rollback only**

The production migration sequence is:

1. `migrator` container starts → waits for `postgres` to be healthy
2. Migrator applies all pending EF Core migrations and seeds initial data
3. Migrator exits with code `0`
4. `api` container starts (depends on `condition: service_completed_successfully`)
5. API starts with `Database__AutoMigrate: "false"` — no automatic migration

This ordering ensures:
- Migrations are atomic (migrator exits before API starts)
- No schema race condition if multiple API replicas are ever added
- A failed migration halts the entire deployment

The CI `database` job verifies migrations apply cleanly to a fresh database on every commit.

**Gap (MEDIUM):** There is no scripted rollback procedure. `docs/40-disaster-recovery-guide.md` documents that rollback means restoring from a PostgreSQL backup, not reversing EF migrations. This is the correct approach for a production relational database (EF `MigrationBuilder.Down()` methods are fragile and rarely complete). However, the backup that would be used for rollback depends on automated backups that do not currently exist (see §8).

**Gap (LOW):** The `/health` endpoint is registered with `endpoints.MapHealthChecks("/health")` and `context.Services.AddHealthChecks()`, but no downstream health check providers are registered. The endpoint returns `200 Healthy` regardless of whether PostgreSQL, Redis, or MinIO are reachable. The Compose `api` healthcheck depends on this endpoint (`curl --fail http://127.0.0.1:8080/health`), which means a degraded API (e.g., database connection pool exhausted) would still report healthy.

The fix is to add:
```csharp
context.Services.AddHealthChecks()
    .AddNpgsql(configuration.GetConnectionString("Default")!)
    .AddRedis(redisConnectionString)
    .AddUrlGroup(new Uri("http://minio:9000/minio/health/live"), "minio");
```

---

## 8. Monitoring, Alerting, and Log Management

**Assessment: SIGNIFICANT GAP — no production observability tooling**

### 8.1 Logging

Serilog is configured with:
- Console sink (captured by Docker logs)
- File sink: `Logs/logs.txt`, rolling daily, 30-day retention (inside the API container)

ABP audit logging is enabled (`app.UseAuditing()`), writing audit records to the PostgreSQL database.

Correlation IDs (`X-Correlation-Id`) are generated and included in problem detail responses.

**What is missing:**
- No centralized log aggregation (no Seq, no Loki, no ELK, no Syslog)
- Container logs are accessible only via `docker compose logs` on the host — no remote access
- File logs inside the API container are lost if the container is replaced (unless the `Logs/` directory is mounted to a named volume or host path)
- No structured log query capability

The `docs/39-operations-runbook.md` instructs operators to `docker compose logs --tail 200 api frontend` for routine checks. This is adequate for a small single-node deployment but provides no visibility if the host is unreachable.

### 8.2 Metrics and Alerting

There is no metrics infrastructure. No Prometheus endpoint, no Grafana dashboard, no OpenTelemetry export, and no application performance monitoring (APM) agent. The operations runbook lists monitoring targets but provides no tooling to fulfil them:

> "Monitor at minimum: ingress availability and latency; API 5xx, 401/403 anomalies, 429 volume..."

These cannot be measured without instrumentation.

The `scripts/load-test.k6.js` file provides an NFR validation tool (30 VU, p95 < 5s threshold), but it is a one-shot manual test, not continuous monitoring.

**Hangfire dashboard** is available at `/hangfire` but with `LocalRequestsOnlyAuthorizationFilter` — only accessible from within the container network (e.g., via SSH port-forward). Recurring job status and failure history are only visible through this mechanism.

### 8.3 Backup Implementation

`docs/40-disaster-recovery-guide.md` states:

> "The repository contains the procedure but not evidence of a completed production-like backup/restore rehearsal. Production readiness therefore remains blocked until that exercise is performed and recorded."

This is an honest self-assessment. The actual state:

- No backup scripts exist in the `scripts/` directory
- No scheduled backup container or cron job in any Compose file
- No backup monitoring/alerting configuration
- Only manual `pg_dump` and `mc mirror` commands documented

The documented RTO (4 hours) and RPO (24 hours) have no automation enforcing them. A production incident requiring database restoration would depend entirely on operators following documented procedures and having independently scheduled backups.

---

## 9. Claims in Documentation vs. Reality

| Document | Claim | Reality | Gap Severity |
|---|---|---|---|
| `docs/37-ci-cd-guide.md` | "Protect `main` and require all three CI jobs before merge" | No CODEOWNERS file; branch protection cannot be verified from repo | HIGH |
| `docs/37-ci-cd-guide.md` | "Scan the repository for secrets and high/critical configuration findings" | Trivy fs scan is present in CI | PASS |
| `docs/38-deployment-guide.md` | `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` | `Dockerfile.prod` does not exist — this command fails | CRITICAL |
| `docs/38-deployment-guide.md` | Production nginx.prod.conf.template processes at container startup | Cannot be verified — `Dockerfile.prod` that would implement this is missing | CRITICAL |
| `docs/39-operations-runbook.md` | "Monitor at minimum: ingress availability and latency; API 5xx..." | No monitoring tooling implemented | HIGH |
| `docs/39-operations-runbook.md` | "Alert immediately when health checks fail for five minutes..." | No alerting system configured | HIGH |
| `docs/40-disaster-recovery-guide.md` | RTO 4 hours, RPO 24 hours | No automated backups; no rehearsal evidence | HIGH |
| `docs/40-disaster-recovery-guide.md` | "Automate backup creation, encryption, transfer, retention, and verification" | Not implemented | HIGH |
| `docs/40-disaster-recovery-guide.md` | "Production readiness therefore remains blocked until that exercise is performed" | Self-documented as a blocker | HIGH |

---

## 10. Gap Classification Summary

### CRITICAL (Production blockers — deployment would fail or be inoperable)

| ID | Finding | File |
|---|---|---|
| C-01 | `FoodSafe.FE/Dockerfile.prod` does not exist. `docker-compose.prod.yml` references it for the production frontend build. The entire HTTPS production deployment path fails at the `docker compose build` step. | `FoodSafe.FE/Dockerfile.prod` (missing) |
| C-02 | The CI `supply-chain` job validates `docker-compose.yml` only, not the production overlay. The `Dockerfile.prod` gap is invisible to CI and would only surface during an actual production deployment attempt. | `.github/workflows/ci.yml` lines 232–233 |
| C-03 | No automated backup scripts or scheduled backup jobs exist. The documented RTO/RPO objectives have no implementation. A production database failure with no automated backups is a data-loss event. | `scripts/` (no backup scripts present) |

### HIGH (Serious operational risk — must be resolved before production)

| ID | Finding |
|---|---|
| H-01 | `/health` endpoint registers no downstream probes. PostgreSQL, Redis, and MinIO connectivity is not checked. A degraded API incorrectly reports healthy, masking dependency failures from the Compose healthcheck and any load balancer. |
| H-02 | No centralized monitoring or alerting infrastructure (no Prometheus, Grafana, Seq, OTel, or APM). Operators have no visibility into production health beyond raw `docker compose logs`. |
| H-03 | Branch protection rules are documented as requirements but cannot be verified from repository contents. No `CODEOWNERS` file exists. Without enforcement, unreviewed commits can reach `main`. |
| H-04 | Git history contains credentials committed before `06656c8`. If the repository was ever pushed to a shared remote with those credentials present, they are compromised and must be rotated before production use. |

### MEDIUM (Should be resolved before production or in the first maintenance window)

| ID | Finding |
|---|---|
| M-01 | Docker base images are tag-pinned but not digest-pinned (`mcr.microsoft.com/dotnet/aspnet:9.0`, `node:20-alpine`, `nginxinc/nginx-unprivileged:1.27-alpine`). Mutable tags can change without notice. |
| M-02 | Node.js version mismatch: Dockerfile uses `node:20-alpine`, CI uses `node-version: 22`. Both are LTS; the mismatch should be resolved to prevent subtle build divergence. |
| M-03 | No CPU or memory resource limits on any Docker Compose service. A runaway process can starve adjacent containers. |
| M-04 | No log aggregation. Container logs are ephemeral (lost on container replacement) and accessible only via SSH to the host. |
| M-05 | OCSP stapling is not configured in `nginx.prod.conf.template`. This increases TLS handshake latency and leaks client browsing patterns to the CA's OCSP responder. |
| M-06 | No scripted migration rollback procedure. Recovery from a bad migration requires restoring from backup (which itself has no automation — C-03). |
| M-07 | No image tagging/versioning strategy in CI. Images are built but not tagged with commit SHA or semantic version before Trivy scanning. Immutable image digests are not recorded in the CI artifact. |

### LOW (Improvements recommended for long-term health)

| ID | Finding |
|---|---|
| L-01 | Code coverage threshold not enforced in CI. Coverage XML is collected and retained, but no minimum coverage gate prevents regression. |
| L-02 | No SAST tool beyond Trivy misconfig scan. A static analysis tool (e.g., `dotnet-roslyn-analyzers`, SonarCloud) would surface code-level security issues. |
| L-03 | `gzip_types` in nginx does not include `application/xml`, `font/woff2`, or `image/svg+xml`. Minor throughput improvement possible. |
| L-04 | nginx.prod.conf.template includes DHE cipher suites but no `ssl_dhparam` directive. Either add a generated DH parameter or remove DHE entries from the cipher list. |
| L-05 | Hangfire dashboard uses `LocalRequestsOnlyAuthorizationFilter`. Remote operators must SSH port-forward to access job status and failure history. An alternative authenticated dashboard path would simplify operations. |
| L-06 | No secrets rotation automation or schedule. Documented as a manual operator responsibility with no tooling support. |

---

## 11. Production Blockers (Explicit List)

The following items must be resolved before any production deployment:

1. **[C-01] Create `FoodSafe.FE/Dockerfile.prod`** — the production frontend image cannot be built without it. The file should install the `nginx.prod.conf.template` into `/etc/nginx/templates/` so the official nginx Docker image auto-processes it at startup with `envsubst`.

2. **[C-02] Add prod overlay validation to CI** — the `supply-chain` job should add:
   ```yaml
   - name: Validate production Compose rendering
     run: docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet
   - name: Build production deployable images
     run: docker compose -f docker-compose.yml -f docker-compose.prod.yml build frontend
   ```
   and scan the resulting `foodsafe-frontend:latest` image (which would then be the production variant).

3. **[C-03] Implement automated backups** — at minimum, a scheduled backup container or host cron job running `pg_dump` to encrypted off-host storage. `mc mirror` for MinIO. Backup health alerting. A rehearsed restore before the first production deployment, per `docs/40-disaster-recovery-guide.md`'s own stated gate.

4. **[H-01] Register downstream health check probes** — add Npgsql, Redis, and MinIO checks to `AddHealthChecks()` so the `/health` endpoint reflects real system health.

5. **[H-04] Rotate any credentials that appeared in git history** — required if the repository was ever pushed with those values to any shared remote (including GitHub).

---

## 12. Workflow Summary (Pass/Fail Assessment)

| Workflow / Area | Assessment | Key Issue |
|---|---|---|
| `application` job — backend gate | PASS | None |
| `application` job — frontend gate | PASS | Node version mismatch with Dockerfile (LOW) |
| `database` job — migration gate | PASS | None |
| `supply-chain` job — dependency audit | PASS | Three mitigated CVEs with documented justification |
| `supply-chain` job — Trivy secret/misconfig scan | PASS | Trivy action pinned to commit SHA |
| `supply-chain` job — image build and scan | PARTIAL FAIL | Builds dev images only; prod overlay with `Dockerfile.prod` never tested |
| Dependabot configuration | PASS | Three ecosystems covered weekly |
| Branch protection enforcement | UNVERIFIED | No CODEOWNERS; server-side configuration not auditable |
| CD / deployment automation | NOT IMPLEMENTED | Acknowledged in docs; fully manual |
| `docker-compose.yml` (dev) | PASS | Compose syntax valid; ordering correct |
| `docker-compose.prod.yml` (prod overlay) | CRITICAL FAIL | `Dockerfile.prod` missing; HTTPS deployment broken |
| Backend Dockerfile | PASS | Tag-pinned base images (not digest) |
| Frontend Dockerfile (dev) | PASS | Node 20 vs. CI Node 22 mismatch |
| Frontend Dockerfile.prod | CRITICAL FAIL | Does not exist |
| nginx dev config | PASS | All security headers present |
| nginx prod config template | GOOD (undeployable) | Complete TLS config; blocked by missing Dockerfile.prod |
| Secrets flow and startup validation | PASS | Fail-fast guards present; `.env` git-ignored |
| Migration strategy and ordering | PASS | One-shot migrator, `AutoMigrate=false` on API |
| `/health` endpoint | PARTIAL FAIL | No downstream probes; masks dependency failures |
| Monitoring and alerting | FAIL | No tooling implemented |
| Log management | PARTIAL | File + console; no aggregation |
| Automated backups | FAIL | No scripts, no scheduling, no rehearsal evidence |

---

## 13. Deployment Readiness Verdict

**NOT PRODUCTION READY.**

The system has a well-structured CI pipeline, a thoughtful secrets management approach, correct Compose dependency ordering, and comprehensive nginx security headers. The supply-chain security posture (Trivy, Dependabot, vulnerability allowlists) is above average for a government system of this classification.

However, three blockers prevent production deployment:

1. The HTTPS production image cannot be built (`Dockerfile.prod` missing).
2. Backup infrastructure is entirely absent, making the documented RTO/RPO objectives unenforceable and a production database failure a data-loss event.
3. The `/health` endpoint provides false positive health signals, which undermines the Compose healthcheck dependency chain and any future load balancer integration.

The high-severity operational gap (no monitoring/alerting) means that even after fixing the blockers, operators would have no visibility into system behavior after go-live. This is acceptable as a phased approach only if a monitoring solution is committed to in the near-term.

**Minimum work to unblock a production deployment:**

- Create `FoodSafe.FE/Dockerfile.prod` (estimated: 1 hour)
- Add prod overlay build and scan to CI `supply-chain` job (estimated: 30 minutes)
- Implement automated PostgreSQL backup with `pg_dump` to off-host storage (estimated: 4–8 hours)
- Register downstream health check probes (estimated: 1 hour)
- Perform and document a backup/restore rehearsal (estimated: half-day)
- Verify GitHub branch protection rules are configured on the remote (estimated: 30 minutes)

Total estimated effort to reach a minimum viable production readiness: **1–2 days of engineering time.**
