# CI/CD Guide — FoodSafe

## Purpose

`.github/workflows/ci.yml` is the mandatory pull-request and branch quality
gate. It runs for pull requests and pushes to `main` or `codex/**`. Concurrent
runs for the same ref are cancelled so only the newest revision consumes
runner capacity.

No workflow currently deploys to production. Release promotion remains a
controlled operator action until a registry, target environment, approval
owners, and rollback authority are supplied. Passing CI means the revision is
deployable; it does not mean the application is functionally complete or
production-ready.

## Required jobs

### Application quality gates

- Restore pinned .NET tools, NuGet packages, and npm packages from lock files.
- Verify `dotnet format` and Prettier formatting.
- Compile .NET with warnings treated as errors.
- Run backend tests, including dependency-boundary tests, and collect Cobertura
  coverage.
- Reject pending EF model changes.
- Publish the API and one-shot migrator in Release mode.
- Run frontend lint, strict TypeScript checking, component tests, and the
  production Vite build.

Backend coverage XML is retained for 14 days even when a test fails.

### Clean PostgreSQL migration

A disposable PostgreSQL 15 service starts empty. CI applies every EF migration
and then checks for model drift. This prevents a revision from relying on a
developer database or an unapplied model change.

### Supply-chain and container gates

- Fail on unapproved NuGet and production npm advisories. The narrow,
  time-bounded exceptions are documented in
  `docs/43-dependency-security-policy.md`.
- Scan the repository for secrets and high/critical configuration findings.
- Render Compose using Production settings, then build all deployable images.
- Scan API, migrator, and frontend images for fixed high/critical
  vulnerabilities.

The Trivy action is pinned to its full reviewed commit, not a mutable tag.
Workflow placeholder values are render-only credentials and must never be
reused in any environment.

## Branch protection and release use

Protect `main` and require all three CI jobs before merge. Require review from
the backend or frontend owner for code in that boundary, and from the
operations/security owner for workflows, Compose, secrets, authentication, or
authorization changes. Disallow force pushes and direct production promotion
from an unreviewed commit.

For a release candidate:

1. Confirm all required checks passed on the exact commit SHA.
2. Review dependency and image scan output, migration changes, and release
   notes.
3. Build and identify images by immutable digest.
4. Back up PostgreSQL, MinIO objects, and the data-protection key material.
5. Rehearse the migration and smoke tests in a production-like environment.
6. Obtain the designated release approval, deploy per `docs/38`, and record the
   image digests and migration ID.

Rollback must use a previously approved image digest. Never reverse a database
migration without a migration-specific, rehearsed recovery plan; restore or
forward-fix according to `docs/40-disaster-recovery-guide.md`.
