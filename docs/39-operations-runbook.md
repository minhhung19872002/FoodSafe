# Operations Runbook — FoodSafe

## Service map and healthy state

The production-shaped stack contains PostgreSQL, Redis, MinIO, a one-shot
migrator, API, and Nginx-hosted SPA. Mailpit is development-only. Nginx is the
sole application ingress; the API is private to the Compose network.

A healthy deployment has:

- `postgres`, `redis`, `minio`, `api`, and `frontend` healthy;
- `migrator` exited once with code `0`;
- `/healthz` returning `healthy` from Nginx;
- `/health` returning the API health response through Nginx;
- no repeating startup, migration, SMTP, storage, or authentication errors.

Use correlation IDs from `X-Correlation-Id` to join client reports, error
bodies, structured API logs, and ABP audit records. Do not place credentials,
tokens, reset links, or unmasked personal data in tickets or chat.

## Routine checks

```powershell
docker compose ps --all
docker compose logs --tail 200 api frontend
docker compose logs migrator
docker stats --no-stream
```

Monitor at minimum:

- ingress availability and latency;
- API 5xx, 401/403 anomalies, 429 volume, and failed login/lockout trends;
- PostgreSQL connections, storage, slow queries, replication/WAL and backup
  freshness;
- MinIO capacity, replication/sync state, and checksum failures;
- SMTP delivery failures;
- container restarts, memory/CPU saturation, and certificate expiry.

Alert immediately when health checks fail for five minutes, backups exceed the
24-hour RPO, storage exceeds 80%, certificates have fewer than 30 days
remaining, or authentication/security failure rates materially depart from the
baseline.

## Safe restart and deployment

Before a change, record the current commit, image digests, migration ID,
configuration version, and backup IDs. Validate Production Compose rendering.
Run the migrator once and require exit code `0` before replacing API/frontend
containers. Then verify health, login, current-user context, an authorized
read, an expected authorization denial, and SMTP recovery delivery.

Restart stateless services only:

```powershell
docker compose restart api frontend
docker compose ps --all
```

Do not delete named volumes to repair a production incident. Do not rerun seed
logic with a new administrator password as a substitute for account recovery.

## Incident triage

1. Declare severity, incident lead, start time, and affected capability.
2. Preserve logs, correlation IDs, image/config identifiers, and audit
   evidence.
3. Contain exposure without destroying evidence: remove ingress, revoke a
   credential, disable an integration, or scale down the affected service.
4. Check recent deployments, migrations, storage capacity, dependency
   failures, certificate status, and upstream availability.
5. Recover with a verified rollback, forward fix, or disaster-recovery
   procedure.
6. Run security and functional smoke tests before reopening traffic.
7. Document timeline, root cause, data impact, corrective actions, and owners.

Treat suspected credential disclosure, unexpected privileged access, audit-log
tampering, malware/object-scan findings, or unexplained data export as a
security incident. Rotate affected credentials and preserve forensic evidence.

## Maintenance boundaries

- PostgreSQL and MinIO are systems of record; back them up before upgrades.
- Redis is disposable cache/session support and is never the authoritative
  recovery source.
- Preserve and protect the ASP.NET data-protection key ring and its certificate
  so cookie and anti-forgery continuity survives normal replacement.
- Rotate database, MinIO, SMTP, CAPTCHA, certificate, and bootstrap credentials
  through the approved secret store; never edit committed files.
- Test restore procedures at least quarterly and after a material persistence
  or infrastructure change.

Detailed deployment configuration is in `docs/38-deployment-guide.md`; recovery
order and acceptance criteria are in `docs/40-disaster-recovery-guide.md`.
