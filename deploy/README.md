# FoodSafe — Google Cloud deployment

Single Compute Engine VM running the full stack with docker compose:
nginx frontend (:80) → .NET API → PostgreSQL 15 / Redis 7 / MinIO / ClamAV.
Images are built by GitHub Actions and stored in Artifact Registry.

```
GitHub Actions (push to main)          Google Cloud (asia-southeast1)
┌───────────────────────────┐          ┌─────────────────────────────────┐
│ build BE + FE images      │  push    │ Artifact Registry (foodsafe)    │
│ (WIF keyless auth)        ├─────────►│                                 │
│                           │          │ VM foodsafe-vm (e2-standard-2)  │
│ ssh deploy@VM             ├─────────►│  docker compose pull && up -d   │
│ curl /health              │          │  postgres/redis/minio/clamav    │
└───────────────────────────┘          │  migrator → api → frontend :80  │
                                       └─────────────────────────────────┘
```

## Files

| File | Purpose |
|---|---|
| `deploy/docker-compose.cloud.yml` | Stack definition on the VM (`/opt/foodsafe/docker-compose.yml`) |
| `deploy/.env.cloud.example` | Documented template of the VM `.env` |
| `scripts/gcp/provision.sh` | Idempotent infra provisioning (project → VM → WIF → GitHub secrets) |
| `.github/workflows/deploy.yml` | CI/CD: build → push → deploy → health check |

## One-time setup

1. `gcloud auth login <gcp-account>` — the account must have an **open billing account**.
2. `gh auth status` — must be logged in with access to this repo.
3. `bash scripts/gcp/provision.sh` (Git Bash). Re-runnable; state and generated
   secrets live in `scripts/gcp/.secrets/` (gitignored — back it up!).
4. Push to `main` (or run the **Deploy** workflow manually). First run takes
   longest: image build + ClamAV signature download (~5–10 min).

Seed admin login: `admin@foodsafe.local` — password in `scripts/gcp/.secrets/foodsafe.env`.

## GitHub Actions secrets (set automatically by provision.sh)

| Secret | Value |
|---|---|
| `GCP_PROJECT_ID` | GCP project id |
| `GCP_WIF_PROVIDER` | `projects/<num>/locations/global/workloadIdentityPools/github/providers/github-oidc` |
| `GCP_DEPLOY_SA` | `github-deploy@<project>.iam.gserviceaccount.com` |
| `VM_HOST` | VM static IP |
| `VM_SSH_PRIVATE_KEY` | ed25519 deploy key |

No long-lived GCP key exists anywhere: GitHub Actions authenticates via
Workload Identity Federation, and the VM pulls images with a short-lived
access token passed through SSH at deploy time.

## Why the stack runs as `Staging`, and how to reach `Production`

`ASPNETCORE_ENVIRONMENT=Production` enforces hard gates in
`FoodSafeHttpApiHostModule` that cannot be satisfied on a bare IP deployment:

1. **HTTPS + domain** — obtain a domain, point A record at the static IP,
   issue a certificate (Let's Encrypt), enable the TLS nginx template
   (`FoodSafe.FE/docker/nginx.prod.conf.template`, ports 80→8443) and set
   `PUBLIC_BASE_URL=https://<domain>`, `REQUIRE_HTTPS_METADATA=true`.
2. **SMTP** — real SSL SMTP host + credentials (`SMTP_*` vars).
3. **Captcha** — real Cloudflare Turnstile site/secret keys +
   `CAPTCHA_EXPECTED_HOSTNAME=<domain>`.
4. **PostgreSQL SSL** — enable `ssl=on` in the postgres container and set
   `POSTGRES_SSL_MODE=Require`.
5. **DataProtection certificate** — generate a PFX into
   `/opt/foodsafe/secrets/foodsafe-data-protection.pfx` and set
   `DATA_PROTECTION_CERTIFICATE_PATH/PASSWORD`.

Then set `ASPNETCORE_ENVIRONMENT=Production` in `/opt/foodsafe/.env` and
re-run the Deploy workflow.

## Operations

```bash
# SSH into the VM
ssh -i scripts/gcp/.secrets/deploy_key deploy@<VM_HOST>

# Logs / status
cd /opt/foodsafe && docker compose ps
docker compose logs -f api

# Roll back to a previous image
sed -i 's/^IMAGE_TAG=.*/IMAGE_TAG=<old-sha>/' .env && docker compose up -d

# Database backup
docker compose exec postgres pg_dump -U foodsafe FoodSafe > backup.sql
```

Estimated cost: e2-standard-2 + 40 GB disk + static IP ≈ **$55–65/month**
(covered by the $300 free trial for ~4–5 months).
