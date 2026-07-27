# Local Development Guide — FoodSafe

## Prerequisites

- Docker Desktop with Compose v2 for the complete environment.
- .NET SDK 9.0.x for native backend work.
- Node.js 22 and npm for native frontend work.
- PowerShell 7 or Windows PowerShell 5.1 for repository scripts.

Do not store credentials in source-controlled files. Copy
`FoodSafe.BE/.env.example` to `.env`, replace every placeholder with an
independent local value, and keep the file untracked.

## Complete container environment

From `FoodSafe.BE`:

```powershell
Copy-Item .env.example .env
docker compose --profile development config --quiet
docker compose --profile development up -d --build
docker compose --profile development ps --all
docker compose --profile development logs migrator
```

The development profile adds Mailpit. Expected state:

- `postgres`, `redis`, `minio`, `mailpit`, `api`, and `frontend` are healthy.
- `migrator` exits with code `0`.
- <http://127.0.0.1:8080/healthz> reports the SPA health endpoint.
- <http://127.0.0.1:8080/health> reaches the API through Nginx.
- <http://127.0.0.1:8025> opens the captured development inbox.

Cloudflare's published Turnstile test keys are used only in Development.
Production startup rejects them. The browser still executes the normal widget
and the API still performs mandatory server-side verification.

Password-recovery messages are delivered to Mailpit over the private Compose
network. Use the forgot-password link on the login page, then inspect the
message in Mailpit. Reset links point to the configured `PUBLIC_BASE_URL`, so
keep it aligned with the address used in the browser.

## Native backend

Start PostgreSQL and supporting services first, or provide equivalent external
connections. The default host connection uses PostgreSQL on port 5433.

```powershell
dotnet restore FoodSafe.BE/FoodSafe.sln
dotnet build FoodSafe.BE/FoodSafe.sln --no-restore
dotnet test FoodSafe.BE/FoodSafe.sln --no-build --no-restore
dotnet run --project FoodSafe.BE/src/FoodSafe.DbMigrator
dotnet run --project FoodSafe.BE/src/FoodSafe.HttpApi.Host
```

For native email testing, set the ABP mail host to `localhost` and port to
`1025`; the published Mailpit SMTP port accepts the message.

## Native frontend

```powershell
Set-Location FoodSafe.FE
npm ci
npm run dev
```

Vite proxies `/api` to the backend URL configured in `vite.config.ts`.

Before handing off a change:

```powershell
npm run lint
npm run test -- --run
npm run build
```

## Database and generated state

The one-shot migrator owns schema migration and seed execution. The API does
not migrate in Compose. PostgreSQL, Redis, MinIO, ClamAV, Mailpit, and the data
protection key ring use named volumes.

`docker compose down` removes containers and the private network but preserves
volumes. Do not use `docker compose down -v` unless all data in that Compose
project is intentionally disposable; it permanently removes the named
volumes.

## Troubleshooting

```powershell
docker compose --profile development ps --all
docker compose --profile development logs --tail 200 migrator api frontend mailpit
docker compose --profile development config
```

- A failed migrator prevents the API from starting. Inspect its first exception
  and correct migration or configuration errors rather than bypassing it.
- A CAPTCHA configuration failure usually means a missing key, an invalid
  verifier URL, or a Production process using published test keys.
- A recovery request returning 500 should be checked for template-rendering and
  SMTP errors in API logs. Development SMTP host must be `mailpit` inside
  Compose and `localhost` for a natively running backend.
- After login, obtain a fresh anti-forgery token before making an authenticated
  write; anti-forgery tokens are bound to the current claims principal.
