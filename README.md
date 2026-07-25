# FoodSafe

FoodSafe is a Quảng Ninh food-safety administration and public-information
system. The repository contains a .NET 9/ABP backend, a React/TypeScript SPA,
PostgreSQL persistence, Redis, MinIO, and a reproducible container environment.

The implementation is being delivered in audited vertical slices. Current
completion and remaining mandatory scope are tracked in
[`docs/41-implementation-progress.md`](docs/41-implementation-progress.md) and
[`docs/16-implementation-gap-analysis.md`](docs/16-implementation-gap-analysis.md).
The application must not be treated as production-ready while either document
contains mandatory gaps.

## Start the development stack

Prerequisites: Docker Desktop with Compose v2 and available ports 8080, 8025,
1025, 5433, 6379, 9000, and 9001.

```powershell
Set-Location FoodSafe.BE
Copy-Item .env.example .env
# Replace every placeholder secret in .env.
docker compose --profile development config --quiet
docker compose --profile development up -d --build
docker compose --profile development ps --all
```

Open:

- Application: <http://127.0.0.1:8080>
- Development email inbox: <http://127.0.0.1:8025>
- MinIO console: <http://127.0.0.1:9001>

The migrator must exit with code 0; all long-running services must become
healthy. The bootstrap administrator email and password come from `.env`.
Never commit that file or reuse its credentials outside the local environment.

See [`docs/36-local-development-guide.md`](docs/36-local-development-guide.md)
for native commands, tests, troubleshooting, data persistence, and reset-email
validation. Deployment and production-only controls are documented in
[`docs/42-container-deployment.md`](docs/42-container-deployment.md).

## Quality gates

```powershell
dotnet restore FoodSafe.BE/FoodSafe.sln
dotnet build FoodSafe.BE/FoodSafe.sln --no-restore
dotnet test FoodSafe.BE/FoodSafe.sln --no-build --no-restore

Set-Location FoodSafe.FE
npm ci
npm run lint
npm run test -- --run
npm run build
```

CI additionally checks EF model drift, vulnerable dependencies, Production
Compose rendering, and all deployable images.
