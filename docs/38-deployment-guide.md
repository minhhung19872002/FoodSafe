# Deployment Guide — FoodSafe

## Deployment shape

The base Compose stack runs PostgreSQL 15, Redis 7, MinIO, a one-shot database
migrator, the ASP.NET Core API, and the React SPA behind an unprivileged Nginx
container. The `development` profile adds pinned Mailpit SMTP capture and its
local inbox. The API is not published on the host. Nginx is the only
application entry point and proxies `/api/` to the API container.

PostgreSQL, Redis, MinIO, and the web entry point bind to `127.0.0.1` by
default. Production traffic must reach the web entry point through a separately
managed TLS reverse proxy or load balancer.

## Configure secrets

From `FoodSafe.BE`, create an untracked environment file:

```powershell
Copy-Item .env.example .env
```

Replace every placeholder secret. In particular, use independent high-entropy
values for the PostgreSQL password, MinIO root password, string-encryption
passphrase, data-protection certificate password, and bootstrap administrator
password. Never commit `.env`.

Development uses Cloudflare's published Turnstile test keys. Production must
replace `CAPTCHA_SITE_KEY` and `CAPTCHA_SECRET_KEY` with a real widget restricted
to `CAPTCHA_EXPECTED_HOSTNAME`. FoodSafe fails startup if test keys or a blank
expected hostname reach Production.

The bootstrap password is mandatory. It is passed only to the one-shot
migrator and is not present in the API container. Change it immediately after
the first successful sign-in.

For local HTTP validation, the example uses:

```dotenv
ASPNETCORE_ENVIRONMENT=Development
PUBLIC_BASE_URL=http://localhost:8080
REQUIRE_HTTPS_METADATA=false
```

For production, use:

```dotenv
ASPNETCORE_ENVIRONMENT=Production
PUBLIC_BASE_URL=https://foodsafe.example.gov.vn
REQUIRE_HTTPS_METADATA=true
```

Production also requires a password-protected PKCS#12 certificate at
`FoodSafe.BE/secrets/foodsafe-data-protection.pfx` and its password in
`DATA_PROTECTION_CERTIFICATE_PASSWORD`. The certificate encrypts the persistent
ASP.NET data-protection key ring used for authentication and anti-forgery
cookies. The `secrets` directory ignores all secret material.

Password recovery requires an SSL-enabled SMTP service in Production. Set the
`SMTP_*` values, keep the SMTP password external, and verify delivery and reset
links against the public HTTPS base URL before release. Development uses
`SMTP_HOST=mailpit` and the profile inbox at `http://127.0.0.1:8025`.

The TLS proxy must preserve `Host` and send `X-Forwarded-Proto: https`.
FoodSafe trusts only its fixed Nginx container address (`172.28.0.10`) as a
forwarded-header proxy. If the container subnet is changed, update the matching
known-proxy setting at the same time.

## Start and verify

```powershell
docker compose --profile development config --quiet
docker compose --profile development up -d --build
docker compose --profile development ps --all
docker compose --profile development logs migrator
```

Expected state:

- `postgres`, `redis`, `minio`, `mailpit`, `api`, and `frontend` are healthy.
- `migrator` exits with code `0`.
- `http://127.0.0.1:8080/healthz` returns `healthy`.
- `http://127.0.0.1:8080/health` returns the API health response through Nginx.

The migrator owns schema migration and initial seeding. The API has
`Database__AutoMigrate=false` in Compose, so application replicas never race to
modify the production schema during startup.

Useful operating commands:

```powershell
docker compose logs --tail 200 api frontend
docker compose restart api frontend
docker compose pull
docker compose up -d --build
```

`docker compose down` removes containers and the private network while
preserving data volumes. `docker compose down -v` permanently deletes this
Compose project's PostgreSQL, Redis, and MinIO volumes and is only appropriate
for disposable environments.

## Data protection and recovery boundary

The named volumes `postgres_data`, `redis_data`, `minio_data`, and development
`mailpit_data` are persistent deployment state. `data_protection_keys` must
also survive API replacement so active sessions and anti-forgery tokens remain
decryptable. Mailpit is never a production mail archive. Back up PostgreSQL and
MinIO using versioned, encrypted, off-host storage before upgrades. Redis is
configured with append-only persistence but must not be treated as the system
of record.

A deployment is not production-ready until a backup/restore rehearsal verifies
database records, object checksums, permissions, and application sign-in in an
isolated restore environment. That rehearsal remains an explicit release gate.
