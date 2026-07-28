# Production Readiness Review — Deployment & Operations

**Date:** 2026-07-28 · **HEAD:** `6b6ff6a` · Fresh inspection of compose files, CI/CD workflows, scripts, and ops docs (file:line cited).

## 1. What is genuinely ready

| Area | Evidence |
|---|---|
| Environment discipline | Compose env vars fail-fast (`:?err`) on every critical secret; healthchecks on all services; migrator as a one-shot gate (`depends_on: service_completed_successfully`); `Database__AutoMigrate=false` everywhere — migrations never run implicitly |
| Secrets | No production secret ever committed (doc 09 verified); startup validators reject known dev defaults in Production (`CoreSecretsValidator`, CAPTCHA/test-key refusal, SMTP validation); CI secret scanning (`scan-committed-secrets.sh` + Trivy fs) ; DataProtection cert via mounted secret; documented operator rotation checklist (doc 09 §3) |
| Migration safety | EF drift gate in CI (`has-pending-model-changes`); clean-DB migration + **non-destructive migration regression + restore rehearsal run on every CI build** (`ci.yml` `database` job) |
| Backups (capability) | `scripts/backup-database.sh`: pg_dump custom format + SHA-256 + optional GPG + optional MinIO mirror + 30-day retention + manifest; `scripts/rehearse-restore.sh` restores to a throwaway DB and verifies counts + RTO (~5–8s in CI) |
| TLS/IPv6 (self-hosted path) | `nginx.prod.conf.template`: `listen [::]:8443 ssl`, TLS1.2/1.3 only, HSTS, full security headers — **runtime-verified in the production drill** (doc 07 update) |
| Health | `/health/live` + `/health/ready` (checks PostgreSQL + MinIO); drill proved MinIO outage → ready 503 while live stays 200; `verify-health-endpoints.sh` CI-gated |
| CI | 3 jobs: application (format, Release `--warnaserror`, tests+coverage, EF drift, FE lint/typecheck/test/build), database (migration + restore rehearsal), supply-chain (NuGet/NPM audit, secret scan, env-drift, Trivy fs + all 3 images HIGH/CRITICAL, prod-overlay validation, HTTPS/TLS/IPv6 runtime verify) — a genuinely strong pipeline |
| CD | `deploy.yml`: build+push to GCP Artifact Registry, SSH deploy, `compose pull && up -d`, 30×20s health-check loop |

## 2. Gaps (ranked — these are the operations story)

| ID | Severity | Gap | Evidence |
|---|---|---|---|
| O-1 | **High** | **No scheduled backups anywhere** — scripts exist and are CI-rehearsed, but no cron/systemd/container schedules them on any host; **MinIO blobs have no backup at all**. A data-loss event today is unrecoverable beyond the last manual dump | ops docs 05:337/06:395 flag it; no scheduler found |
| O-2 | **High** | **Auto-deploy with no approval gate and no rollback step** — every push to `main` deploys; recovery is manual SSH + image-tag surgery. For a government Level-2 system this fails change-management expectations | `deploy.yml:74-133` |
| O-3 | **High** | **Cloud compose defaults are unsafe**: `ASPNETCORE_ENVIRONMENT=Staging` (Production validators silent), CAPTCHA falls back to the always-pass test secret, `POSTGRES_SSL_MODE=Disable`, `REQUIRE_HTTPS_METADATA=false`, empty DataProtection cert path, Caddy binds IPv4-only | `deploy/docker-compose.cloud.yml:19-38,141,197-198` |
| O-4 | **High** | **No monitoring/alerting/error tracking**: zero metrics (no Prometheus/OTel), no Sentry-class error tracker, no uptime monitor on `/health/ready`, Redis absent from readiness | grep-verified; module `:118-122` |
| O-5 | Medium | **Logs are ephemeral**: Serilog writes `Logs/logs.txt` inside the container with no volume; console lines survive only as docker logs; no aggregation. Post-incident forensics after a redeploy = nothing | `Program.cs:11-24` |
| O-6 | Medium | No runbooks: incident response, rollback SOP, on-call/escalation absent (drill doc covers app-level behavior only); migration rollback procedure undocumented (manual `ef database update <prev>`) |
| O-7 | Medium | No container resource limits in any compose — OOM/CPU-starvation unguarded |
| O-8 | Medium | Production host prerequisites not yet provisioned (expected — no prod environment exists): TLS cert/domain/DNS (AAAA+DNSSEC per YCKT), production SMTP, DB-host hardening (pg_hba, login audit, at-rest encryption), prod k6 re-run (G-31..38) |
| O-9 | Low | Redis is a hard startup dependency yet unused by code (G-23) — wire the cache or drop it; Low but it *widens the outage surface* today |
| O-10 | Low | Git history carries dev credentials (purge+rotate pre-prod, G-20); delete stray `cookies.txt` at repo root |

## 3. Verdict

The **software-side ops engineering is unusually good** — fail-fast config, migration gates, CI-rehearsed restore, drill-verified TLS/health behavior. What's missing is the **operations around the software**: nothing schedules the backups, nothing watches the system, nothing aggregates the logs, and the deploy path has neither approval nor rollback. Every one of these is standard provisioning work (days, not weeks), but **O-1 through O-5 are exactly the failures that turn a small incident into an unrecoverable one** — they must exist before real customer data does.
