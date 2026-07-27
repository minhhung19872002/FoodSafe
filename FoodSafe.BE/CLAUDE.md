# Backend Testing Rules

These rules apply to all files under `FoodSafe.BE/`.

Follow the testing strategy defined in the root `CLAUDE.md`.

## Default backend verification

Backend functionality must be verified through real HTTP API integration tests:

HTTP request
→ ASP.NET Core middleware
→ authentication
→ authorization
→ controller or endpoint
→ application service
→ Entity Framework Core
→ real PostgreSQL database

Do not create new unit tests or mocked service/repository tests unless explicitly requested.

## Required test infrastructure

Use:

- actual ASP.NET Core application pipeline
- `WebApplicationFactory` or the project's equivalent test host
- PostgreSQL Testcontainers or a disposable PostgreSQL database
- actual EF Core migrations
- deterministic test seed data
- real HTTP requests using `HttpClient`

Do not use EF Core InMemory as runtime or acceptance evidence.

Do not replace PostgreSQL with SQLite for database-specific behavior.

## Do not mock in API acceptance tests

Do not mock:

- `DbContext`
- repositories
- application services
- authorization handlers
- current-user context
- organization-scope resolver
- administrative-area-scope resolver
- workflow validators
- internal FoodSafe APIs

Local substitutes may be used only for unavailable external third-party services
and must be documented.

## Required API scenarios

For each backend feature, verify applicable scenarios:

- unauthenticated request
- successful request
- invalid request
- missing permission
- cross-organization access denial
- cross-administrative-area access denial
- create
- detail
- list
- search
- filtering
- sorting
- pagination
- update
- deactivate or delete
- valid workflow transition
- invalid workflow transition
- unauthorized export
- unauthorized attachment access
- duplicate prevention
- database persistence
- audit or history side effects
- follow-up retrieval using a separate request

## Feature status

Before testing a backend feature, read:

- `docs/testing/01-feature-verification-registry.md`
- `docs/testing/02-impact-map.md`
- `docs/testing/features/<feature>.md`

After successful verification:

- update the feature verification document
- record the tested API endpoints
- record the PostgreSQL environment
- record the verified Git commit
- update the registry status to `VERIFIED`

When backend code affects a previously verified feature:

- change its status to `DIRTY`
- run the required impact-based retest
- return it to `VERIFIED` only after the real API tests pass